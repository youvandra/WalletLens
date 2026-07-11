import { test } from "node:test";
import assert from "node:assert/strict";
import { riskLevel, recommendationFor } from "./risk.js";

test("riskLevel maps flag counts onto coarse levels", () => {
  assert.equal(riskLevel(0, false), "low");
  assert.equal(riskLevel(1, false), "medium");
  assert.equal(riskLevel(2, false), "medium");
  assert.equal(riskLevel(3, false), "high");
});

test("a self blocklist hit is decisive regardless of flags", () => {
  assert.equal(riskLevel(0, true), "high");
});

test("recommendationFor maps risk onto an actionable verdict", () => {
  assert.equal(recommendationFor("low"), "proceed");
  assert.equal(recommendationFor("medium"), "caution");
  assert.equal(recommendationFor("high"), "avoid");
});
