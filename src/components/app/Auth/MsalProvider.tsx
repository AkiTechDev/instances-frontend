import { EventType, type AccountInfo, type EventMessage } from "@azure/msal-browser";
import { getToken as acquireToken, msalReady, msalInstance } from "../../../lib/auth";
import { createEffect, createContext, createResource, createSignal, Show, useContext, onCleanup, onMount } from "solid-js";

import authenticatingStyles from "./Authenticating.module.css";

type MsalContextType = {
    account: () => AccountInfo | null;
    getToken: (scopes: string[]) => Promise<string>;
    login: () => Promise<void>;
    logout: () => void;
};

export const MsalContext = createContext<MsalContextType>();

function Authenticating() {
    return (
        <div class={authenticatingStyles.container}>
            <h3 class="h3">Authenticating</h3>
            <p class="subTitle">Confirming it's really you</p>
        </div>
    )
}

function LoginRedirect() {
    onMount(async () => {
        await msalReady;
        await msalInstance.loginRedirect({ scopes: ["api://Instances/access"] });
    });
    return (
        <div class={authenticatingStyles.container}>
            <h3 class="h3">Authenticating</h3>
            <p class="subTitle">Confirming it's really you</p>
        </div>
    )
}

export function MsalProvider(props: { children?: any }) {
    const [ready] = createResource(() => msalReady);
    const [account, setAccount] = createSignal<AccountInfo | null>(null);

    createEffect(() => {
        if (ready.loading) return;
        setAccount(msalInstance.getActiveAccount());
    });

    const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
        switch (message.eventType) {
            case EventType.LOGIN_SUCCESS:
            case EventType.ACQUIRE_TOKEN_SUCCESS:
            case EventType.LOGOUT_SUCCESS:
            case EventType.ACTIVE_ACCOUNT_CHANGED:
                setAccount(msalInstance.getActiveAccount());
                break;
        }
    });

    onCleanup(() => {
        if (callbackId) msalInstance.removeEventCallback(callbackId);
    });


    // Delegate to the shared token path in lib/auth so silent-refresh failures
    // (expired session -> InteractionRequiredAuthError) fall back to an
    // interactive redirect in one place rather than being duplicated here.
    const getToken = async (scopes: string[]): Promise<string> => {
        const result = await acquireToken(scopes);
        return result.accessToken;
    };

    const login = async () => {
        await msalReady;
        await msalInstance.loginRedirect({ scopes: ["api://Instances/access"] });
    
    };

    const logout = () => {
        msalInstance.logoutRedirect();
    };

    return (
        <Show when={!ready.loading} fallback={<Authenticating />}>
            <Show when={account()} fallback={<LoginRedirect />}>
                <MsalContext.Provider value={{ account, getToken, login, logout }}>
                    {props.children}
                </MsalContext.Provider>
            </Show>
        </Show>
    )
}

export const useMsal = () => {
    const ctx = useContext(MsalContext);
    if (!ctx) {
        throw new Error("useMsal must be used inside MsalProvider")
    };
    return ctx;
};