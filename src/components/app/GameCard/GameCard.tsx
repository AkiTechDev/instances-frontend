import { Show, type Component } from "solid-js"
import { gameRegistry } from "../../../lib/games/index"
import { createAsync } from "@solidjs/router"

import styles from "./GameCard.module.css";
import { ResponsiveImage } from "@responsive-image/solid";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

const GameCard: Component<{game_id: string, OpenCreateInstanceModal: ((options: ModalOptions) => void) | undefined }> = (props) => { 
    const game = createAsync(async () => {

        const entry = gameRegistry[props.game_id];

        // The control plane lists games before the frontend ships art and a
        // config for them, so an unrecognised id is expected traffic, not a
        // fault. Callers filter these out of their lists; returning undefined
        // is the backstop, so a stray id costs one card rather than the whole
        // grid — and, without an error boundary above it, the whole page.
        if (!entry) {
            console.warn(`Unknown game id, skipping card: ${props.game_id}`);
            return undefined;
        }

        const mod = await entry.load();
        return mod.default;
    })


    const banner = createAsync(async () => {
        if (game()) {
            return game()!.getBanner()
        }
    });


    return (
        <Show when={banner()}>
            <div class={styles.container} onclick={() => {
                if (props.OpenCreateInstanceModal) { props.OpenCreateInstanceModal({game_id: props.game_id, allow_game_change: false}) }
            }}>
                <div class={styles.banner}>
                    <ResponsiveImage src={banner()!} width={1200} height={675} />
                </div>
                <p class="subTitle">{game()!.name}</p>
            </div>
        </Show>
    )
}

export default GameCard