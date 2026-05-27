import { createResource, createSignal, createUniqueId, Show, Suspense } from "solid-js";
import { A, createAsync } from "@solidjs/router";
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

import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

const cardLabel = (state: InstanceState, isRunning: boolean): string => {
    switch (state.status) {
        case "ready":
        case "updating":      return isRunning ? "RUNNING" : "STOPPED";
        case "creating":      return "CREATING";
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
        case "ready":
        case "updating":      return `Active ${timeAgo(state.elapsed_seconds)}`;
        case "creating":
        case "deleting":
        case "rolling_back":
        case "gone":          return state.message;
        case "failed":        return state.error.reason ?? state.error.failed_status;
        case "rolled_back":   return state.reason ?? "Rolled back";
        case "unknown":       return state.note;
    }
};

const canToggle = (state: InstanceState | undefined): boolean =>
    state?.status === "ready" || state?.status === "updating";

const DashboardInstanceCard = (props: { instance: Instance, listView: boolean, idx: number }) => {
    const id = createUniqueId();

    const game = createAsync(async () => {
        const entry = gameRegistry[props.instance.game];

        if (!entry) throw new Error(`Unknown game: ${props.instance.game}`);
        const mod = await entry.load();
        return mod.default;
    });

    const state = createAsync(() => getInstanceState(props.instance));
    const endpoint = () => endpointOf(state());

    const [runtime, { refetch: refetchRuntime }] = createResource(
        endpoint,
        (ep: string) => getInstanceStatus(ep),
    );

    const runtimeRunning = () => {
        const r = runtime();
        return r ? "ipv6" in r : false;
    };
    const [optimistic, setOptimistic] = createSignal<boolean | null>(null);
    const isRunning = () => optimistic() ?? runtimeRunning();

    const banner = createAsync(async () => game()?.getBanner());

    const toggle = async (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const ep = endpoint();
        if (!ep) return;
        const wasRunning = isRunning();
        setOptimistic(!wasRunning);
        try {
            await toggleInstance(ep, wasRunning);
            await sleep(2000);
            await refetchRuntime();
            setOptimistic(null);
        } catch (err) {
            console.error("toggle failed", err);
            setOptimistic(wasRunning);
        }
    };

    return (
        <>
            { props.listView === false && (
                <A href={`/${props.instance.game}/${props.instance.name}`} class={styles.gameCard}>
                    <Show when={banner()}>
                        <div class={styles.imageWrapper}>
                            <ResponsiveImage src={banner()!} />
                            <Show when={state()}>
                                <div class={`${styles.statusContainer} ${isRunning() ? styles.active : ""}`}>
                                    <div class={`${styles.statusIndicator} ${isRunning() ? styles.active : ""}`}></div>
                                    <p class="smallestLabel">{cardLabel(state()!, isRunning())}</p>
                                </div>
                                <Show when={canToggle(state())}>
                                    <div class={styles.toggleContainer}>
                                        <input id={`toggle-${id}`} type="checkbox" checked={isRunning()} onChange={(e) => toggle(e)} onClick={(e) => e.stopImmediatePropagation()} />
                                        <label for={`toggle-${id}`}>
                                            <p class="smallestLabel">ON</p>
                                            <p class="smallestLabel">OFF</p>
                                        </label>
                                    </div>
                                </Show>
                            </Show>
                            <p class="subtitleSemi">{gameRegistry[props.instance.game].name}</p>
                        </div>
                    </Show>
                    <div class={styles.textWrapper}>
                        <div class={styles.gamecardInfo}>
                            <p class="statsText">{props.instance.name}</p>
                            <InstanceOptions endpoint={endpoint() ?? ""} instance={props.instance} />
                        </div>
                        <p class={styles.metaText}>{cardSubtitle(state())}</p>
                    </div>
                </A>
            )}

            { props.listView === true && (
                <A href={`/${props.instance.game}/${props.instance.name}`} class={styles.instanceList} style={`--colour: ${props.idx % 2 === 0 ? 'var(--colour-text-tertiary)' : '#F9F9F9'}`}>
                    <p class="bodyTextSmallSemi">{props.instance.name}</p>
                    <div class={styles.instanceStatusList}>
                        <p class="bodyTextSmallestSemiCaps">{cardLabel(state()!, isRunning())}</p>
                    </div>
                    <p class="bodyTextSmall">{cardSubtitle(state())}</p>
                    <div class={styles.toggleContainer}>
                        <Show when={canToggle(state())}>
                            <input id={`toggle-list-${id}`} type="checkbox" checked={isRunning()} onChange={(e) => toggle(e)} onClick={(e) => e.stopImmediatePropagation()} />
                            <label for={`toggle-list-${id}`}>
                                <p class="smallestLabel">ON</p>
                                <p class="smallestLabel">OFF</p>
                            </label>
                        </Show>
                    </div>
                    <Suspense>
                        <InstanceOptions endpoint={endpoint() ?? ""} instance={props.instance} />
                    </Suspense>
                </A>
            )}
        </>
    );
};

export default DashboardInstanceCard;
