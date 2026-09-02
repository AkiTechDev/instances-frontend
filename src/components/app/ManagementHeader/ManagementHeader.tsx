import styles from './ManagementHeader.module.css';
import Profile from '../Profile/Profile';
import FeedbackButton from '../SurveyModal/FeedbackButton';

const ManagementHeader = (props: { game: string, name: string }) => {
    return (
        <header class={styles.header}>
            <p class="statsText" style={`--gameName: "${props.name}"`}>Dashboard / {props.game} / </p>

            <div class={styles.headerActions}>
                <FeedbackButton />
                <Profile />
            </div>
        </header>
    )
};

export default ManagementHeader;