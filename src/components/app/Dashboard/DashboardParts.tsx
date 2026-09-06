import { createSignal, Index, Show, type Component } from "solid-js";
import { ResponsiveImage } from "@responsive-image/solid";

import styles from "./Dashboard.module.css";
import effects from "../../../styles/components/effects.module.css";
import button from "../../../styles/components/button.module.css";

import mouseImage from "../../../assets/images/mouse.png?format=avif;webp&responsive";
import crossIcon from "../../../assets/icons/cross.svg";
import refreshIcon from "../../../assets/icons/refresh.svg";

/* Presentational pieces of the dashboard. Split out so Dashboard.tsx holds the
   page's wiring and nothing else. */

/**
 * One instance card in skeleton form — mirrors DashboardInstanceCard's shape
 * (banner, name, meta line) so the grid doesn't reflow when the real cards land.
 */
const InstanceCardSkeleton: Component = () => (
    <div class={styles.skeletonCard}>
        <div class={`${effects.skeleton} ${styles.skeletonCardBanner}`} />
        <div class={styles.skeletonCardText}>
            <div class={`${effects.skeleton} ${styles.skeletonCardTitle}`} />
            <div class={`${effects.skeleton} ${styles.skeletonCardMeta}`} />
        </div>
    </div>
);

/** The same, for the list view's rows. */
const InstanceRowSkeleton: Component = () => (
    <div class={styles.skeletonRow}>
        <div class={`${effects.skeleton} ${styles.skeletonRowName}`} />
        <div class={`${effects.skeleton} ${styles.skeletonRowStatus}`} />
        <div class={`${effects.skeleton} ${styles.skeletonRowMeta}`} />
    </div>
);

/**
 * Loading state for an account we expect to be empty — mirrors NoInstances
 * (art, two lines, button) inside the same centred container, so the
 * get-started screen lands exactly where the skeleton was.
 */
const EmptyStateSkeleton: Component = () => (
    <div class={styles.noInstancesContainer} aria-busy="true">
        <div class={`${effects.skeleton} ${styles.skeletonEmptyArt}`} />
        <div class={styles.noContent}>
            <div class={`${effects.skeleton} ${styles.skeletonEmptyTitle}`} />
            <div class={`${effects.skeleton} ${styles.skeletonEmptyLine}`} />
            <div class={`${effects.skeleton} ${styles.skeletonEmptyLineShort}`} />
        </div>
        <div class={`${effects.skeleton} ${styles.skeletonEmptyButton}`} />
    </div>
);

/**
 * Loading state for the instance list.
 *
 * Holds the page's real layout — sidebar column, list header, filter row, card
 * grid — so nothing jumps when the instances resolve, and so a returning user
 * is never told they have no servers while their servers are still on the wire.
 *
 * The two layouts are far apart (the sidebar column is 290px and animates in
 * and out), so `shape` picks the one the caller expects; guessing wrong is what
 * slides the whole page sideways when the data lands.
 */
export const DashboardSkeleton: Component<{
    /** Which layout the resolved list is expected to produce. */
    shape?: "list" | "empty";
    listView?: boolean;
    cards?: number;
}> = (props) => (
    <Show when={props.shape !== "empty"} fallback={<EmptyStateSkeleton />}>
        {/* Carries Dashboard's own .sidebar class: the grid's `:has(.sidebar)`
            rule is what opens the sidebar column, so the skeleton has to claim
            it too or the content shifts sideways once the real nav mounts. */}
        <aside class={`${styles.sidebar} ${styles.skeletonSidebar}`} aria-hidden="true">
            <div class={`${effects.skeleton} ${styles.skeletonSidebarTitle}`} />
            <div class={`${effects.skeleton} ${styles.skeletonSidebarPill}`} />
            <div class={`${effects.skeleton} ${styles.skeletonSidebarPill}`} />
            <Index each={Array.from({ length: 4 })}>
                {() => <div class={`${effects.skeleton} ${styles.skeletonSidebarItem}`} />}
            </Index>
        </aside>

        <div class={styles.gamesContainer} aria-busy="true">
            <div class={styles.gamesListHeader}>
                <div class={`${effects.skeleton} ${styles.skeletonHeading}`} />
                <div class={`${effects.skeleton} ${styles.skeletonHeaderButton}`} />
            </div>
            <div class={styles.gameFiltersContainer}>
                <div class={`${effects.skeleton} ${styles.skeletonSearch}`} />
                <div class={`${effects.skeleton} ${styles.skeletonFilter}`} />
                <div class={`${effects.skeleton} ${styles.skeletonFilter}`} />
            </div>
            <div class={props.listView ? styles.gamesListContainer : styles.gamesGridContainer}>
                <Index each={Array.from({ length: props.cards ?? 4 })}>
                    {() => (
                        <Show when={props.listView} fallback={<InstanceCardSkeleton />}>
                            <InstanceRowSkeleton />
                        </Show>
                    )}
                </Index>
            </div>
        </div>
    </Show>
);

/**
 * Zero-state for an account with no instances. Rendered only once the list has
 * resolved and is genuinely empty — never while it's still loading.
 */
export const NoInstances: Component<{ onCreate: () => void }> = (props) => (
    <div class={styles.noInstancesContainer}>
        <ResponsiveImage src={mouseImage} width={144} />
        <div class={styles.noContent}>
            <h6 class="h6">No Games Added Yet!</h6>
            <p class="statsTitle">All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
        </div>
        <button type="button" class={`${button.btn} ${button.vibrant} ${button.icon} ${button.rotate45}`} style={`--icon: url(${crossIcon.src})`} onClick={() => props.onCreate()}><p class="buttonText">Create New Game</p></button>
    </div>
);

/**
 * Shown when the instance list can't be fetched.
 *
 * Worth its own state: the list used to default to an empty array, so a failed
 * request rendered the zero-state — telling someone with running servers that
 * they had none, next to a button offering to create another.
 */
export const InstanceListError: Component<{ onRetry: () => void | Promise<void> }> = (props) => {
    const [retrying, setRetrying] = createSignal(false);

    const retry = async () => {
        if (retrying()) return;
        setRetrying(true);
        try {
            await props.onRetry();
        } finally {
            setRetrying(false);
        }
    };

    return (
        <div class={styles.noInstancesContainer} role="alert">
            <div class={styles.noContent}>
                <h6 class="h6">We couldn't load your games</h6>
                <p class="statsTitle">Your instances are still running — we just couldn't reach the server.<br />Check your connection and try again.</p>
            </div>
            <button
                type="button"
                class={`${button.btn} ${button.vibrant} ${button.icon} ${styles.retryIcon}`}
                style={`--icon: url(${refreshIcon.src})`}
                disabled={retrying()}
                onClick={() => void retry()}
            ><p class="buttonText">{retrying() ? "Retrying…" : "Try Again"}</p></button>
        </div>
    );
};
