import { test } from "node:test";
import assert from "node:assert/strict";
import { TtlCache } from "./cache.js";

test("returns a stored value before it expires", () => {
  const c = new TtlCache<number>(1000);
  c.set("a", 1);
  assert.equal(c.get("a"), 1);
});

test("returns undefined for a missing key", () => {
  const c = new TtlCache<number>(1000);
  assert.equal(c.get("missing"), undefined);
});

test("expires entries after the TTL", async () => {
  const c = new TtlCache<number>(10);
  c.set("a", 1);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(c.get("a"), undefined);
  assert.equal(c.size, 0); // lazily evicted on read
});

test("a zero TTL disables caching", () => {
  const c = new TtlCache<number>(0);
  c.set("a", 1);
  assert.equal(c.get("a"), undefined);
});

test("evicts the oldest entries past maxEntries", () => {
  const c = new TtlCache<number>(1000, 2);
  c.set("a", 1);
  c.set("b", 2);
  c.set("c", 3); // pushes "a" out
  assert.equal(c.get("a"), undefined);
  assert.equal(c.get("b"), 2);
  assert.equal(c.get("c"), 3);
  assert.equal(c.size, 2);
});
