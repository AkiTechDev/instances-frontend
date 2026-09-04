import styles from './DashboardHeader.module.css';

import { useAuth } from '../Auth/AuthProvider';
import Profile from '../Profile/Profile';
import FeedbackButton from '../SurveyModal/FeedbackButton';

const DashboardHeader = () => {
    const { account } = useAuth();

    return (
    <header class={styles.header}>
        <h2 class="statsText">Welcome back, {account().name}. Ready to play?</h2>
        <div class={styles.headerActions}>
            <FeedbackButton />
            <Profile />
        </div>
    </header>
)};

export default DashboardHeader;