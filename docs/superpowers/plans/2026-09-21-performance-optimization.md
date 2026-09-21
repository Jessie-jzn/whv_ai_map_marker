# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Maps marking react to actual page state, bound AI response time with reliable failover, and preserve concurrent cache writes.

**Architecture:** Keep the v1.6.0 interfaces and strengthen the existing Maps adapter, Worker provider router, extension client, and cache module. Use Node's built-in test runner with controlled DOM, fetch, clock, and storage fakes so every behavior is reproduced before its fix.

**Tech Stack:** Manifest V3, browser ES modules, Cloudflare Worker JavaScript, Node.js `node:test`.

## Global Constraints

- Start from `origin/feat/20260521` version 1.6.0.
- Do not add browser permissions or migrate persisted storage.
- Preserve `markSinglePostcode(postcode, lang, targetListName)` result statuses: `marked`, `skipped`, and `failed`.
- Keep marking serial within one Google Maps task.
- Use bounded waits and clean up timers or observers.
- Preserve the AI router attempts list without exposing full upstream response bodies.

---

### Task 1: Establish the test harness and state-based Maps marking

**Files:**
- Create: `package.json`
- Create: `test/marking-content.test.js`
- Modify: `build/src/marking/content.js`

**Interfaces:**
- Consumes: the existing `markSinglePostcode(postcode, lang, targetListName)` injected-function interface.
- Produces: the same Promise result shape, with exact target-list matching and state-confirmed completion.

- [ ] **Step 1: Add the Node test harness and failing Maps tests**

Create a root `package.json` with `"type": "module"` and `"test": "node --test"`. In `test/marking-content.test.js`, construct a minimal fake document whose search button reveals a Saved control and whose click reveals two menu items. Assert these observable outcomes:

```js
test("a place saved elsewhere is added to the requested list", async () => {
  const result = await markSinglePostcode(2832, lang, "Target WHV");
  assert.deepEqual(result, { status: "marked" });
  assert.equal(targetItem.getAttribute("aria-checked"), "true");
});

test("a list-name substring is not accepted", async () => {
  const result = await markSinglePostcode(2832, lang, "WHV");
  assert.equal(result.reason, "target_list_not_found");
});
```

The fake must model complete relevant element behavior (`querySelector`, `querySelectorAll`, labels, `aria-checked`, and click state changes) rather than asserting calls on mocks.

- [ ] **Step 2: Run the Maps tests and verify RED**

Run: `npm test -- test/marking-content.test.js`

Expected: the first test returns `skipped/already_saved`, proving the premature Saved branch; the substring test returns `marked`, proving fuzzy matching.

- [ ] **Step 3: Replace fixed sleeps with state predicates**

Inside the self-contained injected function, add a local bounded predicate waiter:

```js
function waitUntil(predicate, timeout = 7000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const value = predicate();
      if (value) return resolve(value);
      if (Date.now() - startedAt >= timeout) return reject(new Error("wait_timeout"));
      setTimeout(check, interval);
    };
    check();
  });
}
```

After search, wait for the save control associated with the refreshed result. Always open the list menu even if the general button says Saved. Normalize whitespace but require `label === normalizedTarget`. If the exact item is already checked, return `skipped/already_in_list`; otherwise click and wait until its `aria-checked` becomes `true` before returning `marked`. Remove the fixed 2000 ms and 1500 ms sleeps.

- [ ] **Step 4: Run the Maps tests and verify GREEN**

Run: `npm test -- test/marking-content.test.js`

Expected: both tests pass with no warnings or unhandled timers.

- [ ] **Step 5: Commit the Maps optimization**

```bash
git add package.json test/marking-content.test.js build/src/marking/content.js
git commit -m "perf: wait for Maps state transitions"
```

### Task 2: Bound AI calls and continue provider failover

**Files:**
- Modify: `worker/package.json`
- Create: `worker/test/aiRouter.test.js`
- Modify: `worker/src/aiRouter.js`
- Create: `test/cloud-router.test.js`
- Modify: `build/src/advisor/cloudRouter.js`

**Interfaces:**
- Consumes: `routeAiChat(rawBody, env)` and `askCloudRouter({ system, user, purpose })`.
- Produces: `fetchWithTimeout(url, init, timeoutMs)` as an internal helper; public return shapes stay unchanged.

- [ ] **Step 1: Write failing Worker failover tests**

Set `worker/package.json` to ES modules and add `"test": "node --test"`. Test real `routeAiChat` behavior with a fetch fake that throws for Gemini and a real Workers AI adapter fake that returns a valid response:

```js
test("network failure falls through to the next configured provider", async () => {
  globalThis.fetch = async () => { throw new TypeError("network down"); };
  const result = await routeAiChat(body, {
    GEMINI_API_KEY: "configured",
    AI: { run: async () => ({ response: "{\"recommendations\":[{\"town\":\"A\"}]}" }) },
  });
  assert.equal(result.ok, true);
  assert.equal(result.body._whv_router.provider, "workers_ai");
});
```

Add a second test whose fetch only rejects when its signal aborts; verify the next provider succeeds within a test-configurable timeout. Inject timeout values through optional environment values such as `AI_PROVIDER_TIMEOUT_MS` and `AI_TOTAL_TIMEOUT_MS`, with production defaults when absent.

- [ ] **Step 2: Run Worker tests and verify RED**

Run: `npm test --prefix worker`

Expected: the thrown fetch rejects `routeAiChat`, and the timeout test hangs until the test's outer deadline or fails without fallback.

- [ ] **Step 3: Implement bounded provider attempts**

Wrap every upstream fetch with an AbortController and normalize thrown failures:

```js
async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
```

Catch each provider invocation in `routeAiChat`, append `{ provider, error: "timeout" | "network_error" }`, and continue while the total deadline has time remaining. Treat HTTP 400 request errors as terminal; isolate provider 401/403/configuration failures and continue to another configured provider. Trim upstream error text in final responses.

- [ ] **Step 4: Add and verify the extension-client timeout**

In `test/cloud-router.test.js`, make fetch remain pending until abort and assert `askCloudRouter` rejects with a timeout error. Add an AbortController to `build/src/advisor/cloudRouter.js`, using an optional internal default of 15 seconds, and clear the timer in `finally`.

Run: `npm test -- test/cloud-router.test.js && npm test --prefix worker`

Expected: client timeout and both Worker failover tests pass.

- [ ] **Step 5: Commit the AI routing optimization**

```bash
git add worker/package.json worker/test/aiRouter.test.js worker/src/aiRouter.js test/cloud-router.test.js build/src/advisor/cloudRouter.js
git commit -m "perf: bound AI routing and preserve failover"
```

### Task 3: Serialize cache mutations without blocking hits

**Files:**
- Create: `test/advisor-cache.test.js`
- Modify: `build/src/advisor/cache.js`

**Interfaces:**
- Consumes: `getCachedLlm`, `putCachedLlm`, and `clearLlmCache`.
- Produces: the same public functions and persisted `{ entries }` schema.

- [ ] **Step 1: Write failing concurrent-write tests**

Use a storage fake that returns snapshots and delays each `set`. Exercise the real cache module:

```js
test("concurrent cache writes preserve both entries", async () => {
  await Promise.all([
    putCachedLlm("a", { recommendations: [{ town: "A" }] }),
    putCachedLlm("b", { recommendations: [{ town: "B" }] }),
  ]);
  assert.deepEqual(Object.keys(stored.entries).sort(), ["a", "b"]);
});
```

Add a second test where the first storage write rejects and a later `putCachedLlm` succeeds, proving the queue is not poisoned.

- [ ] **Step 2: Run cache tests and verify RED**

Run: `npm test -- test/advisor-cache.test.js`

Expected: concurrent writes retain only one key; the rejection test prevents or interferes with the later write.

- [ ] **Step 3: Implement the mutation queue**

Add a module-local queue and ensure each mutation reads after its predecessor:

```js
let mutationQueue = Promise.resolve();

function enqueueMutation(mutate) {
  const operation = mutationQueue.catch(() => undefined).then(async () => {
    const bucket = await readBucket();
    await mutate(bucket);
    await writeBucket(bucket);
  });
  mutationQueue = operation.catch(() => undefined);
  return operation;
}
```

Use it for put, clear, expiry deletion, and asynchronous last-used updates. Return cache hits before awaiting the last-used mutation. Immediately before a write, merge keys from a fresh storage read so separate popup and side-panel contexts do not overwrite unrelated entries observed since the mutation began.

- [ ] **Step 4: Run cache and complete test suites**

Run: `npm test -- test/advisor-cache.test.js`

Expected: both cache tests pass.

Run: `npm test && npm test --prefix worker`

Expected: all extension and Worker tests pass with zero failures.

- [ ] **Step 5: Commit the cache optimization**

```bash
git add test/advisor-cache.test.js build/src/advisor/cache.js
git commit -m "perf: serialize AI cache mutations"
```

### Task 4: Final verification and review

**Files:**
- Modify only if verification exposes a defect in the files listed above.

**Interfaces:**
- Consumes: all changes from Tasks 1–3.
- Produces: a reviewable branch with test evidence.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm test
npm test --prefix worker
node --check build/src/marking/content.js
node --check build/src/advisor/cache.js
node --check build/src/advisor/cloudRouter.js
node --check worker/src/aiRouter.js
git diff --check origin/feat/20260521...HEAD
```

Expected: all commands exit 0.

- [ ] **Step 2: Review scope and behavior**

Inspect `git diff --stat origin/feat/20260521...HEAD` and `git diff origin/feat/20260521...HEAD`. Confirm there are no permission additions, storage migrations, unrelated UI changes, fixed Maps sleeps, or unbounded upstream fetches.

- [ ] **Step 3: Commit verification-only fixes if required**

If verification required source changes, first add a regression test, observe RED, implement the fix, rerun GREEN, then commit only those files with a message naming the behavior fixed.
