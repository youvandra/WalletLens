import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeApprove, classifyAllowance } from "./approvals.js";

const SPENDER = "e8e8a1df1e26277a2875a0bda912ab9f19843a53";
const pad = (hex: string) => hex.padStart(64, "0");

test("decodeApprove extracts spender and amount from approve calldata", () => {
  const amount = 5000000n;
  const data = "0x095ea7b3" + pad(SPENDER) + pad(amount.toString(16));
  const d = decodeApprove(data);
  assert.ok(d);
  assert.equal(d!.spender, "0x" + SPENDER);
  assert.equal(d!.amount, amount);
});

test("decodeApprove handles the unlimited (MaxUint256) allowance", () => {
  const data = "0x095ea7b3" + pad(SPENDER) + "f".repeat(64);
  const d = decodeApprove(data);
  assert.ok(d);
  assert.equal(classifyAllowance(d!.amount), "unlimited");
});

test("classifyAllowance distinguishes revocation and finite", () => {
  assert.equal(classifyAllowance(0n), "revocation");
  assert.equal(classifyAllowance(123n), "finite");
});

test("decodeApprove rejects non-approve or malformed calldata", () => {
  assert.equal(decodeApprove("0x38ed1739" + pad(SPENDER) + pad("1")), null); // swap selector
  assert.equal(decodeApprove("0x095ea7b3" + pad(SPENDER)), null); // missing amount word
  assert.equal(decodeApprove(""), null);
});
