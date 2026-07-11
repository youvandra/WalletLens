// ERC-20 approval hygiene — the drainer check.
//
// A wallet drained by a malicious dApp almost always signed an *unlimited*
// approve first. The X Layer transaction-fills endpoint returns full calldata,
// so we can decode every recent approve(spender, amount) this wallet signed and
// flag the dangerous ones: unlimited allowances, and spenders on the
// known-malicious blocklist. Decoding is pure (unit-tested); fetching is
// bounded to the most recent successful approvals so one check stays cheap.
import { fetchAllTransactions } from "./fetcher.js";
import { getTransactionDetail } from "./xlayer-client.js";
import { labelAddress } from "./labels.js";
import { isBlocklisted } from "./blocklist.js";
import { TtlCache } from "./cache.js";
import { config } from "./config.js";

const APPROVE_SELECTOR = "0x095ea7b3";
const MAX_UINT256 = (1n << 256n) - 1n;
// How many recent successful approvals we decode per check. Each costs one
// upstream detail call, so this bounds latency and rate-limit pressure.
const MAX_APPROVALS_INSPECTED = 10;

export interface DecodedApprove {
  spender: string;
  amount: bigint;
}

// approve(address,uint256) calldata: 4-byte selector, then two 32-byte words.
// Returns null for anything that does not parse — we never guess.
export function decodeApprove(inputData: string): DecodedApprove | null {
  const data = (inputData || "").toLowerCase();
  if (!data.startsWith(APPROVE_SELECTOR) || data.length < 10 + 64 + 64) return null;
  const spenderWord = data.slice(10, 74);
  const amountWord = data.slice(74, 138);
  if (!/^[0-9a-f]{64}$/.test(spenderWord) || !/^[0-9a-f]{64}$/.test(amountWord)) return null;
  return {
    spender: "0x" + spenderWord.slice(24),
    amount: BigInt("0x" + amountWord),
  };
}

export type AllowanceKind = "unlimited" | "revocation" | "finite";

export function classifyAllowance(amount: bigint): AllowanceKind {
  if (amount === MAX_UINT256) return "unlimited";
  if (amount === 0n) return "revocation";
  return "finite";
}

export interface ApprovalRecord {
  txId: string;
  time: number; // epoch ms
  token: string; // the contract the approve was sent to
  tokenLabel: string;
  spender: string;
  spenderLabel: string;
  spenderBlocklisted: boolean;
  allowance: AllowanceKind;
  amount: string; // raw integer string ("unlimited" cases still carry the number)
}

export interface ApprovalCheck {
  address: string;
  approvalsFound: number; // successful approves seen in the analyzed window
  inspected: number; // how many we decoded (bounded)
  unlimited: number;
  blocklistedSpenders: string[];
  approvals: ApprovalRecord[];
  caveat: string;
}

const checkCache = new TtlCache<ApprovalCheck>(config.profileCacheTtlMs);

export async function checkApprovals(address: string): Promise<ApprovalCheck> {
  const key = address.toLowerCase();
  const cached = checkCache.get(key);
  if (cached) return cached;

  const txs = await fetchAllTransactions(address, 5);
  const self = address.toLowerCase();
  // Only approvals this wallet signed itself, and only successful ones — a
  // failed approve grants nothing.
  const approves = txs.filter(
    (t) =>
      t.from?.toLowerCase() === self &&
      (t.methodId || "").toLowerCase() === APPROVE_SELECTOR &&
      t.status === "success"
  );

  const inspected = approves.slice(0, MAX_APPROVALS_INSPECTED);
  const approvals: ApprovalRecord[] = [];
  for (const tx of inspected) {
    try {
      const detail = await getTransactionDetail(tx.txId);
      const decoded = decodeApprove(detail.inputData);
      if (!decoded) continue;
      approvals.push({
        txId: tx.txId,
        time: tx.timestamp,
        token: tx.to,
        tokenLabel: labelAddress(tx.to),
        spender: decoded.spender,
        spenderLabel: labelAddress(decoded.spender),
        spenderBlocklisted: isBlocklisted(decoded.spender),
        allowance: classifyAllowance(decoded.amount),
        amount: decoded.amount.toString(),
      });
    } catch {
      // One unfetchable detail never fails the whole check.
    }
  }

  const result: ApprovalCheck = {
    address: self,
    approvalsFound: approves.length,
    inspected: approvals.length,
    unlimited: approvals.filter((a) => a.allowance === "unlimited").length,
    blocklistedSpenders: [
      ...new Set(approvals.filter((a) => a.spenderBlocklisted).map((a) => a.spender)),
    ],
    approvals,
    caveat:
      "Decoded from the most recent successful approve() calls in the analyzed window only — " +
      "an approval may have been changed or revoked by a later transaction outside this window.",
  };
  checkCache.set(key, result);
  return result;
}
