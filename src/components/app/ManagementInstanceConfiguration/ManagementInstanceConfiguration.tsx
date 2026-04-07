import { type Component, createSignal } from "solid-js";
import { createForm, Form, Field, useField } from "@formisch/solid";
import * as v from 'valibot';
import FormSelect from "../FormModules/FormSelect";
import FormCheckbox from "../FormModules/FormCheckbox";

import games, { fgCalc } from "../../../lib/games";
import instance_tiers from "../../../lib/instance_tiers";
import type { Instance } from "../Dashboard/Dashboard";
import { useMsal } from "../Auth/MsalProvider";

import styles from "./ManagementInstanceConfiguration.module.css";
import typo from "../../../styles/typography.module.css";

import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/iconTick.svg";
import { regions } from "../../../lib/regions";

//type Component<P = {}> = (props: P) => JSX.Element;

//     cpu: v.pipe(v.number(), v.minValue(1024), v.maxValue(48192)),
//    memory: v.pipe(v.number(), v.minValue(1024), v.maxValue(48192)),

interface PostInstanceConfig {
    plan: string,
    cpu: number,
    memory: number,
    auto_start: boolean    
}

export const postInstanceConfig = async ( getToken: (scopes: string[]) => Promise<string>, endpoint: string, config: PostInstanceConfig): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config/instance`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    const data = await resp.json();
    console.log("Instance Config Update", data);

    return data["message"]
};

const ManagementInstanceConfigForm: Component<{ config: any, instance: Instance, endpoint: string }> = (props) => {
    const { getToken } = useMsal();
    const profiles = games[props.instance.game].profiles;
    const [currentProfile, setCurrentProfile] = createSignal(Object.keys(profiles).find(k => profiles[k]["cpu"] === props.config["cpu"] && profiles[k]["memory"] === props.config["memory"]) || "ERR")

  const InstanceConfigurationSchema = v.object({
    plan: v.picklist(instance_tiers),
    profile: v.picklist(Object.keys(profiles)),
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

  const updateInstanceConfig = async (new_config: any) => {
    new_config["cpu"] = profiles[new_config["profile"]]["cpu"]
    new_config["memory"] = profiles[new_config["profile"]]["memory"]
    console.log("ONST : ", new_config)
    setCurrentProfile(new_config["profile"])
    delete new_config["profile"]

    console.log("INST : ", new_config)
    postInstanceConfig(getToken, props.endpoint, new_config)

  }
    
    return (
      <Form of={instanceForm} onSubmit={(output) => updateInstanceConfig(output)} class={styles.instanceConfigSettings}>
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
              field_options={Object.keys(profiles)}
            />
          )}
        </Field>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class={typo.bodyTextSmall}>Region </label>
            <select value={regions["us-east-1"]} class={`${selectStyles.select} ${typo.bodyText}`} disabled>
              <option class={typo.bodyText} value={regions["us-east-1"]} selected>{regions["us-east-1"]}</option>
            </select>
        </div>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class={typo.bodyTextSmall}>Cost </label>
            <select value="Cost" class={`${selectStyles.select} ${typo.bodyText}`} disabled>
              <option class={typo.bodyText} value="$00/hour" selected>${fgCalc("us-east-1", profiles[formProfile.input || ""].memory, profiles[formProfile.input || ""].cpu, formTier.input || "")}/hour</option>
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
        <button class={`${submitBtnStyle.button} ${typo.buttonTextSmall}`} style={`--icon: url("${iconTick.src}")`} type="submit" disabled={!instanceForm.isTouched}>{instanceForm.isSubmitted ? "Settings Saved" : "Save Settings"}</button>
      </Form>
    )
};

export default ManagementInstanceConfigForm;