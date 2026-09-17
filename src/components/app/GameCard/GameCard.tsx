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


    /* The banner carries no information the name below it doesn't already
       give, so it is marked decorative — described, it would announce the game
       twice in a row. */
    const content = () => (
        <>
            <div class={styles.banner}>
                <ResponsiveImage src={banner()!} width={1200} height={675} alt="" />
            </div>
            <p class="subTitle">{game()!.name}</p>
        </>
    );

    return (
        <Show when={banner()}>
            {/* A real <button> wherever the card opens the create flow. It used
                to be a <div> with an onclick, which meant the Explore page —
                the place you go to start a server — could only be used with a
                mouse: no tab stop, no Enter, nothing in the accessibility tree
                saying it could be activated. Where no handler is passed (the
                marketing site's grid) the card isn't interactive, so it stays a
                plain div rather than advertising a press that does nothing. */}
            <Show when={props.OpenCreateInstanceModal} fallback={
                <div class={styles.container}>{content()}</div>
            }>
                <button
                    type="button"
                    class={styles.container}
                    onClick={() => props.OpenCreateInstanceModal!({ game_id: props.game_id, allow_game_change: false })}
                >{content()}</button>
            </Show>
        </Show>
    )
}

export default GameCard