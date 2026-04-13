import { NS } from "@ns";
const SERVERS_FILE = "DATA.json";

export interface ServerInfo {
    bDeployServer: boolean; // deploy server
    bDeployable: boolean; // server can have scripts deployed
    bHackServer: boolean; // hack server
    bHackable: boolean; // server can be hacked
    nMaxMoney: number; // server max money
    nMoneyAvailable: number; // server money available
    nMaxRam: number; // server max RAM
    nUsedRam: number; // server used RAM
    nPorts: number; // server required open ports
    nHackingLevel: number; // server required hacking level
    nMinSecurity: number; // server minimum security level
    nHackChance: number; // server hack chance
    nRamAvailable: number; // server RAM available
    nHackSecurity: number; // server security increase from hacking
    nSecurity: number; // security level
    nHackThreads: number; // threads needed to hack all money available
    nEVperThread: number; // expected value per hack thread, calculated as hack chance * money available / hack threads
    // Add more properties as needed
}

export interface ServerData {
    [serverName: string]: ServerInfo;
}

export async function readDATA(ns: NS): Promise<ServerData> {
    const retryDelayMs = 10;
    const maxAttempts = 1000; 
    let attempts = 0;

    while (true) {
        attempts += 1;
        const rawData = ns.read(SERVERS_FILE);
        if (rawData.length > 0) {
            try {
                return JSON.parse(rawData);
            } catch (e) {
                ns.tprint(`Error: Failed to parse ${SERVERS_FILE} on attempt ${attempts}. Retrying...`);
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error(`Unable to read and parse ${SERVERS_FILE} after ${attempts} attempts.`);
        }

        await ns.sleep(retryDelayMs);
    }
}

export async function writeDATA(ns: NS, servers: ServerData): Promise<void> {
    const retryDelayMs = 10;
    const maxAttempts = 1000;
    let attempts = 0;
    const content = JSON.stringify(servers, null, 2);

    while (true) {
        attempts += 1;
        ns.write(SERVERS_FILE, content, "w");
        const verifyData = ns.read(SERVERS_FILE);
        if (verifyData === content) {
            return;
        }

        if (attempts >= maxAttempts) {
            throw new Error(`Unable to write ${SERVERS_FILE} after ${attempts} attempts.`);
        }

        await ns.sleep(retryDelayMs);
    }
}

