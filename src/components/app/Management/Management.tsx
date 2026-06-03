import { createAsync, useNavigate, useParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";

import styles from "./Management.module.css";

import ManagementHeader from "../ManagementHeader/ManagementHeader";
import iconArrow from "../../../assets/icons/chevron.svg";

import btnWithIcon from "../../../styles/components/buttonWithIcons.module.css";
import button from "../../../styles/components/button.module.css";
import stopIcon from "../../../assets/icons/stop.svg";
import playIcon from "../../../assets/icons/play.svg";
import clipboardIcon from "../../../assets/icons/clipboard.svg";

import Tooltip from "../Test/Test";

import {
    endpointOf,
    getInstanceConfig,
    getInstanceState,
    getInstanceStatus,
    toggleInstance,
    type Instance,
    type InstanceState,
} from "../../../lib/apis";
import { sleep } from "../../../lib/utils";
import { useMsal } from "../Auth/MsalProvider";
import ManagementInstanceConfigForm from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration";
import { regions } from "../../../lib/regions";
import ManagementGameConfiguration from "../ManagementGameConfiguration/ManagementGameConfiguration";
import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

const isReadyOrUpdating = (s: InstanceState | undefined): boolean =>
    s?.status === "ready" || s?.status === "updating";

const provisioningMessage = (s: InstanceState): string => {
    if ("message" in s) return s.message;
    if (s.status === "failed") return s.error.reason ?? s.error.failed_status;
    if (s.status === "rolled_back") return s.reason ?? "Stack rolled back";
    if (s.status === "unknown") return s.note;
    return s.raw_status;
};

const Management = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { account } = useMsal();

    const game = createAsync(async () => {
        if (params.game && params.game in gameRegistry) {
            const entry = gameRegistry[params.game];

            if (!entry) throw Error("Error retrieving game");

            const mod = await entry.load();
            return mod.default;
        }

        return navigate("/dashboard?no-such-game", { replace: true });
    });

    const instance: Instance = {
        game: params.game || "",
        name: params.name || "",
        user_id: account()!.homeAccountId,
    };

    const state = createAsync(async () => {
        const s = await getInstanceState(instance);
        if (s.status === "gone") {
            navigate("/dashboard?no-such-instance", { replace: true });
        }
        return s;
    });

    const endpoint = () => endpointOf(state());

    const config = createAsync(async () => {
        const ep = endpoint();
        return ep ? getInstanceConfig(ep) : undefined;
    });

    const [runtime, { refetch: refetchRuntime }] = createResource(
        endpoint,
        (ep: string) => getInstanceStatus(ep),
    );

    const runtimeRunning = () => {
        const r = runtime();
        return r ? "ipv6" in r : false;
    };
    const [optimistic, setOptimistic] = createSignal<boolean | null>(null);
    const isRunning = () => optimistic() ?? runtimeRunning();

    const banner = createAsync(async () => game()?.getBanner());
    const schema = createAsync(async () => game()?.getSchema());

    const copyText = async (data: string | null) => {
        if (!data) return;
        await navigator.clipboard.writeText(data.replaceAll(" ", ""));
    };

    const toggleInstanceButton = async () => {
        const ep = endpoint();
        if (!ep) return;
        const wasRunning = isRunning();
        setOptimistic(!wasRunning);
        try {
            await toggleInstance(ep, wasRunning);
            if (!wasRunning) {
                // Starting — poll runtime every 5 s until ipv6 appears (max 5 min).
                const deadline = Date.now() + 5 * 60_000;
                while (Date.now() < deadline) {
                    await sleep(5000);
                    const fresh = await refetchRuntime();
                    if (fresh && "ipv6" in fresh) break;
                }
            } else {
                // Stopping — short delay, then one refresh.
                await sleep(2000);
                await refetchRuntime();
            }
            setOptimistic(null);
        } catch (err) {
            console.error("toggle failed", err);
            setOptimistic(wasRunning);
        }
    };

    return (
        <Show when={game()}>
        <div class={styles.gridContainer}>
            <ManagementHeader game={game()!.name} name={params.name || ""} />
            <div class={styles.instanceContainer}>
                <p class="buttonText" style={`--icon: url("${iconArrow.src}")`} onClick={() => navigate(-1)}>Back</p>
                <div class={styles.controlsContainer}>
                    <div class={styles.panel}>
                        <div class={styles.bannerWrapper}>
                            <Show when={banner()}>
                                <ResponsiveImage src={banner()!} />
                            </Show>
                            <div class={styles.bannerHeader}>
                                <p class="h4">{params.name}</p>
                                <Show when={state()}>
                                    <p class="subTitle">{regions[state()!.region]}</p>
                                </Show>
                            </div>
                        </div>

                        <Show when={state() && isReadyOrUpdating(state())}>
                            <div class={styles.quickActions}>
                                <button class={btnWithIcon.buttonSlim} style={`--icon: url(${ isRunning() ? stopIcon.src : playIcon.src})`} onClick={() => toggleInstanceButton()}><p class="buttonText">{isRunning() ? "Stop Game" : "Start Game"}</p></button>
                                <button class={`${button.btn} ${button.outlineDark}`}><p class="buttonText">Invite Friends</p></button>
                                <InstanceOptions endpoint={endpoint()!} instance={instance} />
                            </div>
                            <div class={styles.connectivity}>
                                <div class={styles.connectivityInfo}>
                                    <p class="statsTitle">Domain</p>
                                    <Tooltip tooltipContent="Copied!" tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                        <p class={`statsText ${ runtime()?.domain ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.currentTarget.textContent)}>{runtime()?.domain ? runtime()?.domain : "The game is has not started :)"} </p>
                                    </Tooltip>
                                </div>

                                <div class={styles.connectivityInfo}>
                                    <p class="statsTitle">IPv4 Address</p>
                                    <Tooltip tooltipContent="Copied!" tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                        <p class={`statsText ${ runtime()?.ipv4 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.currentTarget.textContent)}>{runtime()?.ipv4 ? runtime()?.ipv4 : "The game is has not started :)"} </p>
                                    </Tooltip>
                                </div>

                                <div class={styles.connectivityInfo}>
                                    <p class="statsTitle">IPv6 Address</p>
                                    <Tooltip tooltipContent="Copied!" tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                                        <p class={`statsText ${ runtime()?.ipv6 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.currentTarget.textContent)}>{runtime()?.ipv6 ? runtime()?.ipv6 : "The game is has not started :)"} </p>
                                    </Tooltip>
                                </div>
                            </div>
                        </Show>

                        <Show when={state() && !isReadyOrUpdating(state())}>
                            <div class={styles.quickActions}>
                                <InstanceOptions endpoint="" instance={instance} />
                            </div>
                            <div class={styles.connectivity}>
                                <div class={styles.connectivityInfo}>
                                    <p class="statsTitle">{state()!.raw_status}</p>
                                    <p class="statsText">{provisioningMessage(state()!)}</p>
                                </div>
                            </div>
                        </Show>
                    </div>

                    <Show when={state() && isReadyOrUpdating(state()) && config()}>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{instance.name} Settings</h6>
                                <p class="bodyText">You can edit the Instance to your preference at any time.</p>
                            </div>
                            <ManagementInstanceConfigForm config={config()!} instance={instance} endpoint={endpoint()!} profiles={game()!.profiles} />
                        </div>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{game()!.name} Settings</h6>
                                <p class="bodyText">Adjust how the game feels.</p>
                            </div>
                            <ManagementGameConfiguration schema={schema()!} config={config()!.game} endpoint={endpoint()!} />
                        </div>
                    </Show>
                </div>
                <div class={styles.statsContainer}>
                    <div class={styles.statsControl}>
                        <a class="subtitleSemi">Play Time</a>
                        <a class="subtitleSemi">Cost History</a>
                        <a class="subtitleSemi">Server Logs</a>
                    </div>
                    <div class={styles.statsOutput}>
                        <h1 class="h3">Under Construction</h1>
                        <p class="statsTitle">You will be able to see costs and game stats here</p>
                    </div>
                </div>
            </div>
        </div>
        </Show>
    );
};

export default Management;
