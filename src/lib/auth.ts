import { LogLevel, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: 'a8b65d09-2788-44b3-b24d-7c62838436b1',
        authority: 'https://akilaboratories.ciamlogin.com/819748c2-3303-4f6e-bd91-c2bbfd874da8',
        knownAuthorities: ['akilaboratories.ciamlogin.com'],
        //clientId: 'b355e8f6-6973-4b89-821d-f6bada3cde4b',
        //authority: 'https://akilaboratoriesext.ciamlogin.com/f862f504-2fdc-4cb2-aed3-107ac3cb3154', // Replace the placeholder with your tenant subdomain 
        redirectUri: 'https://instances.aki-labs.com/auth/redirect', // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
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


export const getToken = async (scopes: string[]) => {
    await msalReady;
    const account = msalInstance.getActiveAccount();

    if (!account) throw new Error("No active account");

    return await msalInstance.acquireTokenSilent({
        scopes,
        account: account
    });
};


export const login = async (redirectTo?: string) => {
    await msalReady;
    await msalInstance.loginRedirect({
        scopes: ["api://Instances/access"],
        ...(redirectTo && { redirectStartPage: redirectTo }),
    });
};