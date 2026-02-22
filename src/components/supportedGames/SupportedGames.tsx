import { component$, Resource, useResource$, useStore } from "@builder.io/qwik";

import styles from "./supportedGames.module.css";
import typo from "../../styles/typography.module.css";

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

const SupportedGameCard = component$(() => {
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

            return json as string[];
        } catch (error) {
            console.log(error);
            return [] as string[];
        }

    })

    return (
        <Resource
            value={games}
            onPending={() => <p>Loading ...</p>}
            onRejected={(error: any) => <p> Error: {error.message}</p>}
            onResolved={(games: string[]) => (
                <div class={styles.gamesContainer}>
                    {games.map((game, index) => (
                        <div class={styles.card}>
                            <img src={'/instances-frontend/imgs/' + game + '/banner.avif'} />
                            <p class={typo.gameTitle}>{supportedGames[game].name}</p>
                        </div>
                    ))}
                </div>
            )}
        />
    )
})

export default SupportedGameCard