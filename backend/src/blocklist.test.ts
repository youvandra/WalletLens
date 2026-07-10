import { test } from "node:test";
import assert from "node:assert/strict";
import { findBlocklisted } from "./blocklist.js";

const BAD = "0xbadbadbadbadbadbadbadbadbadbadbadbadbad0";
const OK = "0x1111111111111111111111111111111111111111";

test("findBlocklisted returns flagged candidates, case-insensitive", () => {
  const blocked = new Set([BAD.toLowerCase()]);
  const hits = findBlocklisted([OK, BAD.toUpperCase()], blocked);
  assert.deepEqual(hits, [BAD.toLowerCase()]);
});

test("findBlocklisted dedupes and returns empty when nothing matches", () => {
  const blocked = new Set([BAD.toLowerCase()]);
  assert.deepEqual(findBlocklisted([OK, OK], blocked), []);
  assert.deepEqual(findBlocklisted([BAD, BAD], blocked), [BAD.toLowerCase()]);
});

test("an empty blocklist flags nothing", () => {
  assert.deepEqual(findBlocklisted([BAD, OK], new Set()), []);
});
