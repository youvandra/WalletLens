import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNeighbors, neighborhoodRisk } from "./neighborhood.js";
import type { Counterparty } from "./types.js";

const cp = (address: string, txCount: number, label = ""): Counterparty => ({
  address,
  label: label || `${address.slice(0, 6)}…${address.slice(-4)}`,
  txCount,
});

test("pickNeighbors merges directions, dedupes, and marks both-way relations", () => {
  const A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const { neighbors } = pickNeighbors(
    [cp(A, 3), cp(B, 2)], // target sends to A and B
    [cp(A, 4)], //           A also sends to target
    { max: 5, skip: () => false }
  );
  assert.equal(neighbors.length, 2);
  assert.equal(neighbors[0].address, A); // 3+4 = 7 txs, ranked first
  assert.equal(neighbors[0].relation, "both");
  assert.equal(neighbors[0].txCount, 7);
  assert.equal(neighbors[1].relation, "receives-from-target");
});

test("pickNeighbors skips known infrastructure and reports it", () => {
  const USDC = "0x74b7f16337b8972027f6196a17a631ac6de26d22";
  const W = "0xcccccccccccccccccccccccccccccccccccccccc";
  const { neighbors, skippedKnown } = pickNeighbors(
    [cp(USDC, 40, "USDC"), cp(W, 2)],
    [],
    { max: 5, skip: (a) => a === USDC }
  );
  assert.equal(neighbors.length, 1);
  assert.equal(neighbors[0].address, W);
  assert.deepEqual(skippedKnown, ["USDC"]);
});

test("pickNeighbors caps the list at max, keeping the most transacted", () => {
  const many = Array.from({ length: 8 }, (_, i) =>
    cp(`0x${String(i).repeat(40)}`, i + 1)
  );
  const { neighbors } = pickNeighbors(many, [], { max: 3, skip: () => false });
  assert.equal(neighbors.length, 3);
  assert.equal(neighbors[0].txCount, 8);
});

test("neighborhoodRisk: blocklisted neighbor is decisive", () => {
  assert.equal(
    neighborhoodRisk([
      { risk: "low", blocklisted: false },
      { risk: "low", blocklisted: true },
    ]),
    "high"
  );
});

test("neighborhoodRisk weights high double and medium single", () => {
  const n = (risk: "low" | "medium" | "high") => ({ risk, blocklisted: false });
  assert.equal(neighborhoodRisk([n("high"), n("high")]), "high"); // weight 4
  assert.equal(neighborhoodRisk([n("high"), n("low")]), "medium"); // weight 2
  assert.equal(neighborhoodRisk([n("medium"), n("low"), n("low")]), "low"); // weight 1
  assert.equal(neighborhoodRisk([]), "low");
});
