import styles from './Nav.module.css';

import iconLight from "../../../assets/iconLight.svg?url";
import gamesIcon from "./assets/gameMenuIcon.svg";
import socialIcon from "./assets/socialIcon.svg";
import exploreIcon from "./assets/exploreIcon.svg";
import extraIcon from "./assets/extraIcon.svg";
import { A } from '@solidjs/router';

const RootSidebarNav = () => (
    <section class={styles.container}>
        <img class={styles.logoIcon} src={iconLight} />

        <A href="/instances-frontend/dashboard" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${gamesIcon.src})`}>
        </A>
        <A href="/instances-frontend/explore" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${exploreIcon.src})`}>
            
        </A>
        <A href="https://discord.gg/nhCEXaZVMX" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${socialIcon.src})`}>
            
        </A>
        <A href="/instances-frontend/extra" class={styles.menuItem} activeClass={styles.menuItemActive} style={`--gamesIconUrl: url(${extraIcon.src})`}>
            
        </A>
    </section>
);

export default RootSidebarNav;