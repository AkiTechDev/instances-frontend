import type { Component } from "solid-js"

import styles from "./Profile.module.css";

import iconArrow from "../../../assets/iconArrow.svg";
import profileIcon from "../../../assets/profileIcon.svg";
import helpIcon from "../../../assets/helpIcon.svg";
import logoutIcon from "../../../assets/logoutIcon.svg";
import { useMsal } from "../Auth/MsalProvider";

const Profile: Component<{}> = () => {
    const { logout, account } = useMsal();

    

    return (
        <div
            class={styles.container}
            onMouseEnter={() => document.getElementById("profile")?.showPopover()}
            onMouseLeave={() => document.getElementById("profile")?.hidePopover()}
        >
            <button popoverTarget="profile" aria-haspopup="true" style={`--icon: url("${iconArrow.src}")`}>
                <img class={styles.profileImg} src="/imgs/profile.jpg" />
            </button>

            <ul id="profile" popover role="menu">
                <li><a href={`https://myaccount.microsoft.com/?tenant=${account()?.tenantId}`} role="menuitem" class="bodyTextMedium" target="_blank" rel="noopener noreferrer" style={`--iconUrl: url(${profileIcon.src})`}>Account Settings</a></li>
                <li><a href="/" rel="external" role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${helpIcon.src})`}>Help</a></li>
                <li><a role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${logoutIcon.src})`} onclick={() => logout()}>Log Out</a></li>
            </ul>
        </div>
    )
}

export default Profile