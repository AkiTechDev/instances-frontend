import { EventType, InteractionRequiredAuthError, type AccountInfo, type EventMessage } from "@azure/msal-browser";
import { msalReady, msalInstance } from "../../../lib/auth";
import { createEffect, createContext, createResource, createSignal, Show, useContext, onCleanup, onMount } from "solid-js";

type MsalContextType = {
    account: () => AccountInfo | null;
    getToken: (scopes: string[]) => Promise<string>;
    login: () => Promise<void>;
    logout: () => void;
};

export const MsalContext = createContext<MsalContextType>();

function Authenticating() {
    return <div>Authenticating...</div>
}

function LoginRedirect() {
    onMount(async () => {
        await msalReady;
        await msalInstance.loginRedirect({ scopes: ["api://Instances/access"] });
    });
    return <div>Redirecting to login...</div>
}

export function MsalProvider(props: { children?: any }) {
    const [ready] = createResource(() => msalReady);
    const [account, setAccount] = createSignal<AccountInfo | null>(null);

    console.log("FUCKING LOG");

    createEffect(() => {
        if (ready.loading) return;
        console.log("ACCOUNT", msalInstance.getActiveAccount());
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


    const getToken = async (scopes: string[]): Promise<string> => {
        await msalReady;
        const current = account();

        if (!current) throw new Error("No active account");

        try {
            const result = await msalInstance.acquireTokenSilent({
                scopes,
                account: current
            });

            return result.accessToken
        } catch (e) {
            // Silent failed - redirect to login
            if (e instanceof InteractionRequiredAuthError) {
                await msalInstance.acquireTokenRedirect({
                    scopes: scopes,
                });
                throw new Error("Redirecting for token");
            }
            throw e;
        }
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