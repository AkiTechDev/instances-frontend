import {
    UserManager,
    WebStorageStateStore,
    type User,
    type UserManagerSettings,
} from "oidc-client-ts";

/**
 * Zitadel User Agent (SPA) client — Authorization Code + PKCE, no client secret.
 *
 * Every value here is public by design: a User Agent app has no secret, so the
 * client id / authority are safe in the bundle. They live in env vars only so
 * the same build can target a test and a production Zitadel instance.
 *
 *   PUBLIC_ZITADEL_AUTHORITY   e.g. https://your-instance.zitadel.cloud
 *   PUBLIC_ZITADEL_CLIENT_ID   the User Agent app's client id
 *   PUBLIC_ZITADEL_PROJECT_ID  project owning the Instances API (token audience)
 */
const AUTHORITY = import.meta.env.PUBLIC_ZITADEL_AUTHORITY;
const CLIENT_ID = import.meta.env.PUBLIC_ZITADEL_CLIENT_ID;
const PROJECT_ID = import.meta.env.PUBLIC_ZITADEL_PROJECT_ID;

export const CALLBACK_PATH = "/auth/redirect";

/**
 * Whether the build has Zitadel config at all. Checked before rendering so a
 * missing env var surfaces as a readable message rather than an app that sits
 * on "Authenticating..." forever.
 */
export const isConfigured = (): boolean => Boolean(AUTHORITY && CLIENT_ID);

// `offline_access` is not optional for us. Zitadel deliberately refuses silent
// re-auth in a hidden iframe — its login UI answers with X-Frame-Options: DENY —
// so the refresh-token grant is the ONLY way to renew a token without bouncing
// the user through a full-page redirect. Zitadel rotates the refresh token on
// every use, which is what makes holding one in the browser acceptable.
const SCOPES = [
    "openid",
    "profile",
    "email",
    "offline_access",
    // Adds the API's project to the access token's `aud`. Without it the token
    // is audienced only to this client and the Instances API will reject it.
    ...(PROJECT_ID ? [`urn:zitadel:iam:org:project:id:${PROJECT_ID}:aud`] : []),
].join(" ");

const settings = (): UserManagerSettings => {
    if (!AUTHORITY || !CLIENT_ID) {
        throw new Error(
            "Zitadel auth is not configured — set PUBLIC_ZITADEL_AUTHORITY and PUBLIC_ZITADEL_CLIENT_ID.",
        );
    }

    const origin = window.location.origin;

    return {
        authority: AUTHORITY,
        client_id: CLIENT_ID,
        redirect_uri: `${origin}${CALLBACK_PATH}`,
        post_logout_redirect_uri: `${origin}/`,
        response_type: "code",
        scope: SCOPES,

        // Renewal is driven by us, not the library's timer, so that every
        // refresh funnels through the single-flight guard below. Rotating
        // refresh tokens make concurrent refreshes actively harmful.
        automaticSilentRenew: false,
        // Session monitoring uses a hidden check_session iframe, which Zitadel
        // blocks for the same reason as silent renew.
        monitorSession: false,
        // Revocation is done by hand in `logout()` instead. The library
        // revokes *inside* signoutRedirect and lets a failure abort the whole
        // call, which would leave the Zitadel session alive while the app
        // looks signed out.
        revokeTokensOnSignout: false,

        // Tab-scoped, matching the previous MSAL `cacheLocation: 'sessionStorage'`.
        // `stateStore` holds the PKCE verifier between the authorize redirect and
        // the callback — same tab, so sessionStorage is sufficient.
        userStore: new WebStorageStateStore({ store: window.sessionStorage }),
        stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    };
};

// Constructed lazily: the settings above touch `window`, and this module is
// imported from Astro pages that are also rendered on the server.
let manager: UserManager | null = null;

export const getUserManager = (): UserManager => {
    if (!manager) {
        manager = new UserManager(settings());
        manager.events.addAccessTokenExpiring(() => {
            void refreshOnce().catch(() => {
                // Renewal failed ahead of expiry; the next getToken() call will
                // fall back to an interactive redirect. Nothing to do here.
            });
        });
    }
    return manager;
};

/**
 * Single-flight refresh.
 *
 * oidc-client-ts has no internal mutex around `signinSilent()`: concurrent
 * callers each read the same stored user and POST the same refresh token. With
 * Zitadel rotating on every use, the first call wins and the rest present an
 * already-consumed token. Collapsing them into one shared promise matters here
 * because the dashboard preloads state for every instance at once.
 */
let refreshInFlight: Promise<User | null> | null = null;

const refreshOnce = (): Promise<User | null> => {
    if (!refreshInFlight) {
        refreshInFlight = getUserManager()
            .signinSilent()
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
};

/**
 * Only ever send the user somewhere on this origin.
 *
 * oidc-client-ts keeps this payload in sessionStorage and round-trips only an
 * opaque id through Zitadel, so it isn't attacker-controlled — but it is the
 * one place a stored value turns into a navigation, so it stays closed to
 * same-origin paths regardless.
 */
const safeReturnPath = (value: unknown): string => {
    if (typeof value !== "string") return "/dashboard";
    if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
    return value;
};

// Guard so that several token requests failing at once (e.g. the dashboard
// preloading many instances after a long idle) trigger only ONE interactive
// redirect instead of racing each other.
let redirecting = false;

const redirectForInteraction = async (): Promise<never> => {
    if (!redirecting) {
        redirecting = true;
        try {
            await login(window.location.pathname + window.location.search);
        } catch (e) {
            redirecting = false;
            throw e;
        }
    }
    // The browser is navigating to the sign-in page; keep callers pending rather
    // than rejecting, so no in-flight request surfaces an uncaught rejection
    // while the page unloads.
    return new Promise<never>(() => { });
};

export type Account = {
    /** Zitadel `sub` claim — the stable user id. Replaces MSAL's homeAccountId. */
    sub: string;
    /** Best available human-readable name; never empty. */
    name: string;
    email?: string;
};

// Deliberately indifferent to token expiry: an expired access token still
// identifies the user, and `getToken()` can renew it silently. Treating expiry
// as "signed out" here would force a full redirect where a refresh would do.
const toAccount = (user: User | null): Account | null => {
    const p = user?.profile;
    if (!p?.sub) return null;

    return {
        sub: p.sub,
        // Zitadel only puts profile claims in the ID token when "User Info
        // inside ID Token" is enabled on the app, so degrade gracefully.
        name: p.name || p.given_name || p.preferred_username || p.email || "there",
        email: p.email,
    };
};

export const getAccount = async (): Promise<Account | null> =>
    toAccount(await getUserManager().getUser());

/** Zitadel's built-in self-service profile page. */
export const accountSettingsUrl = (): string =>
    `${(AUTHORITY ?? "").replace(/\/+$/, "")}/ui/console/users/me`;

/** True if this browser currently holds a session (used by the landing page). */
export const hasSession = async (): Promise<boolean> => (await getAccount()) !== null;

/**
 * Returns a usable access token, renewing or re-authenticating as needed.
 * Never rejects for auth reasons — it redirects instead.
 */
export const getToken = async (): Promise<string> => {
    const user = await getUserManager().getUser();

    if (!user) return redirectForInteraction();

    if (!user.expired && user.access_token) return user.access_token;

    // Expired: try the refresh-token grant before disturbing the user.
    if (user.refresh_token) {
        try {
            const renewed = await refreshOnce();
            if (renewed?.access_token) return renewed.access_token;
        } catch {
            // Refresh token expired, revoked, or already rotated away — fall
            // through to interactive sign-in.
        }
    }

    return redirectForInteraction();
};

/** Send the user to the Zitadel hosted login UI. */
export const login = async (returnTo?: string): Promise<void> => {
    await getUserManager().signinRedirect({
        // Round-tripped through Zitadel and read back in the callback.
        state: safeReturnPath(returnTo ?? window.location.pathname + window.location.search),
    });
};

/** RP-initiated logout: ends the Zitadel session and clears local tokens. */
export const logout = async (): Promise<void> => {
    const mgr = getUserManager();

    // Best-effort, and deliberately not fatal. Revoking the refresh token also
    // revokes the access token it was issued with, so one call covers both.
    try {
        await mgr.revokeTokens(["refresh_token"]);
    } catch (e) {
        console.warn("Token revocation failed; continuing with sign-out", e);
    }

    try {
        // Ends the Zitadel session itself; oidc-client-ts supplies
        // id_token_hint and post_logout_redirect_uri from the stored user.
        await mgr.signoutRedirect();
    } catch (e) {
        console.error("Sign-out redirect failed", e);
        // Still drop local state so the app doesn't look signed in.
        await mgr.removeUser();
        window.location.assign("/");
    }
};

/**
 * Completes the code exchange on the callback page, then forwards the user to
 * wherever they were heading.
 */
export const handleRedirectCallback = async (): Promise<void> => {
    try {
        const user = await getUserManager().signinRedirectCallback();
        window.location.replace(safeReturnPath(user.state));
    } catch (e) {
        console.error("Sign-in callback failed", e);
        window.location.replace("/?auth-error");
    }
};
