import { LogLevel, PublicClientApplication, type AccountInfo } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: 'a8b65d09-2788-44b3-b24d-7c62838436b1',
        authority: 'https://akilaboratories.ciamlogin.com/819748c2-3303-4f6e-bd91-c2bbfd874da8',
        //clientId: 'b355e8f6-6973-4b89-821d-f6bada3cde4b',
        //authority: 'https://akilaboratoriesext.ciamlogin.com/f862f504-2fdc-4cb2-aed3-107ac3cb3154', // Replace the placeholder with your tenant subdomain 
        redirectUri: 'https://www.instances.aki-labs.com/dashboard', // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
        postLogoutRedirectUri: '/', // Indicates the page to navigate after logout.
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookies: false,
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
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        //console.info(message);
                        return;
                    case LogLevel.Verbose:
                        //console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
            piiLoggingEnabled: false,
        },
        windowHashTimeout: 60000,
        iframeHashTimeout: 60000,
        loadFrameTimeout: 0,
    },
}

let msalInstance: PublicClientApplication;

export async function getMsal() {
  if (typeof window === 'undefined') return null; // server, skip

  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise();
  }

  return msalInstance;
}

export async function login() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
        window.location.href = "/dashboard";
    } else {
        await msalInstance.loginRedirect({
            scopes: ["api://Instances/access"],
        });
    }
}


export async function signUp() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
    } else {
        await msalInstance.loginRedirect({
            scopes: ["api://Instances/access"],
            prompt: "create",
        });
    }
}

export function getActiveAccount(): AccountInfo | null {
    return msalInstance?.getActiveAccount() ?? null;
}

export async function getAccessToken(scopes: string[]): Promise<string | null> {
    const account = getActiveAccount();

    if (!account || !msalInstance) return null;

    try {
        const result = await msalInstance.acquireTokenSilent({ account, scopes });
        return result.accessToken;
    } catch {
        await msalInstance.loginRedirect();
        return null;
    }
}