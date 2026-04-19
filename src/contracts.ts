import { NS } from "@ns";

interface ContractData {
    file: string;
    server: string;
    type: string;
    data: unknown;
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    while (true) {
        const allServers = getAllServers(ns);
        // ns.tprint(`Found ${allServers.length} servers. Checking for contracts...`);
        const contracts = findAllContracts(ns, allServers);

        for (const contract of contracts) {
            const solution = solveContract(ns, contract);
            if (solution !== null) {
                const result = ns.codingcontract.attempt(solution, contract.file, contract.server);
                if (result) {
                    ns.tprint(`✓ Solved ${contract.type} on ${contract.server}: ${contract.file}`);
                    ns.tprint(`  Reward: ${result}`);
                } else {
                    ns.tprint(`✗ Failed ${contract.type} on ${contract.server}: ${contract.file}`);
                }
            }
        }

        await ns.sleep(10000); // Check every 10 seconds
    }
}

function getAllServers(ns: NS): string[] {
    const servers: string[] = [];
    const visited = new Set<string>();

    function scan(server: string) {
        if (visited.has(server)) return;
        visited.add(server);
        servers.push(server);

        const neighbors = ns.scan(server);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                scan(neighbor);
            }
        }
    }

    scan("home");
    return servers;
}

function findAllContracts(ns: NS, servers: string[]): ContractData[] {
    const contracts: ContractData[] = [];

    for (const server of servers) {
        const files = ns.ls(server);
        for (const file of files) {
            if (file.endsWith(".cct")) {
                const type = ns.codingcontract.getContractType(file, server);
                const data = ns.codingcontract.getData(file, server);
                contracts.push({ file, server, type, data });
            }
        }
    }

    return contracts;
}

function solveContract(ns: NS, contract: ContractData): unknown {
    switch (contract.type) {
        case "Find Largest Prime Factor":
            return findLargestPrimeFactor(contract.data as number);

        case "Subarray with Maximum Sum":
            return subarrayMaxSum(contract.data as number[]);

        case "Total Ways to Sum":
            return totalWaysToSum(contract.data as number);

        case "Spiralize Matrix":
            return spiralizeMatrix(contract.data as number[][]);

        case "Array Jumping Game":
            return arrayJumpingGame(contract.data as number[]);

        case "Merge Overlapping Intervals":
            return mergeOverlappingIntervals(contract.data as number[][]);

        case "Generate IP Addresses":
            return generateIPAddresses(contract.data as string);

        case "Algorithmic Stock Trader I":
            return stockTraderI(contract.data as number[]);

        case "Algorithmic Stock Trader II":
            return stockTraderII(contract.data as number[]);

        case "Algorithmic Stock Trader III":
            return stockTraderIII(contract.data as number[]);

        case "Algorithmic Stock Trader IV":
            return stockTraderIV(contract.data as [number, number[]]);

        case "Minimum Path Sum in a Triangle":
            return minPathSumTriangle(contract.data as number[][]);

        case "Unique Paths in a Grid I":
            return uniquePathsGridI(contract.data as [number, number]);

        case "Unique Paths in a Grid II":
            return uniquePathsGridII(contract.data as number[][]);

        case "Shortest Path in a Grid":
            return shortestPathGrid(contract.data as number[][]);

        case "Sanitize Parentheses in Expression":
            return sanitizeParentheses(contract.data as string);

        case "Find All Valid Math Expressions":
            return findValidMathExpressions(contract.data as [string, number]);

        case "HammingCodes: Integer to Encoded Binary":
            return hammingEncode(contract.data as number);

        case "HammingCodes: Encoded Binary to Integer":
            return hammingDecode(contract.data as string);

        case "Proper 2-Coloring of a Graph":
            return properGraphColoring(contract.data as [number, [number, number][]]);

        case "Compression I: RLE Compression":
            return rleCompress(contract.data as string);

        case "Compression II: LZ Decompression":
            return lzDecompress(contract.data as string);

        case "Compression III: LZ Compression":
            return lzCompress(contract.data as string);

        case "Encryption I: Caesar Cipher":
            return caesarDecipher(contract.data as [string, number]);

        case "Encryption II: Vigenère Cipher":
            return vigenereDecipher(contract.data as [string, string]);

        default:
            ns.tprint(`Unknown contract type: ${contract.type}`);
            return null;
    }
}

// ==================== SOLUTIONS ====================

function findLargestPrimeFactor(n: number): number {
    let factor = -1;
    for (let i = 2; i * i <= n; i++) {
        while (n % i === 0) {
            factor = i;
            n /= i;
        }
    }
    if (n > 1) factor = n;
    return factor;
}

function subarrayMaxSum(arr: number[]): number {
    let maxSum = arr[0];
    let currentSum = arr[0];
    for (let i = 1; i < arr.length; i++) {
        currentSum = Math.max(arr[i], currentSum + arr[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}

function totalWaysToSum(n: number): number {
    const dp = Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i < n; i++) {
        for (let j = i; j <= n; j++) {
            dp[j] += dp[j - i];
        }
    }
    return dp[n];
}

function spiralizeMatrix(matrix: number[][]): number[] {
    const result: number[] = [];
    let top = 0,
        bottom = matrix.length - 1,
        left = 0,
        right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        for (let i = left; i <= right; i++) {
            result.push(matrix[top][i]);
        }
        top++;

        for (let i = top; i <= bottom; i++) {
            result.push(matrix[i][right]);
        }
        right--;

        if (top <= bottom) {
            for (let i = right; i >= left; i--) {
                result.push(matrix[bottom][i]);
            }
            bottom--;
        }

        if (left <= right) {
            for (let i = bottom; i >= top; i--) {
                result.push(matrix[i][left]);
            }
            left++;
        }
    }
    return result;
}

function arrayJumpingGame(arr: number[]): 1 | 0 {
    let maxReach = 0;
    for (let i = 0; i < arr.length; i++) {
        if (i > maxReach) return 0;
        maxReach = Math.max(maxReach, i + arr[i]);
        if (maxReach >= arr.length - 1) return 1;
    }
    return 0;
}

function mergeOverlappingIntervals(intervals: number[][]): number[][] {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], intervals[i][1]);
        } else {
            merged.push(intervals[i]);
        }
    }
    return merged;
}

function generateIPAddresses(s: string): string[] {
    const result: string[] = [];

    function backtrack(start: number, path: string[], count: number) {
        if (count === 4) {
            if (start === s.length) {
                result.push(path.join("."));
            }
            return;
        }

        for (let i = 1; i <= 3 && start + i <= s.length; i++) {
            const part = s.substring(start, start + i);
            if (part[0] !== "0" || part === "0") {
                const num = parseInt(part);
                if (num <= 255) {
                    path.push(part);
                    backtrack(start + i, path, count + 1);
                    path.pop();
                }
            }
        }
    }

    backtrack(0, [], 0);
    return result;
}

function stockTraderI(prices: number[]): number {
    if (prices.length < 2) return 0;
    let maxProfit = 0;
    let minPrice = prices[0];
    for (let i = 1; i < prices.length; i++) {
        maxProfit = Math.max(maxProfit, prices[i] - minPrice);
        minPrice = Math.min(minPrice, prices[i]);
    }
    return maxProfit;
}

function stockTraderII(prices: number[]): number {
    let profit = 0;
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) {
            profit += prices[i] - prices[i - 1];
        }
    }
    return profit;
}

function stockTraderIII(prices: number[]): number {
    if (prices.length === 0) return 0;
    const n = prices.length;
    const leftProfit = Array(n).fill(0);
    const rightProfit = Array(n).fill(0);

    let minPrice = prices[0];
    for (let i = 1; i < n; i++) {
        minPrice = Math.min(minPrice, prices[i]);
        leftProfit[i] = Math.max(leftProfit[i - 1], prices[i] - minPrice);
    }

    let maxPrice = prices[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        maxPrice = Math.max(maxPrice, prices[i]);
        rightProfit[i] = Math.max(rightProfit[i + 1], maxPrice - prices[i]);
    }

    let maxProfit = 0;
    for (let i = 0; i < n; i++) {
        maxProfit = Math.max(maxProfit, leftProfit[i] + rightProfit[i]);
    }
    return maxProfit;
}

function stockTraderIV(data: [number, number[]]): number {
    const [k, prices] = data;
    if (prices.length < 2) return 0;

    if (2 * k >= prices.length) {
        return stockTraderII(prices);
    }

    const buy = Array(k + 1).fill(-Infinity);
    const sell = Array(k + 1).fill(0);

    for (const price of prices) {
        for (let j = k; j > 0; j--) {
            sell[j] = Math.max(sell[j], buy[j] + price);
            buy[j] = Math.max(buy[j], sell[j - 1] - price);
        }
    }

    return sell[k];
}

function minPathSumTriangle(triangle: number[][]): number {
    const dp = triangle.map(row => [...row]);
    for (let i = dp.length - 2; i >= 0; i--) {
        for (let j = 0; j < dp[i].length; j++) {
            dp[i][j] += Math.min(dp[i + 1][j], dp[i + 1][j + 1]);
        }
    }
    return dp[0][0];
}

function uniquePathsGridI(data: [number, number]): number {
    const [m, n] = data;
    const dp = Array(m)
        .fill(null)
        .map(() => Array(n).fill(1));
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }
    return dp[m - 1][n - 1];
}

function uniquePathsGridII(grid: number[][]): number {
    const m = grid.length;
    const n = grid[0].length;
    const dp = Array(m)
        .fill(null)
        .map(() => Array(n).fill(0));

    dp[0][0] = grid[0][0] === 1 ? 0 : 1;

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1) {
                dp[i][j] = 0;
            } else if (i === 0 && j === 0) {
                // already set
            } else if (i === 0) {
                dp[i][j] = dp[i][j - 1];
            } else if (j === 0) {
                dp[i][j] = dp[i - 1][j];
            } else {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }
    }
    return dp[m - 1][n - 1];
}

function shortestPathGrid(grid: number[][]): string {
    const m = grid.length;
    const n = grid[0].length;
    const directions: [number, number, string][] = [[0, 1, "R"], [1, 0, "D"], [0, -1, "L"], [-1, 0, "U"]];
    const queue: [number, number, string][] = [[0, 0, ""]];
    const visited = new Set<string>();
    visited.add("0,0");

    while (queue.length > 0) {
        const [x, y, path] = queue.shift()!;

        if (x === m - 1 && y === n - 1) {
            return path;
        }

        for (const [dx, dy, dir] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;

            if (nx >= 0 && nx < m && ny >= 0 && ny < n && !visited.has(key) && grid[nx][ny] === 0) {
                visited.add(key);
                queue.push([nx, ny, path + dir]);
            }
        }
    }

    return "";
}

function sanitizeParentheses(s: string): string[] {
    const result = new Set<string>();
    const queue = [s];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const current = queue.shift()!;
        visited.add(current);

        if (isValidParentheses(current)) {
            result.add(current);
        }

        for (let i = 0; i < current.length; i++) {
            if (current[i] === "(" || current[i] === ")") {
                const next = current.slice(0, i) + current.slice(i + 1);
                if (!visited.has(next)) {
                    queue.push(next);
                }
            }
        }
    }

    return Array.from(result).sort((a, b) => b.length - a.length);
}

function isValidParentheses(s: string): boolean {
    let count = 0;
    for (const char of s) {
        if (char === "(") count++;
        if (char === ")") count--;
        if (count < 0) return false;
    }
    return count === 0;
}

function findValidMathExpressions(data: [string, number]): string[] {
    const [numStr, target] = data;
    const results: string[] = [];

    function backtrack(index: number, expression: string, value: number, lastNum: number) {
        if (index === numStr.length) {
            if (value === target) {
                results.push(expression);
            }
            return;
        }

        for (let i = index + 1; i <= numStr.length; i++) {
            const numPart = numStr.substring(index, i);
            if (numPart.length > 1 && numPart[0] === "0") break;

            const num = parseInt(numPart);

            if (index === 0) {
                backtrack(i, numPart, num, num);
            } else {
                // Addition
                backtrack(i, expression + "+" + numPart, value + num, num);
                // Subtraction
                backtrack(i, expression + "-" + numPart, value - num, -num);
                // Multiplication
                backtrack(i, expression + "*" + numPart, value - lastNum + lastNum * num, lastNum * num);
            }
        }
    }

    backtrack(0, "", 0, 0);
    return results;
}

function hammingEncode(num: number): string {
    const binary = num.toString(2).padStart(8, "0");
    let encoded = "";
    const positions: number[] = [];

    for (let i = 0; i < binary.length; i++) {
        positions.push(parseInt(binary[i]));
    }

    let result = [0];
    for (let i = 0; i < positions.length; i++) {
        result.push(positions[i]);
    }

    // Calculate parity bits
    for (let i = 0; i < 4; i++) {
        const p = Math.pow(2, i);
        let parity = 0;
        for (let j = p; j < result.length; j += 2 * p) {
            for (let k = j; k < Math.min(j + p, result.length); k++) {
                parity ^= result[k];
            }
        }
        result[p] = parity;
    }

    return result.join("");
}

function hammingDecode(encoded: string): number {
    const bits = encoded.split("").map(Number);
    const n = bits.length;

    // Calculate syndrome
    let syndrome = 0;
    for (let i = 0; i < 4; i++) {
        const p = Math.pow(2, i);
        let parity = 0;
        for (let j = p; j < n; j += 2 * p) {
            for (let k = j; k < Math.min(j + p, n); k++) {
                parity ^= bits[k];
            }
        }
        if (parity !== 0) {
            syndrome += p;
        }
    }

    if (syndrome > 0) {
        bits[syndrome] ^= 1;
    }

    let result = "";
    for (let i = 1; i < n; i++) {
        if (Math.floor(Math.log2(i)) !== Math.log2(i)) {
            result += bits[i];
        }
    }

    return parseInt(result, 2);
}

function properGraphColoring(data: [number, [number, number][]]): 1 | 0 {
    const [n, edges] = data;
    const colors = Array(n).fill(-1);

    function isSafe(node: number, color: number): boolean {
        for (const [u, v] of edges) {
            if ((u === node && colors[v] === color) || (v === node && colors[u] === color)) {
                return false;
            }
        }
        return true;
    }

    function colorGraph(node: number): boolean {
        if (node === n) return true;

        for (let color = 0; color < 2; color++) {
            if (isSafe(node, color)) {
                colors[node] = color;
                if (colorGraph(node + 1)) return true;
                colors[node] = -1;
            }
        }
        return false;
    }

    return colorGraph(0) ? 1 : 0;
}

function rleCompress(s: string): string {
    let result = "";
    let count = 1;

    for (let i = 0; i < s.length; i++) {
        if (s[i] === s[i + 1]) {
            count++;
        } else {
            if (count > 1) {
                result += count + s[i];
            } else {
                result += s[i];
            }
            count = 1;
        }
    }

    return result;
}

function lzDecompress(s: string): string {
    let result = "";
    let i = 0;

    while (i < s.length) {
        const length = parseInt(s[i]);
        i++;

        if (length === 0) {
            result += s[i];
            i++;
        } else {
            const offset = parseInt(s[i]);
            i++;
            const startPos = result.length - offset;
            for (let j = 0; j < length; j++) {
                result += result[startPos + j];
            }
        }
    }

    return result;
}

function lzCompress(s: string): string {
    let result = "";
    let i = 0;

    while (i < s.length) {
        let maxLen = 0;
        let maxOffset = 0;

        for (let j = 1; j <= i; j++) {
            let len = 0;
            while (len < 9 && i + len < s.length && s[i + len] === s[i - j + len]) {
                len++;
            }

            if (len > maxLen) {
                maxLen = len;
                maxOffset = j;
            }
        }

        if (maxLen >= 2) {
            result += maxLen.toString() + maxOffset.toString();
            i += maxLen;
        } else {
            result += "0" + s[i];
            i++;
        }
    }

    return result;
}

function caesarDecipher(data: [string, number]): string {
    const [ciphertext, shift] = data;
    let result = "";

    for (const char of ciphertext) {
        if (char >= "A" && char <= "Z") {
            result += String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 2600) % 26) + 65);
        } else {
            result += char;
        }
    }

    return result;
}

function vigenereDecipher(data: [string, string]): string {
    const [ciphertext, key] = data;
    let result = "";
    let keyIndex = 0;

    for (const char of ciphertext) {
        if (char >= "A" && char <= "Z") {
            const shift = key.charCodeAt(keyIndex % key.length) - 65;
            result += String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 260) % 26) + 65);
            keyIndex++;
        } else {
            result += char;
        }
    }

    return result;
}
