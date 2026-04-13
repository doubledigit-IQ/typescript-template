import { NS } from "@ns";
 
export async function main(ns: NS): Promise<void> {
  var sServerToAttack: string = String(ns.args[0]);
  var bHack: boolean = Boolean(ns.args[1]);
  var bGrow: boolean = Boolean(ns.args[2]);
  var bWeaken: boolean = Boolean(ns.args[3]);
  var bLoop: boolean = Boolean(ns.args[4]);
  do {
    if (bHack) {
      await ns.hack(sServerToAttack);
    }
    if (bGrow) {
      await ns.grow(sServerToAttack);
    }
    if (bWeaken) {
      await ns.weaken(sServerToAttack);
    }
  } while (bLoop);
}
