# Copilot instructions for this Bitburner TypeScript workspace

## Project shape and runtime model
- This repo is a Bitburner script workspace: source in `src/`, transpiled output in `dist/` (configured by `tsconfig.json` + `filesync.json`).
- In-game execution uses compiled `.js` filenames (`launch.js`, `DATA.js`, `attack.js`), even though source files are `.ts`.
- `launch.ts` is the orchestrator: it starts `hacknet.js`, `DATA.js`, and `contracts.js`, then repeatedly reads shared state and deploys `attack.js` across servers.
- `DATA.ts` is the shared-state producer. It scans/discovers servers, computes metrics, opens ports/nukes, sorts by expected value, and writes `DATA.json`.
- `UTILS.ts` is the persistence boundary for `DATA.json` with retry loops for read/write consistency.

## Critical data flow (cross-file)
- `DATA.ts` -> writes `DATA.json` via `UTILS.writeDATA`.
- `launch.ts` -> reads `DATA.json` via `UTILS.readDATA`, allocates threads, and `ns.exec`s `attack.js` on deployable hosts.
- `attack.ts` -> worker primitive for `hack/grow/weaken/share` driven entirely by CLI args.
- Keep `ServerInfo`/`ServerData` in `UTILS.ts` as the source of truth when adding server fields.

## Build/sync workflow (what to run)
- Install deps: `npm i`.
- Main dev loop: `npm run watch`.
- `watch` runs:
  - `watch:init` (`build/init.js`) to ensure `dist/` exists,
  - `watch:transpile` (`tsc -w`),
  - `watch:local` (`build/watch.js`) to mirror allowed static files,
  - `watch:remote` (`bitburner-filesync`) to push to game.
- Remote File API settings come from `filesync.json` (notably `port: 12525`, `scriptsFolder: "dist"`, `allowedFiletypes`).

## Code conventions observed here
- Netscript entrypoints are `export async function main(ns: NS): Promise<void>`.
- Use the `@ns` type import pattern (`import { NS } from "@ns"`).
- Existing code commonly uses function declarations inside `main` and explicit loops over object keys.
- Internal imports are extensionless TypeScript paths (e.g., `./UTILS`, `./attack` style).
- Prefer minimal abstractions; this codebase is script-oriented and procedural.

## High-value edit targets
- For hacking orchestration changes, edit `src/launch.ts` and validate arg ordering with `src/attack.ts`.
- For server scoring/autohack behavior, edit `src/DATA.ts` and preserve `ServerData` compatibility.
- For coding contracts, extend the switch in `src/contracts.ts` and add a pure helper function per contract type.

## Practical guardrails for agents
- Do not rename script files casually; `ns.exec("<name>.js")` string calls are hard dependencies.
- Keep generated/runtime filenames aligned with existing `.js` references.
- No automated test suite is defined in `package.json`; validate by type-check/watch workflow and targeted script reasoning.
- Preserve file-sync assumptions (`dist/` output + allowed static extensions) when adding new assets.