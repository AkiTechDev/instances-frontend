import { createSignal, For, catchError, createEffect, createMemo, ErrorBoundary, Show } from "solid-js";
import { createAsync, revalidate } from "@solidjs/router";
import DashboardHeader from "../DashboardHeader/DashboardHeader";
import DashboardSidebarNav from "../DashboardSidebarNav/DashboardSidebarNav";

// Dashboard Imports
import styles from "./Dashboard.module.css";

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
import { DashboardSkeleton, InstanceListError, NoInstances } from "./DashboardParts";

import { getBestRegion, regions } from "../../../lib/regions";
import { getInstances } from "../../../lib/apis";
import { gameRegistry } from "../../../lib/games/index";

import button from "../../../styles/components/button.module.css";
import search from "../../../styles/components/search.module.css";

const Dashboard = () => {
    // No `initialValue`: with one, `instances()` was an empty array until the
    // fetch resolved, and the zero-state below greeted every returning user
    // with "No Games Added Yet!" before their servers appeared. Undefined means
    // "still loading" and shows the skeleton; only a resolved, genuinely empty
    // list reaches the zero-state.
    const instances = createAsync(() => getInstances());

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

    // A failed fetch makes `instances()` throw when read. That throw is what
    // raises the error state below, but only reads *inside* the ErrorBoundary
    // reach it — a memo declared out here owns itself and its error would
    // escape the component entirely. So everything derived at this level reads
    // through this guard, and the boundary gets the throw from its own subtree.
    const loadedInstances = createMemo(() => catchError(() => instances(), () => undefined));

    const visibleInstances = createMemo(() => {
        const query = instanceSearchText().trim().toLowerCase();
        const game = gameFilter();

        return (loadedInstances() ?? []).filter((instance) =>
            (game === "all" || instance.game === game) &&
            (query === "" || instance.name.toLowerCase().includes(query)));
    });

    /** Resolved and non-empty — undefined (still loading) is not "empty". */
    const hasInstances = () => (loadedInstances()?.length ?? 0) > 0;

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
            {/* A failed fetch throws on read, so it needs a state of its own —
                otherwise it sits on the skeleton forever. Retry refetches
                first, then resets the boundary so the children re-read a
                resource that is loading again rather than still failed. */}
            <ErrorBoundary fallback={(err, reset) => {
                console.error("failed to load instances", err);
                return <InstanceListError onRetry={async () => { await revalidate(getInstances.key); reset(); }} />;
            }}>
                {/* `instances()` stays undefined until the list resolves, so the
                    skeleton covers loading and the zero-state below can only be
                    reached by a resolved — genuinely empty — list. */}
                <Show when={instances()} fallback={<DashboardSkeleton listView={isListView()} />}>
                    <Show when={hasInstances()} fallback={<NoInstances onCreate={() => OpenCreateInstanceModal({game_id: null, allow_game_change: true})} />}>
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
                </Show>
            </ErrorBoundary>
        </section>
    );
}

export default Dashboard
