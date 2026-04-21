import styles from './ManagementHeader.module.css';
import typo from '../../../styles/typography.module.css';

import Profile from '../Profile/Profile';

const ManagementHeader = (props: { game: string, name: string }) => {    
    return (
        <header class={styles.header}>
            <p class={typo.statsText} style={`--gameName: "${props.name}"`}>Dashboard / {props.game} / </p>

            <Profile />
        </header>
    )
};

export default ManagementHeader;