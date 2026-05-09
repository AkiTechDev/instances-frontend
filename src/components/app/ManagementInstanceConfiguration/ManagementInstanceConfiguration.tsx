import { type Component, createSignal } from "solid-js";
import { createForm, Form, Field, useField, type SubmitHandler } from "@formisch/solid";
import * as v from 'valibot';
import FormSelect from "../FormModules/FormSelect";

import { fgCalc } from "../../../lib/pricing";
import instance_tiers from "../../../lib/instance_tiers";

import styles from "./ManagementInstanceConfiguration.module.css";

import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";
import { regions } from "../../../lib/regions";
import { postInstanceConfig, type Instance, type InstanceConfig, type PostInstanceConfig } from "../../../lib/apis";
import type { InstanceProfile } from "../../../lib/games/types";


const ManagementInstanceConfigForm: Component<{ config: InstanceConfig, instance: Instance, endpoint: string, profiles: { [id: string]: InstanceProfile } }> = (props) => {
    const [currentProfile, setCurrentProfile] = createSignal(Object.keys(props.profiles).find(k => props.profiles[k]["cpu"] === props.config["cpu"] && props.profiles[k]["memory"] === props.config["memory"]) || "ERR")

    const InstanceConfigurationSchema = v.object({
      plan: v.picklist(instance_tiers),
      profile: v.picklist(Object.keys(props.profiles)),
      auto_start: v.boolean()
    });


    const instanceForm = createForm({
      schema: InstanceConfigurationSchema,
      initialInput: {
        "auto_start": false,
        "plan": props.config["plan"],
        "profile": currentProfile()
      }
    })

    const formProfile = useField(instanceForm, { path: ["profile"] })
    const formTier = useField(instanceForm, { path: ["plan"] })

    const submitForm: SubmitHandler<typeof InstanceConfigurationSchema> = async (values) => {
          if (instanceForm.isValid) {
              const new_config: PostInstanceConfig = {
                cpu: props.profiles[values["profile"]]["cpu"],
                memory: props.profiles[values["profile"]]["memory"],
                plan: values["plan"],
                auto_start: values["auto_start"]
              };
              setCurrentProfile(values["profile"])
              await postInstanceConfig(props.endpoint, new_config)
          }
      }
    
    return (
      <Form of={instanceForm} onSubmit={submitForm} class={styles.instanceConfigSettings}>
        <Field of={instanceForm} path={['plan']}>
          {(field) => (
            <FormSelect field={field}
              field_id="plan"
              field_label="Tier"
              field_placeholder={props.config["plan"]}
              field_options={instance_tiers}
            />
          )}
        </Field>

        <Field of={instanceForm} path={["profile"]}>
          {(field) => (
            <FormSelect field={field}
              field_id="profile"
              field_label="Player Count"
              field_placeholder={currentProfile()}
              field_options={Object.keys(props.profiles)}
            />
          )}
        </Field>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class="bodyTextSmall">Region </label>
            <select value={regions["us-east-1"]} class={`${selectStyles.select} bodyText`} disabled>
              <option class="bodyText" value={regions["us-east-1"]} selected>{regions["us-east-1"]}</option>
            </select>
        </div>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class="bodyTextSmall">Cost </label>
            <select value="Cost" class={`${selectStyles.select} bodyText`} disabled>
              <option class="bodyText" value="$00/hour" selected>${fgCalc("us-east-1", props.profiles[formProfile.input || ""].memory, props.profiles[formProfile.input || ""].cpu, formTier.input || "")}/hour</option>
            </select>
        </div>
        
        {/* <Field of={instanceForm} path={["auto_start"]}>
          {(field) => (
            <FormCheckbox field={field}
              field_id="auto_start"
              field_label="Auto Start"
              field_placeholder={false}
            />
          )}
        </Field> */}
        <div></div>
        <button class={`${submitBtnStyle.button} buttonTextSmall`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={!instanceForm.isDirty || instanceForm.isSubmitting}>
          {instanceForm.isSubmitting ? "Saving Settings" : instanceForm.isSubmitted ? "Settings Saved" : "Save Settings"}
        </button>
      </Form>
    )
};

export default ManagementInstanceConfigForm;