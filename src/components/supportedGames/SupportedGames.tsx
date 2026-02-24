import { component$, Resource, useResource$, useSignal, useStore } from "@builder.io/qwik";

import styles from "./supportedGames.module.css";
import typo from "../../styles/typography.module.css";
import buttonBig from "../../styles/components/buttonBig.module.css";

interface Game {
    name: string
};

const supportedGames: {[id: string]: Game} = {
    "MinecraftJava": {
        name: "Minecraft Java"
    },
    "MinecraftAllTheMods10": {
        name: "Minecraft ATM10"
    },
    "MinecraftBetterMC4": {
        name: "Minecraft BetterMC 4"
    },
    "MinecraftRLCraft": {
        name: "Minecraft RLCraft"
    },
    "MinecraftProminence2": {
        name: "Minecraft Prominence 2"
    },
    "MinecraftCursedWalking": {
        name: "Minecraft Cursed Walking"
    },
    "MinecraftBedrock": {
        name: "Minecraft Bedrock"
    },
    "Valheim": {
        name: "Valheim"
    },
};

function shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return 
}

const SupportedGameCard = component$(() => {
    const showAll = useSignal(false)
    const games = useResource$(async () => {
        try {
            const resp = await fetch('https://api.instances.aki-labs.com/instances/types', {
                method: "GET",
            });

            if (!resp.ok) {
                throw new Error();
            }

            const json = await resp.json();
            console.log("Got: ", JSON.stringify(json));

            shuffleArray(json);

            return json as string[];
        } catch (error) {
            console.log(error);
            return [] as string[];
        }

    })

    return (
        <>
        <Resource
            value={games}
            onPending={() => <p>Loading ...</p>}
            onRejected={(error: any) => <p> Error: {error.message}</p>}
            onResolved={(games: string[]) => (
                <div class={styles.gamesContainer}>
                    {(showAll.value ? games : games.slice(0, 4)).map((game, index) => (
                        <div class={styles.card}>
                            <img src={'/instances-frontend/imgs/' + game + '/banner.avif'} />
                            <p class={typo.subTitle}>{supportedGames[game].name}</p>
                        </div>
                    ))}
                </div>
            )}
        />
        <button style="width:33%;" class={[buttonBig.buttonBig, buttonBig.transparentVibrantStyle]} onClick$={() => showAll.value = !showAll.value}><p class={typo.buttonText}>{showAll.value ? 'Show Less Games' : 'Show More Games'}</p></button>
        </>
    )
})

export default SupportedGameCard


const SupportedGameButton = component$(() => {
    return null
})