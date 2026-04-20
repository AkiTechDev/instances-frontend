import { query, redirect } from "@solidjs/router";

export interface Instance {
    user_id: string,
    name: string,
    game: string,
}

export const getInstances = query(async (getToken: (scopes: string[]) => Promise<string>): Promise<Instance[]> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch("https://api.instances.aki-labs.com/instances/list", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
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

export const getInstanceEndpoint = query(async (getToken: (scopes: string[]) => Promise<string>, instance: Instance): Promise<InstanceEndpoint> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) {
        throw redirect("/instances-frontend/dashboard");
    }
    
    return await resp.json() as InstanceEndpoint;
}, "endpoint");

export const getInstanceConfig = query(async (getToken: (scopes: string[]) => Promise<string>, endpoint: string): Promise<InstanceConfig> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
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

export const getInstanceStatus = query(async (getToken: (scopes: string[]) => Promise<string>, endpoint: string): Promise<InstanceStatus | InstanceStatusBadRequest> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/status`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!resp.ok) return await resp.json() as InstanceStatusBadRequest;

    const data = await resp.json();
    console.log("Status", data);

    return data
}, "instanceStatus")

export const toggleInstance = async (getToken: (scopes: string[]) => Promise<string>, endpoint: string, isRunning: boolean): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const uri = isRunning ? "stop" : "start";

    const resp = await fetch(`${endpoint}/${uri}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
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

export const postInstanceConfig = async ( getToken: (scopes: string[]) => Promise<string>, endpoint: string, config: PostInstanceConfig): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config/instance`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to fetch Instance configuration");

    const data = await resp.json();
    console.log("Instance Config Update", data);

    return data["message"]
};


export const postGameConfig = async ( getToken: (scopes: string[]) => Promise<string>, endpoint: string, config: any): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/config/game`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to upload Game configuration");

    const data = await resp.json();
    console.log("Game Config Update", data);

    return data["message"]
};


export const postDownloadGameData = async ( getToken: (scopes: string[]) => Promise<string>, endpoint: string): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`${endpoint}/download`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!resp.ok) throw new Error("Failed to request game data download");

    const data = await resp.json();
    console.log("Requested to Download Game data", data);

    return data["message"]
};

export const deleteInstance = async ( getToken: (scopes: string[]) => Promise<string>, instance: Instance): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${instance.game}/${instance.name}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
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

export const putCreateInstance = async ( getToken: (scopes: string[]) => Promise<string>, game_id: string, instance_name: string, config: any): Promise<string> => {
    const token = await getToken(["api://Instances/access"]);
    const resp = await fetch(`https://api.instances.aki-labs.com/${game_id}/${instance_name}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
    });

    if (!resp.ok) throw new Error("Failed to create Instance");

    const data = await resp.json();
    console.log("Instance Created", data);

    return data["message"]
};