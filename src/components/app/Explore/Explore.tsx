import { createSignal, For, Show } from "solid-js";
import DashboardHeader from "../DashboardHeader/DashboardHeader";

import styles from "./Explore.module.css";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { getBestRegion, regions } from "../../../lib/regions";
import { createAsync } from "@solidjs/router";
import { gameRegistry } from "../../../lib/games/index";
import GameCard from "../GameCard/GameCard";

const Explore = () => {
    const [openModal, setOpenModal] = createSignal(false)
    const [modalOptions, setModalOptions] = createSignal<ModalOptions>({game_id: null, allow_game_change: true})

    // Deferred until the modal opens — ranking regions pings all 14 of them,
    // and browsing the game list doesn't need that. Cached for an hour, so
    // re-opening the modal costs nothing.
    const regionsByLatency = createAsync(async () => {
        if (!openModal()) return undefined;
        const ordered = await getBestRegion();
        return Object.fromEntries(ordered.map(({ region }) => [region, regions[region]]));
    })

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
                <div class={styles.gamesContainer}>
                    <For each={Object.entries(gameRegistry)}>
                        {([id, ]) => (
                            <GameCard game_id={id} OpenCreateInstanceModal={OpenCreateInstanceModal} />
                        )}
                    </For>
                </div>
            </div>
        </div>
    )
}

export default Explore;

