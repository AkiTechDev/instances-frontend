
import { createSignal, createUniqueId } from "solid-js";
import { A, createAsync, query } from "@solidjs/router";
import { type Instance } from "../../../lib/apis";

import styles from "./DashboardInstanceCard.module.css";
import typo from "../../../styles/typography.module.css";

import games from "../../../lib/games";
import statusIndicator from "./assets/statusIndicator.svg";
import cardOptionsIcon from "./assets/cardIcon.svg";
import InstanceOptions from "../InstanceOptions/InstanceOptions";

const DashboardInstanceCard = (props: { instance: Instance, listView: boolean, idx: number}) => {
    const id = createUniqueId();

    return (
        <>
            { props.listView === false && (
                <A href={`/instances-frontend/${props.instance.game}/${props.instance.name}`} class={styles.gameCard}>
                    <div class={styles.imageWrapper} style={`--backgroundImg: url("/instances-frontend/imgs/${props.instance.game}/banner.avif")`}>
                        <div class={styles.statusContainer} style={`--statusIndicator: url(${statusIndicator.src})`}>
                            <p class={typo.smallestLabel}>RUNNING</p>
                        </div>
                        <div class={styles.toggleContainer}>
                            <input id={`toggle-${id}`} type="checkbox" checked/>
                            <label for={`toggle-${id}`}>
                                <p class={typo.smallestLabel}>ON</p>
                                <p class={typo.smallestLabel}>OFF</p>
                            </label>
                        </div>
                        <p class={typo.subtitleSemi}>{games[props.instance.game].name}</p>
                    </div>
                    <div class={styles.textWrapper}>
                        <div class={styles.gamecardInfo}>
                            <p class={typo.statsText}>{props.instance.name}</p>
                            <InstanceOptions endpoint="test" instance={props.instance} />
                        </div>
                        <p class={styles.metaText}>Active 4 hours ago</p>
                    </div>
                </A>
            )}

            { props.listView === true && (
                <A href={`/instances-frontend/${props.instance.game}/${props.instance.name}`} class={styles.instanceList} style={`--colour: ${props.idx % 2 === 0 ? 'var(--colour-text-tertiary)' : '#F9F9F9'}`}>
                    <p class={typo.bodyTextSmallSemi}>{props.instance.name}</p>
                    <div class={styles.instanceStatusList}>
                        <p class={typo.bodyTextSmallestSemiCaps}>RUNNING</p>
                    </div>
                    <p class={typo.bodyTextSmall}>Active 4 hours ago</p>
                    <div class={styles.toggleContainer}>
                        <input id={`toggle-${id}`} type="checkbox" checked/>
                        <label for={`toggle-${id}`}>
                            <p class={typo.smallestLabel}>ON</p>
                            <p class={typo.smallestLabel}>OFF</p>
                        </label>
                    </div>
                    <InstanceOptions endpoint="test" instance={props.instance} />
                </A>
            )}
        </>

    )
}

export default DashboardInstanceCard