import { createEffect, createMemo, createSignal, For, Show, type Component, type Setter, onCleanup } from "solid-js"
import { Portal } from "solid-js/web"

import * as v from 'valibot';

import styles from "./CreateInstanceModal.module.css";
import games, { fgCalc } from "../../../lib/games";
import instance_tiers from "../../../lib/instance_tiers";

import { regions } from "../../../lib/regions";
import { createForm, Field, Form, useField, type SubmitHandler } from "@formisch/solid";
import FormSelect from "../FormModules/FormSelect";
import FormTextInput from "../FormModules/FormTextInput";
import { fullSeverName, generateRandomName } from "../../../lib/name_generator";

import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";
import iconCross from "../../../assets/icons/cross.svg";
import { putCreateInstance, type PutCreateInstance } from "../../../lib/apis";

export interface ModalOptions {
    game_id: string | null,
    allow_game_change: boolean
};


const CreateInstanceModal: Component<{ setIsOpen: Setter<boolean>, game_id: string | null, allow_game_change: boolean, regions: {[id: string]: string} | undefined}> = (props) => {
    const [gameId, setGameId] = createSignal(props.game_id);
    const [instanceName, setInstanceName] = createSignal(fullSeverName(generateRandomName()));
    let mainBodyRef: HTMLDivElement | undefined;

    const handleBodyClick = (e: MouseEvent) => {
        if (!mainBodyRef?.contains(e.target as Node)) {
            props.setIsOpen(false);
        }
    };

    document.body.addEventListener("click", handleBodyClick);

    createEffect(() => {
        if (gameId()) {
            setInstanceName(fullSeverName(generateRandomName()))
        }
    });

    const profiles = createMemo(() => {
        if (gameId()) {
            return games[gameId()!].profiles
        }
    })

    const form = createMemo(() => {
        if (profiles()) {
            let schema = v.object({
                instance_name: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
                plan: v.picklist(instance_tiers),
                auto_start: v.boolean(),
                profile: v.picklist(Object.keys(profiles()!)),
                region: v.picklist(Object.keys(regions))
            });
            return createForm({
                schema: schema,
                initialInput: {
                    instance_name: instanceName(),
                    plan: "Premium",
                    auto_start: false,
                    profile: Object.keys(profiles()!)[0],
                    region: Object.keys(props.regions!)[0]
                }
            });
        }
    })

    const formProfile = createMemo(() => {
        if (form()) {
            return useField(form()!, { path: ["profile"] });
        }
    })

    const formTier = createMemo(() => {
        if (form()) {
            return useField(form()!, { path: ["plan"] });
        }
    });

    const formRegion = createMemo(() => {
        if (form()) {
            return useField(form()!, { path: ["region"] });
        }
    });

    onCleanup(() => {
        document.body.removeEventListener("click", handleBodyClick);
    });


    const submitForm = createMemo(() => {
        if (form()) {
            let CreateInstanceSchema = form()!["~internal"].schema
            let fnc: SubmitHandler<typeof CreateInstanceSchema> = async (formData: any) => {
                if (form()!.isValid) {
                    const new_config: PutCreateInstance = {
                        cpu: profiles()![formData["profile"]]["cpu"],
                        memory: profiles()![formData["profile"]]["memory"],
                        plan: formData["plan"],
                        auto_start: formData["auto_start"],
                        region: formData["region"]
                    };

                    console.log(`Creating Instance: ${gameId()}/${formData["instance_name"].replaceAll(" ", "")}`, new_config);
                    await putCreateInstance(gameId()!, formData["instance_name"].replaceAll(' ', ''), new_config)
                    props.setIsOpen(false);
                }
            }

            return fnc
        }
    })

    return (
        <Portal>
            <div class={styles.backdrop}>

            </div>
            <div ref={mainBodyRef} class={styles.container} onClick={(e) => e.stopImmediatePropagation()}>
                <button class={styles.exit} style={`--icon: url("${iconCross.src}")`} onClick={() => {
                    setGameId(null);
                    props.setIsOpen(false);
                    }}
                ></button>
                <Show when={gameId()}>
                    <img src={`/imgs/${gameId()}/banner.avif`}></img>
                </Show>
                <div class={styles.header}>
                    <h6 class="h5">Create a {gameId() ? games[gameId()!].name : null} Instance</h6>
                    <p class="statsTitle">Here by adding some information you can create a {gameId() ? games[gameId()!].name : null} new instance.</p>
                </div>

                <Show when={props.allow_game_change || gameId() === null}>
                    <div class={`${selectStyles.instanceConfigSettingsContainer} ${styles.gameField}`}>
                        <label class="bodyTextSmall">What game do you want to play? </label>
                        <select value="game_id" class={`${selectStyles.select} bodyText`} onChange={(e) => setGameId(e.target.value)}>
                            <option class="bodyText" value="Select Game">Select Game</option>
                            <For each={Object.keys(games)}>
                                { (option, ) => (
                                    <option class="bodyText" value={option}>{games[option].name}</option>
                                )}
                            </For>
                        </select>
                    </div>
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
                                <label class="bodyTextSmall">Cost </label>
                                <select value="Cost" class={`${selectStyles.select} bodyText`} disabled>
                                    <option class="bodyText" value="$00/hour" selected>
                                            ${fgCalc(formRegion()?.input || "", profiles()![formProfile()!.input || ""].memory, profiles()![formProfile()!.input || ""].cpu, formTier()?.input || "")}/hour
                                    </option>
                                </select>
                            </div>

                            <button class={`${submitBtnStyle.button} buttonTextSmall`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={form()!.isSubmitting}>
                                {form()!.isSubmitting ? "Creating Instance" : form()!.isSubmitted ? "Creating Instance" : "Create Instance"}
                            </button>
                        </Show>
                    </Form>
                </Show>
            </div>
        </Portal>
    )
}

export default CreateInstanceModal