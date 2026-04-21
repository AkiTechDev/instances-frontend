import type { Component } from "solid-js";

import typo from "../../../styles/typography.module.css";
import styles from "./Extra.module.css";

const Extra: Component<{}> = () => {

    return (
        <div class={styles.container}>
            <h3 class={typo.h3}>Under Constructions</h3>
            <p class={typo.statsTitle}>We need ideas, what should we put here?</p>
        </div>
    )
}

export default Extra