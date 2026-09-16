import { test } from "node:test";
import assert from "node:assert/strict";
import { withRuntimeEnvironment } from "./runtime-site";

test("copied development settings cannot expose draft demos in production", () => {
  assert.equal(withRuntimeEnvironment({ development: true }, "production").development, false);
  assert.equal(withRuntimeEnvironment({ development: false }, "development").development, true);
});