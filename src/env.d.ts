/// <reference types="astro/client" />

interface ImportMetaEnv {
    /** Zitadel instance base URL, e.g. https://your-instance.zitadel.cloud */
    readonly PUBLIC_ZITADEL_AUTHORITY: string;
    /** Client id of the Zitadel User Agent application. */
    readonly PUBLIC_ZITADEL_CLIENT_ID: string;
    /** Project owning the Instances API — added to the access token audience. */
    readonly PUBLIC_ZITADEL_PROJECT_ID: string;
    /** Control-plane base URL. Defaults to production when unset. */
    readonly PUBLIC_API_BASE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
