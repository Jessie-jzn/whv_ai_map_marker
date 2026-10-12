import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatPostcodeForSearch,
  parsePostcodesInput,
} from "../build/src/eligibility/postcodes.js";

test("Australian postcodes keep their four-digit display form", () => {
  const [postcode] = parsePostcodesInput("0872");

  assert.equal(formatPostcodeForSearch(postcode), "0872");
  assert.equal(formatPostcodeForSearch(2832), "2832");
});
