import { ErrorBoundary, For, Index, Suspense, type Component } from "solid-js";

import styles from "./GameGrid.module.css";
import GameCard, { GameCardSkeleton } from "../GameCard/GameCard";
import RouteError from "../RouteError/RouteError";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { gameRegistry } from "../../../lib/games/index";

/**
 * Every game we host, each as a card that opens the create flow for it.
 *
 * Explore and the dashboard's zero-state both ask "which game?", so they share
 * one grid: picking a game looks the same wherever you go to start one, and the
 * two can't drift apart.
 */
const GameGrid: Component<{ OpenCreateInstanceModal: (options: ModalOptions) => void }> = (props) => (
    /* Each card loads its game module on demand, so a chunk that 404s after a
       deploy throws here. Caught at the grid so the heading above it and the
       create flow stay usable. */
    <ErrorBoundary fallback={(err, reset) => {
        console.error("failed to render the games grid", err);
        return <RouteError onRetry={reset} />;
    }}>
        <div class={styles.grid}>
            <For each={Object.keys(gameRegistry)}>
                {(id) => (
                    /* Per card, so a slow chunk holds its own slot rather than
                       the whole grid. Without it a card rendered nothing until
                       its module arrived, and the grid filled in out of order. */
                    <Suspense fallback={<GameCardSkeleton />}>
                        <GameCard game_id={id} OpenCreateInstanceModal={props.OpenCreateInstanceModal} />
                    </Suspense>
                )}
            </For>
        </div>
    </ErrorBoundary>
);

/** The same grid, card for card, for a page still waiting before it can draw it. */
export const GameGridSkeleton: Component = () => (
    <div class={styles.grid} aria-hidden="true">
        <Index each={Object.keys(gameRegistry)}>
            {() => <GameCardSkeleton />}
        </Index>
    </div>
);

export default GameGrid;
