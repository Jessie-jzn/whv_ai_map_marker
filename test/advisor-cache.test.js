import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalChrome = globalThis.chrome;
const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator"
);

afterEach(() => {
  globalThis.chrome = originalChrome;
  if (originalNavigatorDescriptor) {
    Object.defineProperty(globalThis, "navigator", originalNavigatorDescriptor);
  } else {
    delete globalThis.navigator;
  }
});

function installStorage() {
  let bucket = { entries: {} };
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return { [key]: structuredClone(bucket) };
        },
        async set(value) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          bucket = structuredClone(value.aiLlmCache);
        },
      },
    },
  };
  return () => bucket;
}

function installWebLocks() {
  let tail = Promise.resolve();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request(_name, callback) {
          const operation = tail.catch(() => undefined).then(callback);
          tail = operation.catch(() => undefined);
          return operation;
        },
      },
    },
  });
}

function freshCacheModule(context) {
  return import(
    `../build/src/advisor/cache.js?context=${context}-${Date.now()}-${Math.random()}`
  );
}

const recommendation = (town) => ({ recommendations: [{ town }] });

test("two extension contexts preserve both concurrent cache writes", async () => {
  const stored = installStorage();
  installWebLocks();
  const [popupCache, sidePanelCache] = await Promise.all([
    freshCacheModule("popup"),
    freshCacheModule("side-panel"),
  ]);

  await Promise.all([
    popupCache.putCachedLlm("a", recommendation("Albany")),
    sidePanelCache.putCachedLlm("b", recommendation("Broome")),
  ]);

  assert.deepEqual(Object.keys(stored().entries).sort(), ["a", "b"]);
});

test("the fallback queue preserves same-context concurrent writes", async () => {
  const stored = installStorage();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {},
  });
  const cache = await freshCacheModule("fallback");

  await Promise.all([
    cache.putCachedLlm("a", recommendation("Albany")),
    cache.putCachedLlm("b", recommendation("Broome")),
  ]);

  assert.deepEqual(Object.keys(stored().entries).sort(), ["a", "b"]);
});
