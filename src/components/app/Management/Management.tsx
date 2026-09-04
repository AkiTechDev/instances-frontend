import { createAsync, useNavigate, useParams } from "@solidjs/router";
import { createMemo, Match, Show, Suspense, Switch } from "solid-js";

import styles from "./Management.module.css";
import effects from "../../../styles/components/effects.module.css";
import button from "../../../styles/components/button.module.css";

import ManagementHeader from "../ManagementHeader/ManagementHeader";
import iconArrow from "../../../assets/icons/chevron.svg";
import stopIcon from "../../../assets/icons/stop.svg";
import playIcon from "../../../assets/icons/play.svg";

import {
    ConfigFormSkeleton,
    CopyRow,
    PanelBodySkeleton,
    StatusBanner,
} from "./ManagementParts";

import { getInstanceConfig, type Instance, type InstanceState } from "../../../lib/apis";
import { useAuth } from "../Auth/AuthProvider";
import { useInstanceRuntime } from "../../../lib/hooks/useInstanceRuntime";
import { useProvisioningProgress } from "../../../lib/hooks/useProvisioningProgress";
import ManagementInstanceConfigForm from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration";
import { regions } from "../../../lib/regions";
import ManagementGameConfiguration from "../ManagementGameConfiguration/ManagementGameConfiguration";
import InstanceOptions from "../InstanceOptions/InstanceOptions";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";

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
    const { account } = useAuth();

    const game = createAsync(async () => {
        if (params.game && params.game in gameRegistry) {
            const entry = gameRegistry[params.game];
            if (!entry) throw Error("Error retrieving game");

            const mod = await entry.load();
            return mod.default;
        }

        return navigate("/dashboard?no-such-game", { replace: true });
    });

    // A memo, not a const: the route params are reactive, so navigating
    // straight from one instance to another has to rebuild this rather than
    // leaving every downstream query keyed to the instance we arrived on.
    const instance = createMemo<Instance>(() => ({
        game: params.game || "",
        name: params.name || "",
        user_id: account().sub,
    }));

    // Provisioning lifecycle (creating / updating / ready) + its poll loops.
    const provisioning = useProvisioningProgress(instance, {
        onGone: () => navigate("/dashboard?no-such-instance", { replace: true }),
    });

    // Game-server runtime (running / stopped / starting) + the start/stop control.
    const runtime = useInstanceRuntime(provisioning.endpoint);

    const config = createAsync(async () => {
        const ep = provisioning.endpoint();
        return ep ? getInstanceConfig(ep) : undefined;
    });

    const banner = createAsync(async () => game()?.getBanner());
    const schema = createAsync(async () => game()?.getSchema());

    // Reserve the config column from the first paint. While state is still
    // loading we optimistically assume a ready instance (the common case) so
    // the grid keeps its two-column shape and the panel never flashes
    // full-width; once state resolves we only keep the column for reachable
    // ready/updating instances (provisioning/failed correctly collapse to the
    // panel-only view).
    const showConfigColumn = () => {
        if (!provisioning.state()) return true;
        return provisioning.isReadyOrUpdating() && !!provisioning.endpoint();
    };

    const toggleLabel = () => {
        switch (runtime.status()) {
            case "starting": return "Starting…";
            case "stopping": return "Stopping…";
            case "running":  return "Stop Game";
            default:         return "Start Game";
        }
    };

    const showStopIcon = () => runtime.status() === "running" || runtime.status() === "stopping";

    const copyText = async (data: string | null) => {
        if (!data) return;
        await navigator.clipboard.writeText(data.replaceAll(" ", ""));
    };

    return (
        <Show when={game()}>
        <div class={styles.gridContainer}>
            <ManagementHeader game={game()!.name} name={params.name || ""} />
            <div class={styles.instanceContainer}>
                <button type="button" class={`buttonText ${styles.back}`} style={`--icon: url("${iconArrow.src}")`} onClick={() => navigate(-1)}>Back</button>
                <div class={styles.controlsContainer}>
                    <div class={styles.panel}>
                        <div class={`${styles.bannerWrapper} ${provisioning.inProgress() ? styles.bannerBusy : ""}`}>
                            <Show when={banner()}>
                                <ResponsiveImage src={banner()!} />
                            </Show>
                            <Show when={provisioning.inProgress()}>
                                <div class={effects.sweep} />
                            </Show>
                            <div class={styles.bannerHeader}>
                                <p class="h4">{params.name}</p>
                                <Show when={provisioning.inProgress()} fallback={<Show when={provisioning.state()}><p class="subTitle">{regions[provisioning.state()!.region]}</p></Show>}>
                                    <p class={`subTitle ${effects.pulse}`}>{provisioning.progressLabel()}</p>
                                </Show>
                            </div>
                        </div>

                        <Suspense fallback={<PanelBodySkeleton />}>
                            <Show when={provisioning.state() && provisioning.isReadyOrUpdating()}>
                                <div class={styles.quickActions}>
                                    <button
                                        class={`${button.btn} ${button.secondary} ${button.icon} ${runtime.busy() ? button.busy : ""}`}
                                        style={`--icon: url(${showStopIcon() ? stopIcon.src : playIcon.src})`}
                                        disabled={!runtime.canToggle() || provisioning.inProgress()}
                                        onClick={() => void runtime.toggle()}
                                        type="button"
                                    ><p class="buttonText">{toggleLabel()}</p></button>
                                    <button
                                        class={`${button.btn} ${button.outlineDark}`}
                                        disabled
                                        title="Coming soon"
                                        type="button"
                                    ><p class="buttonText">Invite Friends</p></button>
                                    <InstanceOptions endpoint={provisioning.endpoint()!} instance={instance()} />
                                </div>
                                <div class={styles.connectivity}>
                                    <Switch fallback={<StatusBanner title="Your world is offline" subtitle="Hit Start to drop back in" />}>
                                        <Match when={runtime.status() === "running"}>
                                            <CopyRow label="Domain" value={runtime.running()?.domain} onCopy={copyText} />
                                            <CopyRow label="IPv4 Address" value={runtime.running()?.ipv4} onCopy={copyText} />
                                            <CopyRow label="IPv6 Address" value={runtime.running()?.ipv6} onCopy={copyText} />
                                        </Match>
                                        <Match when={runtime.status() === "starting"}>
                                            <StatusBanner busy title="Waking up your world…" subtitle={runtime.startingPhase() ?? "Getting things ready"} />
                                        </Match>
                                        <Match when={runtime.status() === "stopping"}>
                                            <StatusBanner busy title="Powering down…" subtitle="Tidying up your world" />
                                        </Match>
                                        <Match when={runtime.status() === "forbidden"}>
                                            <StatusBanner title="No access" subtitle="You're not the owner of this instance" />
                                        </Match>
                                        <Match when={runtime.status() === "error"}>
                                            <StatusBanner title="Something went sideways" subtitle={runtime.errorMessage() ?? "We couldn't reach your server — try again shortly"} />
                                        </Match>
                                    </Switch>
                                </div>
                            </Show>

                            <Show when={provisioning.state() && !provisioning.isReadyOrUpdating()}>
                                <div class={styles.quickActions}>
                                    <InstanceOptions endpoint="" instance={instance()} />
                                </div>
                                <div class={styles.connectivity}>
                                    <div class={styles.connectivityInfo}>
                                        <p class="statsTitle">{provisioning.state()!.raw_status}</p>
                                        <p class="statsText">{provisioningMessage(provisioning.state()!)}</p>
                                    </div>
                                </div>
                            </Show>
                        </Suspense>
                    </div>

                    <Show when={showConfigColumn()}>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{instance().name} Settings</h6>
                                <p class="bodyText">You can edit the Instance to your preference at any time.</p>
                            </div>
                            <Suspense fallback={<ConfigFormSkeleton rows={4} />}>
                                <Show when={config() && !provisioning.isUpdating()} fallback={<ConfigFormSkeleton rows={4} />}>
                                    <ManagementInstanceConfigForm config={config()!} instance={instance()} endpoint={provisioning.endpoint()!} profiles={game()!.profiles} onSubmitted={provisioning.onConfigSubmitted} />
                                </Show>
                            </Suspense>
                        </div>
                        <div class={styles.instanceConfigContainer}>
                            <div class={styles.instanceConfigHeader}>
                                <h6 class="h6">{game()!.name} Settings</h6>
                                <p class="bodyText">Adjust how the game feels.</p>
                            </div>
                            <Suspense fallback={<ConfigFormSkeleton rows={5} />}>
                                <Show when={config() && schema() && !provisioning.isUpdating()} fallback={<ConfigFormSkeleton rows={5} />}>
                                    <ManagementGameConfiguration schema={schema()!} config={config()!.game} endpoint={provisioning.endpoint()!} onSubmitted={provisioning.onConfigSubmitted} />
                                </Show>
                            </Suspense>
                        </div>
                    </Show>
                </div>
                <div class={styles.statsContainer}>
                    <div class={styles.statsControl}>
                        <span class="subtitleSemi" aria-disabled="true" title="Coming soon">Play Time</span>
                        <span class="subtitleSemi" aria-disabled="true" title="Coming soon">Cost History</span>
                        <span class="subtitleSemi" aria-disabled="true" title="Coming soon">Server Logs</span>
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
