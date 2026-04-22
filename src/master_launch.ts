import { NS } from "@ns";
import * as UTILS from "./UTILS";

type PositionBias = "long" | "short";

interface HeldTarget {
    sym: string;
    org: string;
    server: string;
    bias: PositionBias;
}

interface DeployHost {
    host: string;
    threadsAvailable: number;
}

export async function main(ns: NS): Promise<void> {
    const ATTACK_SCRIPT = "attack.js";
    const DATA_SCRIPT = "DATA.js";
    const HACKNET_SCRIPT = "hacknet.js";
    const STONKS_SCRIPT = "stonks.js";

    const THREADS_PER_TARGET = Number(ns.args[0] ?? 200);

    ns.disableLog("ALL");

    function getRam(script: string, host: string): number {
        return ns.getScriptRam(script, host);
    }

    function serverExists(server: string): boolean {
        return ns.serverExists(server);
    }

    function doExec(script: string, host: string, threads: number = 1, ...args: (string | number | boolean)[]): number {
        return ns.exec(script, host, threads, ...args);
    }

    function ensureRunning(script: string, host: string): void {
        if (!ns.scriptRunning(script, host)) {
            doExec(script, host);
        }
    }

    function scanAllServers(): string[] {
        const seen = new Set<string>();
        const queue: string[] = ["home"];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current == null || seen.has(current)) {
                continue;
            }

            seen.add(current);
            const neighbors = ns.scan(current);
            for (let i = 0; i < neighbors.length; i++) {
                const next = neighbors[i];
                if (!seen.has(next)) {
                    queue.push(next);
                }
            }
        }

        return Array.from(seen);
    }

    function buildOrgToServerMap(allServers: string[]): Record<string, string> {
        const orgToServer: Record<string, string> = {};

        for (let i = 0; i < allServers.length; i++) {
            const serverName = allServers[i];
            const server = ns.getServer(serverName);
            const orgName = server.organizationName;
            if (orgName.length === 0) {
                continue;
            }

            if (!(orgName in orgToServer)) {
                orgToServer[orgName] = serverName;
                continue;
            }

            const currentMapped = orgToServer[orgName];
            const currentMoney = ns.getServerMaxMoney(currentMapped);
            const candidateMoney = ns.getServerMaxMoney(serverName);
            if (candidateMoney > currentMoney) {
                orgToServer[orgName] = serverName;
            }
        }

        return orgToServer;
    }

    function getHeldTargets(orgToServer: Record<string, string>, oServers: UTILS.ServerData): HeldTarget[] {
        const targets: HeldTarget[] = [];
        const symbols = ns.stock.getSymbols();

        for (let i = 0; i < symbols.length; i++) {
            const sym = symbols[i];
            const [longShares, , shortShares] = ns.stock.getPosition(sym);
            if (longShares <= 0 && shortShares <= 0) {
                continue;
            }

            const org = ns.stock.getOrganization(sym);
            const mappedServer = orgToServer[org];
            if (mappedServer == null || !serverExists(mappedServer)) {
                continue;
            }

            if (!(mappedServer in oServers) || !oServers[mappedServer].bHackable) {
                continue;
            }

            if (longShares > 0) {
                targets.push({ sym, org, server: mappedServer, bias: "long" });
            }
            if (shortShares > 0) {
                targets.push({ sym, org, server: mappedServer, bias: "short" });
            }
        }

        return targets;
    }

    function deployAttackFile(oServers: UTILS.ServerData): void {
        for (let i = 0; i < Object.keys(oServers).length; i++) {
            const host = Object.keys(oServers)[i];
            if (!serverExists(host)) {
                continue;
            }
            if (!oServers[host].bDeployServer) {
                continue;
            }
            if (host === "home") {
                continue;
            }

            ns.rm(ATTACK_SCRIPT, host);
            ns.scp(ATTACK_SCRIPT, host, "home");
        }
    }

    function getDeployHosts(oServers: UTILS.ServerData, homeReserveRam: number): DeployHost[] {
        const hosts: DeployHost[] = [];

        for (let i = 0; i < Object.keys(oServers).length; i++) {
            const host = Object.keys(oServers)[i];
            if (!(host in oServers) || !oServers[host].bDeployable || !serverExists(host)) {
                continue;
            }

            const scriptRam = getRam(ATTACK_SCRIPT, host);
            if (scriptRam <= 0) {
                continue;
            }

            let maxRam = oServers[host].nMaxRam;
            if (host === "home") {
                maxRam = Math.max(0, maxRam - homeReserveRam);
            }

            const ramAvailableNow = Math.min(maxRam, Math.max(0, oServers[host].nRamAvailable));
            const threadsAvailable = Math.floor(ramAvailableNow / scriptRam);
            if (threadsAvailable <= 0) {
                continue;
            }

            hosts.push({ host, threadsAvailable });
        }

        return hosts;
    }

    function runStockPressure(oServers: UTILS.ServerData, orgToServer: Record<string, string>): void {
        const targets = getHeldTargets(orgToServer, oServers);
        if (targets.length === 0) {
            return;
        }

        let homeReserveRam = 0;
        homeReserveRam += getRam(DATA_SCRIPT, "home");
        homeReserveRam += getRam(HACKNET_SCRIPT, "home");
        homeReserveRam += getRam(STONKS_SCRIPT, "home");
        homeReserveRam += getRam("UTILS.js", "home");
        homeReserveRam += getRam("master_launch.js", "home");

        const hosts = getDeployHosts(oServers, homeReserveRam);
        if (hosts.length === 0) {
            return;
        }

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            let threadsNeeded = THREADS_PER_TARGET;

            for (let j = 0; j < hosts.length && threadsNeeded > 0; j++) {
                const deploy = hosts[j];
                if (deploy.threadsAvailable <= 0) {
                    continue;
                }

                const threads = Math.min(deploy.threadsAvailable, threadsNeeded);
                const bHack = target.bias === "short";
                const bGrow = target.bias === "long";
                const bWeaken = true;
                const bShare = false;
                const bLoop = false;

                const pid = doExec(
                    ATTACK_SCRIPT,
                    deploy.host,
                    threads,
                    target.server,
                    bHack,
                    bGrow,
                    bWeaken,
                    bShare,
                    bLoop,
                );

                if (pid > 0) {
                    deploy.threadsAvailable -= threads;
                    threadsNeeded -= threads;
                }
            }
        }
    }

    let firstLoop = true;
    let orgToServer = buildOrgToServerMap(scanAllServers());

    while (true) {
        ensureRunning(HACKNET_SCRIPT, "home");
        ensureRunning(DATA_SCRIPT, "home");
        ensureRunning(STONKS_SCRIPT, "home");

        const oServers = await UTILS.readDATA(ns);

        if (firstLoop) {
            firstLoop = false;
            deployAttackFile(oServers);
        }

        runStockPressure(oServers, orgToServer);

        await ns.stock.nextUpdate();
        orgToServer = buildOrgToServerMap(scanAllServers());
    }
}
