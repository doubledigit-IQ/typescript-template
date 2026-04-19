import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    function myMoney() { 
        return ns.getServerMoneyAvailable("home");
    }
    var maxMoneyServerSpend: number = 100000000; 
    var nodes: number = 0;
    var ref: number = 0;
    ns.disableLog("ALL");
    while (true) {
		//sleep for second to prevent the loop from crashing the game
		await ns.sleep(1000);
		//buy a node if we have more than twice the money needed
        var purchaseCost: number = ns.hacknet.getPurchaseNodeCost();
		if (purchaseCost < myMoney() / 2 && purchaseCost < maxMoneyServerSpend) {
			ref = ns.hacknet.purchaseNode();
			ns.print("bought node hn-" + ref);
		}
		nodes = ns.hacknet.numNodes();
		for (var i = 0; i < nodes; i++) {
			//check if nodes level is a multiple of 10
			var mod: number = ns.hacknet.getNodeStats(i).level % 10;
			//buy level node to the nearest multiple of 10 if we have double the money needed
            var levelCost: number = ns.hacknet.getLevelUpgradeCost(i, 10 - mod);
			if (levelCost < myMoney() / 2) {
				ns.hacknet.upgradeLevel(i, 10 - mod);
				ns.print("node hn-" + i + " leveled up");
			}
			//same for ram
            var ramCost: number = ns.hacknet.getRamUpgradeCost(i);
			if (ramCost < myMoney() / 2) {
				ns.hacknet.upgradeRam(i);
				ns.print("node hn-" + i + " ram upgraded");
			}
			//and cores
            var coreCost: number = ns.hacknet.getCoreUpgradeCost(i);
			if (coreCost < myMoney() / 2) {
				ns.hacknet.upgradeCore(i);
				ns.print("node hn-" + i + " core upgraded");
			}
		}
	}
}