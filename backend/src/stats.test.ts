import { test } from "node:test";
import assert from "node:assert/strict";
import { computePercentile, summarizeScores } from "./stats.js";

test("withholds a percentile below the sample floor", () => {
  assert.equal(computePercentile(90, [10, 20, 30], 30), null);
});

test("a top score lands in the top 1% (floored, never 0%)", () => {
  const sample = Array.from({ length: 100 }, (_, i) => i); // 0..99
  const r = computePercentile(99, sample, 30);
  assert.ok(r);
  assert.equal(r!.topPercent, 1); // nothing scores higher -> floored at 1
  assert.equal(r!.sampleSize, 100);
});

test("a median score lands near the top 50%", () => {
  const sample = Array.from({ length: 100 }, (_, i) => i); // 0..99
  const r = computePercentile(49, sample, 30);
  assert.equal(r!.topPercent, 50); // 50 values (50..99) score higher
});

test("summarizeScores reports p50/p90/max above the floor, null below", () => {
  const sample = Array.from({ length: 100 }, (_, i) => i); // 0..99
  const s = summarizeScores(sample, 30);
  assert.ok(s);
  assert.equal(s!.p50, 50);
  assert.equal(s!.p90, 90);
  assert.equal(s!.max, 99);
  assert.equal(summarizeScores([1, 2, 3], 30), null);
});

test("respects a custom minimum sample size", () => {
  assert.equal(computePercentile(5, [1, 2, 3], 3)?.sampleSize, 3);
  assert.equal(computePercentile(5, [1, 2], 3), null);
});
