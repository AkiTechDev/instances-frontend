import { createEffect, createMemo, createResource, createSignal, on, type Accessor } from "solid-js";

import {
    getInstanceStatus,
    toggleInstance,
    type InstanceRuntimeStatus,
} from "../apis";
import { pollUntilSettled } from "../polling";

type RuntimeState = InstanceRuntimeStatus["state"];
type RunningStatus = Extract<InstanceRuntimeStatus, { state: "running" }>;

export interface InstanceRuntime {
    /**
     * One coarse status for the whole UI: while a toggle is in flight the
     * optimistic intent wins (instant feedback), otherwise the latest polled
     * runtime state, falling back to "stopped" before the first poll lands.
     */
    status: Accessor<RuntimeState>;
    isRunning: Accessor<boolean>;
    /**
     * What a two-state control (a switch, an ON/OFF badge) should show: the
     * user's intent while a toggle is in flight, so the switch doesn't snap
     * back to OFF for the minute the server spends starting. Falls back to the
     * real state once the action settles.
     */
    intent: Accessor<boolean>;
    /** True while a start/stop is in flight. */
    busy: Accessor<boolean>;
    canToggle: Accessor<boolean>;
    /** Connectivity payload — only present while genuinely running. */
    running: Accessor<RunningStatus | undefined>;
    startingPhase: Accessor<string | undefined>;
    errorMessage: Accessor<string | undefined>;
    /** Start if stopped, stop if running. No-op while busy or unreachable. */
    toggle: () => Promise<void>;
    refetch: () => void;
}

const SETTLED: RuntimeState[] = ["running", "stopped", "forbidden", "error"];
const TERMINAL: RuntimeState[] = ["forbidden", "error"];

/**
 * Runtime status of one instance's game server, plus the start/stop control.
 *
 * Owns three things that used to be reimplemented per call site: the status
 * resource, the optimistic toggle, and the poll loop that waits for the server
 * to actually get there. Both the management panel and the dashboard card use
 * this, so a toggle behaves identically in either place.
 *
 * `endpoint` may be undefined (instance still provisioning) — the resource
 * simply doesn't fetch until it resolves.
 */
export function useInstanceRuntime(endpoint: Accessor<string | undefined>): InstanceRuntime {
    const [runtime, { refetch }] = createResource(endpoint, (ep: string) => getInstanceStatus(ep));

    const [optimistic, setOptimistic] = createSignal<"starting" | "stopping" | null>(null);
    const [busy, setBusy] = createSignal(false);
    const [polling, setPolling] = createSignal(false);

    const status = createMemo<RuntimeState>(() => optimistic() ?? runtime()?.state ?? "stopped");
    const isRunning = createMemo(() => status() === "running");

    const intent = createMemo(() => {
        const o = optimistic();
        if (o) return o === "starting";
        return isRunning();
    });

    const canToggle = createMemo(() =>
        !busy() && !!endpoint() &&
        (status() === "running" || status() === "stopped" || status() === "error"));

    const running = createMemo(() => {
        const r = runtime();
        return r?.state === "running" ? r : undefined;
    });

    const startingPhase = createMemo(() => {
        const r = runtime();
        return r?.state === "starting" ? r.phase : undefined;
    });

    const errorMessage = createMemo(() => {
        const r = runtime();
        return r && (r.state === "forbidden" || r.state === "error") ? r.error?.message : undefined;
    });

    /**
     * `target` lets a toggle wait for its destination (e.g. "running") and
     * ignore the *current* settled state, which the gateway keeps reporting for
     * a beat after the action — that lag is what snapped the panel straight
     * back on the first click. `initialDelayMs` holds the optimistic
     * first-stage text before we poll at all, so the very first request can't
     * just echo the old state back.
     *
     * Guarded so the toggle handler and the auto-resume effect share one
     * in-flight loop rather than stacking.
     */
    const pollStatus = async (opts?: { target?: RuntimeState; initialDelayMs?: number }) => {
        if (polling()) return;
        setPolling(true);
        try {
            await pollUntilSettled(async () => {
                const s = (await refetch())?.state;
                if (!s) return false;
                if (TERMINAL.includes(s)) return true;
                return opts?.target ? s === opts.target : SETTLED.includes(s);
            }, {
                intervalMs: 4000,
                timeoutMs: 5 * 60_000,
                initialDelayMs: opts?.initialDelayMs,
            });
        } finally {
            setPolling(false);
        }
    };

    const toggle = async () => {
        const ep = endpoint();
        if (!ep || !canToggle()) return;

        const wasRunning = isRunning();
        setBusy(true);
        setOptimistic(wasRunning ? "stopping" : "starting");
        try {
            await toggleInstance(ep, wasRunning);
            // Hold the first-stage text, then poll for the destination state
            // (not the lagging current one) so the panel doesn't flash back.
            await pollStatus({ target: wasRunning ? "stopped" : "running", initialDelayMs: 4000 });
        } catch (err) {
            console.error("toggle failed", err);
        } finally {
            setOptimistic(null);
            setBusy(false);
        }
    };

    // Landing on the page mid start/stop: resume polling immediately — no
    // delay, no target, just run until it settles.
    createEffect(on(() => runtime()?.state, (s) => {
        if (s === "starting" || s === "stopping") void pollStatus();
    }));

    return {
        status, isRunning, intent, busy, canToggle,
        running, startingPhase, errorMessage,
        toggle, refetch: () => void refetch(),
    };
}
