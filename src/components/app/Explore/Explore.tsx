import { For } from "solid-js";
import DashboardHeader from "../DashboardHeader/DashboardHeader";

import styles from "./Explore.module.css";
import games from "../../../lib/games";

const Explore = () => {
    return (
        <div class={styles.gridContainer}>
            <DashboardHeader />
            <div class={styles.exploreContainer}>
                <div class={styles.exploreHeader}>
                    <h4 class="h4">Games to Try</h4>
                </div>
                <div class={styles.gamesContainer}>
                    <For each={Object.entries(games)}>
                        {([id, game]) => (
                            <div class={styles.gameCard}>
                                <img src={`/imgs/${id}/banner.avif`} />
                                <p>{game.name}</p>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    )
}

export default Explore;

