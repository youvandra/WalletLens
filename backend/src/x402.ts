// x402 payment gate for the MCP tool surface.
//
// Model: freemium per-IP daily quota, then HTTP 402 following the x402 spec
// (https://x402.org). Payments are USDT on X Layer.
//
// Modes (X402_MODE):
//   off         — no payment required (default for local dev)
//   demo        — issues real 402 challenges and validates the X-PAYMENT
//                 payload structurally, but does NOT settle on-chain (no
//                 public x402 facilitator exists for X Layer yet). Clearly
//                 flagged in the payment response.
//   facilitator — verifies/settles via X402_FACILITATOR_URL (x402 /verify).
import type { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

// USDT on X Layer. Verified on-chain: name() = "Tether USD", decimals() = 6.
// It exposes EIP-2612 `permit` but NOT EIP-3009 `transferWithAuthorization`,
// so the `exact` scheme must run over Permit2 — advertised to the payer via
// extra.assetTransferMethod. Signing an EIP-3009 authorization would fail.
const USDT_XLAYER = "0x1e4a5963abfd975d8c9021ce480b42188849d41d";
const USDT_DECIMALS = 6;

interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string; // atomic units
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: {
    name: string;
    decimals: number;
    assetTransferMethod: "permit2";
  };
}

// The payer signs one of two wire shapes. Permit2 is what we advertise for
// USDT on X Layer; the EIP-3009 shape is still accepted so the gate keeps
// working if the asset is ever swapped for a token that supports it.
interface Eip3009Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

interface Permit2Authorization {
  from: string;
  permitted: { token: string; amount: string };
  spender: string;
  nonce: string;
  deadline: string;
  witness: { to: string; validAfter: string };
}

interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization?: Eip3009Authorization;
    permit2Authorization?: Permit2Authorization;
  };
}

// Normalize either wire shape into { payer, recipient, amount, expiresAt }.
function normalize(
  p: PaymentPayload
): { payer: string; recipient: string; amount: string; expiresAt: number } | null {
  const perm = p.payload?.permit2Authorization;
  if (perm) {
    return {
      payer: perm.from,
      recipient: perm.witness?.to,
      amount: perm.permitted?.amount,
      expiresAt: Number(perm.deadline),
    };
  }
  const auth = p.payload?.authorization;
  if (auth) {
    return {
      payer: auth.from,
      recipient: auth.to,
      amount: auth.value,
      expiresAt: Number(auth.validBefore),
    };
  }
  return null;
}

function priceAtomic(): bigint {
  const usd = Number(config.x402PriceUsd) || 0.05;
  return BigInt(Math.round(usd * 10 ** USDT_DECIMALS));
}

export function paymentRequirements(resource: string): PaymentRequirements {
  return {
    scheme: "exact",
    network: "xlayer",
    maxAmountRequired: priceAtomic().toString(),
    resource,
    description: `TxWrap wallet-intelligence tool call (${config.x402PriceUsd} USDT)`,
    mimeType: "application/json",
    payTo: config.x402PayTo || "0x0000000000000000000000000000000000000000",
    maxTimeoutSeconds: 60,
    asset: USDT_XLAYER,
    extra: {
      name: "Tether USD", // EIP-712 domain name, read from the contract
      decimals: USDT_DECIMALS,
      assetTransferMethod: "permit2",
    },
  };
}

// ---- Per-IP daily free quota (in-memory; single-process pm2 app) ----

const quota = new Map<string, { day: string; used: number }>();

function takeFreeCall(ip: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const entry = quota.get(ip);
  if (!entry || entry.day !== day) {
    quota.set(ip, { day, used: 1 });
    return config.x402FreeDaily - 1;
  }
  if (entry.used >= config.x402FreeDaily) return -1;
  entry.used++;
  return config.x402FreeDaily - entry.used;
}

// ---- Verification ----

async function verifyViaFacilitator(
  paymentHeader: string,
  requirements: PaymentRequirements
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`${config.x402FacilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements: requirements,
      }),
    });
    if (!res.ok) return { ok: false, reason: `facilitator ${res.status}` };
    const data = (await res.json()) as { isValid?: boolean; invalidReason?: string };
    return data.isValid ? { ok: true } : { ok: false, reason: data.invalidReason || "invalid" };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "facilitator error" };
  }
}

function verifyStructurally(
  payment: PaymentPayload,
  requirements: PaymentRequirements
): { ok: boolean; reason?: string } {
  if (payment.scheme !== "exact") return { ok: false, reason: "unsupported scheme" };
  if (payment.network !== requirements.network) return { ok: false, reason: "wrong network" };
  if (!payment.payload?.signature) return { ok: false, reason: "missing signature" };

  const auth = normalize(payment);
  if (!auth) return { ok: false, reason: "missing authorization" };

  try {
    if (BigInt(auth.amount) < BigInt(requirements.maxAmountRequired)) {
      return { ok: false, reason: "insufficient amount" };
    }
  } catch {
    return { ok: false, reason: "malformed amount" };
  }
  if (config.x402PayTo && auth.recipient?.toLowerCase() !== config.x402PayTo.toLowerCase()) {
    return { ok: false, reason: "wrong payTo" };
  }
  if (auth.expiresAt * 1000 < Date.now()) {
    return { ok: false, reason: "authorization expired" };
  }
  return { ok: true };
}

function respond402(res: Response, resource: string, error: string): void {
  res.status(402).json({
    x402Version: 1,
    error,
    accepts: [paymentRequirements(resource)],
  });
}

// Gate for POST /mcp: only tool calls are metered; initialize / tools/list
// stay free so MCP clients can always connect and discover the tools.
export async function x402Gate(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (config.x402Mode === "off") return next();
  const method = (req.body as { method?: string } | undefined)?.method;
  if (method !== "tools/call") return next();

  const ip = req.ip || "unknown";
  const remaining = takeFreeCall(ip);
  if (remaining >= 0) {
    res.setHeader("X-Free-Calls-Remaining", String(remaining));
    return next();
  }

  const resource = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const header = req.header("X-PAYMENT");
  if (!header) {
    respond402(res, resource, "Free daily quota exhausted. X-PAYMENT header is required.");
    return;
  }

  let payment: PaymentPayload;
  try {
    payment = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    respond402(res, resource, "Malformed X-PAYMENT header (expected base64 JSON).");
    return;
  }

  const requirements = paymentRequirements(resource);
  const result =
    config.x402Mode === "facilitator" && config.x402FacilitatorUrl
      ? await verifyViaFacilitator(header, requirements)
      : verifyStructurally(payment, requirements);

  if (!result.ok) {
    respond402(res, resource, `Payment invalid: ${result.reason}`);
    return;
  }

  console.log(
    `x402 payment accepted (${config.x402Mode}) from ${normalize(payment)?.payer} for ${resource}`
  );
  res.setHeader(
    "X-PAYMENT-RESPONSE",
    Buffer.from(
      JSON.stringify({
        success: true,
        network: requirements.network,
        settled: config.x402Mode === "facilitator",
        mode: config.x402Mode,
      })
    ).toString("base64")
  );
  next();
}

export function x402Info(): Record<string, unknown> {
  return {
    enabled: config.x402Mode !== "off",
    mode: config.x402Mode,
    pricing: {
      perToolCall: `${config.x402PriceUsd} USDT`,
      asset: USDT_XLAYER,
      assetTransferMethod: "permit2",
      network: "xlayer",
      freeDailyCallsPerIp: config.x402FreeDaily,
    },
    settlement:
      config.x402Mode === "facilitator"
        ? "on-chain via facilitator"
        : "not settled — demo mode verifies the payment payload but does not move funds",
    metered: ["tools/call on POST /mcp"],
    free: ["initialize", "tools/list", "GET /wrap/:address", "POST /api/txwrap (human tier)"],
  };
}
