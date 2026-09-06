import { query } from "@solidjs/router";
import { getToken } from "./auth";
import { createLimiter } from "./concurrency";

/**
 * Control-plane base URL. Overridable via `PUBLIC_API_BASE` so a staging build
 * can point elsewhere without editing source; per-instance calls use the
 * gateway endpoint the control plane hands back instead.
 */
const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "https://api.instances.aki-labs.com";

interface GenericResponse {
    message: string
}

/** Bearer-auth headers, optionally with a JSON content type. */
const authHeaders = async (json = false): Promise<Record<string, string>> => ({
    "Authorization": `Bearer ${await getToken()}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
});

export interface Instance {
    user_id: string,
    name: string,
    game: string,
}

/**
 * The list arrives as "user_id/game/name" strings. Accepts a bare array or one
 * wrapped in the usual envelope keys; returns null only for a shape we don't
 * recognise at all.
 */
const asInstanceList = (data: unknown): string[] | null => {
    if (data === null || data === undefined) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "object") {
        for (const key of ["instances", "items", "Items", "data"]) {
            const value = (data as Record<string, unknown>)[key];
            if (Array.isArray(value)) return value;
        }
    }
    return null;
};

/** Drops anything that isn't a full user/game/name triple — a partial entry
 *  would render as a card linking to a route that doesn't exist. */
const parseInstance = (entry: unknown): Instance[] => {
    if (typeof entry !== "string") return [];
    const [user_id, game, name] = entry.split("/");
    if (!user_id || !game || !name) return [];
    return [{ user_id, game, name }];
};

export const getInstances = query(async (): Promise<Instance[]> => {
    const resp = await fetch(`${API_BASE}/instances/list`, {
        method: "GET",
        cache: "no-store", // disk-cache the list and a delete + recreate looks stale to the user
        headers: await authHeaders(),
    });

    // "You don't have any yet" is not a failure, and it doesn't only arrive as
    // `[]`: a brand-new account can come back as 404 (nothing to list), as 204
    // or an empty body, or as a JSON null. Every one of those has to reach the
    // dashboard's get-started screen, so none of them may throw — only a real
    // failure (auth, server, transport) does.
    if (resp.status === 404 || resp.status === 204) return [];

    if (!resp.ok) throw new Error(`Failed to fetch list of Instances (${resp.status})`);

    const raw = (await resp.text()).trim();
    if (!raw) return [];

    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error("Instance list response was not valid JSON");
    }

    const list = asInstanceList(data);
    if (!list) {
        // A 200 we can't read. An account with nothing in it is far likelier
        // than a broken control plane, and the get-started screen is the safe
        // thing to show — but leave a breadcrumb, since a contract change would
        // look exactly like this.
        console.warn("Unexpected instance list payload; treating as empty", data);
        return [];
    }

    return list.flatMap(parseInstance);
}, "instances");


export interface InstanceConfig {
    memory: number,
    cpu: number,
    plan: string
    domain: string,
    region: string,
    webhook_url?: string,
    game: any
}

export type ProvisioningStatus =
    | "creating" | "ready" | "updating" | "deleting"
    | "rolling_back" | "rolled_back" | "failed" | "gone" | "unknown";

interface ProvisioningEnvelope {
    region: string;
    raw_status: string;
    created_at: string;
    last_updated_at: string | null;
    elapsed_seconds: number;
}

export type InstanceState =
    | (ProvisioningEnvelope & { status: "creating";     message: string })
    | (ProvisioningEnvelope & { status: "ready";        endpoint: string })
    | (ProvisioningEnvelope & { status: "updating";     endpoint?: string; message: string })
    | (ProvisioningEnvelope & { status: "deleting";     message: string })
    | (ProvisioningEnvelope & { status: "rolling_back"; reason?: string; message: string })
    | (ProvisioningEnvelope & { status: "rolled_back";  reason?: string; recovery: "delete" })
    | (ProvisioningEnvelope & { status: "failed";       error: { failed_status: string; reason?: string }; recovery: "delete" | "contact_support" })
    | (ProvisioningEnvelope & { status: "gone";         message: string })
    | (ProvisioningEnvelope & { status: "unknown";      note: string });

export const getInstanceState = query(async (instance: Instance): Promise<InstanceState> => {
    const resp = await fetch(`${API_BASE}/${instance.game}/${instance.name}`, {
        method: "GET",
        cache: "no-store", // 401 response when instance is delete, if created on same name, browser will return cache rather than ping pong
        headers: await authHeaders(),
    });

    // 200/202/409/410 all carry a structured InstanceState body. Only auth/server errors throw.
    if (resp.status === 401 || resp.status === 403 || resp.status >= 500) {
        throw new Error(`Failed to fetch instance state (${resp.status})`);
    }
    return (await resp.json()) as InstanceState;
}, "instanceState");

export const endpointOf = (s: InstanceState | undefined): string | undefined => {
    if (!s) return undefined;
    if (s.status === "ready") return s.endpoint;
    if (s.status === "updating") return s.endpoint;
    return undefined;
};

export const getInstanceConfig = query(async (endpoint: string): Promise<InstanceConfig> => {
    if (endpoint === undefined) {
        throw new Error("Invalid endpoint");
    };

    const resp = await fetch(`${endpoint}/config`, {
        method: "GET",
        headers: await authHeaders(),
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    const data = await resp.json();

    return data as InstanceConfig
}, "instanceConfig")

export interface StatusError {
    code?: string,
    message?: string,
    details?: unknown,
}

// Runtime status of a provisioned instance's game server. The gateway encodes
// the lifecycle phase in the HTTP status code as well as the body, so we map
// each code to a tagged member instead of throwing — that lets the UI message
// every outcome (including forbidden / server fault) rather than blanking.
export type InstanceRuntimeStatus =
    | { state: "running";   health: string; ipv6: string; ipv4?: string; domain?: string } // 200
    | { state: "starting";  phase: string }                                                 // 202
    | { state: "stopping" }                                                                  // 503
    | { state: "stopped" }                                                                   // 409
    | { state: "forbidden"; error: StatusError }                                             // 403
    | { state: "error";     error: StatusError };                                            // 500 / unexpected

/**
 * Every dashboard card polls its own instance, so an account with a dozen
 * servers would otherwise open a dozen simultaneous status requests the moment
 * the list renders. Cap the burst — the queue drains in arrival order, and a
 * toggle's follow-up poll waits behind at most a few idle cards.
 *
 * The real fix is a batch status endpoint on the gateway; this bounds the
 * damage until that exists.
 */
const statusLimit = createLimiter(4);

export const getInstanceStatus = (endpoint: string): Promise<InstanceRuntimeStatus> =>
    statusLimit(async () => {
        let resp: Response;
        try {
            resp = await fetch(`${endpoint}/status`, {
                method: "GET",
                headers: await authHeaders(),
            });
        } catch {
            return { state: "error", error: { message: "Couldn't reach the instance" } };
        }

        const data = await resp.json().catch(() => null);

        switch (resp.status) {
            case 200: // running — body carries health + ipv6/ipv4?/domain?
            case 202: // starting — body carries phase
                return data as InstanceRuntimeStatus;
            case 409: return { state: "stopped" };
            case 503: return { state: "stopping" };
            case 403: return { state: "forbidden", error: (data ?? {}) as StatusError };
            default:  return { state: "error", error: (data ?? {}) as StatusError };
        }
    });

export const toggleInstance = async (endpoint: string, isRunning: boolean): Promise<GenericResponse> => {
    const uri = isRunning ? "stop" : "start";

    const resp = await fetch(`${endpoint}/${uri}`, {
        method: "GET",
        headers: await authHeaders(),
    });
    return await resp.json() as GenericResponse;
};


export interface PostInstanceConfig {
    plan: string,
    cpu: number,
    memory: number,
    auto_start: boolean,
    webhook_url?: string
}

export const postInstanceConfig = async (endpoint: string, config: PostInstanceConfig): Promise<GenericResponse> => {
    const resp = await fetch(`${endpoint}/config/instance`, {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error(`Failed to save Instance configuration (${resp.status})`);

    return await resp.json();

};


export const postGameConfig = async (endpoint: string, config: any): Promise<GenericResponse> => {
    const resp = await fetch(`${endpoint}/config/game`, {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to upload Game configuration");

    return await resp.json();
};


export const postDownloadGameData = async (endpoint: string): Promise<GenericResponse> => {
    const resp = await fetch(`${endpoint}/download`, {
        method: "POST",
        headers: await authHeaders(),
    });

    if (!resp.ok) throw new Error("Failed to request game data download");

    return await resp.json();
};

export const deleteInstance = async (instance: Instance): Promise<GenericResponse> => {
    const resp = await fetch(`${API_BASE}/${instance.game}/${instance.name}`, {
        method: "DELETE",
        headers: await authHeaders(),
    });

    if (!resp.ok) throw new Error("Failed to delete instance");

    return await resp.json();

};


export interface PutCreateInstance {
    plan: string,
    auto_start: boolean,
    memory: number,
    cpu: number,
    region: string,
    webhook_url?: string
};

export const putCreateInstance = async (game_id: string, instance_name: string, config: any): Promise<GenericResponse> => {
    const resp = await fetch(`${API_BASE}/${game_id}/${instance_name}`, {
        method: "PUT",
        headers: await authHeaders(true),
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to create Instance");

    return await resp.json();
};

export interface SurveyAnswer {
    /** Stable question key from the survey definition. */
    id: string,
    /** The wording the rater actually saw, stored so old responses stay readable. */
    question: string,
    /** 0–5 inclusive. */
    rating: number,
}

export interface SurveyResponse {
    /** Version of the question set these answers came from. */
    survey_id: string,
    submitted_at: string,
    answers: SurveyAnswer[],
    comment?: string,
    context: {
        /** Route the rater was on when they opened the survey. */
        path: string,
        user_agent: string,
    },
}

export const postSurvey = async (response: SurveyResponse): Promise<GenericResponse> => {
    const resp = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify(response)
    });

    if (!resp.ok) throw new Error(`Failed to submit feedback (${resp.status})`);

    // A bare 200/204 with no body is a perfectly good "received"; don't turn
    // that into a failure the rater has to retry.
    return (await resp.json().catch(() => ({ message: "ok" }))) as GenericResponse;
};

export const getGames = query(async (): Promise<string[]> => {
    const resp = await fetch(`${API_BASE}/instances/types`, {
        method: "GET",
    });

    if (!resp.ok) throw new Error("Failed to get supported Games");
    
    return await resp.json()
}, "supportedGames")
