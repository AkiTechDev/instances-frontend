import { createSignal, Match, Switch, For, createEffect } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import DashboardHeader from "../DashboardHeader/DashboardHeader";
import DashboardSidebarNav from "../DashboardSidebarNav/DashboardSidebarNav";
import { useMsal } from "../Auth/MsalProvider";

// Dashboard Imports
import styles from "./Dashboard.module.css";
import typo from "../../../styles/typography.module.css"

import buttonBig from "../../../styles/components/buttonBig.module.css";

// No Instances Imports
import mouseImage from "./assets/mouse.png?url";
import buttonIcon from "../../../assets/iconPlus.svg";

import games from "../../../lib/games";

import filterBtn from '../../../styles/components/filterButton.module.css';
import gridViewIcon from "./assets/gridViewIcon.svg";
import listViewIcon from "./assets/listViewIcon.svg";
import iconArrow from "../../../assets/iconArrow.svg";
import searchIcon from "./assets/searchIcon.svg";
import crossIcon from "./assets/crossIcon.svg";
import DashboardInstanceCard from "../DashboardInstanceCard/DashboardInstanceCard";

export interface Instance {
    user_id: string,
    name: string,
    game: string,
}

export const getInstances = query(async (getToken: (scopes: string[]) => Promise<string>): Promise<Instance[]> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch("https://api.instances.aki-labs.com/instances/list", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) throw new Error("Failed to fetch list of Instances");

    return (await resp.json()).map((instance: string) => {
        const parts = instance.split("/");
        return {
            user_id: parts[0],
            game: parts[1],
            name: parts[2]
        }
    })}, "instances");

const Dashboard = () => {
    const { getToken } = useMsal()
    const instances = createAsync(() => getInstances(getToken), {
        initialValue: [],
    });

    const [gameFilter, setGameFilter] = createSignal("all");
    const [instanceSearchText, setInstanceSearchText] = createSignal("");

    const [isListView, setIsListView] = createSignal(false);

    return (
        <section class={styles.gridContainer}>
            <DashboardHeader />
            <Switch>
                <Match when={instances().length === 0}>
                    <div class={styles.noInstancesContainer}>
                        <img src={mouseImage} />
                        <div class={styles.noContent}>
                            <h6 class={typo.h6}>No Games Added Yet!</h6>
                            <p class={typo.statsTitle}>All the added games will add up here.<br />Tap "Create new Game" to add games.</p>
                        </div>
                        <button class={`${buttonBig.buttonBig} ${buttonBig.vibrantStyle}`} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Create new Game</p></button>
                    </div>
                </Match>
                <Match when={instances().length > 0}>
                    <DashboardSidebarNav filter={gameFilter} setFilter={setGameFilter} />
                    <div class={styles.gamesContainer}>
                        <div class={styles.gamesListHeader}>
                            <h4 class={typo.h4}>{(gameFilter() === "all") ? "All Instances" : games[gameFilter()].name}</h4>
                            <button class={`${buttonBig.buttonBig} ${buttonBig.vibrantStyle}`} style={`--icon: url(${buttonIcon.src})`}><p class={typo.buttonText}>Add New Instance</p></button>
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
                </Match>
            </Switch>
        </section>
    );
}

export default Dashboard