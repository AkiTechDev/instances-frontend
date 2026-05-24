import { Show, type Component } from "solid-js"
import { gameRegistry } from "../../../lib/games/index"
import { createAsync } from "@solidjs/router"

import styles from "./GameCard.module.css";
import { ResponsiveImage } from "@responsive-image/solid";
import type { ModalOptions } from "../CreateInstanceModel/CreateInstanceModal";

const GameCard: Component<{game_id: string, OpenCreateInstanceModal: ((options: ModalOptions) => void) | undefined }> = (props) => { 
    const game = createAsync(async () => {

        const entry = gameRegistry[props.game_id];

        if (!entry) throw new Error(`Uknown game: ${game}`);
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
            <div class={styles.card} onclick={() => {
                if (props.OpenCreateInstanceModal) { props.OpenCreateInstanceModal({game_id: props.game_id, allow_game_change: false}) }
            }}>
                <ResponsiveImage src={banner()!} width={1200} height={675} />
                <p class="buttonText">{game()!.name}</p>
            </div>
        </Show>
    )
}

export default GameCard