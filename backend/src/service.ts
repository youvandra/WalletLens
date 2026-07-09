// Shared wallet-profiling pipeline used by both the REST endpoint and the MCP
// server, so the analysis logic lives in exactly one place.
import { fetchFullWalletData } from "./fetcher.js";
import { analyzeWallet } from "./analyzer.js";
import { generatePersonality } from "./personality.js";
import { buildMarkdown } from "./renderer.js";
import type { WalletMetrics, WalletPersonality } from "./types.js";

export interface WalletProfileResult {
  address: string;
  metrics: WalletMetrics;
  personality?: WalletPersonality;
  markdown?: string;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Profile a wallet into structured metrics. The roast (personality + markdown)
// is a human-facing garnish and is only produced when explicitly requested —
// agents that just need the decision-grade data skip it.
export async function profileWallet(
  address: string,
  opts: { roast?: boolean } = {}
): Promise<WalletProfileResult> {
  if (!isValidAddress(address)) {
    throw new Error("Invalid address format. Must be a 0x-prefixed 42-char address.");
  }

  const data = await fetchFullWalletData(address);
  const metrics = await analyzeWallet(data);

  if (opts.roast) {
    const personality = await generatePersonality(metrics);
    const markdown = buildMarkdown(address, metrics, personality);
    return { address, metrics, personality, markdown };
  }

  return { address, metrics };
}
