import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    Math.random = () => { return 0.001 };
    // const originalMathLog = Math.log;

    // Math.log = (number) => { return number; };

    // await ns.sleep(7000);

    // Math.log = originalMathLog;
}