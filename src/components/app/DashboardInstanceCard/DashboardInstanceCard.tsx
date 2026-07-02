import {
    createEffect,
    createMemo,
    createResource,
    createSignal,
    createUniqueId,
    on,
    Show,
    Suspense,
    type Component,
} from "solid-js";
import { A, createAsync, revalidate } from "@solidjs/router";
import {
    endpointOf,
    getInstanceState,
    getInstanceStatus,
    toggleInstance,
    type Instance,
    type InstanceState,
} from "../../../lib/apis";
import { sleep, timeAgo } from "../../../lib/utils";

import styles from "./DashboardInstanceCard.module.css";
import effects from "../../../styles/components/effects.module.css";

import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

const cardLabel = (state: InstanceState | undefined, isRunning: boolean): string => {
    if (!state) return "";
    switch (state.status) {
        case "ready":         return isRunning ? "RUNNING" : "STOPPED";
        case "updating":      return "UPDATING";
        case "creating":      return "GENERATING";
        case "deleting":      return "DELETING";
        case "rolling_back":  return "ROLLING BACK";
        case "rolled_back":   return "FAILED";
        case "failed":        return "FAILED";
        case "gone":          return "GONE";
        case "unknown":       return state.raw_status;
    }
};

const cardSubtitle = (state: InstanceState | undefined): string => {
    if (!state) return "";
    switch (state.status) {
        case "ready":         return `Created ${timeAgo(state.elapsed_seconds)}`;
        case "updating":      return `Updating`;
        case "creating":      return `Generating`;
        case "deleting":
        case "rolling_back":
        case "gone":          return state.message;
        case "failed":        return state.error.reason ?? state.error.failed_status;
        case "rolled_back":   return state.reason ?? "Rolled back";
        case "unknown":       return state.note;
    }
};

// Only "ready" is toggleable — while updating, CloudFormation may cycle the
// server, so we hide the toggle rather than imply the user controls it.
const canToggle = (state: InstanceState | undefined): boolean =>
    state?.status === "ready";

type StatusVariant = "active" | "creating" | "updating" | undefined;

const statusVariantOf = (state: InstanceState | undefined, isRunning: boolean): StatusVariant => {
    if (!state) return undefined;
    switch (state.status) {
        case "ready":         return isRunning ? "active" : undefined;
        case "updating":      return "updating";
        case "creating":      return "creating";
        default:              return undefined;
    }
};

const StatusBadge: Component<{ label: string; variant: StatusVariant }> = (props) => {
    const variantClass = () => (props.variant ? styles[props.variant] : "");
    return (
        <div class={`${styles.statusContainer} ${variantClass()}`}>
            <div class={`${styles.statusIndicator} ${variantClass()}`} />
            <p class="smallestLabel">{props.label}</p>
        </div>
    );
};

const ToggleSwitch: Component<{
    id: string;
    checked: boolean;
    disabled?: boolean;
    onToggle: (e: Event) => void;
}> = (props) => (
    <>
        <input
            id={props.id}
            type="checkbox"
            checked={props.checked}
            disabled={props.disabled}
            onChange={props.onToggle}
            onClick={(e) => e.stopImmediatePropagation()}
        />
        <label for={props.id}>
            <p class="smallestLabel">ON</p>
            <p class="smallestLabel">OFF</p>
        </label>
    </>
);

const DashboardInstanceCard: Component<{ instance: Instance; listView: boolean; idx: number }> = (props) => {
    const id = createUniqueId();
    const detailHref = `/${props.instance.game}/${props.instance.name}`;
    const gameName = createMemo(() => gameRegistry[props.instance.game]?.name ?? props.instance.game);

    const banner = createAsync(async () => {
        const entry = gameRegistry[props.instance.game];
        if (!entry) return undefined;
        const mod = await entry.load();
        return mod.default.getBanner();
    });

    const state = createAsync(() => getInstanceState(props.instance));
    const endpoint = createMemo(() => endpointOf(state()));

    const [runtime, { refetch: refetchRuntime }] = createResource(
        endpoint,
        (ep: string) => getInstanceStatus(ep),
    );

    const runtimeRunning = createMemo(() => runtime()?.state === "running");

    const [optimistic, setOptimistic] = createSignal<boolean | null>(null);
    const [toggling, setToggling] = createSignal(false);
    const isRunning = createMemo(() => optimistic() ?? runtimeRunning());

    const labelText = createMemo(() => cardLabel(state(), isRunning()));
    const subtitleText = createMemo(() => cardSubtitle(state()));
    const variant = createMemo(() => statusVariantOf(state(), isRunning()));
    const bannerBusy = createMemo(() => {
        const s = state()?.status;
        return s === "creating" || s === "updating";
    });

    const toggle = async (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const ep = endpoint();
        if (!ep || toggling()) return;
        const wasRunning = isRunning();
        setOptimistic(!wasRunning);
        setToggling(true);
        try {
            await toggleInstance(ep, wasRunning);
            await sleep(2000);
            await refetchRuntime();
            setOptimistic(null);
        } catch (err) {
            console.error("toggle failed", err);
            setOptimistic(wasRunning);
        } finally {
            setToggling(false);
        }
    };

    // While the instance is updating, poll its state until the update completes.
    // Sleep-before-refetch gives the gateway a beat to move off the lagging
    // "updating" status (same lag guard as the Management start/stop poll).
    const [pollingState, setPollingState] = createSignal(false);
    const pollWhileUpdating = async () => {
        if (pollingState()) return;
        setPollingState(true);
        try {
            const deadline = Date.now() + 5 * 60_000;
            while (Date.now() < deadline) {
                await sleep(9000);
                await revalidate(getInstanceState.keyFor(props.instance));
                const s = state()?.status;
                if (s && s !== "updating") break;
            }
        } finally {
            setPollingState(false);
        }
    };

    createEffect(on(() => state()?.status, (s) => {
        if (s === "updating") void pollWhileUpdating();
    }));

    if (props.listView) {
        return (
            <A
                href={detailHref}
                class={styles.instanceList}
                style={`--colour: ${props.idx % 2 === 0 ? 'var(--colour-text-tertiary)' : 'var(--c-cream-list)'}`}
            >
                <p class="bodyTextSmallSemi">{props.instance.name}</p>
                <Suspense fallback={<div class={`${effects.skeleton} ${styles.listStatusSkeleton}`} aria-busy="true" />}>
                    <div class={styles.instanceStatusList}>
                        <p class="bodyTextSmallestSemiCaps">{labelText()}</p>
                    </div>
                </Suspense>
                <Suspense fallback={<p class={`bodyTextSmall ${effects.skeleton} ${styles.textSkeleton}`} aria-busy="true">&nbsp;</p>}>
                    <p class="bodyTextSmall">{subtitleText()}</p>
                </Suspense>
                <div class={styles.toggleContainer}>
                    <Suspense>
                        <Show when={canToggle(state())}>
                            <ToggleSwitch
                                id={`toggle-list-${id}`}
                                checked={isRunning()}
                                disabled={toggling()}
                                onToggle={toggle}
                            />
                        </Show>
                    </Suspense>
                </div>
                <InstanceOptions endpoint={endpoint() ?? ""} instance={props.instance} />
            </A>
        );
    }

    return (
        <A href={detailHref} class={styles.card}>
            <div class={styles.banner}>
                <div class={styles.image}>
                    <Suspense fallback={<div class={`${effects.skeletonOnDark} ${styles.bannerSkeleton}`} aria-busy="true" />}>
                        <Show when={banner()} fallback={<div class={`${effects.skeletonOnDark} ${styles.bannerSkeleton}`} />}>
                            <ResponsiveImage src={banner()!} width={260} />
                        </Show>
                    </Suspense>
                    <Show when={bannerBusy()}>
                        <div class={effects.sweep} />
                    </Show>
                </div>
                <div class={styles.metadata}>
                    <div>
                        <Suspense fallback={<div class={`${effects.skeletonOnDark} ${styles.gridStatusSkeleton}`} aria-busy="true" />}>
                            <Show when={state()}>
                                <StatusBadge label={labelText()} variant={variant()} />
                            </Show>
                        </Suspense>
                        <Suspense>
                            <Show when={canToggle(state())}>
                                <div class={styles.toggleContainer}>
                                    <ToggleSwitch
                                        id={`toggle-${id}`}
                                        checked={isRunning()}
                                        disabled={toggling()}
                                        onToggle={toggle}
                                    />
                                </div>
                            </Show>
                        </Suspense>
                    </div>
                    <p class="subtitleSemi">{gameName()}</p>
                </div>
            </div>
    
            <div class={styles.content}>
                <div class={styles.cta}>
                    <p class="statsText">{props.instance.name}</p>
                    <InstanceOptions endpoint={endpoint() ?? ""} instance={props.instance} />
                </div>
                <Suspense fallback={<p class={`${styles.metaText} ${effects.skeleton} ${styles.textSkeleton}`} aria-busy="true">&nbsp;</p>}>
                    <p class={`${styles.metaText} ${(state()?.status === "creating" || state()?.status === "updating") ? styles.dotsAnim : ""}`}>{subtitleText()}</p>
                </Suspense>
            </div>
        </A>
    );
};

export default DashboardInstanceCard;