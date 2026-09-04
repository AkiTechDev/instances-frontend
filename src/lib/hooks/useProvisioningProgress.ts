import { createEffect, createMemo, createSignal, on, type Accessor } from "solid-js";
import { createAsync, revalidate } from "@solidjs/router";

import {
    endpointOf,
    getInstanceState,
    type Instance,
    type InstanceState,
} from "../apis";
import { pollUntilSettled } from "../polling";

export interface ProvisioningProgress {
    state: Accessor<InstanceState | undefined>;
    /** Gateway endpoint — only present once the stack is reachable. */
    endpoint: Accessor<string | undefined>;
    isCreating: Accessor<boolean>;
    isUpdating: Accessor<boolean>;
    /** Either of the above — drives the sweep overlay and disables controls. */
    inProgress: Accessor<boolean>;
    /** "Creating…" / "Updating…" — undefined when settled. */
    progressLabel: Accessor<string | undefined>;
    /** True for ready/updating, i.e. the instance has a usable endpoint. */
    isReadyOrUpdating: Accessor<boolean>;
    /**
     * Call after a config POST. Bridges the POST→"updating" lag so forms swap
     * to their skeleton at once, then polls until the update lands.
     */
    onConfigSubmitted: () => Promise<void>;
}

const isProgressStatus = (s: InstanceState["status"] | undefined) =>
    s === "creating" || s === "updating";

/**
 * Provisioning lifecycle of one instance: its CloudFormation-side state, and
 * the polling that carries it from creating/updating back to ready.
 *
 * Shared by the management page and the dashboard card so both agree on what
 * "in progress" means and neither has to hand-roll another poll loop.
 *
 * `onGone` fires when the instance no longer exists, so the caller can
 * navigate away rather than rendering a dead page.
 */
export function useProvisioningProgress(
    instance: Accessor<Instance>,
    opts?: { onGone?: () => void },
): ProvisioningProgress {
    const state = createAsync(async () => {
        const s = await getInstanceState(instance());
        if (s.status === "gone") opts?.onGone?.();
        return s;
    });

    const endpoint = createMemo(() => endpointOf(state()));

    // Bridges the lag between a config-form POST and the state flipping to
    // "updating", so the forms swap to the skeleton immediately.
    const [pendingUpdate, setPendingUpdate] = createSignal(false);
    const [tracking, setTracking] = createSignal(false);

    const isUpdating = createMemo(() => pendingUpdate() || state()?.status === "updating");
    const isCreating = createMemo(() => state()?.status === "creating");
    const inProgress = createMemo(() => isCreating() || isUpdating());
    const progressLabel = createMemo(() =>
        isCreating() ? "Creating…" : isUpdating() ? "Updating…" : undefined);

    const isReadyOrUpdating = createMemo(() => {
        const s = state()?.status;
        return s === "ready" || s === "updating";
    });

    const refreshState = () => revalidate(getInstanceState.keyFor(instance()));

    // Poll until the instance leaves the in-progress state. Guarded so the
    // submit bridge and the observe-effect share a single loop.
    const pollProgress = async () => {
        if (tracking()) return;
        setTracking(true);
        try {
            await pollUntilSettled(async () => {
                await refreshState();
                return !isProgressStatus(state()?.status);
            }, {
                intervalMs: 4000,
                timeoutMs: 10 * 60_000,
                // Sleep before the first refresh: the effect fires the moment
                // the state is already known to be in progress, so an immediate
                // refetch is a wasted request.
                initialDelayMs: 4000,
            });
        } finally {
            setTracking(false);
        }
    };

    const onConfigSubmitted = async () => {
        setPendingUpdate(true);
        try {
            await pollUntilSettled(async () => {
                await refreshState();
                return state()?.status === "updating";
            }, { intervalMs: 3000, timeoutMs: 15_000, initialDelayMs: 3000 });
        } finally {
            setPendingUpdate(false);
        }
        await pollProgress();
    };

    // Poll whenever we observe an in-progress state — creating on first load,
    // or updating triggered from anywhere.
    createEffect(on(() => state()?.status, (s) => {
        if (isProgressStatus(s)) void pollProgress();
    }));

    return {
        state, endpoint,
        isCreating, isUpdating, inProgress, progressLabel, isReadyOrUpdating,
        onConfigSubmitted,
    };
}
