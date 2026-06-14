import { createSignal, createEffect, For, Show } from "solid-js"
import { createAsync } from "@solidjs/router";

import styles from "./DashboardSidebarNav.module.css";

import button from "../../../styles/components/button.module.css";

import iconCross from "../../../assets/icons/cross.svg";
import sidebarIcon from "../../../assets/icons/sidebar.svg";
import searchIcon from "../../../assets/icons/search.svg"
import allGamesIcon from "../../../assets/icons/allGames.svg";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { gameRegistry } from "../../../lib/games/index";
import { getInstances } from "../../../lib/apis";
import search from "../../../styles/components/search.module.css";
import crossIcon from "../../../assets/icons/cross.svg";
import SearchNoResultsIcon from "../../../assets/icons/search_no_results.svg";

const DashboardSidebarNav = (props: { filter: any, setFilter: any, openCreateIntanceModal: (options: ModalOptions) => void}) => {
    const [searchText, setSearchText] = createSignal("");
    const [collapsed, setCollapsed] = createSignal(false);

    // `getInstances` is query-cached, so this re-uses the Dashboard's fetch.
    const instances = createAsync(() => getInstances(), { initialValue: [] });
    const userGames = () => new Set(instances().map(i => i.game));

    const filteredGameIds = () => Object.entries(gameRegistry)
        .filter(([game_id]) => userGames().has(game_id))
        .filter(([game_id]) => searchText() === "" || gameRegistry[game_id].name.toLowerCase().includes(searchText().toLowerCase()))
        .map(([game_id]) => game_id);

    const showAll = () => searchText() === "" || "all".includes(searchText().toLowerCase());
    const hasMatches = () => showAll() || filteredGameIds().length > 0;

    // Auto-apply filter as the user types. Empty search falls back to "All"
    // (covers the clear button and deleting characters). Games take precedence
    // over "All" when both match; user can still click any visible result.
    createEffect(() => {
        if (searchText() === "") {
            props.setFilter("all");
            return;
        }
        const games = filteredGameIds();
        if (games.length > 0) {
            props.setFilter(games[0]);
        } else if (showAll()) {
            props.setFilter("all");
        }
    });

    return (
        <aside class={`${styles.sidebar} ${collapsed() && styles.collapsed}`}>
            <a id="btnCollapse" class={styles.sidebarCollapser} style={`--icon: url("${sidebarIcon.src}")`} onClick={() => {
                setCollapsed(!collapsed())
            }}></a>
            <div class={styles.sidebarHeader}>
                <p class={`${styles.title} subtitleSemi`}>My Games</p>
                <button class={`${button.btn} ${button.secondary} ${button.icon} ${button.rotate45}`} style={`--icon: url(${iconCross.src})`} onClick={() => { setCollapsed(false); props.openCreateIntanceModal({game_id: null, allow_game_change: true})}}><p class="buttonTextSmall">Create New Game</p></button>
                <label class={`${search.label} ${search.beforeIcon} ${collapsed() ? search.collapsed : ""}`} style={`--icon: url("${searchIcon.src}")`} onclick={() => {
                    if (collapsed()) {
                        setCollapsed(false)
                    }
                }}>
                    <input
                        id="gameSearch"
                        type="search"
                        placeholder="Find your game"
                        value={searchText()}
                        onInput={(e) => setSearchText(e.currentTarget.value)} 
                    />
                    <button onClick={() => (setSearchText(""))} class={`${search.clearBtn} ${searchText() ? search.visible : ""}`} style={`--icon: url("${crossIcon.src}")`}></button>
                </label>
            </div>
            <div class={styles.sidebarGamesContainer}>
                <Show when={hasMatches()} fallback={
                    <div class={styles.noMatches}>
                        <div class={styles.icon} style={`--icon: url(${SearchNoResultsIcon.src})`}></div>
                        <div class={styles.content}>
                            <p class="subtitleSemi">No games found.</p>
                            <p class="bodyTextSmall">Please check your search and try again.</p>
                        </div>
                    </div>
                }>
                    <Show when={showAll()}>
                        <div class={styles.sidebarGame}>
                            <input
                                id="all"
                                onChange={() => props.setFilter("all")}
                                name="gameFilter"
                                type="radio"
                                checked={props.filter() === "all"}
                            />
                            <label class="statsTitle" style={`--icon: url("${allGamesIcon.src}")`} for="all"><span>All</span></label>
                        </div>
                    </Show>

                    <For each={filteredGameIds()}>
                        {(game_id) => (
                            <div class={styles.sidebarGame}>
                                <input
                                    id={game_id}
                                    onChange={() => props.setFilter(game_id)}
                                    name="gameFilter"
                                    type="radio"
                                    checked={props.filter() === game_id}
                                />
                                <label class="statsTitle" style={`--icon: url("${gameRegistry[game_id].icon.src}")`} for={game_id}><span>{gameRegistry[game_id].name}</span></label>
                            </div>
                        )}
                    </For>
                </Show>
            </div>
        </aside>
    )
}

export default DashboardSidebarNav;