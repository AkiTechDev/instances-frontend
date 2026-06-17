import { createSignal, createResource, Show, For } from "solid-js";

import styles from "./SupportedGames.module.css";
import button from "../../styles/components/button.module.css";
import GameCard from "../app/GameCard/GameCard";


function shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

const SupportedGameCard = () => {
    const [showAll, setShowAll] = createSignal(false);

    const [games] = createResource<string[]>(async () => {
        try {
            const resp = await fetch('https://api.instances.aki-labs.com/instances/types', {
                method: "GET",
            });

            if (!resp.ok) {
                throw new Error();
            }

            const json = await resp.json();

            shuffleArray(json as string[]);

            return shuffleArray(json as string[]) as string[];
        } catch (error) {
            return [] as string[];
        }

    })

    return (
        <>
        <Show when={!games.loading} fallback={<p>Loading</p>}>
            <Show when={!games.error} fallback={<p>Error</p>}>
                <div class={styles.gamesContainer}>
                    <For each={showAll() ? games() : games()?.slice(0, 4)}>
                        {(game) => (
                            <GameCard game_id={game} OpenCreateInstanceModal={undefined} />
                        )}
                    </For>
                </div>
            </Show>
        </Show>
        <button
            style="width:100%;"
            class={`${button.btn} ${button.outline}`}
            onClick={() => setShowAll(prev => !prev)}
        >
            <p class="buttonText">{showAll() ? 'Show Less Games' : 'Show More Games'}</p>
        </button>
        </>
    )
};

export default SupportedGameCard