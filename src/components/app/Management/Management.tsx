import { createAsync, query, redirect, reload, revalidate, useNavigate, useParams } from "@solidjs/router"

import styles from "./Management.module.css";
import typo from "../../../styles/typography.module.css";

import ManagementHeader from "../ManagementHeader/ManagementHeader";
import iconArrow from "../../../assets/iconArrow.svg";

import btnWithIcon from "../../../styles/components/buttonWithIcons.module.css";
import btn from "../../../styles/components/buttonBig.module.css";
import stopIcon from "./assets/stopIcon.svg";
import clipboardIcon from "./assets/clipboardIcon.svg";

import games from "../../../lib/games";
import Tooltip from "../Test/Test";

import { type Instance } from "../Dashboard/Dashboard";
import { useMsal } from "../Auth/MsalProvider";
import { createSignal, Show } from "solid-js";
import ManagementInstanceConfigForm from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration";
import { regions } from "../../../lib/regions";
import ManagementGameConfiguration from "../ManagementGameConfiguration/ManagementGameConfiguration";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface InstanceConfig {
    memory: number,
    cpu: number,
    plan: string
    domain: string,
    game: any
}

export interface InstanceEndpoint {
    endpoint: string,
}

export const getInstanceEndpoint = query(async (getToken: (scopes: string[]) => Promise<string>, instance: Instance): Promise<InstanceEndpoint> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) {
        return redirect("/instances-frontend/dashboard");
    }
    
    return await resp.json() as InstanceEndpoint;
}, "endpoint");

export const getInstanceConfig = query(async (getToken: (scopes: string[]) => Promise<string>, endpoint: string): Promise<InstanceConfig> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    const data = await resp.json();
    console.log("Config", data);

    return data
}, "instanceConfig")

export interface InstanceStatus {
    ipv6: string,
    ipv4?: string,
    domain?: string,
}

export interface InstanceStatusBadRequest {
    code: string,
    message: string,
    details: null
}

export const getInstanceStatus = query(async (getToken: (scopes: string[]) => Promise<string>, endpoint: string): Promise<InstanceStatus | InstanceStatusBadRequest> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/status`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) return await resp.json() as InstanceStatusBadRequest;

    const data = await resp.json();
    console.log("Status", data);

    return data
}, "instanceStatus")

export const toggleInstance = async (getToken: (scopes: string[]) => Promise<string>, endpoint: string, isRunning: boolean): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const uri = isRunning ? "stop" : "start";

    const resp = await fetch(`${endpoint}/${uri}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await resp.json();
    return data
};

const Management = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [isRunning, setIsRunning] = createSignal(false);

    const { getToken, account } = useMsal();
    const instance: Instance = { game: params?.game || "", name: params?.name || "", user_id: account()?.nativeAccountId || ""};

    const endpoint = createAsync(() => getInstanceEndpoint(getToken, instance));

    const config = createAsync(() => {
        if (!endpoint()) return Promise.resolve(undefined);
        return getInstanceConfig(getToken, endpoint()!.endpoint)}
    )
    let status = createAsync(async () => {
        if (!endpoint()) return Promise.resolve(undefined);

        const data = await getInstanceStatus(getToken, endpoint()!.endpoint)
        if ("code" in data) {
            setIsRunning(false);
            return null
        };

        setIsRunning(true);
        return data
    });


    const copyText = async (data: string) => {
        await navigator.clipboard.writeText(data)
    };

    const toggleInstanceButton = async () => {
        await toggleInstance(getToken, endpoint()?.endpoint || "", isRunning());
        if (isRunning()) {
            console.log("STOPPING");
            status = createAsync(async () => {return null}); 
        } else {
            console.log("STARTING");
            while (true) {
                try {
                    await revalidate("instanceStatus", true);
                    console.log("REVALIDATING", status())

                    if (status()?.ipv6) {
                        break
                    }

                    await sleep(15000);
                } catch (err) {
                    console.log("Failed starting status loop", err)
                }
            }
        }

        setIsRunning(!isRunning())
    }

    return (
        <div class={styles.gridContainer}>
            <ManagementHeader game={games[params.game || ""].name} name={params.name || ""} />
            <div class={styles.instanceContainer}>
                <p class={typo.buttonText} style={`--icon: url("${iconArrow.src}")`} onClick={() => navigate(-1)}>Back</p>
                <div class={styles.controlsContainer}>
                    <div class={styles.panel}>
                        <div class={styles.bannerWrapper} style={`--backgroundImg: url("/instances-frontend/imgs/${params.game}/banner.avif")`}>
                            <div class={styles.bannerHeader}>
                                <p class={typo.h4}>{params.name}</p>
                                <p class={typo.subTitle}>{games[params.game || ""].name}</p>
                            </div>
                        </div>

                        <div class={styles.quickActions}>
                            <button class={btnWithIcon.buttonSlim} style={`--icon: url(${stopIcon.src})`} onClick={() => toggleInstanceButton()}><p class={typo.buttonText}>{isRunning() ? "Stop Game" : "Start Game"}</p></button>
                            <button class={`${btn.buttonBig} ${btn.transparentDarkStyle}`}><p class={typo.buttonText}>Invite Friends</p></button>
                        </div>

                        <div class={styles.connectivity}>
                    

                            <div class={styles.connectivityInfo}>
                                <p class={typo.statsTitle}>Domain</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle={typo.bodyTextSmallest} enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`${typo.statsText} ${ status()?.domain ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.domain ? status()?.domain : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class={typo.statsTitle}>IPv4 Address</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle={typo.bodyTextSmallest} enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`${typo.statsText} ${ status()?.ipv4 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.ipv4 ? status()?.ipv4 : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class={typo.statsTitle}>IPv6 Address</p>
                                <Tooltip tooltipContent="Copied!"  tooltipContentStyle={typo.bodyTextSmallest} enableTimeout={true} timeoutDuration={1000}>
                                    <p class={`${typo.statsText} ${ status()?.ipv6 ? styles.copy : ""}`} style={`--icon: url(${clipboardIcon.src})`} onClick={(e) => copyText(e.target.textContent)}>{status()?.ipv6 ? status()?.ipv6 : "The game is has not started :)"} </p>
                                </Tooltip>
                            </div>

                            <div class={styles.connectivityInfo}>
                                <p class={typo.statsTitle}>Region</p>
                                <p class={typo.statsText}>{regions["us-east-1"]} </p>
                            </div>

                        </div>

                    </div>
                    <div class={styles.instanceConfigContainer}>
                        <div class={styles.instanceConfigHeader}>
                            <h6 class={typo.h6}>{instance.name} Settings</h6>
                            <p class={typo.bodyText}>You can edit the Instance to your preference at any time.</p>
                        </div>
                        <Show when={config()}>
                            <ManagementInstanceConfigForm config={config()} instance={instance} endpoint={endpoint()!.endpoint} />
                        </Show>


                    </div>
                    <div class={styles.instanceConfigContainer}>
                        <div class={styles.instanceConfigHeader}>
                            <h6 class={typo.h6}>{games[params?.game || ""].name} Settings</h6>
                            <p class={typo.bodyText}>Adjust how the game feels.</p>
                        </div>

                        <Show when={config()}>
                            <ManagementGameConfiguration config={config()!.game } />
                        </Show>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Management