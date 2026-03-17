import { component$, useId, useSignal } from "@builder.io/qwik";

import styles from './InstanceCard.module.css';
import typo from '../../../styles/typography.module.css';
import games from "../../../lib/games";
import statusIndicator from "./assets/statusIndicator.svg";

interface Instance {
    user_id: string
    name: string,
    game: string,
}

import cardOptionsIcon from "./assets/cardIcon.svg";

const InstanceCard = component$<Instance>( ({user_id, name, game}) => {
    const openOptions = useSignal(false);

    let rando_id = Math.random().toString(36).slice(2);


    return (
        <div class={styles.gameCard}>
            <div class={styles.imageWrapper} style={`--backgroundImg: url("/instances-frontend/imgs/${game}/banner.avif")`}>
                <div class={styles.statusContainer} style={`--statusIndicator: url(${statusIndicator.src})`}>
                    <p class={typo.smallestLabel}>RUNNING</p>
                </div>
                <div class={styles.toggleContainer}>
                    <input id={`toggle-${useId()}`} type="checkbox" checked/>
                    <label for={`toggle-${useId()}`}>
                        <p class={typo.smallestLabel}>ON</p>
                        <p class={typo.smallestLabel}>OFF</p>
                    </label>
                </div>
                <p class={typo.subtitleSemi}>{games[game].name}</p>
            </div>
            <div class={styles.textWrapper}>
                <div class={styles.gamecardInfo}>
                    <p class={typo.statsText}>{name}</p>
                    <button style={`--icon: url(${cardOptionsIcon.src})`}></button>
                </div>
                <p class={styles.metaText}>Active 4 hours ago</p>
            </div>
        </div>
    )
})

export default InstanceCard;