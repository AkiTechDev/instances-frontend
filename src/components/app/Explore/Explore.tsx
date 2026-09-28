import { createSignal, ErrorBoundary, For, onMount, Show } from "solid-js";
import DashboardHeader from "../DashboardHeader/DashboardHeader";

import styles from "./Explore.module.css";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { getRegionsByLatency, preloadRegionRanking } from "../../../lib/regions";
import { createAsync } from "@solidjs/router";
import { gameRegistry } from "../../../lib/games/index";
import GameCard from "../GameCard/GameCard";
import RouteError from "../RouteError/RouteError";

const Explore = () => {
    const [openModal, setOpenModal] = createSignal(false)
    const [modalOptions, setModalOptions] = createSignal<ModalOptions>({game_id: null, allow_game_change: true})

    // Ranked in the background once the page is idle, so picking a game opens
    // onto a finished region list. Gated on the modal so the pings wait for
    // idle rather than starting during first render.
    onMount(preloadRegionRanking);
    const regionsByLatency = createAsync(async () => openModal() ? getRegionsByLatency() : undefined);

    const OpenCreateInstanceModal = (options: ModalOptions) => {
        setModalOptions(options);
        setOpenModal(true);
    }

    return (
        <div class={styles.gridContainer}>
            <DashboardHeader />
            <Show when={openModal()}>
                <CreateInstanceModal setIsOpen={setOpenModal} game_id={modalOptions()["game_id"]} allow_game_change={modalOptions()["allow_game_change"]} regions={regionsByLatency()} />
            </Show>
            <div class={styles.exploreContainer}>
                <div class={styles.exploreHeader}>
                    <h4 class="h4">Games to Try</h4>
                </div>
                {/* Each card loads its game module on demand, so a chunk that
                    404s after a deploy throws here. Caught at the grid so the
                    header and the create flow above it stay usable. */}
                <ErrorBoundary fallback={(err, reset) => {
                    console.error("failed to render the games grid", err);
                    return <RouteError onRetry={reset} />;
                }}>
                    <div class={styles.gamesContainer}>
                        <For each={Object.entries(gameRegistry)}>
                            {([id, ]) => (
                                <GameCard game_id={id} OpenCreateInstanceModal={OpenCreateInstanceModal} />
                            )}
                        </For>
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    )
}

export default Explore;

