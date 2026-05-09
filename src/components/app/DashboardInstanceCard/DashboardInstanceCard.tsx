
import { createEffect, createSignal, createUniqueId, Show, Suspense } from "solid-js";
import { A, createAsync } from "@solidjs/router";
import { getInstanceEndpoint, getInstanceStatus, toggleInstance, type Instance } from "../../../lib/apis";

import styles from "./DashboardInstanceCard.module.css";

import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

const DashboardInstanceCard = (props: { instance: Instance, listView: boolean, idx: number}) => {
    const id = createUniqueId();
    const [isRunning, setIsRunning] = createSignal(false);

    const game = createAsync(async () => {
        const entry = gameRegistry[props.instance.game];

        if (!entry) throw new Error(`Uknown game: ${game}`);
        const mod = await entry.load();
        return mod.default;
    })

    const endpoint = createAsync(() => getInstanceEndpoint(props.instance))
    const status = createAsync(() => {
        if (endpoint()) {
            return getInstanceStatus(endpoint()!)
        }

        return Promise.resolve(undefined)
    })

    createEffect(() => {
        if (status()) {
            if ("message" in status()!) {
                setIsRunning(false)
            } else {
                setIsRunning(true)
            }
        }
    })

    const banner = createAsync(async () => {
        if (game()) {
            return game()!.getBanner()
        }
    });

    const toggle = () => {
        toggleInstance(endpoint()!, isRunning())
        setIsRunning(!isRunning())
    }

    return (
        <>
            { props.listView === false && (
                <A href={`/${props.instance.game}/${props.instance.name}`} class={styles.gameCard}>
                    <Show when={banner()}>
                        <div class={styles.imageWrapper}>
                            <ResponsiveImage src={banner()!} />
                            <div class={`${styles.statusContainer} ${isRunning() ? styles.active : ""}`}>
                                <div class={`${styles.statusIndicator} ${isRunning() ? styles.active : ""}`}></div>
                                <p class="smallestLabel">{isRunning() ? "RUNNING" : "STOPPED"}</p>
                            </div>
                            <div class={styles.toggleContainer}>
                                <input id={`toggle-${id}`} type="checkbox" checked={isRunning()} onChange={() => toggle()} onClick={(e) => e.stopImmediatePropagation()} />
                                <label for={`toggle-${id}`}>
                                    <p class="smallestLabel">ON</p>
                                    <p class="smallestLabel">OFF</p>
                                </label>
                            </div>
                            <p class="subtitleSemi">{gameRegistry[props.instance.game].name}</p>
                        </div>
                    </Show>
                    <div class={styles.textWrapper}>
                        <div class={styles.gamecardInfo}>
                            <p class="statsText">{props.instance.name}</p>
                            <InstanceOptions endpoint="test" instance={props.instance} />
                        </div>
                        <p class={styles.metaText}>Active 4 hours ago</p>
                    </div>
                </A>
            )}

            { props.listView === true && (
                <A href={`/${props.instance.game}/${props.instance.name}`} class={styles.instanceList} style={`--colour: ${props.idx % 2 === 0 ? 'var(--colour-text-tertiary)' : '#F9F9F9'}`}>
                    <p class="bodyTextSmallSemi">{props.instance.name}</p>
                    <div class={styles.instanceStatusList}>
                        <p class="bodyTextSmallestSemiCaps">RUNNING</p>
                    </div>
                    <p class="bodyTextSmall">Active 4 hours ago</p>
                    <div class={styles.toggleContainer}>
                        <input id={`toggle-${id}`} type="checkbox" checked={isRunning()}/>
                        <label for={`toggle-${id}`}>
                            <p class="smallestLabel">ON</p>
                            <p class="smallestLabel">OFF</p>
                        </label>
                    </div>
                    <Suspense>
                        <InstanceOptions endpoint={endpoint()!} instance={props.instance} />
                    </Suspense>
                </A>
            )}
        </>

    )
}

export default DashboardInstanceCard