// Shared risk-verdict mapping for screen_wallet and screen_wallets, so the
// single and bulk screens can never drift apart. Pure — unit-tested directly.

export type RiskLevel = "low" | "medium" | "high";
export type Recommendation = "proceed" | "caution" | "avoid";

// A blocklist hit on the wallet itself is decisive regardless of flag count.
export function riskLevel(flagCount: number, selfBlocklisted: boolean): RiskLevel {
  if (selfBlocklisted) return "high";
  if (flagCount >= 3) return "high";
  if (flagCount >= 1) return "medium";
  return "low";
}

export function recommendationFor(risk: RiskLevel): Recommendation {
  return risk === "high" ? "avoid" : risk === "medium" ? "caution" : "proceed";
}
