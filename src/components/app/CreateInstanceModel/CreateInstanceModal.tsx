import { createEffect, createMemo, createSignal, For, Show, type Component, type Setter, onCleanup, onMount } from "solid-js"
import { Portal } from "solid-js/web"

import * as v from 'valibot';

import styles from "./CreateInstanceModal.module.css";
import { fgCalc } from "../../../lib/pricing";
import instance_tiers from "../../../lib/instance_tiers";

import { regions } from "../../../lib/regions";
import { createForm, Field, Form, useField, type SubmitHandler } from "@formisch/solid";
import FormSelect from "../FormModules/FormSelect";
import FormTextInput from "../FormModules/FormTextInput";
import AdvancedSettingsToggle from "../FormModules/AdvancedSettingsToggle";
import { webhookUrlPlaceholder, webhookUrlSchema } from "../../../lib/webhook";
import { fullSeverName, generateRandomName } from "../../../lib/name_generator";

import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";
import iconCross from "../../../assets/icons/cross.svg";
import { getInstances, putCreateInstance, type PutCreateInstance } from "../../../lib/apis";
import { revalidate } from "@solidjs/router";
import { gameRegistry } from "../../../lib/games/index";
import { ResponsiveImage } from "@responsive-image/solid";
import { createAsync } from "@solidjs/router";

export interface ModalOptions {
    game_id: string | null,
    allow_game_change: boolean
};


const CreateInstanceModal: Component<{ setIsOpen: Setter<boolean>, game_id: string | null, allow_game_change: boolean, regions: {[id: string]: string} | undefined}> = (props) => {
    const [gameId, setGameId] = createSignal(props.game_id);
    const [instanceName, setInstanceName] = createSignal(fullSeverName(generateRandomName()));
    const [showAdvanced, setShowAdvanced] = createSignal(false);
    const [creating, setCreating] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    let mainBodyRef: HTMLDivElement | undefined;

    // Creation can't be called back once the PUT is away, so every dismissal
    // route is closed while it is in flight.
    const dismiss = () => {
        if (!creating()) props.setIsOpen(false);
    };

    const handleBodyClick = (e: MouseEvent) => {
        if (!mainBodyRef?.contains(e.target as Node)) dismiss();
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") dismiss();
    };

    const game = createAsync(async () => {
        const id = gameId();
        if (!id) return undefined;

        const entry = gameRegistry[id];
        if (!entry) {
            console.error(`Unknown game: ${id}`);
            return undefined;
        }

        const mod = await entry.load();
        return mod.default;
    })

    const banner = createAsync(async () => game()?.getBanner());

    // Registered in onMount rather than during render: a document-level
    // listener attached as a render side effect runs before the component is
    // in the DOM, and re-attaches on every render pass.
    onMount(() => {
        document.body.addEventListener("click", handleBodyClick);
        window.addEventListener("keydown", handleKeydown);
    });

    onCleanup(() => {
        document.body.removeEventListener("click", handleBodyClick);
        window.removeEventListener("keydown", handleKeydown);
    });

    createEffect(() => {
        if (gameId()) {
            setInstanceName(fullSeverName(generateRandomName()))
        }
    });

    const profiles = createMemo(() => game()?.profiles);

    // The form can only be built once both the game's profiles and the ranked
    // region list are in — `initialInput` reads a key out of each, and building
    // early would throw on the undefined.
    const ready = createMemo(() => !!profiles() && !!props.regions && Object.keys(props.regions).length > 0);

    const form = createMemo(() => {
        if (!ready()) return undefined;

        const schema = v.object({
            instance_name: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
            plan: v.picklist(instance_tiers),
            auto_start: v.boolean(),
            profile: v.picklist(Object.keys(profiles()!)),
            region: v.picklist(Object.keys(regions)),
            webhook_url: webhookUrlSchema
        });

        return createForm({
            schema: schema,
            initialInput: {
                instance_name: instanceName(),
                plan: "Premium",
                auto_start: false,
                profile: Object.keys(profiles()!)[0],
                region: Object.keys(props.regions!)[0],
                webhook_url: ""
            }
        });
    })

    const formProfile = createMemo(() => {
        const f = form();
        return f ? useField(f, { path: ["profile"] }) : undefined;
    })

    const formTier = createMemo(() => {
        const f = form();
        return f ? useField(f, { path: ["plan"] }) : undefined;
    });

    const formRegion = createMemo(() => {
        const f = form();
        return f ? useField(f, { path: ["region"] }) : undefined;
    });

    /** Hourly price for the currently selected profile/tier/region. */
    const hourlyCost = createMemo(() => {
        const p = profiles();
        const selected = formProfile()?.input;
        if (!p || !selected || !p[selected]) return "0.00";
        // null when we have no price table for the region — the picker only
        // offers regions we price, so this is belt-and-braces.
        return fgCalc(formRegion()?.input || "", p[selected].memory, p[selected].cpu, formTier()?.input || "") ?? "0.00";
    });

    const submitForm = createMemo(() => {
        const f = form();
        if (!f) return undefined;

        const CreateInstanceSchema = f["~internal"].schema;
        const fnc: SubmitHandler<typeof CreateInstanceSchema> = async (formData: any) => {
            if (!f.isValid || creating()) return;

            const webhook_url = (formData["webhook_url"] ?? "").trim();
            const new_config: PutCreateInstance = {
                cpu: profiles()![formData["profile"]]["cpu"],
                memory: profiles()![formData["profile"]]["memory"],
                plan: formData["plan"],
                auto_start: formData["auto_start"],
                region: formData["region"],
                // Left out entirely when blank — a new instance has no
                // webhook to clear, so there is nothing to send.
                ...(webhook_url ? { webhook_url } : {})
            };

            setCreating(true);
            setError(null);
            try {
                // Awaited: this used to be fire-and-forget, so a rejected
                // create closed the modal anyway and the user was left with no
                // instance and no explanation.
                await putCreateInstance(gameId()!, formData["instance_name"].replaceAll(' ', ''), new_config);
                await revalidate(getInstances.key);
                props.setIsOpen(false);
            } catch (err) {
                console.error("create instance failed", err);
                setError("We couldn't create that instance. Nothing has been charged — check the name isn't already taken and try again.");
                setCreating(false);
            }
        }

        return fnc
    })

    return (
        <Portal>
            <div class={styles.backdrop}></div>
            <div
                ref={mainBodyRef}
                class={styles.container}
                role="dialog"
                aria-modal="true"
                aria-label="Create a new instance"
                onClick={(e) => e.stopImmediatePropagation()}
            >
                <button
                    class={styles.exit}
                    style={`--icon: url("${iconCross.src}")`}
                    aria-label="Close"
                    type="button"
                    disabled={creating()}
                    onClick={() => {
                        if (creating()) return;
                        setGameId(null);
                        props.setIsOpen(false);
                    }}
                ></button>
                <Show when={banner()}>
                    <ResponsiveImage src={banner()!} width={548} height={137} />
                </Show>
                <div class={styles.header}>
                    <h6 class="h5">Create a {game()?.name ?? ""} Instance</h6>
                    <p class="statsTitle">Here by adding some information you can create a {game()?.name ?? "new"} instance.</p>
                </div>

                <Show when={props.allow_game_change || gameId() === null}>
                    <div class={`${selectStyles.instanceConfigSettingsContainer} ${styles.gameField}`}>
                        <label class="bodyTextSmall" for="gameSelect">What game do you want to play? </label>
                        <select id="gameSelect" class={`${selectStyles.select} bodyText`} value={gameId() ?? ""} onChange={(e) => setGameId(e.target.value || null)}>
                            <option class="bodyText" value="">Select Game</option>
                            <For each={Object.keys(gameRegistry)}>
                                { (option) => (
                                    <option class="bodyText" value={option}>{gameRegistry[option].name}</option>
                                )}
                            </For>
                        </select>
                    </div>
                </Show>

                <Show when={error()}>
                    <p class={`${styles.error} bodyTextSmall`} role="alert">{error()}</p>
                </Show>

                <Show when={gameId() && !ready()}>
                    <p class={`${styles.loading} bodyTextSmall`} role="status">Finding the closest region…</p>
                </Show>

                <Show when={form()}>
                    <Form of={form()!} onSubmit={(e) => submitForm()!(e)} class={styles.form}>
                        <Field of={form()!} path={['instance_name']}>
                            {(field) => (
                                <FormTextInput
                                    field={field}
                                    field_id="instance_name"
                                    field_label="Name your Instance"
                                    field_placeholder={instanceName()}
                                    field_maxlength={32}
                                />
                            )}
                        </Field>

                        <Show when={gameId()}>
                            <Field of={form()!} path={['plan']}>
                                {(field) => (
                                    <FormSelect
                                        field={field}
                                        field_id="plan"
                                        field_label="Tier"
                                        field_placeholder="Premium"
                                        field_options={instance_tiers}
                                    />
                                )}
                            </Field>

                            <Field of={form()!} path={['profile']}>
                                {(field) => (
                                    <FormSelect
                                        field={field}
                                        field_id="profile"
                                        field_label="How many friends will you play with?"
                                        field_placeholder={Object.keys(profiles()!)[0]}
                                        field_options={Object.keys(profiles()!)}
                                    />
                                )}
                            </Field>

                            <Field of={form()!} path={['region']}>
                                {(field) => (
                                    <FormSelect
                                        field={field}
                                        field_id="region"
                                        field_label="Region"
                                        field_placeholder={Object.keys(props.regions!)[0]}
                                        field_options={props.regions!}
                                    />
                                )}
                            </Field>

                            <div class={selectStyles.instanceConfigSettingsContainer}>
                                <label class="bodyTextSmall" for="costPreview">Cost </label>
                                <select id="costPreview" class={`${selectStyles.select} bodyText`} disabled>
                                    <option class="bodyText" selected>${hourlyCost()}/hour</option>
                                </select>
                            </div>

                            <Show when={showAdvanced()}>
                                <div class={styles.advanced}>
                                    <Field of={form()!} path={['webhook_url']}>
                                        {(field) => (
                                            <FormTextInput
                                                field={field}
                                                field_id="webhook_url"
                                                field_label="Webhook URL"
                                                field_placeholder={webhookUrlPlaceholder}
                                                field_maxlength={2048}
                                            />
                                        )}
                                    </Field>
                                </div>
                            </Show>

                            <div class={styles.formFooter}>
                                <AdvancedSettingsToggle expanded={showAdvanced()} onToggle={() => setShowAdvanced(!showAdvanced())} />

                                <button
                                    class={`${submitBtnStyle.button} ${creating() ? submitBtnStyle.busy : ""} buttonTextSmall`}
                                    style={`--icon: url("${iconTick.src}")`}
                                    type="submit"
                                    disabled={creating()}
                                >
                                    {creating() ? "Creating Instance…" : "Create Instance"}
                                </button>
                            </div>
                        </Show>
                    </Form>
                </Show>
            </div>
        </Portal>
    )
}

export default CreateInstanceModal
