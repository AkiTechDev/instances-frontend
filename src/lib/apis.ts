import { query } from "@solidjs/router";
import { getToken } from "./auth";

interface GenericResonse {
    message: string
}

export interface Instance {
    user_id: string,
    name: string,
    game: string,
}

export const getInstances = query(async (): Promise<Instance[]> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch("https://api.instances.aki-labs.com/instances/list", {
        method: "GET",
        cache: "no-store", // disk-cache the list and a delete + recreate looks stale to the user
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });

    if (!resp.ok) throw new Error("Failed to fetch list of Instances");

    return (await resp.json() as string[]).map((instance: string) => {
        const parts = instance.split("/");
        return {
            user_id: parts[0],
            game: parts[1],
            name: parts[2]
        }
    })}, "instances");


export interface InstanceConfig {
    memory: number,
    cpu: number,
    plan: string
    domain: string,
    region: string,
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
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "GET",
        cache: "no-store", // 401 response when instance is delete, if created on same name, browser will return cache rather than ping pong
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
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
    const token = await getToken(["api://Instances/access"]);

    if (endpoint === undefined) {
        throw new Error("Invalid endpoint");
    };

    const resp = await fetch(`${endpoint}/config`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    const data = await resp.json();

    return data as InstanceConfig
}, "instanceConfig")

export interface InstanceStatus {
    ipv6: string,
    ipv4?: string,
    domain?: string,
}

export interface InstanceStatusBadRequest {
    code: string,
    message: string,
    details: null
}

export const getInstanceStatus = async (endpoint: string): Promise<InstanceStatus> => {
    const token = await getToken(["api://Instances/access"]);

    if (endpoint === undefined) {
        throw new Error("Invalid endpoint");
    };

    const resp = await fetch(`${endpoint}/status`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });

    const data = await resp.json();
    return data as InstanceStatus
};

export const toggleInstance = async (endpoint: string, isRunning: boolean): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const uri = isRunning ? "stop" : "start";

    const resp = await fetch(`${endpoint}/${uri}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });
    return await resp.json() as GenericResonse;
};


export interface PostInstanceConfig {
    plan: string,
    cpu: number,
    memory: number,
    auto_start: boolean    
}

export const postInstanceConfig = async (endpoint: string, config: PostInstanceConfig): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config/instance`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    return await resp.json();

};


export const postGameConfig = async (endpoint: string, config: any): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config/game`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to upload Game configuration");

    return await resp.json();
};


export const postDownloadGameData = async (endpoint: string): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/download`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
        },
    });

    if (!resp.ok) throw new Error("Failed to request game data download");

    return await resp.json();
};

export const deleteInstance = async (instance: Instance): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
        },
    });

    if (!resp.ok) throw new Error("Failed to delete instance");

    return await resp.json();

};


export interface PutCreateInstance {
    plan: string,
    auto_start: boolean,
    memory: number,
    cpu: number,
    region: string
};

export const putCreateInstance = async (game_id: string, instance_name: string, config: any): Promise<GenericResonse> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${game_id}/${instance_name}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to create Instance");

    return await resp.json();
};

export const getGames = query(async (): Promise<string[]> => {
    const resp = await fetch("https://api.instances.aki-labs.com/instances/types", {
        method: "GET",
    });

    if (!resp.ok) throw new Error("Failed to get supported Games");
    
    return await resp.json()
}, "supportedGames")
