import { createSignal, onMount, Show } from "solid-js";
import DashboardHeader from "../DashboardHeader/DashboardHeader";

import styles from "./Explore.module.css";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { getRegionsByLatency, preloadRegionRanking } from "../../../lib/regions";
import { createAsync } from "@solidjs/router";
import GameGrid from "../GameGrid/GameGrid";

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
                <GameGrid OpenCreateInstanceModal={OpenCreateInstanceModal} />
            </div>
        </div>
    )
}

export default Explore;

