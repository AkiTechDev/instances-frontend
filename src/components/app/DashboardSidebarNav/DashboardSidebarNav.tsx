import { createSignal} from "solid-js"

import styles from "../Dashboard/Dashboard.module.css";

import btnWithIcon from '../../../styles/components/buttonWithIcons.module.css';

import { For } from "solid-js";

import iconCross from "../../../assets/icons/cross.svg";
import sidebarIcon from "../../../assets/icons/sidebar.svg";
import searchIcon from "../../../assets/icons/search.svg"
import allGamesIcon from "../../../assets/icons/allGames.svg";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";
import { gameRegistry } from "../../../lib/games/index";

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
                <p class="subtitleSemi">My Games</p>
                <button class={`${btnWithIcon.buttonSlim} ${btnWithIcon.rotate45}`} style={`--icon: url(${iconCross.src})`} onClick={() => props.openCreateIntanceModal({game_id: null, allow_game_change: true})}><p class="buttonTextSmall">Create new Game</p></button>
                <label class={styles.searchableContainer}>
                    <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                    <input
                        type="search"
                        id="gameSearch"
                        placeholder="Find your game"
                        value={searchText()}
                        onClick={() => setCollapsed(false)}
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
                    <label class="statsTitle" style={`--icon: url("${allGamesIcon.src}")`} for="all"><span>All</span></label>
                </div>

                <For each={Object.entries(gameRegistry)
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