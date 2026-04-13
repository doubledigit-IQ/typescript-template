import { NS } from "@ns";
import * as UTILS from "./UTILS";

export async function main(ns: NS): Promise<void> {
    function getRam(sScript: string, sServer: string) {
        return ns.getScriptRam(sScript, sServer);
    }

    function doExec(sScript: string, sServer: string, threads: number = 1, ...args: any) {
        return ns.exec(sScript, sServer, threads, ...args);
    }

    function deployAttackFile(oServers: UTILS.ServerData, sAttackFile: string) {
        for (let i = 0; i < Object.keys(oServers).length; i++) {
            const sServerToDeploy = Object.keys(oServers)[i];
            if (oServers[sServerToDeploy].bDeployServer) {
                if (sServerToDeploy !== "home") {
                    ns.rm(sAttackFile, sServerToDeploy);
                    ns.scp(sAttackFile, sServerToDeploy, "home");
                }
            }
        }
    }

    function deployToServers(oServers: UTILS.ServerData, nHomeRamBuffer: number, nDefaultPartitionSize: number) {
        for (let i = 0; i < Object.keys(oServers).length; i++) {
            const sServerToHack = Object.keys(oServers)[i];
            if (!oServers[sServerToHack].bHackable) {
                continue;
            }

            const nThreadsTotal = Math.floor(oServers[sServerToHack].nHackThreads) + 1;
            let nThreadsDeployed = 0;

            for (let j = 0; j < Object.keys(oServers).length; j++) {
                const sServerToDeploy = Object.keys(oServers)[j];
                if (!oServers[sServerToDeploy].bDeployable) {
                    continue;
                }

                let nMaxRam = oServers[sServerToDeploy].nMaxRam;
                let nRamAvailable = oServers[sServerToDeploy].nRamAvailable;
                const nScriptRam = getRam("attack.js", sServerToDeploy);
                if (nScriptRam === 0) {
                    continue;
                }

                if (sServerToDeploy === "home") {
                    nMaxRam -= nHomeRamBuffer;
                }

                nRamAvailable = Math.min(nMaxRam, nRamAvailable);
                if (nRamAvailable < nScriptRam) {
                    continue;
                }

                const nThreadsAvailable = Math.floor(nRamAvailable / nScriptRam);
                const nThreadsStillNeeded = nThreadsTotal - nThreadsDeployed;
                const nThreadsToRun = Math.min(nThreadsAvailable, nThreadsStillNeeded);

                // if (sServerToDeploy === "zb-institute") {
                //     ns.tprint("nRamAvailable " + nRamAvailable);
                //     ns.tprint("nScriptRam " + nScriptRam);
                //     ns.tprint("nThreadsTotal: " + nThreadsTotal);
                //     ns.tprint("nThreadsAvailable: " + nThreadsAvailable);
                //     ns.tprint("nThreadsStillNeeded: " + nThreadsStillNeeded);
                //     ns.tprint("nThreadsToRun: " + nThreadsToRun);
                // }

                nThreadsDeployed += nThreadsToRun;
                if (nThreadsToRun <= 0) {
                    continue;
                }

                var nPartitionSize = Math.floor(nThreadsToRun / 100);
                nPartitionSize = Math.max(nPartitionSize, nDefaultPartitionSize);

                var nFullPartitions = Math.floor(nThreadsToRun / nPartitionSize);
                var nRemainingThreads = nThreadsToRun % nPartitionSize;

                var aPartitions = [];
                for (let k = 0; k < nFullPartitions; k++) {
                    aPartitions.push(nPartitionSize);
                }
                if (nRemainingThreads > 0) {
                    aPartitions.push(nRemainingThreads);
                }

                const bHack = true;
                const bGrow = true;
                const bWeaken = true;
                const bShare = false;
                const bLoop = false;
                for (let k = 0; k < aPartitions.length; k++) {
                    var nPartitionThreads = aPartitions[k];
                    const nRET = doExec("attack.js", sServerToDeploy, nPartitionThreads, sServerToHack, bHack, bGrow, bWeaken, bShare, bLoop);
                    if (nRET <= 0) {
                        continue;
                    }
                }

                oServers[sServerToDeploy].nRamAvailable -= nThreadsToRun * nScriptRam;
                ns.tprint(`|\t${sServerToDeploy.padEnd(20)} is hacking ${sServerToHack.padEnd(20)} with ${String(nThreadsToRun).padStart(5)} threads`);
                if (nThreadsStillNeeded - nThreadsToRun <= 0) {
                    ns.tprint("finished branch " + sServerToHack);
                    ns.tprint("threads used: " + nThreadsDeployed);
                    ns.tprint("partitions used: " + aPartitions.length);
                }
            }
        }
        UTILS.writeDATA(ns, oServers);
        
    }

    const sAttackFile = "attack.js";
    let bFirstLoop = true;
    let bLoop = true;

    var nDefaultPartitionSize = 10;

    // doExec("hacknet.js", "home"); 
    doExec("DATA.js", "home");

    while (bLoop) {
        let nHomeRamBuffer = 0;
        nHomeRamBuffer += getRam("DATA.js", "home");
        nHomeRamBuffer += getRam("hacknet.js", "home");
        nHomeRamBuffer += getRam("UTILS.js", "home");
        nHomeRamBuffer += getRam("launch.js", "home");
        nHomeRamBuffer += getRam("sudokill.js", "home");

        // updates the oServers object

        // load updated data
        const oServers: UTILS.ServerData = await UTILS.readDATA(ns);
        if (bFirstLoop) {
            bFirstLoop = false;
            ns.tprint("deploying attack file " + sAttackFile);
            deployAttackFile(oServers, sAttackFile);
        }

        deployToServers(oServers, nHomeRamBuffer, nDefaultPartitionSize);
        await ns.sleep(5000);
    }
}
