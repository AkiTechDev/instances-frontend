import { EventType, LogLevel, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: 'b355e8f6-6973-4b89-821d-f6bada3cde4b',
        authority: 'https://akilaboratoriesext.ciamlogin.com/f862f504-2fdc-4cb2-aed3-107ac3cb3154', // Replace the placeholder with your tenant subdomain 
        redirectUri: 'https://instances.aki-labs.com/dashboard', // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
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
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
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

/*

export const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize();

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        console.log("SIGNED IN");
    }
});

*/

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