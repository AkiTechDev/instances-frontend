import { createUniqueId, type Component } from "solid-js"

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
    const id = createUniqueId();
    const popoverId = `profile-${id}`;

    // No onMouseLeave close: `popover` already light-dismisses on an outside
    // click or Escape, and closing on pointer-exit made the menu unusable on
    // touch (open and gone in one gesture) and for keyboard traversal.
    return (
        <div class={styles.container}>
            <button
                type="button"
                popoverTarget={popoverId}
                aria-haspopup="menu"
                aria-label="Account menu"
                style={`--icon: url("${iconArrow.src}")`}
            >
                <ResponsiveImage src={ProfileJPG} alt="" />
            </button>

            <ul id={popoverId} popover role="menu">
                <li role="none"><a href={accountSettingsUrl()} role="menuitem" class="bodyTextMedium" target="_blank" rel="noopener noreferrer" style={`--iconUrl: url(${profileIcon.src})`}>Account Settings</a></li>
                <li role="none"><a href="/" rel="external" role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${helpIcon.src})`}>Help</a></li>
                {/* A real button: it performs an action rather than navigating,
                    and an <a> with no href isn't keyboard-reachable. */}
                <li role="none"><button type="button" role="menuitem" class="bodyTextMedium" style={`--iconUrl: url(${logoutIcon.src})`} onClick={() => logout()}>Log Out</button></li>
            </ul>
        </div>
    )
}

export default Profile