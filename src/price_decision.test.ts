import test from "node:test";
import assert from "node:assert/strict";
import { chooseCatalogAction } from "./price_decision.ts";

test("a lower competitor quote creates a review-decrease decision", () => {
  const result = chooseCatalogAction({ vendor: "regional-services", amount: 119.5, currency: "USD", observedAt: "2026-01-01T00:00:00Z" }, 125);
  assert.deepEqual(result, { vendor: "regional-services", currentAmount: 125, observedAmount: 119.5, change: -5.5, action: "review-decrease" });
});
