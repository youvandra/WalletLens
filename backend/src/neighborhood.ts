// 1-hop neighborhood risk — the pure logic behind the expand_risk tool.
//
// Every screen looks AT a wallet; this looks AROUND it: who it sends to, who
// funds it, and how risky that circle is. Verified infrastructure contracts
// (known tokens from labels.ts) are excluded — holding USDC is not a
// relationship with a counterparty.
import type { Counterparty } from "./types.js";
import type { RiskLevel } from "./risk.js";

export type Relation = "receives-from-target" | "sends-to-target" | "both";

export interface NeighborPick {
  address: string;
  label: string;
  relation: Relation;
  txCount: number;
}

// Merge the target's outbound recipients and inbound senders into one deduped,
// most-transacted-first neighbor list. `skip` filters known infrastructure.
export function pickNeighbors(
  outbound: Counterparty[],
  inbound: Counterparty[],
  opts: { max: number; skip: (address: string) => boolean }
): { neighbors: NeighborPick[]; skippedKnown: string[] } {
  const merged = new Map<string, NeighborPick>();
  const skippedKnown: string[] = [];

  const add = (c: Counterparty, relation: Relation) => {
    if (opts.skip(c.address)) {
      if (!skippedKnown.includes(c.label)) skippedKnown.push(c.label);
      return;
    }
    const existing = merged.get(c.address);
    if (existing) {
      existing.txCount += c.txCount;
      if (existing.relation !== relation) existing.relation = "both";
    } else {
      merged.set(c.address, { address: c.address, label: c.label, relation, txCount: c.txCount });
    }
  };

  // Target sends to these -> they receive from the target.
  for (const c of outbound) add(c, "receives-from-target");
  // These send to the target.
  for (const c of inbound) add(c, "sends-to-target");

  const neighbors = [...merged.values()]
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, opts.max);
  return { neighbors, skippedKnown };
}

// Aggregate verdict over the screened circle. Weighted: a blocklisted direct
// counterparty is decisive; otherwise high-risk neighbors weigh double.
export function neighborhoodRisk(
  screened: { risk: RiskLevel; blocklisted: boolean }[]
): RiskLevel {
  if (screened.some((n) => n.blocklisted)) return "high";
  const weight = screened.reduce(
    (w, n) => w + (n.risk === "high" ? 2 : n.risk === "medium" ? 1 : 0),
    0
  );
  if (weight >= 4) return "high";
  if (weight >= 2) return "medium";
  return "low";
}
