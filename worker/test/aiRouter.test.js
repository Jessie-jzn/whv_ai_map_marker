import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { routeAiChat } from "../src/aiRouter.js";

const originalFetch = globalThis.fetch;
const request = {
  purpose: "long",
  messages: [{ role: "user", content: "recommend a town" }],
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function workersAi() {
  return {
    run: async () => ({
      response: JSON.stringify({ recommendations: [{ town: "Albany" }] }),
    }),
  };
}

test("a network failure falls through to the next configured provider", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("network down");
  };

  const result = await routeAiChat(request, {
    GEMINI_API_KEY: "configured",
    AI: workersAi(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.body._whv_router.provider, "workers_ai");
});

test(
  "a timed-out provider falls through within the configured deadline",
  { timeout: 500 },
  async () => {
    globalThis.fetch = async (_url, init = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });

    const startedAt = Date.now();
    const result = await routeAiChat(request, {
      GEMINI_API_KEY: "configured",
      AI_PROVIDER_TIMEOUT_MS: "20",
      AI_TOTAL_TIMEOUT_MS: "120",
      AI: workersAi(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.body._whv_router.provider, "workers_ai");
    assert.ok(Date.now() - startedAt < 300);
  }
);
