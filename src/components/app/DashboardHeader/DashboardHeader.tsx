import styles from './DashboardHeader.module.css';

import { useAuth } from '../Auth/AuthProvider';
import Profile from '../Profile/Profile';

const DashboardHeader = () => {
    const { account } = useAuth();

    console.log(account());

    return (
    <header class={styles.header}>
        <h2 class="statsText">Welcome back, {account().name}. Ready to play?</h2>
        <Profile />
    </header>
)};

export default DashboardHeader;