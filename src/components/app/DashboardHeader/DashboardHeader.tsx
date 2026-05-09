import styles from './DashboardHeader.module.css';

import { useMsal } from '../Auth/MsalProvider';
import Profile from '../Profile/Profile';

const DashboardHeader = () => {
    const { account } = useMsal();
    
    return (
    <header class={styles.header}>
        <h2 class="statsText">Welcome back, {account()!.name}. Ready to play?</h2>
        <Profile />
    </header>
)};

export default DashboardHeader;