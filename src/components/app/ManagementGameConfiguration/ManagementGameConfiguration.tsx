import { createForm, Field, Form, type FormStore, type SubmitHandler } from "@formisch/solid";
import { type Component, For } from "solid-js"
import FormSelect from "../FormModules/FormSelect";
import { MinecraftJavaConfigurationSchema, type MinecraftJavaConfiguration } from "../../../lib/games/MinecraftJava";

import styles from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration.module.css"
import gameStyles from "./ManagementGameConfiguration.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/iconTick.svg";

import FormTextInput from "../FormModules/FormTextInput";
import FormNumberInput from "../FormModules/FormNumberInput";
import FormCheckbox from "../FormModules/FormCheckbox";
import { postGameConfig } from "../../../lib/apis";


const ManagementGameConfiguration: Component<{ config: any, endpoint: string }> = (props) => {
    const gameForm = createForm({
        schema: MinecraftJavaConfigurationSchema,
        initialInput: props.config
    })

    type ConfigKey = keyof typeof MinecraftJavaConfigurationSchema.entries;

    const submitForm: SubmitHandler<typeof MinecraftJavaConfigurationSchema> = async (values) => {
        if (gameForm.isValid) {
            await postGameConfig(props.endpoint, values)
        }
    }

    return (
        <Form of={gameForm} onSubmit={submitForm} class={gameStyles.instanceConfigSettings}>
            <For each={Object.entries(gameForm["~internal"].children)}>
                {([name, schema]) => {
                    const id = name as ConfigKey
                    return (
                        <Field of={gameForm} path={[id]}>
                            {(field) => {
                                if (schema.schema.type === 'picklist') {
                                    console.log("true")
                                    return (
                                        <FormSelect
                                            field={field}
                                            field_id={name}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                            field_options={schema.schema.options}
                                        />
                                    )
                                } else if (schema.schema.type === 'string') {
                                    return (
                                        <FormTextInput
                                            field={field}
                                            field_id={name}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                            field_maxlength={schema.schema.pipe.find((p: any) => p.type === "max_length").requirement}
                                        />
                                    )
                                } else if (schema.schema.type === 'number') {
                                    return (
                                        <FormNumberInput
                                            field={field}
                                            field_id={name}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                        />
                                    )
                                } else if (schema.schema.type === 'boolean') {
                                    return (
                                        <div class={gameStyles.toggleContainer}>
                                        <p class="bodyTextSmall">{name}</p>
                                        <FormCheckbox
                                            field={field}
                                            field_id={name}
                                            field_label={name}
                                            field_placeholder={props.config[name]}
                                        />
                                        </div>
                                    )
                                } else {
                                    console.log("For Each ", name, schema);
                                }
                            }}
                        </Field>
                    )
                }}
            </For>
            <button class={`${submitBtnStyle.button}buttonTextSmall`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={!gameForm.isDirty || gameForm.isSubmitting}>
                {gameForm.isSubmitting ? "Saving Settings" : gameForm.isSubmitted ? "Settings Saved" : "Save Settings"}
            </button>
        </Form>
    )
}

export default ManagementGameConfiguration;