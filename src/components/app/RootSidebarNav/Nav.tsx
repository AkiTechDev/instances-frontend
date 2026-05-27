import styles from './Nav.module.css';

import LogoIcon from "../../../assets/icons/logos/icon.svg?solid";
import gamesIcon from "../../../assets/icons/menu/games.svg";
import socialIcon from "../../../assets/icons/menu/social.svg";
import exploreIcon from "../../../assets/icons/menu/explore.svg";
import extraIcon from "../../../assets/icons/menu/extra.svg";
import { A } from '@solidjs/router';

const RootSidebarNav = () => (
    <section class={styles.container}>
        <a class={styles.logoIcon} href="/" target="_self">
            <LogoIcon width={50} height={50} style={"--path2: white"} />
        </a>

        <A href="/dashboard" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${gamesIcon.src})`}>
        </A>
        <A href="/explore" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${exploreIcon.src})`}>
            
        </A>
        <A href="https://discord.gg/qtnvJEvuDw" target="_blank" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${socialIcon.src})`}>
            
        </A>
        <A href="/extra" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${extraIcon.src})`}>
            
        </A>
    </section>
);

export default RootSidebarNav;