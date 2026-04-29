import { createSignal, For, Show } from "solid-js";
import DashboardHeader from "../DashboardHeader/DashboardHeader";

import styles from "./Explore.module.css";
import games from "../../../lib/games";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { getBestRegion, regions } from "../../../lib/regions";
import { createAsync } from "@solidjs/router";

const Explore = () => {
    const [openModal, setOpenModal] = createSignal(false)
    const [modalOptions, setModalOptions] = createSignal<ModalOptions>({game_id: null, allow_game_change: true})

    const regionsByLatency = createAsync(async () => {
        let ordered_regions = getBestRegion();
        return Object.fromEntries((await ordered_regions).map(({ region }) => [region, regions[region]]));
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
                    <For each={Object.entries(games)}>
                        {([id, game]) => (
                            <div class={styles.gameCard} onclick={() => OpenCreateInstanceModal({game_id: id, allow_game_change: false})}>
                                <img src={`/imgs/${id}/banner.avif`} />
                                <p>{game.name}</p>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    )
}

export default Explore;

