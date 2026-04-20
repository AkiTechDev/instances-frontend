import { createEffect, createSignal, type Setter } from "solid-js"

import styles from "../Dashboard/Dashboard.module.css";
import typo from "../../../styles/typography.module.css"

import btnWithIcon from '../../../styles/components/buttonWithIcons.module.css';

import games from "../../../lib/games";
import { For } from "solid-js";

import iconPlus from "../../../assets/iconPlus.svg";
import sidebarIcon from "./assets/sidebarIcon.svg";
import searchIcon from "./assets/searchIcon.svg";
import allGamesIcon from "./assets/allGamesIcon.svg";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

const DashboardSidebarNav = (props: { filter: any, setFilter: any, openCreateIntanceModal: (options: ModalOptions) => void}) => {
    const [searchText, setSearchText] = createSignal("");
    const [collapsed, setCollapsed] = createSignal(false);

    return (
        <aside class={`${styles.sidebar} ${collapsed() && styles.collapsed}`}>
            <a id="btnCollapse" class={styles.sidebarCollapser} style={`--icon: url("${sidebarIcon.src}")`} onClick={(e) => {
                e.preventDefault();
                if (collapsed() === false) {
                    setSearchText("")
                }
                setCollapsed(!collapsed())
            }}></a>
            <div class={styles.sidebarHeader}>
                <p class={typo.subtitleSemi}>My Games</p>
                <button class={btnWithIcon.buttonSlim} style={`--icon: url(${iconPlus.src})`} onClick={() => props.openCreateIntanceModal({game_id: null, allow_game_change: true})}><p class={typo.buttonTextSmall}>Create new Game</p></button>
                <label class={styles.searchableContainer}>
                    <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                    <input
                        type="search"
                        id="gameSearch"
                        placeholder="Find your game"
                        value={searchText()}
                        onClick={(e) => setCollapsed(false)}
                        onInput={(e) => setSearchText(e.currentTarget.value)}></input>
                </label>
            </div>
            <div class={styles.sidebarGamesContainer}>
                <div class={styles.sidebarGame}>
                    <input 
                        id="all"
                        onChange={() => props.setFilter("all")}
                        name="gameFilter"
                        type="radio"
                        checked={props.filter() === "all"}
                    />
                    <label class={typo.statsTitle} style={`--icon: url("${allGamesIcon.src}")`} for="all"><span>All</span></label>
                </div>

                <For each={Object.entries(games)
                    .filter(([, game]) => {
                        if (searchText() === "") { return true } else { return game.name.toLowerCase().includes(searchText().toLowerCase()) }
                    })
                    .map(([game_id, ]) => game_id)
                }>
                    {(game_id) => (
                        <div class={styles.sidebarGame}>
                            <input 
                                id={game_id}
                                onChange={() => props.setFilter(game_id) }
                                name="gameFilter"
                                type="radio"
                                checked={props.filter() === game_id}
                            />
                            <label class={typo.statsTitle} style={`--icon: url("${games[game_id].icon}")`} for={game_id}><span>{games[game_id].name}</span></label>
                        </div>
                    )}
                </For>
            </div>
        </aside>
    )
}

export default DashboardSidebarNav;