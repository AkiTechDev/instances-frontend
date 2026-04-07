import styles from './DashboardHeader.module.css';
import typo from '../../../styles/typography.module.css';

import iconArrow from "../../../assets/iconArrow.svg?url";
import profileIcon from "../../../assets/profileIcon.svg";
import helpIcon from "../../../assets/helpIcon.svg";
import logoutIcon from "../../../assets/logoutIcon.svg";
import { useMsal } from '../Auth/MsalProvider';

const DashboardHeader = () => {
    const { account } = useMsal();
    
    return (
    <header class={styles.header}>
        <h2 class={typo.statsText}>Welcome back, {account()?.name || "Anonymous"}. Ready to play?</h2>
        <div class={styles.profileContainer}>
            <img class={styles.profileImg} src="/instances-frontend/imgs/profile.jpg" />
            <embed src={iconArrow} />
            <div class={styles.profileCard}>
                <a href="#test" class={typo.bodyTextMedium} style={`--iconUrl: url(${profileIcon.src})`}>Account Settings</a>
                <a href="#test" class={typo.bodyTextMedium} style={`--iconUrl: url(${helpIcon.src})`}>Help</a>
                <a href="#test" class={typo.bodyTextMedium} style={`--iconUrl: url(${logoutIcon.src})`}>Log Out</a>
            </div>
        </div>
    </header>
)};

export default DashboardHeader;