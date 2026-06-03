import { createSignal} from "solid-js"
import { createAsync } from "@solidjs/router";

import styles from "../Dashboard/Dashboard.module.css";

import btnWithIcon from '../../../styles/components/buttonWithIcons.module.css';

import { For } from "solid-js";

import iconCross from "../../../assets/icons/cross.svg";
import sidebarIcon from "../../../assets/icons/sidebar.svg";
import searchIcon from "../../../assets/icons/search.svg"
import allGamesIcon from "../../../assets/icons/allGames.svg";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { gameRegistry } from "../../../lib/games/index";
import { getInstances } from "../../../lib/apis";
import search from "../../../styles/components/search.module.css";
import crossIcon from "../../../assets/icons/cross.svg";

const DashboardSidebarNav = (props: { filter: any, setFilter: any, openCreateIntanceModal: (options: ModalOptions) => void}) => {
    const [searchText, setSearchText] = createSignal("");
    const [collapsed, setCollapsed] = createSignal(false);

    // `getInstances` is query-cached, so this re-uses the Dashboard's fetch.
    const instances = createAsync(() => getInstances(), { initialValue: [] });
    const userGames = () => new Set(instances().map(i => i.game));

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
                <p class="subtitleSemi">My Games</p>
                <button class={`${btnWithIcon.buttonSlim} ${btnWithIcon.rotate45}`} style={`--icon: url(${iconCross.src})`} onClick={() => props.openCreateIntanceModal({game_id: null, allow_game_change: true})}><p class="buttonTextSmall">Create New Game</p></button>
                <label class={search.label} style={`--icon: url("${searchIcon.src}")`}>
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

                <For each={Object.entries(gameRegistry)
                    .filter(([game_id,]) => userGames().has(game_id))
                    .filter(([game,]) => {
                        if (searchText() === "") { return true } else { return gameRegistry[game].name.toLowerCase().includes(searchText().toLowerCase()) }
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
                            <label class="statsTitle" style={`--icon: url("${gameRegistry[game_id].icon.src}")`} for={game_id}><span>{gameRegistry[game_id].name}</span></label>
                        </div>
                    )}
                </For>
            </div>
        </aside>
    )
}

export default DashboardSidebarNav;