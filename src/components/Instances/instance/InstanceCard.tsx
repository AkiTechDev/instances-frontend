import { component$, useId, useSignal } from "@builder.io/qwik";

import styles from './InstanceCard.module.css';
import typo from '../../../styles/typography.module.css';
import games from "../../../lib/games";
import statusIndicator from "./assets/statusIndicator.svg";

interface Instance {
    listView: boolean,
    idx: number,
    user_id: string
    name: string,
    game: string,
}

import cardOptionsIcon from "./assets/cardIcon.svg";

const InstanceCard = component$<Instance>( ({user_id, name, game, listView, idx}) => {
    const openOptions = useSignal(false);

    return (
        <>
            { listView === false && (
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
            )}

            { listView === true && (
                <div class={styles.instanceList} style={`--colour: ${idx % 2 === 0 ? 'var(--colour-text-tertiary)' : '#F9F9F9'}`}>
                    <p class={typo.bodyTextSmallSemi}>{name}</p>
                    <div class={styles.instanceStatusList}>
                        <p class={typo.bodyTextSmallestSemiCaps}>RUNNING</p>
                    </div>
                    <p class={typo.bodyTextSmall}>Active 4 hours ago</p>
                    <div class={styles.toggleContainer}>
                        <input id={`toggle-${useId()}`} type="checkbox" checked/>
                        <label for={`toggle-${useId()}`}>
                            <p class={typo.smallestLabel}>ON</p>
                            <p class={typo.smallestLabel}>OFF</p>
                        </label>
                    </div>
                    <button style={`--icon: url(${cardOptionsIcon.src})`}></button>
                </div>
            )}
        </>
    )
})

export default InstanceCard;