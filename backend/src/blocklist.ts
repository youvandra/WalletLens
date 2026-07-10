// Known-malicious address registry for the risk screen (see screen_wallet).
//
// Same philosophy as labels.ts: the *mechanism* ships here; the data is seeded
// only with addresses we can actually verify. We never invent entries — a false
// "drainer" label is worse than none. Operators can extend the list at deploy
// time via the BLOCKLIST_ADDRESSES env var (comma-separated) without a rebuild.
//
// Note on scope: this screens whether the wallet *is* or *has transacted with* a
// flagged address. Detecting an unlimited-approval *amount* needs decoded call
// data (token approve args), which the X Layer tx-list endpoint does not return,
// so that is intentionally out of scope until we fetch raw input data.
import { config } from "./config.js";

function normalize(a: string): string {
  return (a || "").toLowerCase();
}

// Seed with verified known-malicious X Layer addresses as they are confirmed.
// Keys must be lowercase. Left empty on purpose rather than filled with guesses.
const SEED: string[] = [];

function buildBlocklist(): Set<string> {
  const set = new Set<string>();
  for (const a of SEED) set.add(normalize(a));
  for (const a of config.blocklistAddresses) {
    const n = normalize(a);
    if (n) set.add(n);
  }
  return set;
}

export const blocklist: Set<string> = buildBlocklist();

export function isBlocklisted(address: string): boolean {
  return blocklist.has(normalize(address));
}

// Return the unique flagged addresses among the candidates. Pure and set-
// injectable so it unit-tests without touching the module-level list.
export function findBlocklisted(
  candidates: string[],
  blocked: Set<string> = blocklist
): string[] {
  const hits = new Set<string>();
  for (const c of candidates) {
    const n = normalize(c);
    if (blocked.has(n)) hits.add(n);
  }
  return [...hits];
}
