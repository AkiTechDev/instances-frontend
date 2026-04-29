import { createAsync, useNavigate, useParams } from "@solidjs/router"

import styles from "./Management.module.css";

import ManagementHeader from "../ManagementHeader/ManagementHeader";
import iconArrow from "../../../assets/icons/chevron.svg";

import btnWithIcon from "../../../styles/components/buttonWithIcons.module.css";
import btn from "../../../styles/components/buttonBig.module.css";
import stopIcon from "../../../assets/icons/stop.svg";
import playIcon from "../../../assets/icons/play.svg";
import clipboardIcon from "../../../assets/icons/clipboard.svg"

import games from "../../../lib/games";
import Tooltip from "../Test/Test";

import { getInstanceConfig, getInstanceEndpoint, getInstanceStatus, toggleInstance, type Instance } from "../../../lib/apis";
import { useMsal } from "../Auth/MsalProvider";
import { createEffect, createSignal, Show } from "solid-js";
import ManagementInstanceConfigForm from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration";
import { regions } from "../../../lib/regions";
import ManagementGameConfiguration from "../ManagementGameConfiguration/ManagementGameConfiguration";
import InstanceOptions from "../InstanceOptions/InstanceOptions";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const Management = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [isRunning, setIsRunning] = createSignal(false);

    const { account } = useMsal();
    const instance: Instance = { game: params?.game || "", name: params?.name || "", user_id: account()!.homeAccountId};

    const endpoint = createAsync(async () => getInstanceEndpoint(instance));
    const config = createAsync(async () => {
        if (endpoint()) {
            return getInstanceConfig(endpoint()!)
        }
    });
    let status = createAsync(async () => {
        if (endpoint()) {
            return getInstanceStatus(endpoint()!)
        }
    });

    createEffect(() => {
        if (status() && "ipv6" in status()!) {
            setIsRunning(true)
        } else {
            setIsRunning(false)
        }
    })

    const copyText = async (data: string) => {
        await navigator.clipboard.writeText(data.replaceAll(" ", ""))
    };

    const toggleInstanceButton = async () => {
        await toggleInstance(endpoint()!, isRunning());

        if (isRunning()) {
            await sleep(2000);
            status = createAsync(() => getInstanceStatus(endpoint()!))
        } else {
            while (true) {
                try {
                    status = createAsync(() => getInstanceStatus(endpoint()!))
                    await sleep(5000);

                    if (status() && "ipv6" in status()!) {
                        break
                    };
                } catch (err) {
                    console.log("Failed starting status loop", err)
                    break
                }
            }
        }

        setIsRunning(!isRunning())
    }

    return (
        <div class={styles.gridContainer}>
            <ManagementHeader game={games[params.game || ""].name} name={params.name || ""} />
            <div class={styles.instanceContainer}>
                <p class="buttonText" style={`--icon: url("${iconArrow.src}")`} onClick={() => navigate(-1)}>Back</p>
                <div class={styles.controlsContainer}>
                    <div class={styles.panel}>
                        <div class={styles.bannerWrapper} style={`--backgroundImg: url("/imgs/${params.game}/banner.avif")`}>
                            <div class={styles.bannerHeader}>
                                <p class="h4">{params.name}</p>
                                <p class="subTitle">{games[params.game || ""].name}</p>
                            </div>
                        </div>

                        <div class={styles.quickActions}>
                            <button class={btnWithIcon.buttonSlim} style={`--icon: url(${ isRunning() ? stopIcon.src : playIcon.src})`} onClick={() => toggleInstanceButton()}><p class="buttonText">{isRunning() ? "Stop Game" : "Start Game"}</p></button>
                            <button class={`${btn.buttonBig} ${btn.transparentDarkStyle}`}><p class="buttonText">Invite Friends</p></button>
                            <InstanceOptions endpoint={endpoint()!} instance={instance} />
                        </div>
                        <div class={styles.connectivity}>

                            <div class={styles.connectivityInfo}>
                                <p class="statsTitle">Domain</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`statsText ${ status()?.domain ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.domain ? status()?.domain : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class="statsTitle">IPv4 Address</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`statsText ${ status()?.ipv4 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.ipv4 ? status()?.ipv4 : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class="statsTitle">IPv6 Address</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`statsText ${ status()?.ipv6 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.ipv6 ? status()?.ipv6 : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class="statsTitle">Region</p>
                                <p class="statsText">{regions["us-east-1"]} </p>
                            </div>
                        </div>
                    </div>
                    <div class={styles.instanceConfigContainer}>
                        <div class={styles.instanceConfigHeader}>
                            <h6 class="h6">{instance.name} Settings</h6>
                            <p class="bodyText">You can edit the Instance to your preference at any time.</p>
                        </div>
                        <Show when={config()}>
                            <ManagementInstanceConfigForm config={config()!} instance={instance} endpoint={endpoint()!} />
                        </Show>

                    </div>
                    <div class={styles.instanceConfigContainer}>
                        <div class={styles.instanceConfigHeader}>
                            <h6 class="h6">{games[params?.game || ""].name} Settings</h6>
                            <p class="bodyText">Adjust how the game feels.</p>
                        </div>

                        <Show when={config()}>
                            <ManagementGameConfiguration config={config()!.game} endpoint={endpoint()!} />
                        </Show>

                    </div>
                </div>
                <div class={styles.statsContainer}>
                    <div class={styles.statsControl}>
                        <a class="subtitleSemi">
                            Play Time
                        </a>
                        <a class="subtitleSemi">
                            Cost History
                        </a>
                        <a class="subtitleSemi">
                            Server Logs
                        </a>
                    </div>
                    <div class={styles.statsOutput}>
                        <h1 class="h3">Under Construction</h1>
                        <p class="statsTitle">You will be able to see costs and game stats here</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Management