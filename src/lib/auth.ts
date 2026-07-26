import { InteractionRequiredAuthError, LogLevel, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: 'a8b65d09-2788-44b3-b24d-7c62838436b1',
        authority: 'https://akilaboratories.ciamlogin.com/819748c2-3303-4f6e-bd91-c2bbfd874da8',
        knownAuthorities: ['akilaboratories.ciamlogin.com'],
        //clientId: 'b355e8f6-6973-4b89-821d-f6bada3cde4b',
        //authority: 'https://akilaboratoriesext.ciamlogin.com/f862f504-2fdc-4cb2-aed3-107ac3cb3154', // Replace the placeholder with your tenant subdomain 
        redirectUri: 'https://www.instances.aki-labs.com/auth/redirect', // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
        postLogoutRedirectUri: '/', // Indicates the page to navigate after logout.
        // navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: 'sessionStorage',
    },
    system: {
        loggerOptions: {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error: console.error(message); return;
                    case LogLevel.Warning: console.warn(message); return;
                }
            },
            piiLoggingEnabled: false,
        },
        popupBridgeTimeout: 60000,
        iframeBridgeTimeout: 60000,
    },
}

export const msalInstance = new PublicClientApplication(msalConfig);

export const msalReady = msalInstance.initialize().then(async () => {
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
        msalInstance.setActiveAccount(response.account)
    } else {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 1) msalInstance.setActiveAccount(accounts[0]);
    }
})


// Guard so that several token requests failing at once (e.g. the dashboard
// preloading many instances after a long idle) trigger only ONE interactive
// redirect instead of racing and throwing `interaction_in_progress`.
let redirecting = false;

const redirectForInteraction = async (scopes: string[]): Promise<never> => {
    if (!redirecting) {
        redirecting = true;
        try {
            await msalInstance.acquireTokenRedirect({
                scopes,
                // Pass the (possibly stale) account as a login hint so the
                // re-auth pre-fills the user instead of showing a blank prompt.
                account: msalInstance.getActiveAccount() ?? undefined,
            });
        } catch (e) {
            redirecting = false;
            throw e;
        }
    }
    // The browser is navigating to the sign-in page; keep callers pending
    // rather than rejecting, so no in-flight request surfaces an uncaught
    // rejection while the page unloads.
    return new Promise<never>(() => { });
};

export const getToken = async (scopes: string[]) => {
    await msalReady;
    const account = msalInstance.getActiveAccount();

    // No cached account at all -> straight to interactive sign-in.
    if (!account) return redirectForInteraction(scopes);

    try {
        return await msalInstance.acquireTokenSilent({
            scopes,
            account: account
        });
    } catch (e) {
        // Tokens expired AND the server session is gone (e.g. AADSTS160021
        // after a day idle) -> MSAL cannot refresh silently. Re-authenticate
        // interactively instead of letting the rejection go uncaught.
        if (e instanceof InteractionRequiredAuthError) {
            return redirectForInteraction(scopes);
        }
        throw e;
    }
};


export const login = async (redirectTo?: string) => {
    await msalReady;
    await msalInstance.loginRedirect({
        scopes: ["api://Instances/access"],
        ...(redirectTo && { redirectStartPage: redirectTo }),
    });
};