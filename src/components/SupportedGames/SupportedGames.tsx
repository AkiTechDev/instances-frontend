import { createSignal, createResource, Show, For, ErrorBoundary } from "solid-js";

import styles from "./SupportedGames.module.css";
import button from "../../styles/components/button.module.css";
import GameCard from "../app/GameCard/GameCard";
import { fetchGames } from "../../lib/apis";
import { gameRegistry } from "../../lib/games/index";


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
        // Shared with the app's `getGames`, so this honours PUBLIC_API_BASE and
        // a staging build can't quote production's catalogue. Rejections land in
        // `games.error` and are rendered below rather than swallowed — a failed
        // fetch used to be indistinguishable from an empty one.
        const supported = await fetchGames();

        // Only ids the frontend has art and a config for can be drawn. Dropping
        // the rest here keeps the four-card preview at four real games when the
        // control plane is ahead of the frontend.
        return shuffleArray(supported.filter((id) => id in gameRegistry));
    })

    return (
        <>
        <Show when={!games.loading} fallback={<p>Loading</p>}>
            <Show when={!games.error} fallback={<p>We couldn't load the game list right now.</p>}>
                {/* A card's game module is a dynamic import, so a chunk that 404s
                    after a deploy throws in here — where, with nothing to catch
                    it, it would blank the landing page rather than one tile. */}
                <ErrorBoundary fallback={<p>We couldn't load the game list right now.</p>}>
                    <div class={styles.gamesContainer}>
                        <For each={showAll() ? games() : games()?.slice(0, 4)}>
                            {(game) => (
                                <GameCard game_id={game} OpenCreateInstanceModal={undefined} />
                            )}
                        </For>
                    </div>
                </ErrorBoundary>
            </Show>
        </Show>
        {/* Nothing to expand when the list didn't load: the control stayed put
            under the failure message, offering more of a list that isn't
            there. Undefined while loading, so the button still holds its place
            until the fetch settles. */}
        <Show when={!games.error}>
            <button
                style="width:100%;"
                class={`${button.btn} ${button.outline}`}
                onClick={() => setShowAll(prev => !prev)}
            >
                <p class="buttonText">{showAll() ? 'Show Less Games' : 'Show More Games'}</p>
            </button>
        </Show>
        </>
    )
};

export default SupportedGameCard