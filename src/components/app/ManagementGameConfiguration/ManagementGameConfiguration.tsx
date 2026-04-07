import { createForm, Field, Form, type FormStore } from "@formisch/solid";
import { type Component, For } from "solid-js"
import * as v from 'valibot';
import FormSelect from "../FormModules/FormSelect";
import { MinecraftJavaConfigurationSchema, type MinecraftJavaConfiguration } from "../../../lib/games/MinecraftJava";

import styles from "../ManagementInstanceConfiguration/ManagementInstanceConfiguration.module.css"
import typo from "../../../styles/typography.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/iconTick.svg";

import FormTextInput from "../FormModules/FormTextInput";

const defaultRegistry = {
    picklist: (props: { field: string, id: string, label: string, placeholder: string, options: string[]}) => <FormSelect field={props.field} field_id={props.id} field_label={props.label} field_placeholder={props.placeholder} field_options={props.options} />,
    _: (props: any) => <p>Hi</p>
}

function typedEntries<K extends string, V>(obj: Record<K, V>): [K, V][] {
  return Object.entries(obj) as [K, V][];
}

const ManagementGameConfiguration: Component<{ config: any }> = (props) => {

    const gameForm = createForm({
        schema: MinecraftJavaConfigurationSchema,
        initialInput: props.config
    })

    type ConfigKey = keyof typeof MinecraftJavaConfigurationSchema.entries;

    return (
        <Form of={gameForm} onSubmit={(output) => console.log("Submitted", output)} class={styles.instanceConfigSettings}>
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
                                        />
                                    )
                                } else {
                                    console.log("For Each ", name, schema);
                                    return (
                                        <p>no</p>
                                    )
                                }
                            }}
                        </Field>
                    )
                }}
            </For>
            <button class={`${submitBtnStyle.button} ${typo.buttonTextSmall}`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={!gameForm.isTouched}>{gameForm.isSubmitted ? "Settings Saved" : "Save Settings"}</button>
        </Form>
    )
}

export default ManagementGameConfiguration;