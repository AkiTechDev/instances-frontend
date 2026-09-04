import {
    createMemo,
    createUniqueId,
    Show,
    Suspense,
    type Component,
} from "solid-js";
import { A, createAsync } from "@solidjs/router";
import { type Instance, type InstanceState } from "../../../lib/apis";
import { timeAgo } from "../../../lib/utils";
import { useInstanceRuntime } from "../../../lib/hooks/useInstanceRuntime";
import { useProvisioningProgress } from "../../../lib/hooks/useProvisioningProgress";

import styles from "./DashboardInstanceCard.module.css";
import effects from "../../../styles/components/effects.module.css";
import toggleSwitch from "../../../styles/components/toggleSwitch.module.css";

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

/**
 * The ON/OFF switch. Owns its container so the shared switch styles and the
 * markup they target can't drift apart; `class` is for caller-side layout only.
 */
const ToggleSwitch: Component<{
    id: string;
    checked: boolean;
    disabled?: boolean;
    label: string;
    class?: string;
    onToggle: (e: Event) => void;
}> = (props) => (
    <div class={`${toggleSwitch.container} ${props.class ?? ""}`}>
        <input
            id={props.id}
            type="checkbox"
            role="switch"
            aria-label={props.label}
            checked={props.checked}
            disabled={props.disabled}
            onChange={props.onToggle}
            onClick={(e) => e.stopImmediatePropagation()}
        />
        <label for={props.id}>
            <p class="smallestLabel">ON</p>
            <p class="smallestLabel">OFF</p>
        </label>
    </div>
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

    // Same two hooks the management page uses, so a card and the page it links
    // to agree on state and a toggle behaves identically in either place.
    const provisioning = useProvisioningProgress(() => props.instance);
    const runtime = useInstanceRuntime(provisioning.endpoint);

    const state = provisioning.state;

    const labelText = createMemo(() => cardLabel(state(), runtime.intent()));
    const subtitleText = createMemo(() => cardSubtitle(state()));
    const variant = createMemo(() => statusVariantOf(state(), runtime.intent()));

    const toggle = (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        void runtime.toggle();
    };

    // The stretched link has no text of its own, so it carries an explicit name.
    const cardLinkLabel = () => `${props.instance.name} — ${gameName()}`;

    const toggleLabel = () =>
        `${runtime.intent() ? "Stop" : "Start"} ${props.instance.name}`;

    if (props.listView) {
        return (
            <div
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
                <div class={styles.toggleSlot}>
                    <Suspense>
                        <Show when={canToggle(state())}>
                            <ToggleSwitch
                                id={`toggle-list-${id}`}
                                checked={runtime.intent()}
                                disabled={runtime.busy()}
                                label={toggleLabel()}
                                onToggle={toggle}
                            />
                        </Show>
                    </Suspense>
                </div>
                <InstanceOptions endpoint={provisioning.endpoint() ?? ""} instance={props.instance} class={styles.raised} />
                <A href={detailHref} class={styles.cardLink} aria-label={cardLinkLabel()} />
            </div>
        );
    }

    return (
        <div class={styles.card}>
            <div class={styles.banner}>
                <div class={styles.image}>
                    <Suspense fallback={<div class={`${effects.skeletonOnDark} ${styles.bannerSkeleton}`} aria-busy="true" />}>
                        <Show when={banner()} fallback={<div class={`${effects.skeletonOnDark} ${styles.bannerSkeleton}`} />}>
                            <ResponsiveImage src={banner()!} width={260} />
                        </Show>
                    </Suspense>
                    <Show when={provisioning.inProgress()}>
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
                                <ToggleSwitch
                                    class={styles.raised}
                                    id={`toggle-${id}`}
                                    checked={runtime.intent()}
                                    disabled={runtime.busy()}
                                    label={toggleLabel()}
                                    onToggle={toggle}
                                />
                            </Show>
                        </Suspense>
                    </div>
                    <p class="subtitleSemi">{gameName()}</p>
                </div>
            </div>

            <div class={styles.content}>
                <div class={styles.cta}>
                    <p class="statsText">{props.instance.name}</p>
                    <InstanceOptions endpoint={provisioning.endpoint() ?? ""} instance={props.instance} class={styles.raised} />
                </div>
                <Suspense fallback={<p class={`${styles.metaText} ${effects.skeleton} ${styles.textSkeleton}`} aria-busy="true">&nbsp;</p>}>
                    <p class={`${styles.metaText} ${provisioning.inProgress() ? styles.dotsAnim : ""}`}>{subtitleText()}</p>
                </Suspense>
            </div>
            <A href={detailHref} class={styles.cardLink} aria-label={cardLinkLabel()} />
        </div>
    );
};

export default DashboardInstanceCard;
