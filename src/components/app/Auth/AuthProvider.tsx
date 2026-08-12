import { createContext, createSignal, onCleanup, onMount, Show, useContext } from "solid-js";

import {
    getAccount,
    getToken as acquireToken,
    getUserManager,
    isConfigured,
    login as startLogin,
    logout as endSession,
    type Account,
} from "../../../lib/auth";

import authenticatingStyles from "./Authenticating.module.css";

type AuthContextType = {
    /** Always resolves — children only render once a session exists. */
    account: () => Account;
    getToken: () => Promise<string>;
    login: () => Promise<void>;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType>();

function Authenticating() {
    return (
        <div class={authenticatingStyles.container}>
            <h3 class="h3">Authenticating</h3>
            <p class="subTitle">Confirming it's really you</p>
        </div>
    );
}

function NotConfigured() {
    return (
        <div class={`${authenticatingStyles.container} ${authenticatingStyles.static}`}>
            <h3 class="h3">Sign-in unavailable</h3>
            <p class="subTitle">
                Authentication isn't configured for this deployment.
            </p>
        </div>
    );
}

function LoginRedirect() {
    onMount(() => {
        // No session — hand the user straight to the Zitadel hosted login UI,
        // returning them to whatever they were trying to reach.
        void startLogin();
    });

    return (
        <div class={authenticatingStyles.container}>
            <h3 class="h3">Authenticating</h3>
            <p class="subTitle">Confirming it's really you</p>
        </div>
    );
}

export function AuthProvider(props: { children?: any }) {
    // Bail before anything touches the UserManager, which throws on missing config.
    if (!isConfigured()) return <NotConfigured />;

    const [ready, setReady] = createSignal(false);
    const [account, setAccount] = createSignal<Account | null>(null);

    onMount(() => {
        const mgr = getUserManager();

        // `userLoaded` also fires on every silent renew. The <Show> below is
        // non-keyed, so re-emitting an equivalent account updates the accessor
        // without remounting the app.
        const onLoaded = () => void getAccount().then(setAccount);
        const onUnloaded = () => { setAccount(null); };

        // Registered before the async lookup below so Solid still owns them.
        mgr.events.addUserLoaded(onLoaded);
        mgr.events.addUserUnloaded(onUnloaded);
        onCleanup(() => {
            mgr.events.removeUserLoaded(onLoaded);
            mgr.events.removeUserUnloaded(onUnloaded);
        });

        void getAccount().then((a) => {
            setAccount(a);
            setReady(true);
        });
    });

    // Delegate to the shared token path in lib/auth so refresh failures fall
    // back to an interactive redirect in one place rather than being
    // duplicated here.
    const getToken = () => acquireToken();
    const login = () => startLogin();
    const logout = () => void endSession();

    return (
        <Show when={ready()} fallback={<Authenticating />}>
            <Show when={account()} fallback={<LoginRedirect />}>
                {(acc) => (
                    <AuthContext.Provider value={{ account: acc, getToken, login, logout }}>
                        {props.children}
                    </AuthContext.Provider>
                )}
            </Show>
        </Show>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
};
