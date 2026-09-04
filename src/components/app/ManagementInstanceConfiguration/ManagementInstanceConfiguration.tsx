import { type Component, createSignal, createUniqueId, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { createForm, Form, Field, useField, type SubmitHandler } from "@formisch/solid";
import * as v from 'valibot';
import FormSelect from "../FormModules/FormSelect";
import FormTextInput from "../FormModules/FormTextInput";
import AdvancedSettingsToggle from "../FormModules/AdvancedSettingsToggle";

import { fgCalc } from "../../../lib/pricing";
import instance_tiers from "../../../lib/instance_tiers";
import { webhookUrlPlaceholder, webhookUrlSchema } from "../../../lib/webhook";

import styles from "./ManagementInstanceConfiguration.module.css";

import selectStyles from "../FormModules/FormSelect.module.css";
import submitBtnStyle from "../../../styles/components/formSubmitButton.module.css";
import iconTick from "../../../assets/icons/tick.svg";
import iconCross from "../../../assets/icons/cross.svg";
import { regions } from "../../../lib/regions";
import { postInstanceConfig, type Instance, type InstanceConfig, type PostInstanceConfig } from "../../../lib/apis";
import type { InstanceProfile } from "../../../lib/games/types";


interface InstanceConfigFormProps {
  config: InstanceConfig,
  endpoint: string,
  profiles: { [id: string]: InstanceProfile },
  onSubmitted?: () => void
}

/**
 * The settings form itself. Rendered twice over the same config: inline on the
 * management panel with the everyday fields only, and inside the all-settings
 * modal with the advanced ones as well. Each render owns its own form state, so
 * the modal always opens on the last saved config rather than on half-finished
 * edits left behind in the panel.
 */
const InstanceConfigForm: Component<InstanceConfigFormProps & {
  advanced?: boolean,
  onShowAll?: () => void
}> = (props) => {
    const [currentProfile, setCurrentProfile] = createSignal(Object.keys(props.profiles).find(k => props.profiles[k]["cpu"] === props.config["cpu"] && props.profiles[k]["memory"] === props.config["memory"]) || "ERR")

    const InstanceConfigurationSchema = v.object({
      plan: v.picklist(instance_tiers),
      profile: v.picklist(Object.keys(props.profiles)),
      auto_start: v.boolean(),
      webhook_url: webhookUrlSchema
    });


    const instanceForm = createForm({
      schema: InstanceConfigurationSchema,
      initialInput: {
        "auto_start": false,
        "plan": props.config["plan"],
        "profile": currentProfile(),
        "webhook_url": props.config["webhook_url"] ?? ""
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
                auto_start: values["auto_start"],
                // Always sent — a blank value is how the user clears a webhook.
                webhook_url: (values["webhook_url"] ?? "").trim()
              };
              setCurrentProfile(values["profile"])
              await postInstanceConfig(props.endpoint, new_config)
              props.onSubmitted?.()
          }
      }

    return (
      <Form of={instanceForm} onSubmit={submitForm} class={styles.instanceConfigSettings}>
        <Field of={instanceForm} path={['plan']}>
          {(field) => (
            <FormSelect field={field}
              field_id="plan"
              field_label="TIER"
              field_placeholder={props.config["plan"]}
              field_options={instance_tiers}
            />
          )}
        </Field>

        <Field of={instanceForm} path={["profile"]}>
          {(field) => (
            <FormSelect field={field}
              field_id="profile"
              field_label="PLAYER_COUNT"
              field_placeholder={currentProfile()}
              field_options={Object.keys(props.profiles)}
            />
          )}
        </Field>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class="bodyTextSmall">REGION</label>
            <select value={regions[props.config["region"]]} class={`${selectStyles.select} bodyText`} disabled>
              <option class="bodyText" value={regions[props.config["region"]]} selected>{regions[props.config["region"]]}</option>
            </select>
        </div>

        <div class={selectStyles.instanceConfigSettingsContainer}>
            <label class="bodyTextSmall">COST</label>
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

        <Show when={props.advanced}>
          <div class={styles.advanced}>
            <Field of={instanceForm} path={["webhook_url"]}>
              {(field) => (
                <FormTextInput field={field}
                  field_id="webhook_url"
                  field_label="WEBHOOK_URL"
                  field_placeholder={webhookUrlPlaceholder}
                  field_maxlength={2048}
                />
              )}
            </Field>
          </div>
        </Show>

        <div class={styles.formFooter}>
          <Show when={props.onShowAll}>
            <AdvancedSettingsToggle
              label="Show All Settings"
              onToggle={() => props.onShowAll!()}
            />
          </Show>

          {/* The green + tick is driven by `isSubmitted`, not by `:focus` —
              tabbing to this button used to claim the settings had saved. */}
          <button
            class={`${submitBtnStyle.button} ${styles.footerSubmit} buttonTextSmall`}
            classList={{
              [submitBtnStyle.busy]: instanceForm.isSubmitting,
              [submitBtnStyle.submitted]: instanceForm.isSubmitted && !instanceForm.isDirty && !instanceForm.isSubmitting,
            }}
            style={`--icon: url("${iconTick.src}")`}
            type="submit"
            disabled={!instanceForm.isDirty || instanceForm.isSubmitting}
          >
            {instanceForm.isSubmitting ? "Saving Settings" : instanceForm.isSubmitted ? "Settings Saved" : "Save Settings"}
          </button>
        </div>
      </Form>
    )
};

/** Every configurable instance setting, advanced ones included, in one dialog. */
const InstanceSettingsModal: Component<InstanceConfigFormProps & {
  instance: Instance,
  onClose: () => void
}> = (props) => {
    const id = createUniqueId();

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") props.onClose();
    };

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
    });

    onCleanup(() => {
        window.removeEventListener("keydown", handleKeydown);
        document.body.style.overflow = "";
    });

    return (
        <Portal>
            <div class={styles.backdrop} onClick={() => props.onClose()}></div>
            <div
                class={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`instanceSettingsTitle${id}`}
                onClick={(e) => e.stopImmediatePropagation()}
            >
                <button
                    class={styles.exit}
                    style={`--icon: url("${iconCross.src}")`}
                    onClick={() => props.onClose()}
                    aria-label="Close"
                ></button>

                <div class={styles.modalBody}>
                    <div class={styles.modalHeader}>
                        <h6 id={`instanceSettingsTitle${id}`} class="h6">{props.instance.name} Settings</h6>
                        <p class={`${styles.muted} bodyText`}>Everything you can configure on this instance, advanced options included.</p>
                    </div>

                    <InstanceConfigForm
                        config={props.config}
                        endpoint={props.endpoint}
                        profiles={props.profiles}
                        onSubmitted={props.onSubmitted}
                        advanced
                    />
                </div>
            </div>
        </Portal>
    )
};

const ManagementInstanceConfigForm: Component<InstanceConfigFormProps & { instance: Instance }> = (props) => {
    const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

    return (
        <>
            <InstanceConfigForm
                config={props.config}
                endpoint={props.endpoint}
                profiles={props.profiles}
                onSubmitted={props.onSubmitted}
                onShowAll={() => setIsSettingsOpen(true)}
            />

            <Show when={isSettingsOpen()}>
                <InstanceSettingsModal
                    config={props.config}
                    endpoint={props.endpoint}
                    profiles={props.profiles}
                    instance={props.instance}
                    onClose={() => setIsSettingsOpen(false)}
                    onSubmitted={() => {
                        // Close before handing back: the panel swaps to its
                        // skeleton while the update lands, and a dialog left
                        // open over it would be stranded on stale values.
                        setIsSettingsOpen(false);
                        props.onSubmitted?.();
                    }}
                />
            </Show>
        </>
    )
};

export default ManagementInstanceConfigForm;
