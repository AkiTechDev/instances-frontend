import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";
import { msalConfig } from "../../../lib/auth";
import { createContext, createSignal, useContext } from "solid-js";

export const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();

type MsalContextType = {
    account: () => AccountInfo | null;
    getToken: (scopes: string[]) => Promise<string>;
    login: () => Promise<void>;
    logout: () => void;
};

export const MsalContext = createContext<MsalContextType>();

export function MsalProvider(props: { children?: any }) {
    const [account, setAccount] = createSignal<AccountInfo | null>(
        msalInstance.getActiveAccount()
    );

    const getToken = async (scopes: string[]): Promise<string> => {
        const current = account();
        if (!current) throw new Error("No active account");

        try {
            const result = await msalInstance.acquireTokenSilent({
                scopes,
                account: current
            });

            return result.accessToken
        } catch {
            // Silent failed - redirect to login
            await msalInstance.acquireTokenRedirect({
                scopes: ["api://Instances/access"],
            });
            throw new Error("Redirecting for token");
        }
    };

    const login = async () => {
        await msalInstance.loginRedirect({
            scopes: ["api://Instances/access"],
        });
    };

    const logout = () => {
        msalInstance.logoutRedirect();
        setAccount(null);
    };

    return (
        <MsalContext.Provider value={{ account, getToken, login, logout }}>
            {props.children}
        </MsalContext.Provider>
    )
}

export const useMsal = () => {
    const ctx = useContext(MsalContext);
    if (!ctx) {
        console.log("CTX", ctx);
        throw new Error("useMsal must be used inside MsalProvider")
    };
    return ctx;
};