import { createSignal, Match, Switch, For, createEffect, Show, Suspense } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import DashboardHeader from "../DashboardHeader/DashboardHeader";
import DashboardSidebarNav from "../DashboardSidebarNav/DashboardSidebarNav";

// Dashboard Imports
import styles from "./Dashboard.module.css";
import typo from "../../../styles/typography.module.css"

import buttonBig from "../../../styles/components/buttonBig.module.css";
import btnWithIcon from "../../../styles/components/buttonWithIcons.module.css";

// No Instances Imports
import mouseImage from "./assets/mouse.png?url";
import buttonIcon from "../../../assets/iconPlus.svg";

import games from "../../../lib/games";

import filterBtn from '../../../styles/components/filterButton.module.css';
import gridViewIcon from "./assets/gridViewIcon.svg";
import listViewIcon from "./assets/listViewIcon.svg";
import iconArrow from "../../../assets/iconArrow.svg";
import searchIcon from "./assets/searchIcon.svg";
import crossIcon from "../../../assets/crossIcon.svg";
import instanceIcon from "../../../assets/instanceIcon.svg";
import DashboardInstanceCard from "../DashboardInstanceCard/DashboardInstanceCard";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

import { getBestRegion, regions } from "../../../lib/regions";
import { getInstances, type Instance } from "../../../lib/apis";


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
            <Suspense fallback={
                <div class={styles.noInstancesContainer}>
                    <img src={mouseImage} />
                    <div class={styles.noContent}>
                        <h6 class={typo.h6}>No Games Added Yet!</h6>
                        <p class={typo.statsTitle}>All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                    </div>
                    <button class={`${buttonBig.buttonBig} ${buttonBig.vibrantStyle}`} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Create new Game</p></button>
                </div>
            }>
            {instances().length === 0 && (
                <div class={styles.noInstancesContainer}>
                    <img src={mouseImage} />
                    <div class={styles.noContent}>
                        <h6 class={typo.h6}>No Games Added Yet!</h6>
                        <p class={typo.statsTitle}>All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                    </div>
                    <button class={`${buttonBig.buttonBig} ${buttonBig.vibrantStyle}`} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Create new Game</p></button>
                </div>
            )}
            { instances().length > 0 && (
                <>
                <DashboardSidebarNav filter={gameFilter} setFilter={setGameFilter} openCreateIntanceModal={OpenCreateInstanceModal}/>
                <div class={styles.gamesContainer}>
                    <div class={styles.gamesListHeader}>
                        <h4 class={typo.h4}>{(gameFilter() === "all") ? "All Instances" : games[gameFilter()].name}</h4>
                        <button class={`${btnWithIcon.buttonSlim} ${btnWithIcon.buttonBig}`} style={`--icon: url(${instanceIcon.src})`}><p class={typo.buttonText} onclick={() => OpenCreateInstanceModal({game_id: gameFilter() === "all" ? null : gameFilter(), allow_game_change: gameFilter() === "all" ? true : false})}>Add new Instance</p></button>
                    </div>
                    <div class={styles.gameFiltersContainer}>
                        <label class={styles.searchableContainer}>
                            <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                            <input id="instanceSearch" type="search" placeholder="Search your instances" value={instanceSearchText()} onInput={(e) => setInstanceSearchText(e.currentTarget.value)}></input>
                            <button onClick={() => (setInstanceSearchText(""))} class={`${styles.inputClearBtn} ${instanceSearchText() ? styles.visible : styles.hidden}`} style={`--icon: url("${crossIcon.src}")`}></button>
                            <button class={`${typo.bodyTextMedium} ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Active Instances</button>
                        </label>
                        <button class={`${typo.bodyTextMedium} ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Date Created</button>
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
                                <p class={typo.bodyTextSmall}>Instance</p>
                                <p class={typo.bodyTextSmall}>Status</p>
                                <p class={typo.bodyTextSmall}>Activity</p>
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
            </Suspense>
        </section>
    );
}

export default Dashboard