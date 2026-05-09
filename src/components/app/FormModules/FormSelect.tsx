
import { type Component, For, Match, Switch } from 'solid-js';

import styles from "./FormSelect.module.css";

const FormSelect: Component<{ field: any, field_id: string, field_label: string, field_placeholder: string | number | boolean, field_options: string[] | {[id: string]: string} }> = (props) => {

    return (
        <div class={`${styles.instanceConfigSettingsContainer} ${styles.fieldXS }`}>
            <label class="bodyTextSmall">{props.field_label} </label>
            <select {...props.field.props} value={props.field.input} class={`${styles.select} bodyText`}>
            <Switch>
                <Match when={props.field_options != undefined && props.field_options.constructor === Array}>
                    <For each={props.field_options as string[]}>
                        { (option, ) => (
                            <option class="bodyText" value={option} selected={option == props.field_placeholder}>{option}</option>
                        )}
                    </For>
                </Match>
                <Match when={1==1}>
                    <For each={props.field_options != undefined && Object.entries(props.field_options)}>
                        { (item: [string, string], ) => (
                            <option class="bodyText" value={item[0]} selected={item[0] == props.field_placeholder}>{item[1]}</option>
                        )}
                    </For>
                </Match>
            </Switch>

            </select>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormSelect;