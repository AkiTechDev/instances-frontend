import { component$, Resource, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getAccessToken, getActiveAccount } from "../../../lib/auth";

import styles from './Games.module.css';
import typo from '../../../styles/typography.module.css';

import filterBtn from '../../../styles/components/filterButton.module.css';

import btnWithIcon from '../../../styles/components/buttonWithIcons.module.css';

import buttonBig from '../../../styles/components/buttonBig.module.css';
import buttonIcon from '../../../assets/iconPlus.svg';
import mouseImage from './assets/mouse.png?url';
import Instance from "../../../layouts/Instance.astro";

import InstanceCard from "../instance/InstanceCard.tsx";
import searchIcon from "./assets/searchIcon.svg";
import iconArrow from "../../../assets/iconArrow.svg";
import iconPlus from "../../../assets/iconPlus.svg";
import crossIcon from "./assets/crossIcon.svg";
import gridViewIcon from "./assets/gridViewIcon.svg";
import listViewIcon from "./assets/listViewIcon.svg";
import allGamesIcon from "./assets/allGamesIcon.svg";
import sidebarIcon from "./assets/sidebarIcon.svg";

import games, { type Game } from '../../../lib/games.ts';


interface Instance {
    user_id: string
    name: string,
    game: string,
}

const GamesList = component$(() => {
    const user_access_token = useSignal<string | null>(null);
    useVisibleTask$(async() => {
        user_access_token.value = await getAccessToken(["api://Instances/access"]);
    });

    const games_list = useSignal<Instance[]>([]);
    useVisibleTask$(async ({ track }) => {
        const token = track(() => user_access_token.value);
        if (user_access_token.value) {
            const resp = await fetch("https://api.instances.aki-labs.com/instances/list", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user_access_token.value}`
                }
            })

            const json = await resp.json();
            console.log("Games List:", JSON.stringify(json))


            const games = json.map((instance: string) => {
                const parts = instance.split("/");
                return {
                    user_id: parts[0],
                    game: parts[1],
                    name: parts[2]
                }
            })

            console.log(games);

            games_list.value = games;
            //games_list.value = [];
        }
    })

    const isListView = useSignal(false);

    const instanceSearchValue = useSignal("");


    const sidebarFilter = useSignal("all");
    const sidebarSearch = useSignal("");
    const sidebarFilteredGames: string[] = Object.entries(games)
        .filter(([, game]) => {
            if (sidebarSearch.value === "") { return true } else { return game.name.toLowerCase().includes(sidebarSearch.value.toLowerCase())}})
        .map(([game_id, ]) => game_id);
    const sidebarCollasped = useSignal(false);


    return (
        <>
            {games_list.value.length > 0 && (
                <aside class={[styles.sidebar, sidebarCollasped.value && styles.collapsed]}>
                    <a id="btnCollapse" class={styles.sidebarCollapser} style={`--icon: url("${sidebarIcon.src}")`} onClick$={(e) => {
                        e.preventDefault();
                        if (sidebarCollasped.value === false) {
                            sidebarSearch.value = ""
                        }
                        sidebarCollasped.value = !sidebarCollasped.value
                    }}></a>
                    <div class={[styles.sidebarHeader]}>
                        <p class={typo.subtitleSemi}>My Games</p>
                        <button class={[btnWithIcon.buttonSlim]} style={`--icon: url(${iconPlus.src})`}><p class={typo.buttonTextSmall}>Create new Game</p></button>
                        <label class={styles.searchableContainer}>
                            <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                            <input
                                type="search"
                                id="gameSearch"
                                placeholder="Find your game"
                                value={sidebarSearch.value}
                                onClick$={(e) => sidebarCollasped.value = false}
                                onInput$={(e) => sidebarSearch.value = (e.target as HTMLInputElement).value}></input>
                        </label>
                    </div>
                    <div class={styles.sidebarGamesContainer}>
                        <div class={styles.sidebarGame}>
                                <input 
                                    id="all"
                                    onChange$={() => sidebarFilter.value = "all" }
                                    name="gameFilter"
                                    type="radio"
                                    checked={sidebarFilter.value === "all"}
                                />
                                <label class={typo.statsTitle} style={`--icon: url("${allGamesIcon.src}")`} for="all"><span>All</span></label>
                            </div>
                        {sidebarFilteredGames.map((game_id) => (
                            <div class={styles.sidebarGame}>
                                <input 
                                    id={game_id}
                                    onChange$={() => sidebarFilter.value = game_id }
                                    name="gameFilter"
                                    type="radio"
                                    checked={sidebarFilter.value === game_id}
                                />
                                <label class={typo.statsTitle} style={`--icon: url("${games[game_id].icon}")`} for={game_id}><span>{games[game_id].name}</span></label>
                            </div>
                        ))}
                    </div>
                </aside>  
            )}

            {games_list.value.length === 0 && (
                <div class={styles.noInstancesContainer}>
                    <img src={mouseImage} />
                    <div class={styles.noContent}>
                        <h6 class={typo.h6}>No Games Added Yet!</h6>
                        <p class={typo.statsTitle}>All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                    </div>
                    <button class={[buttonBig.buttonBig, buttonBig.vibrantStyle]} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Create new Game</p></button>
                </div>
            )}

            {games_list.value.length > 0 && (
                <div class={styles.gamesContainer}>
                    <div class={styles.gamesListHeader}>
                        <h4 class={typo.h4}>{(sidebarFilter.value === "all") ? "All Instances" : games[sidebarFilter.value].name}</h4>
                        <button class={[buttonBig.buttonBig, buttonBig.vibrantStyle]} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Add New Instance</p></button>
                    </div>
                    <div class={styles.gameFiltersContainer}>
                        <label class={styles.searchableContainer}>
                            <div class={styles.searchIcon} style={`--icon: url("${searchIcon.src}")`}></div>
                            <input id="instanceSearch" type="search" placeholder="Search your instances" bind:value={instanceSearchValue}></input>
                            <button onClick$={() => (instanceSearchValue.value = "")} class={[styles.inputClearBtn, instanceSearchValue.value ? styles.visible : styles.hidden]} style={`--icon: url("${crossIcon.src}")`}></button>
                            <button class={`${typo.bodyTextMedium} ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Active Instances</button>
                        </label>
                        <button class={`${typo.bodyTextMedium} ${filterBtn.button}`} style={`--icon: url(${iconArrow.src})`}>Date Created</button>
                        <div class={styles.toggleView}>
                            <input
                                id="viewToggle"
                                type="checkbox"
                                checked={isListView.value}
                                onChange$={() => isListView.value = !isListView.value}
                            />
                            <label for="viewToggle">
                                <div class={styles.viewIcon} style={`--icon: url("${gridViewIcon.src}")`} />
                                <div class={styles.viewIcon} style={`--icon: url("${listViewIcon.src}")`} />
                            </label>
                        </div>
                    </div>
                    <div class={{
                        [styles.gamesGridContainer]: !isListView.value, [styles.gamesListContainer]: isListView.value
                    }}>
                        { isListView.value && (
                            <div class={styles.gamesListViewHeader}>
                                <p class={typo.bodyTextSmall}>Instance</p>
                                <p class={typo.bodyTextSmall}>Status</p>
                                <p class={typo.bodyTextSmall}>Activity</p>
                                <p></p>
                                <p></p>
                            </div>
                        )}
                        {games_list.value
                            .filter(instance => {
                                if (instanceSearchValue.value === "") { return true } else { return instance.name.toLowerCase().includes(instanceSearchValue.value.toLowerCase())}
                            })
                        .map((item,  i) => (
                            <InstanceCard key={item["name"]} user_id={item["user_id"]} name={item["name"]} game={item["game"]} listView={isListView.value} idx={i} />
                        ))}
                    </div>
                </div>
            )}
        </>
    )
})

export default GamesList;