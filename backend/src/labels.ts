// Human-friendly labels for on-chain activity.
//
// Two kinds of labeling live here:
//  1. Method classification — the 4-byte function selector is chain-agnostic,
//     so we can reliably derive an activity type from methodId alone.
//  2. Address labeling — a small registry of *verified* X Layer contract
//     addresses. Unknown addresses fall back to a shortened hex so we never
//     show a misleading name.

const SWAP_SELECTORS = new Set([
  "0x38ed1739", // swapExactTokensForTokens
  "0x7ff36ab5", // swapExactETHForTokens
  "0x4a25d94a", // swapTokensForExactETH
  "0x18cbafe5", // swapExactTokensForETH
  "0x5c11d795", // swapExactTokensForTokensSupportingFeeOnTransfer
  "0x6a257603", // swapExactETHForTokensSupportingFeeOnTransfer
  "0x791ac947", // swapExactTokensForETHSupportingFeeOnTransfer
  "0x022c0d9f", // swap (Uniswap V3 style)
]);

const APPROVE_SELECTOR = "0x095ea7b3"; // approve(address,uint256)
const TRANSFER_SELECTOR = "0xa9059cbb"; // transfer(address,uint256)

export type ActivityType = "swap" | "approve" | "transfer" | "native" | "other";

export function classifyMethod(methodId?: string): ActivityType {
  const m = (methodId || "").toLowerCase();
  if (!m || m === "0x") return "native";
  if (SWAP_SELECTORS.has(m)) return "swap";
  if (m === APPROVE_SELECTOR) return "approve";
  if (m === TRANSFER_SELECTOR) return "transfer";
  return "other";
}

// Verified X Layer address labels. Extend as real addresses are confirmed;
// keys must be lowercase. Left small on purpose — we prefer an honest short
// hex over a guessed protocol name.
const ADDRESS_LABELS: Record<string, string> = {};

export function labelAddress(address?: string): string {
  const key = (address || "").toLowerCase();
  if (ADDRESS_LABELS[key]) return ADDRESS_LABELS[key];
  return address && address.length >= 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address || "Unknown";
}

export function isKnownAddress(address?: string): boolean {
  return !!ADDRESS_LABELS[(address || "").toLowerCase()];
}
