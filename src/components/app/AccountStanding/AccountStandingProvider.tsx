import { createContext, useContext } from "solid-js";

import { useAuth } from "../Auth/AuthProvider";
import { useAccountStanding, type AccountStandingStore } from "../../../lib/hooks/useAccountStanding";

const AccountStandingContext = createContext<AccountStandingStore>();

/**
 * One standing store for the whole app. Sits inside AuthProvider, which only
 * renders children once there is an account, and outside the router, so it
 * outlives every route and can clean `?billing=done` off the URL before the
 * router reads it.
 */
export function AccountStandingProvider(props: { children?: any }) {
    const { account } = useAuth();
    const store = useAccountStanding(() => account().sub);

    return (
        <AccountStandingContext.Provider value={store}>
            {props.children}
        </AccountStandingContext.Provider>
    );
}

export const useStanding = () => {
    const ctx = useContext(AccountStandingContext);
    if (!ctx) {
        throw new Error("useStanding must be used inside AccountStandingProvider");
    }
    return ctx;
};
