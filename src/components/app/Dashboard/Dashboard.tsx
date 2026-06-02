import { createSignal, For, createEffect, Show } from "solid-js";
import { createAsync, revalidate } from "@solidjs/router";
import DashboardHeader from "../DashboardHeader/DashboardHeader";
import DashboardSidebarNav from "../DashboardSidebarNav/DashboardSidebarNav";

// Dashboard Imports
import styles from "./Dashboard.module.css";

import btnWithIcon from "../../../styles/components/buttonWithIcons.module.css";

// No Instances Imports
import mouseImage from "../../../assets/images/mouse.png?format=avif;webp&responsive";

import filterBtn from '../../../styles/components/filterButton.module.css';
import gridViewIcon from "../../../assets/icons/grid.svg";
import listViewIcon from "../../../assets/icons/list.svg";;
import iconArrow from "../../../assets/icons/chevron.svg";
import searchIcon from "../../../assets/icons/search.svg";;
import crossIcon from "../../../assets/icons/cross.svg";
import refreshIcon from "../../../assets/icons/refresh.svg";
import LogoIcon from "../../../assets/icons/logos/icon.svg";
import DashboardInstanceCard from "../DashboardInstanceCard/DashboardInstanceCard";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

import { getBestRegion, regions } from "../../../lib/regions";
import { getInstances, type Instance } from "../../../lib/apis";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";


import button from "../../../styles/components/button.module.css";

const Dashboard = () => {
    const instances = createAsync(() => getInstances(), {
        initialValue: [],
    });

    const [openModal, setOpenModal] = createSignal(false);
    const [modalOptions, setModalOptions] = createSignal<ModalOptions>({game_id: null, allow_game_change: true})

    const [gameFilter, setGameFilter] = createSignal("all");
    const [instanceSearchText, setInstanceSearchText] = createSignal("");

    const [isListView, setIsListView] = createSignal(false);

    createEffect(() => {
        document.body.style.overflow = openModal() ? 'hidden' : '';
    });

    const regionsByLatency = createAsync(async () => {
        let ordered_regions = getBestRegion();
        return Object.fromEntries((await ordered_regions).map(({ region }) => [region, regions[region]]));
    })


    const OpenCreateInstanceModal = (options: ModalOptions) => {
        setModalOptions(options);
        setOpenModal(true);
    }


    return (
        <section class={styles.gridContainer}>
            <Show when={openModal()}>
                <CreateInstanceModal setIsOpen={setOpenModal} game_id={modalOptions()["game_id"]} allow_game_change={modalOptions()["allow_game_change"]} regions={regionsByLatency()} />
            </Show>
            <DashboardHeader />
            {instances().length === 0 && (
                <div class={styles.noInstancesContainer}>
                    <ResponsiveImage src={mouseImage} width={144} />
                    <div class={styles.noContent}>
                        <h6 class="h6">No Games Added Yet!</h6>
                        <p class="statsTitle">All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                    </div>
                    <button class={`${button.btn} ${button.vibrant} ${button.icon} ${btnWithIcon.rotate45}`} style={`--icon: url(${crossIcon.src})`} onclick={() => OpenCreateInstanceModal({game_id: null, allow_game_change: true})}><p class="buttonText">Create New Game</p></button>
                </div>
            )}
            { instances().length > 0 && (
                <>
                <DashboardSidebarNav filter={gameFilter} setFilter={setGameFilter} openCreateIntanceModal={OpenCreateInstanceModal}/>
                <div class={styles.gamesContainer}>
                    <div class={styles.gamesListHeader}>
                        <h4 class="h4">{(gameFilter() === "all") ? "All Instances" : gameRegistry[gameFilter()].name}</h4>
                        <button class={`${button.btn} ${button.vibrant} ${button.icon}`} style={`--icon: url(${LogoIcon.src})`} onclick={() => OpenCreateInstanceModal({game_id: gameFilter() === "all" ? null : gameFilter(), allow_game_change: gameFilter() === "all" ? true : false})}><p class="buttonText">Add New Instance</p></button>
                    </div>
                    <div class={styles.gameFiltersContainer}>
                        <label class={styles.searchableContainer}>
                            <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                            <input id="instanceSearch" type="search" placeholder="Search your instances" value={instanceSearchText()} onInput={(e) => setInstanceSearchText(e.currentTarget.value)}></input>
                            <button onClick={() => (setInstanceSearchText(""))} class={`${styles.inputClearBtn} ${instanceSearchText() ? styles.visible : styles.hidden}`} style={`--icon: url("${crossIcon.src}")`}></button>
                            <button class={`bodyTextMedium ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Active Instances</button>
                        </label>
                        <button class={`bodyTextMedium ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Date Created</button>
                        <button class={`bodyTextMedium ${filterBtn.button}`} style={`--icon: url(${refreshIcon.src})`} onClick={() => revalidate("instances")}>Refresh</button>
                        <div class={styles.toggleView}>
                            <input
                                id="viewToggle"
                                type="checkbox"
                                checked={isListView()}
                                onChange={() => setIsListView(!isListView())}
                            />
                            <label for="viewToggle">
                                <div class={styles.viewIcon} style={`--icon: url("${gridViewIcon.src}")`} />
                                <div class={styles.viewIcon} style={`--icon: url("${listViewIcon.src}")`} />
                            </label>
                        </div>
                    </div>
                    <div class={ isListView() ?  styles.gamesListContainer : styles.gamesGridContainer}>
                        { isListView() && (
                            <div class={styles.gamesListViewHeader}>
                                <p class="bodyTextSmall">Instance</p>
                                <p class="bodyTextSmall">Status</p>
                                <p class="bodyTextSmall">Activity</p>
                                <p></p>
                                <p></p>
                            </div>
                        )}

                        <For each={instances()
                            .filter(instance => {
                                if (gameFilter() === "all") {
                                    if (instanceSearchText() === "") {
                                        return true 
                                    } else if (instance.name.toLowerCase().includes(instanceSearchText().toLowerCase())) {
                                        return true
                                    }
                                } else if (gameFilter() !== "") {
                                    if (instanceSearchText() === "" && instance.game == gameFilter()) {
                                        return true 
                                    } else if (instance.name.toLowerCase().includes(instanceSearchText().toLowerCase()) && instance.game == gameFilter()) {
                                        return true
                                    }
                                }
                        })}>
                            {(instance: Instance, idx) => (
                                <DashboardInstanceCard instance={instance} listView={isListView()} idx={idx()} />
                            )}
                        </For>
                    </div>
                </div>
                </>
            )}
        </section>
    );
}

export default Dashboard