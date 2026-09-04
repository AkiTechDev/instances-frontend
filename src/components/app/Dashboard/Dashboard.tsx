import { createSignal, For, createEffect, createMemo, Show } from "solid-js";
import { createAsync, revalidate } from "@solidjs/router";
import DashboardHeader from "../DashboardHeader/DashboardHeader";
import DashboardSidebarNav from "../DashboardSidebarNav/DashboardSidebarNav";

// Dashboard Imports
import styles from "./Dashboard.module.css";

// No Instances Imports
import mouseImage from "../../../assets/images/mouse.png?format=avif;webp&responsive";

import filterBtn from '../../../styles/components/filterButton.module.css';
import gridViewIcon from "../../../assets/icons/grid.svg";
import listViewIcon from "../../../assets/icons/list.svg";
import iconArrow from "../../../assets/icons/chevron.svg";
import searchIcon from "../../../assets/icons/search.svg";
import crossIcon from "../../../assets/icons/cross.svg";
import refreshIcon from "../../../assets/icons/refresh.svg";
import LogoIcon from "../../../assets/icons/logos/icon.svg";
import DashboardInstanceCard from "../DashboardInstanceCard/DashboardInstanceCard";
import CreateInstanceModal, { type ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

import { getBestRegion, regions } from "../../../lib/regions";
import { getInstances } from "../../../lib/apis";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

import button from "../../../styles/components/button.module.css";
import search from "../../../styles/components/search.module.css";

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

    // Ranking regions means pinging all 14 of them. Gated on the modal actually
    // being open so a dashboard visit that never creates an instance — the
    // common case — doesn't pay for a dropdown nobody opened. `getBestRegion`
    // caches for an hour, so re-opening the modal is free.
    const regionsByLatency = createAsync(async () => {
        if (!openModal()) return undefined;
        const ordered = await getBestRegion();
        return Object.fromEntries(ordered.map(({ region }) => [region, regions[region]]));
    })

    const OpenCreateInstanceModal = (options: ModalOptions) => {
        setModalOptions(options);
        setOpenModal(true);
    }

    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const handleRefresh = async () => {
        if (isRefreshing()) return;
        setIsRefreshing(true);
        try {
            // Awaited, so the button stops spinning when the data actually
            // lands rather than after a fixed guess at how long it takes.
            await revalidate(getInstances.key);
        } finally {
            setIsRefreshing(false);
        }
    };

    const visibleInstances = createMemo(() => {
        const query = instanceSearchText().trim().toLowerCase();
        const game = gameFilter();

        return instances().filter((instance) =>
            (game === "all" || instance.game === game) &&
            (query === "" || instance.name.toLowerCase().includes(query)));
    });

    const headingText = () =>
        gameFilter() === "all"
            ? "All Instances"
            : gameRegistry[gameFilter()]?.name ?? gameFilter();

    return (
        <section class={styles.gridContainer}>
            <Show when={openModal()}>
                <CreateInstanceModal setIsOpen={setOpenModal} game_id={modalOptions()["game_id"]} allow_game_change={modalOptions()["allow_game_change"]} regions={regionsByLatency()} />
            </Show>
            <DashboardHeader />
            <Show when={instances().length === 0}>
                <div class={styles.noInstancesContainer}>
                    <ResponsiveImage src={mouseImage} width={144} />
                    <div class={styles.noContent}>
                        <h6 class="h6">No Games Added Yet!</h6>
                        <p class="statsTitle">All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                    </div>
                    <button type="button" class={`${button.btn} ${button.vibrant} ${button.icon} ${button.rotate45}`} style={`--icon: url(${crossIcon.src})`} onClick={() => OpenCreateInstanceModal({game_id: null, allow_game_change: true})}><p class="buttonText">Create New Game</p></button>
                </div>
            </Show>
            <Show when={instances().length > 0}>
                <DashboardSidebarNav filter={gameFilter} setFilter={setGameFilter} openCreateIntanceModal={OpenCreateInstanceModal}/>
                <div class={styles.gamesContainer}>
                    <div class={styles.gamesListHeader}>
                        <h4 class="h4">{headingText()}</h4>
                        <button type="button" class={`${button.btn} ${button.vibrant} ${button.icon}`} style={`--icon: url(${LogoIcon.src})`} onClick={() => OpenCreateInstanceModal({game_id: gameFilter() === "all" ? null : gameFilter(), allow_game_change: gameFilter() === "all"})}><p class="buttonText">Add New Instance</p></button>
                    </div>
                    <div class={styles.gameFiltersContainer}>
                        <label class={`${search.label} ${search.beforeIcon} ${search.withFilterBtn}`} style={`--icon: url("${searchIcon.src}")`}>
                            <input type="search" aria-label="Search your instances" placeholder="Search your instances" value={instanceSearchText()} onInput={(e) => setInstanceSearchText(e.currentTarget.value)} />
                            <button type="button" aria-label="Clear search" onClick={() => setInstanceSearchText("")} class={`${search.clearBtn} ${instanceSearchText() ? search.visible : ""}`} style={`--icon: url("${crossIcon.src}")`}></button>
                            {/* Not wired up yet — disabled rather than rendered as a
                                control that silently does nothing when clicked. */}
                            <button type="button" disabled title="Coming soon" class={`bodyTextMedium ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Active Instances</button>
                        </label>
                        <button type="button" disabled title="Coming soon" class={`bodyTextMedium ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Date Created</button>
                        <button
                            type="button"
                            class={`bodyTextMedium ${filterBtn.button} ${isRefreshing() ? styles.active : ""}`}
                            style={`--icon: url(${refreshIcon.src})`}
                            disabled={isRefreshing()}
                            aria-label="Refresh instance list"
                            onClick={() => void handleRefresh()}
                        >
                                {isRefreshing() ? "Refreshing…" : "Refresh"}
                        </button>
                        <div class={styles.toggleView}>
                            <input
                                id="viewToggle"
                                type="checkbox"
                                role="switch"
                                aria-label="Show instances as a list"
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
                        <Show when={isListView()}>
                            <div class={styles.gamesListViewHeader}>
                                <p class="bodyTextSmall">Instance</p>
                                <p class="bodyTextSmall">Status</p>
                                <p class="bodyTextSmall">Activity</p>
                                <p></p>
                                <p></p>
                            </div>
                        </Show>

                        <Show when={visibleInstances().length > 0} fallback={
                            <p class={`statsTitle ${styles.noMatches}`}>
                                No instances match "{instanceSearchText()}".
                            </p>
                        }>
                            <For each={visibleInstances()}>
                                {(instance, idx) => (
                                    <DashboardInstanceCard instance={instance} listView={isListView()} idx={idx()} />
                                )}
                            </For>
                        </Show>
                    </div>
                </div>
            </Show>
        </section>
    );
}

export default Dashboard
