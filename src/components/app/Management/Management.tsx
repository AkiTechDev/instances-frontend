import { createAsync, revalidate, useNavigate, useParams } from "@solidjs/router";
import { type Component, createEffect, createResource, createSignal, Index, Match, on, Show, Suspense, Switch } from "solid-js";

import styles from "./Management.module.css";
import effects from "../../../styles/components/effects.module.css";

import ManagementHeader from "../ManagementHeader/ManagementHeader";
import iconArrow from "../../../assets/icons/chevron.svg";

import button from "../../../styles/components/button.module.css";
import stopIcon from "../../../assets/icons/stop.svg";
import playIcon from "../../../assets/icons/play.svg";
import clipboardIcon from "../../../assets/icons/clipboard.svg";

import Tooltip from "../Test/Test";

import {
    endpointOf,
    getInstanceConfig,
    getInstanceState,
    getInstanceStatus,
    toggleInstance,
    type Instance,
    type InstanceRuntimeStatus,
    type InstanceState,
} from "../../../lib/apis";
import { sleep } from "../../../lib/utils";
import { useAuth } from "../Auth/AuthProvider";
import ManagementInstanceConfigForm from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration";
import { regions } from "../../../lib/regions";
import ManagementGameConfiguration from "../ManagementGameConfiguration/ManagementGameConfiguration";
import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

const isReadyOrUpdating = (s: InstanceState | undefined): boolean =>
    s?.status === "ready" || s?.status === "updating";

const provisioningMessage = (s: InstanceState): string => {
    if ("message" in s) return s.message;
    if (s.status === "failed") return s.error.reason ?? s.error.failed_status;
    if (s.status === "rolled_back") return s.reason ?? "Stack rolled back";
    if (s.status === "unknown") return s.note;
    return s.raw_status;
};

// Suspense fallbacks: render the form's grid/connectivity shape so the layout
// holds steady while config()/state()/runtime() resolve, then the real fields
// swap in without a pop-in.
const ConfigFormSkeleton: Component<{ rows: number }> = (props) => (
    <div class={styles.formSkeleton} aria-busy="true">
        <Index each={Array.from({ length: props.rows })}>
            {() => (
                <div class={styles.skeletonField}>
                    <div class={`${effects.skeleton} ${styles.skeletonLabel}`} />
                    <div class={`${effects.skeleton} ${styles.skeletonInput}`} />
                </div>
            )}
        </Index>
        <div class={`${effects.skeleton} ${styles.skeletonButton}`} />
    </div>
);

const PanelBodySkeleton = () => (
    <>
        <div class={styles.quickActions} aria-busy="true">
            <div class={`${effects.skeleton} ${styles.skeletonPanelButton}`} />
            <div class={`${effects.skeleton} ${styles.skeletonPanelButton}`} />
        </div>
        <div class={styles.connectivity}>
            <Index each={Array.from({ length: 3 })}>
                {() => (
                    <div class={styles.connectivityInfo}>
                        <div class={`${effects.skeleton} ${styles.skeletonLabel}`} />
                        <div class={`${effects.skeleton} ${styles.skeletonValue}`} />
                    </div>
                )}
            </Index>
        </div>
    </>
);

// A single copyable connectivity value (domain / ip). Renders nothing when the
// value is absent so we never print empty or placeholder rows.
const CopyRow: Component<{ label: string; value?: string; onCopy: (v: string | null) => void }> = (props) => (
    <Show when={props.value}>
        <div class={styles.connectivityInfo}>
            <p class="statsTitle">{props.label}</p>
            <Tooltip tooltipContent="Copied!" tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                <p class={`statsText ${styles.copy}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => props.onCopy(e.currentTarget.textContent)}>{props.value}</p>
            </Tooltip>
        </div>
    </Show>
);

// Headline + sub-line used for every non-running runtime state. `busy` adds the
// pulse used while the instance is transitioning.
const StatusBanner: Component<{ title: string; subtitle?: string; busy?: boolean }> = (props) => (
    <div class={styles.statusBanner}>
        <p class={`statsText ${props.busy ? effects.pulse : ""}`}>{props.title}</p>
        <Show when={props.subtitle}>
            <p class={`bodyTextSmall ${styles.statusSub}`}>{props.subtitle}</p>
        </Show>
    </div>
);

const Management = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { account } = useAuth();

    const game = createAsync(async () => {
        if (params.game && params.game in gameRegistry) {
            const entry = gameRegistry[params.game];

            if (!entry) throw Error("Error retrieving game");

            const mod = await entry.load();
            return mod.default;
        }

        return navigate("/dashboard?no-such-game", { replace: true });
    });

    const instance: Instance = {
        game: params.game || "",
        name: params.name || "",
        user_id: account().sub,
    };

    const state = createAsync(async () => {
        const s = await getInstanceState(instance);
        if (s.status === "gone") {
            navigate("/dashboard?no-such-instance", { replace: true });
        }
        return s;
    });

    const endpoint = () => endpointOf(state());

    const config = createAsync(async () => {
        const ep = endpoint();
        return ep ? getInstanceConfig(ep) : undefined;
    });

    // Reserve the config column from the first paint. While state is still
    // loading we optimistically assume a ready instance (the common case) so the
    // grid keeps its two-column shape and the panel never flashes full-width;
    // once state resolves we only keep the column for reachable ready/updating
    // instances (provisioning/failed correctly collapse to the panel-only view).
    const showConfigColumn = () => {
        const s = state();
        if (!s) return true;
        return isReadyOrUpdating(s) && !!endpoint();
    };

    // "Creating" and "updating" are both in-progress states: the banner gets the
    // sweep + a pulsing label, and we poll instance state until it settles back to
    // ready. `pendingUpdate` bridges the lag between a config-form POST and the
    // state flipping to "updating", so the forms swap to the skeleton at once.
    const [pendingUpdate, setPendingUpdate] = createSignal(false);
    const [trackingProgress, setTrackingProgress] = createSignal(false);
    const isUpdating = () => pendingUpdate() || state()?.status === "updating";
    const isCreating = () => state()?.status === "creating";
    const inProgress = () => isCreating() || isUpdating();
    const progressLabel = () => (isCreating() ? "Creating…" : "Updating…");

    const isProgressStatus = (s: InstanceState["status"] | undefined) =>
        s === "creating" || s === "updating";

    // Poll instance state until it leaves the in-progress state. Guarded so the
    // submit bridge and the observe-effect share a single loop.
    const pollProgress = async () => {
        if (trackingProgress()) return;
        setTrackingProgress(true);
        try {
            const finishBy = Date.now() + 10 * 60_000;
            while (Date.now() < finishBy && isProgressStatus(state()?.status)) {
                await sleep(4000);
                await revalidate(getInstanceState.keyFor(instance));
            }
        } finally {
            setTrackingProgress(false);
        }
    };

    // A config form was submitted → the instance will enter "updating". Flag it
    // optimistically (bridging the POST→updating lag) so the forms swap to the
    // skeleton immediately, then poll until it settles back to ready.
    const onConfigSubmitted = async () => {
        setPendingUpdate(true);
        try {
            const enterBy = Date.now() + 15_000;
            while (Date.now() < enterBy && state()?.status !== "updating") {
                await sleep(3000);
                await revalidate(getInstanceState.keyFor(instance));
            }
        } finally {
            setPendingUpdate(false);
        }
        await pollProgress();
    };

    // Poll whenever we observe an in-progress state — creating on first load, or
    // updating triggered from anywhere.
    createEffect(on(() => state()?.status, (s) => {
        if (isProgressStatus(s)) void pollProgress();
    }));

    const [runtime, { refetch: refetchRuntime }] = createResource(
        endpoint,
        (ep: string) => getInstanceStatus(ep),
    );

    const banner = createAsync(async () => game()?.getBanner());
    const schema = createAsync(async () => game()?.getSchema());

    // One coarse status drives the whole panel: while a toggle is in flight the
    // optimistic intent wins (instant feedback), otherwise the latest polled
    // runtime state (falling back to "stopped" before the first poll lands).
    const [optimistic, setOptimistic] = createSignal<"starting" | "stopping" | null>(null);
    const status = (): InstanceRuntimeStatus["state"] =>
        optimistic() ?? runtime()?.state ?? "stopped";

    const isRunning = () => status() === "running";
    const canToggle = () =>
        status() === "running" || status() === "stopped" || status() === "error";

    // Typed views onto the current runtime payload for the connectivity panel.
    const running = () => {
        const r = runtime();
        return r?.state === "running" ? r : undefined;
    };
    const startingPhase = () => {
        const r = runtime();
        return r?.state === "starting" ? r.phase : undefined;
    };
    const statusError = () => {
        const r = runtime();
        return r && (r.state === "forbidden" || r.state === "error") ? r.error?.message : undefined;
    };

    const toggleLabel = () => {
        switch (status()) {
            case "starting": return "Starting…";
            case "stopping": return "Stopping…";
            case "running":  return "Stop Game";
            default:         return "Start Game";
        }
    };

    const copyText = async (data: string | null) => {
        if (!data) return;
        await navigator.clipboard.writeText(data.replaceAll(" ", ""));
    };

    // Poll /status until the instance settles. Guarded so the toggle handler and
    // the auto-resume effect below share one in-flight loop rather than stacking.
    const [polling, setPolling] = createSignal(false);
    const settled = (s?: InstanceRuntimeStatus["state"]) =>
        s === "running" || s === "stopped" || s === "forbidden" || s === "error";

    // `target` lets a toggle wait for its destination (e.g. "running") and ignore
    // the *current* settled state, which the gateway keeps reporting for a beat
    // after the action — that lag is what snapped the panel straight back on the
    // first click. `initialDelayMs` holds the optimistic first-stage text before
    // we poll at all, so the very first request can't just echo the old state.
    const pollStatus = async (opts?: { target?: InstanceRuntimeStatus["state"]; initialDelayMs?: number }) => {
        if (polling()) return;
        setPolling(true);
        try {
            if (opts?.initialDelayMs) await sleep(opts.initialDelayMs);
            const deadline = Date.now() + 5 * 60_000;
            while (Date.now() < deadline) {
                const s = (await refetchRuntime())?.state;
                if (s === "forbidden" || s === "error") break;
                if (opts?.target ? s === opts.target : settled(s)) break;
                await sleep(4000);
            }
        } finally {
            setPolling(false);
        }
    };

    const toggleInstanceButton = async () => {
        const ep = endpoint();
        if (!ep || !canToggle()) return;
        const wasRunning = isRunning();
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
        }
    };

    // Landing on the page mid start/stop: resume polling immediately — no delay,
    // no target, just run until it settles.
    createEffect(on(() => runtime()?.state, (s) => {
        if (s === "starting" || s === "stopping") void pollStatus();
    }));

    return (
        <Show when={game()}>
        <div class={styles.gridContainer}>
            <ManagementHeader game={game()!.name} name={params.name || ""} />
            <div class={styles.instanceContainer}>
                <p class="buttonText" style={`--icon: url("${iconArrow.src}")`} onClick={() => navigate(-1)}>Back</p>
                <div class={styles.controlsContainer}>
                    <div class={styles.panel}>
                        <div class={`${styles.bannerWrapper} ${inProgress() ? styles.bannerBusy : ""}`}>
                            <Show when={banner()}>
                                <ResponsiveImage src={banner()!} />
                            </Show>
                            <Show when={inProgress()}>
                                <div class={effects.sweep} />
                            </Show>
                            <div class={styles.bannerHeader}>
                                <p class="h4">{params.name}</p>
                                <Show when={inProgress()} fallback={<Show when={state()}><p class="subTitle">{regions[state()!.region]}</p></Show>}>
                                    <p class={`subTitle ${effects.pulse}`}>{progressLabel()}</p>
                                </Show>
                            </div>
                        </div>

                        <Suspense fallback={<PanelBodySkeleton />}>
                            <Show when={state() && isReadyOrUpdating(state())}>
                                <div class={styles.quickActions}>
                                    <button class={`${button.btn} ${button.secondary} ${button.icon}`} style={`--icon: url(${ (status() === "running" || status() === "stopping") ? stopIcon.src : playIcon.src})`} disabled={!canToggle() || inProgress()} onClick={() => toggleInstanceButton()}><p class="buttonText">{toggleLabel()}</p></button>
                                    <button class={`${button.btn} ${button.outlineDark}`} disabled={inProgress()}><p class="buttonText">Invite Friends</p></button>
                                    <InstanceOptions endpoint={endpoint()!} instance={instance} />
                                </div>
                                <div class={styles.connectivity}>
                                    <Switch fallback={<StatusBanner title="Your world is offline" subtitle="Hit Start to drop back in" />}>
                                        <Match when={status() === "running"}>
                                            <CopyRow label="Domain" value={running()?.domain} onCopy={copyText} />
                                            <CopyRow label="IPv4 Address" value={running()?.ipv4} onCopy={copyText} />
                                            <CopyRow label="IPv6 Address" value={running()?.ipv6} onCopy={copyText} />
                                        </Match>
                                        <Match when={status() === "starting"}>
                                            <StatusBanner busy title="Waking up your world…" subtitle={startingPhase() ?? "Getting things ready"} />
                                        </Match>
                                        <Match when={status() === "stopping"}>
                                            <StatusBanner busy title="Powering down…" subtitle="Tidying up your world" />
                                        </Match>
                                        <Match when={status() === "forbidden"}>
                                            <StatusBanner title="No access" subtitle="You're not the owner of this instance" />
                                        </Match>
                                        <Match when={status() === "error"}>
                                            <StatusBanner title="Something went sideways" subtitle={statusError() ?? "We couldn't reach your server — try again shortly"} />
                                        </Match>
                                    </Switch>
                                </div>
                            </Show>

                            <Show when={state() && !isReadyOrUpdating(state())}>
                                <div class={styles.quickActions}>
                                    <InstanceOptions endpoint="" instance={instance} />
                                </div>
                                <div class={styles.connectivity}>
                                    <div class={styles.connectivityInfo}>
                                        <p class="statsTitle">{state()!.raw_status}</p>
                                        <p class="statsText">{provisioningMessage(state()!)}</p>
                                    </div>
                                </div>
                            </Show>
                        </Suspense>
                    </div>

                    <Show when={showConfigColumn()}>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{instance.name} Settings</h6>
                                <p class="bodyText">You can edit the Instance to your preference at any time.</p>
                            </div>
                            <Suspense fallback={<ConfigFormSkeleton rows={4} />}>
                                <Show when={config() && !isUpdating()} fallback={<ConfigFormSkeleton rows={4} />}>
                                    <ManagementInstanceConfigForm config={config()!} instance={instance} endpoint={endpoint()!} profiles={game()!.profiles} onSubmitted={onConfigSubmitted} />
                                </Show>
                            </Suspense>
                        </div>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{game()!.name} Settings</h6>
                                <p class="bodyText">Adjust how the game feels.</p>
                            </div>
                            <Suspense fallback={<ConfigFormSkeleton rows={5} />}>
                                <Show when={config() && schema() && !isUpdating()} fallback={<ConfigFormSkeleton rows={5} />}>
                                    <ManagementGameConfiguration schema={schema()!} config={config()!.game} endpoint={endpoint()!} onSubmitted={onConfigSubmitted} />
                                </Show>
                            </Suspense>
                        </div>
                    </Show>
                </div>
                <div class={styles.statsContainer}>
                    <div class={styles.statsControl}>
                        <a class="subtitleSemi">Play Time</a>
                        <a class="subtitleSemi">Cost History</a>
                        <a class="subtitleSemi">Server Logs</a>
                    </div>
                    <div class={styles.statsOutput}>
                        <h1 class="h3">Under Construction</h1>
                        <p class="statsTitle">You will be able to see costs and game stats here</p>
                    </div>
                </div>
            </div>
        </div>
        </Show>
    );
};

export default Management;
