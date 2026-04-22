import styles from './ManagementHeader.module.css';
import Profile from '../Profile/Profile';

const ManagementHeader = (props: { game: string, name: string }) => {    
    return (
        <header class={styles.header}>
            <p class="statsText" style={`--gameName: "${props.name}"`}>Dashboard / {props.game} / </p>

            <Profile />
        </header>
    )
};

export default ManagementHeader;