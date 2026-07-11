// Wallet snapshots + diffing — the memory behind the diff_wallet tool.
//
// One-shot profiles answer "who is this wallet?". Monitoring agents ask a
// different question on a schedule: "what CHANGED since I last looked?". We
// keep a compact snapshot per address on disk (data/snapshots/, survives
// restarts like stats.json does) and report the delta on the next call:
// archetype/momentum flips, signals gained or lost, net-worth movement, and
// how many new transactions landed. Diffing is pure and unit-tested.
import fs from "fs";
import path from "path";
import type { WalletMetrics } from "./types.js";

export interface WalletSnapshot {
  takenAt: number; // epoch ms
  archetype: string;
  momentum: string;
  netWorthUsd: string;
  balanceEth: string;
  totalTx: number;
  activeSignals: string[];
}

export interface SnapshotDiff {
  changed: boolean;
  changes: string[];
}

let dir = "";

export function initSnapshots(dataDir: string): void {
  dir = path.join(dataDir, "snapshots");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error("snapshots: could not create dir:", err);
  }
}

function fileFor(address: string): string {
  return path.join(dir, `${address.toLowerCase()}.json`);
}

export function loadSnapshot(address: string): WalletSnapshot | null {
  try {
    const f = fileFor(address);
    if (!dir || !fs.existsSync(f)) return null;
    return JSON.parse(fs.readFileSync(f, "utf-8")) as WalletSnapshot;
  } catch {
    return null; // a corrupt snapshot reads as "no baseline", never an error
  }
}

export function saveSnapshot(address: string, snap: WalletSnapshot): void {
  try {
    if (!dir) return;
    fs.writeFileSync(fileFor(address), JSON.stringify(snap), "utf-8");
  } catch (err) {
    console.error("snapshots: write failed:", err);
  }
}

export function snapshotOf(metrics: WalletMetrics, now = Date.now()): WalletSnapshot {
  return {
    takenAt: now,
    archetype: metrics.archetype,
    momentum: metrics.trajectory.momentum,
    netWorthUsd: metrics.netWorthUsd,
    balanceEth: metrics.balanceEth,
    totalTx: metrics.totalTx,
    activeSignals: Object.entries(metrics.signals)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .sort(),
  };
}

// Net-worth changes under this share are price noise, not wallet behavior.
const NET_WORTH_NOISE_PCT = 2;

export function diffSnapshots(prev: WalletSnapshot, curr: WalletSnapshot): SnapshotDiff {
  const changes: string[] = [];

  if (curr.archetype !== prev.archetype) {
    changes.push(`archetype changed: ${prev.archetype} -> ${curr.archetype}`);
  }
  if (curr.momentum !== prev.momentum) {
    changes.push(`momentum changed: ${prev.momentum} -> ${curr.momentum}`);
  }

  const prevSet = new Set(prev.activeSignals);
  const currSet = new Set(curr.activeSignals);
  const gained = curr.activeSignals.filter((s) => !prevSet.has(s));
  const lost = prev.activeSignals.filter((s) => !currSet.has(s));
  if (gained.length) changes.push(`signals gained: ${gained.join(", ")}`);
  if (lost.length) changes.push(`signals lost: ${lost.join(", ")}`);

  const newTxs = curr.totalTx - prev.totalTx;
  if (newTxs > 0) changes.push(`${newTxs} new transaction(s)`);

  const prevWorth = Number(prev.netWorthUsd) || 0;
  const currWorth = Number(curr.netWorthUsd) || 0;
  if (prevWorth > 0) {
    const deltaPct = ((currWorth - prevWorth) / prevWorth) * 100;
    if (Math.abs(deltaPct) >= NET_WORTH_NOISE_PCT) {
      changes.push(
        `net worth ${deltaPct > 0 ? "up" : "down"} ${Math.abs(deltaPct).toFixed(1)}% ` +
          `($${prev.netWorthUsd} -> $${curr.netWorthUsd})`
      );
    }
  } else if (currWorth > 0) {
    changes.push(`net worth appeared: $${curr.netWorthUsd}`);
  }

  return { changed: changes.length > 0, changes };
}
