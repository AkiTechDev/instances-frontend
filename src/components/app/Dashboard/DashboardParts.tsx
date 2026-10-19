import { createSignal, Index, Show, type Component } from "solid-js";

import styles from "./Dashboard.module.css";
import effects from "../../../styles/components/effects.module.css";
import button from "../../../styles/components/button.module.css";

import { type Instance } from "../../../lib/apis";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import GameGrid, { GameGridSkeleton } from "../GameGrid/GameGrid";

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

/**
 * Loading state for an account we expect to be empty — mirrors NoInstances
 * (heading, one line, the game grid) in the same column, so the game picker
 * lands exactly where the skeleton was.
 *
 * Bars rather than the real words: until the list resolves we don't know the
 * account is empty, and "You don't have any instances yet" over someone's
 * loading servers is the very thing this skeleton exists to avoid.
 */
const EmptyStateSkeleton: Component = () => (
    <div class={`${styles.gamesContainer} ${styles.getStarted}`} aria-busy="true">
        <div class={styles.getStartedHeader}>
            {/* Each bar sits in a box carrying the real line's type class, so
                the box is exactly that line's height. */}
            <div class={`h4 ${styles.skeletonLine}`}>
                <div class={`${effects.skeleton} ${styles.skeletonGetStartedTitle}`} />
            </div>
            <div class={`statsTitle ${styles.skeletonLine}`}>
                <div class={`${effects.skeleton} ${styles.skeletonGetStartedLead}`} />
            </div>
        </div>
        <GameGridSkeleton />
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
            <div class={styles.gamesGridContainer}>
                <Index each={Array.from({ length: props.cards ?? 4 })}>
                    {() => <InstanceCardSkeleton />}
                </Index>
            </div>
        </div>
    </Show>
);

/**
 * Zero-state for an account with no instances: every game we host, each a card
 * that opens the create flow already set to that game. Rendered only once the
 * list has resolved and is genuinely empty — never while it's still loading.
 *
 * Explore's cards rather than instance cards, deliberately. An instance card
 * means "a server you have" — badge, switch, menu — and a grid of them here
 * would read as ten servers the account doesn't own.
 */
export const NoInstances: Component<{ onCreate: (options: ModalOptions) => void }> = (props) => (
    <div class={`${styles.gamesContainer} ${styles.getStarted}`}>
        <div class={styles.getStartedHeader}>
            <h4 class="h4">Pick a game to get started</h4>
            <p class="statsTitle">You don't have any instances yet. Choose a game, then name your instance and pick its size.</p>
        </div>
        <GameGrid OpenCreateInstanceModal={props.onCreate} />
    </div>
);

/**
 * Stands in for the list view until it's built. Same heading-and-subline
 * treatment as the Extra page's placeholder.
 */
export const ListViewComingSoon: Component = () => (
    <div class={styles.comingSoon}>
        <h3 class="h3">List View Coming Soon</h3>
        <p class="statsTitle">Switch back to grid view to see your instances.</p>
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
        <div class={styles.listError} role="alert">
            <div class={styles.listErrorText}>
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


/**
 * One instance whose own state call failed.
 *
 * Scoped to a single card on purpose. The list-level boundary in Dashboard.tsx
 * replaces the entire grid with one message, so a single unreachable server
 * used to hide every healthy one alongside it — measured: one of three
 * instances returning 500 rendered zero cards and told the account it had no
 * games. Holding the slot, named, is the honest report: the instance exists,
 * we just can't reach it this second.
 */
export const InstanceCardError: Component<{
    instance: Instance;
    onRetry: () => void | Promise<void>;
}> = (props) => {
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
        <div class={styles.cardError} role="alert">
            <p class={`bodyTextSmallSemi ${styles.cardErrorName}`}>{props.instance.name}</p>
            <p class="bodyTextSmall">We couldn't reach this server.</p>
            <button
                type="button"
                class={`${button.btn} ${button.link}`}
                disabled={retrying()}
                onClick={() => void retry()}
            >{retrying() ? "Retrying…" : "Retry"}</button>
        </div>
    );
};
