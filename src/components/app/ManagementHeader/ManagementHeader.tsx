import styles from './ManagementHeader.module.css';
import typo from '../../../styles/typography.module.css';

import iconArrow from "../../../assets/iconArrow.svg?url";
import profileIcon from "../../../assets/profileIcon.svg";
import helpIcon from "../../../assets/helpIcon.svg";
import logoutIcon from "../../../assets/logoutIcon.svg";
import { useMsal } from '../Auth/MsalProvider';

const ManagementHeader = (props: { game: string, name: string }) => {
    const { account } = useMsal();
    
    return (
    <header class={styles.header}>
        <p class={typo.statsText} style={`--gameName: "${props.name}"`}>Dashboard / {props.game} / </p>
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

export default ManagementHeader;