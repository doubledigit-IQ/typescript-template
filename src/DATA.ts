import { NS } from "@ns";
import * as UTILS from "./UTILS";

export async function main(ns: NS): Promise<void> {
    function myMoney(): number {
        return ns.getServerMoneyAvailable("home");
    }

    function exe0(sServer: string): void {
        ns.nuke(sServer);
    }

    function exe1(sServer: string): void {
        ns.brutessh(sServer);
    }

    function exe2(sServer: string): void {
        ns.ftpcrack(sServer);
    }

    function exe3(sServer: string): void {
        ns.relaysmtp(sServer);
    }

    function exe4(sServer: string): void {
        ns.httpworm(sServer);
    }

    function exe5(sServer: string): void {
        ns.sqlinject(sServer);
    }

    function openPorts(sServer: string, oServers: UTILS.ServerData): number | null {
        if (ns.hasRootAccess(sServer)) {
            return 1;
        }

        const nPorts = oServers[sServer].nPorts;

        if (nPorts >= 5) {
            try {
                exe5(sServer);
            } catch {
                return null;
            }
        }

        if (nPorts >= 4) {
            try {
                exe4(sServer);
            } catch {
                return null;
            }
        }

        if (nPorts >= 3) {
            try {
                exe3(sServer);
            } catch {
                return null;
            }
        }

        if (nPorts >= 2) {
            try {
                exe2(sServer);
            } catch {
                return null;
            }
        }

        if (nPorts >= 1) {
            try {
                exe1(sServer);
            } catch {
                return null;
            }
        }

        if (nPorts >= 0) {
            try {
                exe0(sServer);
            } catch {
                return null;
            }
        }

        return 1;
    }

    function scanServers(): string[] {
        const aScannedServers: string[] = [];
        const aServers: string[] = ["home"];
        let bContinue = true;

        while (bContinue) {
            bContinue = false;
            for (let i = 0; i < aServers.length; i++) {
                const server = aServers[i];
                if (aScannedServers.indexOf(server) === -1) {
                    bContinue = true;
                    aScannedServers.push(server);
                    const aFoundServers = ns.scan(server);
                    for (let j = 0; j < aFoundServers.length; j++) {
                        const foundServer = aFoundServers[j];
                        if (aServers.indexOf(foundServer) === -1) {
                            aServers.push(foundServer);
                        }
                    }
                }
            }
        }

        return aServers;
    }

    function getServerData(aServers: string[]): UTILS.ServerData {
        const oServers: UTILS.ServerData = {};

        for (let i = 0; i < aServers.length; i++) {
            const server = aServers[i];
            if (ns.serverExists(server)) {
                const nMaxMoney = ns.getServerMaxMoney(server);
                const nMoneyAvailable = ns.getServerMoneyAvailable(server);
                const nMaxRam = ns.getServerMaxRam(server);
                const nUsedRam = ns.getServerUsedRam(server);
                const nPorts = ns.getServerNumPortsRequired(server);
                const nHackingLevel = ns.getServerRequiredHackingLevel(server);
                const nMinSecurity = ns.getServerMinSecurityLevel(server);
                const nSecurity = ns.getServerSecurityLevel(server);
                const nHackChance = ns.hackAnalyzeChance(server);
                const nRamAvailable = nMaxRam - nUsedRam;
                const nHackThreads = ns.hackAnalyzeThreads(server, nMoneyAvailable);
                let nHackSecurity = -1;
                let nEVperThread = -1;

                if (nHackThreads > 0) {
                    nHackSecurity = ns.hackAnalyzeSecurity(nHackThreads, server);
                    nEVperThread = (nHackChance * nMoneyAvailable) / nHackThreads;
                }

                oServers[server] = {
                    bDeployServer: nMaxRam > 0,
                    bDeployable: nMaxRam > 0,
                    bHackServer: nMaxMoney > 0,
                    bHackable: nMaxMoney > 0,
                    nMaxMoney: nMaxMoney,
                    nMoneyAvailable: nMoneyAvailable,
                    nMaxRam: nMaxRam,
                    nUsedRam: nUsedRam,
                    nPorts: nPorts,
                    nHackingLevel: nHackingLevel,
                    nMinSecurity: nMinSecurity,
                    nHackChance: nHackChance,
                    nRamAvailable: nRamAvailable,
                    nHackSecurity: nHackSecurity,
                    nSecurity: nSecurity,
                    nHackThreads: nHackThreads,
                    nEVperThread: nEVperThread,
                };
            }
        }

        return oServers;
    }

    function sortServerData(oServers: UTILS.ServerData): UTILS.ServerData {
        return Object.fromEntries(
            Object.entries(oServers).sort(([, a], [, b]) => b.nEVperThread - a.nEVperThread)
        );
    }

    function autohack(oServers: UTILS.ServerData): UTILS.ServerData {
        for (let i = 0; i < Object.keys(oServers).length; i++) {
            const sServer = Object.keys(oServers)[i];
            const ret = openPorts(sServer, oServers);
            const nPlayerHackingLevel = ns.getHackingLevel();
            const bHackable = oServers[sServer].bHackable && nPlayerHackingLevel >= oServers[sServer].nHackingLevel;
            const bDeployable = oServers[sServer].bDeployable;

            if (ret != null) {
                oServers[sServer].bHackable = bHackable;
                oServers[sServer].bDeployable = bDeployable;
            } else {
                oServers[sServer].bHackable = false;
                oServers[sServer].bDeployable = false;
            }
        }

        return oServers;
    }

    function buyServers(): void {
        const nMaxServers = ns.getPurchasedServerLimit();

        for (let i = 0; i < nMaxServers; i++) {
            const sServer = `server-${i}`;
            if (!ns.serverExists(sServer)) {
                var success = ns.purchaseServer(sServer, 2);
                if (success.length > 0) {
                    ns.tprint("purchased server " + sServer + " " + success);
                }
            }
            else {
                const nServerCurrentRam = ns.getServerMaxRam(sServer);
                const nUpgradeCost = ns.getPurchasedServerUpgradeCost(sServer, 2 * nServerCurrentRam);
                if (nUpgradeCost < myMoney() / 2) {
                    ns.upgradePurchasedServer(sServer, 2 * nServerCurrentRam);
                    ns.tprint("upgraded server " + sServer + " for " + nUpgradeCost);
                }
            }
        }
    }

    while (true) {
        buyServers();
        const aServers: string[] = scanServers();
        let oServers: UTILS.ServerData = getServerData(aServers);
        oServers = autohack(oServers);
        oServers = sortServerData(oServers);
        UTILS.writeDATA(ns, oServers);
        await ns.sleep(5000);
    }
}
