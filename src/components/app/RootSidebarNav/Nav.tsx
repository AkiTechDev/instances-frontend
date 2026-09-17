import styles from './Nav.module.css';

import LogoIcon from "../../../assets/icons/logos/icon.svg?solid";
import gamesIcon from "../../../assets/icons/menu/games.svg";
import socialIcon from "../../../assets/icons/menu/social.svg";
import exploreIcon from "../../../assets/icons/menu/explore.svg";
import extraIcon from "../../../assets/icons/menu/extra.svg";
import { A } from '@solidjs/router';

/* The only persistent navigation in the signed-in app.

   Every icon here is a CSS mask on a custom property, which the accessibility
   tree cannot see: to a screen reader these were five links with no text at
   all. The names below are the whole of what they announce, so they say where
   the link goes rather than what the picture is. `<A>` marks the current one
   with aria-current on its own. */
const RootSidebarNav = () => (
    <nav class={styles.container} aria-label="Main">
        <a class={styles.logoIcon} href="/" target="_self" aria-label="Instances home">
            <LogoIcon width={50} height={50} style={"--path2: white"} />
        </a>

        <A href="/dashboard" class={styles.menuItem} activeClass={styles.menuItemActive} aria-label="My games" style={`--gamesIconUrl: url(${gamesIcon.src})`}>
        </A>
        <A href="/explore" class={styles.menuItem} activeClass={styles.menuItemActive} aria-label="Explore games" style={`--gamesIconUrl: url(${exploreIcon.src})`}>
            
        </A>
        <A href="https://discord.gg/qtnvJEvuDw" target="_blank" class={styles.menuItem} activeClass={styles.menuItemActive} aria-label="Community on Discord (opens in a new tab)" style={`--gamesIconUrl: url(${socialIcon.src})`}>
            
        </A>
        <A href="/extra" class={styles.menuItem} activeClass={styles.menuItemActive} aria-label="Extras" style={`--gamesIconUrl: url(${extraIcon.src})`}>
            
        </A>
    </nav>
);

export default RootSidebarNav;
