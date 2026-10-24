import { createForm, Field, Form, type SubmitHandler } from "@formisch/solid";
import { type Component, createSignal, For, Show } from "solid-js"
import FormSelect from "../FormModules/FormSelect";
import FormError from "../FormModules/FormError";

import gameStyles from "./ManagementGameConfiguration.module.css";
import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";

import FormTextInput from "../FormModules/FormTextInput";
import FormNumberInput from "../FormModules/FormNumberInput";
import FormCheckbox from "../FormModules/FormCheckbox";
import { describeFailure, postGameConfig, type Failure } from "../../../lib/apis";

import * as v from "valibot";

/*
1. Should we really be passing config as a prop, instead use createAsync to query the catch +
2. Schema schema schema
*/

// Schema keys arrive as snake_case (e.g. "max_players"); render them as the
// upper-case labels the rest of the settings UI uses ("MAX PLAYERS").
const prettifyLabel = (key: string) => key.replace(/_/g, " ").toUpperCase();

const ManagementGameConfiguration: Component<{ schema: v.ObjectSchema<any, undefined>, config: any, endpoint: string, onSubmitted?: () => void }> = (props) => {
    const gameForm = createForm({
        schema: props.schema,
        initialInput: props.config
    })

    //type ConfigKey = keyof typeof props.schema.entries;

    // Why the last save failed, until the next attempt. Kept here rather than
    // left to formisch, which catches a throw from the handler into the form's
    // own errors — rendered nowhere, so a refused save used to vanish silently.
    const [saveFailure, setSaveFailure] = createSignal<Failure>();
    // Apart from formisch's `isSubmitted`, which turns on at the start of every
    // attempt: going by that, a refused save read "Settings Saved".
    const [saved, setSaved] = createSignal(false);

    const submitForm: SubmitHandler<typeof props.schema> = async (values) => {
        if (gameForm.isValid) {
            setSaveFailure(undefined);
            setSaved(false);
            try {
                await postGameConfig(props.endpoint, values)
            } catch (err) {
                console.error("game settings save failed", err);
                // The edits stay in the form, so trying again is one click.
                setSaveFailure(describeFailure(err));
                return;
            }
            setSaved(true);
            props.onSubmitted?.()
        }
    }

    return (
        <Form of={gameForm} onSubmit={submitForm} class={gameStyles.instanceConfigSettings}>
            <For each={Object.entries(gameForm["~internal"].children)}>
                {([name, schema]) => {
                    return (
                        <Field of={gameForm} path={[name]}>
                            {(field) => {
                                if (schema.schema.type === 'picklist') {
                                    return (
                                        <FormSelect
                                            field={field}
                                            field_id={name}
                                            //field_label={prettifyLabel(name)}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                            // Can as any, as already checking for type above, verifying the options property
                                            field_options={(schema.schema as any).options}
                                            size="md"
                                        />
                                    )
                                } else if (schema.schema.type === 'string') {
                                    // Can as any, as already checking for type above, verifying the pipe property
                                    const maxLength = (schema.schema as any).pipe.find((p: any) => p.type === "max_length").requirement;
                                    return (
                                        <FormTextInput
                                            field={field}
                                            field_id={name}
                                            //field_label={prettifyLabel(name)}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                            field_maxlength={maxLength}
                                            size={maxLength > 32 ? "lg" : "md"}
                                        />
                                    )
                                } else if (schema.schema.type === 'number') {
                                    return (
                                        <FormNumberInput
                                            field={field}
                                            field_id={name}
                                            //field_label={prettifyLabel(name)}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                            size="sm"
                                        />
                                    )
                                } else if (schema.schema.type === 'boolean') {
                                    // A toggle's box fits a short word per line. A longer
                                    // one can't wrap, and ran into the next toggle's label
                                    // (RimWorld's "ENABLE LEADERBOARD"), so it gets a wider box.
                                    const size = prettifyLabel(name).split(" ").some((word) => word.length > 8)
                                        ? selectStyles.sizeSM
                                        : selectStyles.sizeXS;
                                    return (
                                        <div class={`${selectStyles.instanceConfigSettingsContainer} ${size}`}>
                                            <label class="bodyTextSmall">{prettifyLabel(name)}</label>
                                            <div class={selectStyles.control}>
                                                <FormCheckbox
                                                    field={field}
                                                    field_id={name}
                                                    field_label={name}
                                                    field_placeholder={props.config[name]}
                                                />
                                            </div>
                                        </div>
                                    )
                                };
                            }}
                        </Field>
                    )
                }}
            </For>
            {/* Just above the button, not at the top: this card runs long, and
                the top is off screen by the time anyone presses Save. */}
            <Show when={saveFailure()}>
                {(failure) => <FormError title="We couldn't save your changes" failure={failure()} />}
            </Show>
            {/* The green + tick waits for a save that went through — not
                `:focus`, which claimed tabbing to this button had saved, and
                not `isSubmitted`, which claimed a refused save had. */}
            <button
                class={`${submitBtnStyle.button} buttonTextSmall`}
                classList={{
                    [submitBtnStyle.busy]: gameForm.isSubmitting,
                    [submitBtnStyle.submitted]: saved() && !gameForm.isDirty && !gameForm.isSubmitting,
                }}
                style={`--icon: url("${iconTick.src}")`}
                type="submit"
                disabled={!gameForm.isDirty || gameForm.isSubmitting}
            >
                {gameForm.isSubmitting ? "Saving Settings" : saved() ? "Settings Saved" : "Save Settings"}
            </button>
        </Form>
    )
}

export default ManagementGameConfiguration;