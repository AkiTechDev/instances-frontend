import { query, redirect } from "@solidjs/router";
import { msalInstance } from "../components/app/Auth/MsalProvider";

const getToken = async (scopes: string[]) => {
    const account = msalInstance.getActiveAccount();
    if (!account) throw new Error("No active account");

    return msalInstance.acquireTokenSilent({
      scopes: scopes,
      account,
    })
}

export interface Instance {
    user_id: string,
    name: string,
    game: string,
}

export const getInstances = query(async (): Promise<Instance[]> => {
    console.log("GETTING INSTANCES");
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch("https://api.instances.aki-labs.com/instances/list", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });

    if (!resp.ok) throw new Error("Failed to fetch list of Instances");

    return (await resp.json()).map((instance: string) => {
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
    game: any
}

export interface InstanceEndpoint {
    endpoint: string,
}

export const getInstanceEndpoint = query(async (instance: Instance): Promise<string> => {
    console.log("GETTING INSTANCE ENDPOINT", instance);
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });

    if (!resp.ok) {
        throw redirect("/dashboard");
    }
    
    return (await resp.json() as InstanceEndpoint).endpoint;
}, "endpoint");

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
    console.log("Config", data);

    return data
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
    console.log("GETTING INSTANCE STATUS")
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

    if (!resp.ok) throw new Error("Instance not running", await resp.json());

    const data = await resp.json();

    return data as InstanceStatus
};

export const toggleInstance = async (endpoint: string, isRunning: boolean): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const uri = isRunning ? "stop" : "start";

    const resp = await fetch(`${endpoint}/${uri}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`
        }
    });
    const data = await resp.json();
    return data
};


export interface PostInstanceConfig {
    plan: string,
    cpu: number,
    memory: number,
    auto_start: boolean    
}

export const postInstanceConfig = async (endpoint: string, config: PostInstanceConfig): Promise<string> => {
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

    const data = await resp.json();
    console.log("Instance Config Update", data);

    return data["message"]
};


export const postGameConfig = async (endpoint: string, config: any): Promise<string> => {
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

    const data = await resp.json();
    console.log("Game Config Update", data);

    return data["message"]
};


export const postDownloadGameData = async (endpoint: string): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/download`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
        },
    });

    if (!resp.ok) throw new Error("Failed to request game data download");

    const data = await resp.json();
    console.log("Requested to Download Game data", data);

    return data["message"]
};

export const deleteInstance = async (instance: Instance): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token.accessToken}`,
        },
    });

    if (!resp.ok) throw new Error("Failed to delete instance");

    const data = await resp.json();
    console.log("Deleted Instance", data);

    return data["message"]
};


export interface PutCreateInstance {
    plan: string,
    auto_start: boolean,
    memory: number,
    cpu: number,
    region: string
};

export const putCreateInstance = async (game_id: string, instance_name: string, config: any): Promise<string> => {
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

    const data = await resp.json();
    console.log("Instance Created", data);

    return data["message"]
};