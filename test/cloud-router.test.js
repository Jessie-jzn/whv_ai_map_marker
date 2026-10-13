import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { askCloudRouter } from "../build/src/advisor/cloudRouter.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("the extension client aborts a cloud request at its deadline", { timeout: 500 }, async () => {
  globalThis.fetch = async (_url, init = {}) =>
    new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });

  await assert.rejects(
    askCloudRouter({
      system: "Return JSON",
      user: "Recommend a town",
      timeoutMs: 20,
    }),
    /timed out/i
  );
});
