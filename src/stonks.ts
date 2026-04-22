import { NS } from "@ns";

// ── Tunable constants ────────────────────────────────────────────────────────
const COMMISSION = 100_000;   // flat fee per transaction
const LONG_THRESHOLD = 0.53;      // forecast > this → open long
const SHORT_THRESHOLD = 0.47;      // forecast < this → open short
const EXIT_LONG_AT = 0.50;      // close long when forecast falls here
const EXIT_SHORT_AT = 0.50;      // close short when forecast rises here
const MIN_RETURN = 0.001;     // minimum expected return to justify entry
const CASH_RESERVE_PCT = 0.05;      // keep 5 % of total equity as cash
const MAX_POSITION_PCT = 0.20;      // max 20 % of portfolio equity per symbol
const ENABLE_LONG = true;      // trade long positions
const ENABLE_SHORT = false;     // trade short positions
// ────────────────────────────────────────────────────────────────────────────

interface Position { long: number; longAvg: number; short: number; shortAvg: number; }

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const syms = ns.stock.getSymbols();
    let realizedGain = 0;

    while (true) {
        // ── 1. Sell / exit phase ─────────────────────────────────────────────
        for (const sym of syms) {
            const pos = getPos(ns, sym);
            const fc = ns.stock.getForecast(sym);

            if (pos.long > 0 && fc <= EXIT_LONG_AT) {
                const proceeds = ns.stock.sellStock(sym, pos.long);
                const pnl = (proceeds - pos.longAvg) * pos.long - COMMISSION;
                realizedGain += pnl;
                ns.print(`📉 EXIT LONG  ${sym.padEnd(5)}  ${fmtN(pos.long)} shares  P&L ${fmtDollar(pnl)}`);
            }

            if (ENABLE_SHORT && pos.short > 0 && fc >= EXIT_SHORT_AT) {
                const cover = ns.stock.sellShort(sym, pos.short);
                const pnl = (pos.shortAvg - cover) * pos.short - COMMISSION;
                realizedGain += pnl;
                ns.print(`📈 EXIT SHORT ${sym.padEnd(5)}  ${fmtN(pos.short)} shares  P&L ${fmtDollar(pnl)}`);
            }
        }

        // ── 2. Size budget after sells ───────────────────────────────────────
        const cash = ns.getServerMoneyAvailable("home");
        const equity = cash + portfolioValue(ns, syms);
        const deployable = cash - equity * CASH_RESERVE_PCT;

        // ── 3. Rank opportunities by signal strength ─────────────────────────
        const candidates = syms.map(sym => ({
            sym,
            fc: ns.stock.getForecast(sym),
            vol: ns.stock.getVolatility(sym),
            ask: ns.stock.getAskPrice(sym),
            bid: ns.stock.getBidPrice(sym),
            maxShares: ns.stock.getMaxShares(sym),
            pos: getPos(ns, sym),
        }));

        // Debug: show why each symbol is skipped
        for (const { sym, fc, pos } of candidates) {
            const wantLong = ENABLE_LONG && fc > LONG_THRESHOLD && pos.long === 0;
            const wantShort = ENABLE_SHORT && fc < SHORT_THRESHOLD && pos.short === 0;
            if (!wantLong && !wantShort) {
                const reason = pos.long > 0 ? "already long" : pos.short > 0 ? "already short" : `fc=${pct(fc)} (need >${pct(LONG_THRESHOLD)} or <${pct(SHORT_THRESHOLD)})`;
                ns.print(`⏭  SKIP ${sym.padEnd(5)}  ${reason}`);
            }
        }

        const ranked = candidates
            .filter(({ fc, pos }) =>
                (ENABLE_LONG && fc > LONG_THRESHOLD && pos.long === 0) ||
                (ENABLE_SHORT && fc < SHORT_THRESHOLD && pos.short === 0)
            )
            .sort((a, b) => Math.abs(b.fc - 0.5) - Math.abs(a.fc - 0.5));

        // ── 4. Buy / enter phase ─────────────────────────────────────────────
        let budget = deployable;

        for (const { sym, fc, vol, ask, bid, maxShares, pos } of ranked) {
            if (budget < COMMISSION * 4) break;

            const alloc = Math.min(budget, equity * MAX_POSITION_PCT);

            if (ENABLE_LONG && fc > LONG_THRESHOLD && pos.long === 0) {
                const expectedReturn = (fc - 0.5) * 2 * vol;
                if (expectedReturn < MIN_RETURN) continue;

                const shares = Math.min(Math.floor(alloc / ask), maxShares);
                if (shares <= 0) continue;

                const cost = ns.stock.getPurchaseCost(sym, shares, "Long");
                if (cost > budget) continue;

                const fill = ns.stock.buyStock(sym, shares);
                if (fill > 0) {
                    ns.print(`🟢 BUY LONG  ${sym.padEnd(5)}  ${fmtN(shares)} @ ${fmtDollar(fill)}  fc=${pct(fc)}`);
                    budget -= cost;
                }

            } else if (ENABLE_SHORT && fc < SHORT_THRESHOLD && pos.short === 0) {
                const expectedReturn = (0.5 - fc) * 2 * vol;
                if (expectedReturn < MIN_RETURN) continue;

                const shares = Math.min(Math.floor(alloc / bid), maxShares);
                if (shares <= 0) continue;

                const cost = ns.stock.getPurchaseCost(sym, shares, "Short");
                if (cost > budget) continue;

                const fill = ns.stock.buyShort(sym, shares);
                if (fill > 0) {
                    ns.print(`🔴 BUY SHORT ${sym.padEnd(5)}  ${fmtN(shares)} @ ${fmtDollar(fill)}  fc=${pct(fc)}`);
                    budget -= cost;
                }
            }
        }

        // ── 5. Status dashboard ──────────────────────────────────────────────
        const newCash = ns.getServerMoneyAvailable("home");
        const newEquity = newCash + portfolioValue(ns, syms);

        const totalNetGain = syms.reduce((sum, sym) => {
            const pos = getPos(ns, sym);
            if (pos.long > 0) {
                sum += (ns.stock.getBidPrice(sym) - pos.longAvg) * pos.long - COMMISSION;
            }
            if (pos.short > 0) {
                sum += (pos.shortAvg - ns.stock.getAskPrice(sym)) * pos.short - COMMISSION;
            }
            return sum;
        }, 0);

        ns.clearLog();
        ns.print(`╔${'═'.repeat(W)}╗`);
        const _label = `  67 STONKS BOT`;
        const _time = new Date().toLocaleTimeString();
        const _gap = ' '.repeat(Math.max(0, W - _label.length - _time.length));
        ns.print(row(_label + _gap + _time));
        ns.print(`╠${'═'.repeat(W)}╣`);
        ns.print(row(`  Cash        ${fmtDollar(newCash).padStart(18)}`));
        ns.print(row(`  Portfolio   ${fmtDollar(newEquity - newCash).padStart(18)}`));
        ns.print(row(`  Total       ${fmtDollar(newEquity).padStart(18)}`));
        ns.print(row(`  Net Gain    ${fmtDollar(totalNetGain + realizedGain).padStart(18)}`));
        ns.print(`╠${'═'.repeat(W)}╣`);
        ns.print(row(`  ${'SYM'.padEnd(9)} ${'SHARES'.padStart(11)}  ${'RETURN'.padStart(8)}  ${'P&L'.padStart(11)}  FORECAST`));

        const open = syms
            .map(sym => {
                const pos = getPos(ns, sym);
                const bid = ns.stock.getBidPrice(sym);
                const ask = ns.stock.getAskPrice(sym);
                const fc  = ns.stock.getForecast(sym);
                const longPnl  = pos.long  > 0 ? (bid - pos.longAvg)   * pos.long  - COMMISSION : -Infinity;
                const shortPnl = pos.short > 0 ? (pos.shortAvg - ask)  * pos.short - COMMISSION : -Infinity;
                const totalReturn = Math.max(longPnl, shortPnl);
                return { sym, pos, fc, bid, ask, totalReturn };
            })
            .filter(({ pos }) => pos.long > 0 || pos.short > 0)
            .sort((a, b) => b.totalReturn - a.totalReturn)
            .slice(0, 4);

        if (open.length === 0) {
            ns.print(row(`  (no open positions)`));
        }

        for (const { sym, pos, fc, bid, ask } of open) {
            if (pos.long > 0) {
                const pnl = (bid - pos.longAvg) * pos.long - COMMISSION;
                const ret = ((bid - pos.longAvg) / pos.longAvg * 100).toFixed(1);
                ns.print(row(`  [L] ${sym.padEnd(5)} ${fmtN(pos.long).padStart(11)}  ${ret.padStart(7)}%  ${fmtDollar(pnl).padStart(11)}  fc=${pct(fc)}`));
            }
            if (ENABLE_SHORT && pos.short > 0) {
                const pnl = (pos.shortAvg - ask) * pos.short - COMMISSION;
                const ret = ((pos.shortAvg - ask) / pos.shortAvg * 100).toFixed(1);
                ns.print(row(`  [S] ${sym.padEnd(5)} ${fmtN(pos.short).padStart(11)}  ${ret.padStart(7)}%  ${fmtDollar(pnl).padStart(11)}  fc=${pct(fc)}`));
            }
        }

        ns.print(`╚${'═'.repeat(W)}╝`);

        await ns.stock.nextUpdate();
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPos(ns: NS, sym: string): Position {
    const [long, longAvg, short, shortAvg] = ns.stock.getPosition(sym);
    return { long, longAvg, short, shortAvg };
}

/** Mark-to-market value of all open positions. */
function portfolioValue(ns: NS, syms: string[]): number {
    let total = 0;
    for (const sym of syms) {
        const { long, longAvg, short, shortAvg } = getPos(ns, sym);
        if (long > 0) total += ns.stock.getBidPrice(sym) * long;
        if (short > 0) {
            // Short value = initial outlay + unrealised P&L
            const ask = ns.stock.getAskPrice(sym);
            total += shortAvg * short + (shortAvg - ask) * short;
        }
    }
    return total;
}

function fmtDollar(n: number): string {
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + "t";
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + "b";
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(2) + "m";
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(2) + "k";
    return sign + abs.toFixed(0);
}

function fmtN(n: number): string { return n.toLocaleString(); }
function pct(f: number): string { return (f * 100).toFixed(1) + "%"; }
const W = 60;
/** Pad content to W chars and wrap with ║ borders. */
function row(content: string): string { return `║${content.padEnd(W)}║`; }

