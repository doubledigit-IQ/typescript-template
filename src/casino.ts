import { NS } from "@ns";
import * as UTILS from "./UTILS";

export async function main(ns: NS): Promise<void> {
    Math.floor = (number) => { return 1 };
    Math.random = () => { return 0 };
    // Math.log = (number) => { return Math.log10(Math.log10(number)); }; 
}