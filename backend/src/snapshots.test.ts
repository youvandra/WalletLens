import { test } from "node:test";
import assert from "node:assert/strict";
import { diffSnapshots, type WalletSnapshot } from "./snapshots.js";

function snap(over: Partial<WalletSnapshot> = {}): WalletSnapshot {
  return {
    takenAt: 1000,
    archetype: "The Based Chad",
    momentum: "steady",
    netWorthUsd: "1000.00",
    balanceEth: "2.0000",
    totalTx: 100,
    activeSignals: ["diversifiedPortfolio"],
    ...over,
  };
}

test("identical snapshots report no change", () => {
  const d = diffSnapshots(snap(), snap({ takenAt: 2000 }));
  assert.equal(d.changed, false);
  assert.deepEqual(d.changes, []);
});

test("archetype, momentum, and signal changes are all reported", () => {
  const d = diffSnapshots(
    snap(),
    snap({
      archetype: "The 2AM Degen",
      momentum: "heating",
      activeSignals: ["diversifiedPortfolio", "nightOwl"],
    })
  );
  assert.equal(d.changed, true);
  assert.ok(d.changes.some((c) => c.includes("The Based Chad -> The 2AM Degen")));
  assert.ok(d.changes.some((c) => c.includes("steady -> heating")));
  assert.ok(d.changes.some((c) => c.includes("signals gained: nightOwl")));
});

test("lost signals and new transactions are reported", () => {
  const d = diffSnapshots(
    snap({ activeSignals: ["dormant"] }),
    snap({ activeSignals: [], totalTx: 105 })
  );
  assert.ok(d.changes.some((c) => c.includes("signals lost: dormant")));
  assert.ok(d.changes.some((c) => c.includes("5 new transaction(s)")));
});

test("net worth movement is reported above the noise floor, ignored below", () => {
  const up = diffSnapshots(snap(), snap({ netWorthUsd: "1500.00" }));
  assert.ok(up.changes.some((c) => c.includes("net worth up 50.0%")));

  const noise = diffSnapshots(snap(), snap({ netWorthUsd: "1010.00" }));
  assert.equal(noise.changed, false); // 1% move = price noise
});
