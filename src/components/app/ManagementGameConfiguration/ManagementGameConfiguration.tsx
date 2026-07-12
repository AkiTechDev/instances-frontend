import { createForm, Field, Form, type SubmitHandler } from "@formisch/solid";
import { type Component, For } from "solid-js"
import FormSelect from "../FormModules/FormSelect";

import gameStyles from "./ManagementGameConfiguration.module.css";
import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";

import FormTextInput from "../FormModules/FormTextInput";
import FormNumberInput from "../FormModules/FormNumberInput";
import FormCheckbox from "../FormModules/FormCheckbox";
import { postGameConfig } from "../../../lib/apis";

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

    const submitForm: SubmitHandler<typeof props.schema> = async (values) => {
        if (gameForm.isValid) {
            await postGameConfig(props.endpoint, values)
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
                                    return (
                                        <div class={`${selectStyles.instanceConfigSettingsContainer} ${selectStyles.sizeXS}`}>
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
            <button class={`${submitBtnStyle.button} buttonTextSmall`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={!gameForm.isDirty || gameForm.isSubmitting}>
                {gameForm.isSubmitting ? "Saving Settings" : gameForm.isSubmitted ? "Settings Saved" : "Save Settings"}
            </button>
        </Form>
    )
}

export default ManagementGameConfiguration;