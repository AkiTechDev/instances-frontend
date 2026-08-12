import type { Component } from "solid-js"

import styles from "./Profile.module.css";

import iconArrow from "../../../assets/icons/chevron.svg";
import profileIcon from "../../../assets/icons/profile.svg";
import helpIcon from "../../../assets/icons/help.svg";
import logoutIcon from "../../../assets/icons/logout.svg";
import { useAuth } from "../Auth/AuthProvider";
import { accountSettingsUrl } from "../../../lib/auth";
import { ResponsiveImage } from "@responsive-image/solid";
import ProfileJPG from "../../../assets/images/profile.jpg?responsive";

const Profile: Component<{}> = () => {
    const { logout } = useAuth();

    return (
        <div
            class={styles.container}
            onMouseLeave={() => document.getElementById("profile")?.hidePopover()}
        >
            <button popoverTarget="profile" aria-haspopup="true" style={`--icon: url("${iconArrow.src}")`}>
                <ResponsiveImage src={ProfileJPG} alt="Default profile picture of a crab" />
            </button>

            <ul id="profile" popover role="menu">
                <li><a href={accountSettingsUrl()} role="menuitem" class="bodyTextMedium" target="_blank" rel="noopener noreferrer" style={`--iconUrl: url(${profileIcon.src})`}>Account Settings</a></li>
                <li><a href="/" rel="external" role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${helpIcon.src})`}>Help</a></li>
                <li><a role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${logoutIcon.src})`} onclick={() => logout()}>Log Out</a></li>
            </ul>
        </div>
    )
}

export default Profile