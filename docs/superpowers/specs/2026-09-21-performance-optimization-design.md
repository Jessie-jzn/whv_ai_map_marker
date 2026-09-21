# Performance Optimization Design

## Scope

This change starts from the v1.6.0 code on `origin/feat/20260521` and improves three confirmed bottlenecks without replacing the extension's overall architecture:

1. Replace fixed Google Maps delays with state-based waits and verify the target list result.
2. Add bounded timeouts and provider failover to the AI router.
3. Prevent concurrent AI cache writes from overwriting one another.

The recoverable background marking queue described in the architecture review is intentionally deferred to a separate change.

## Maps marking

`markSinglePostcode` remains the Maps adapter used by the runner. Its interface stays compatible, but its implementation waits for observable state transitions rather than sleeping for fixed intervals.

After submitting a postcode, the adapter waits until the search UI reflects the requested query and a save control for the new result becomes available. It then opens the list menu, waits for menu items, finds the target list by normalized exact name, and checks that list's selected state. A place being saved in another list does not count as completion. After selecting the target, the adapter waits until the target item is checked before reporting `marked`.

All waits have deadlines and clean up timers or observers. Results retain the existing `marked`, `skipped`, and `failed` status shape so the runner and UI do not need broad changes. Marking remains serial within a task to avoid racing a single Google Maps page.

## AI router

Each provider attempt receives an `AbortSignal` with a per-attempt timeout. The router also applies an overall request deadline and a maximum number of attempts implied by the configured provider chain.

Timeouts, thrown network errors, rate limits, and transient upstream failures are recorded and allow the next configured provider to run. Invalid client input still returns immediately. Provider authentication or configuration errors are isolated to that provider so a valid fallback can serve the request.

The final error response preserves the attempts list while returning concise error categories rather than upstream response bodies. The extension client also uses a timeout so it can fall back to the local recommendation engine within a bounded time.

## Cache concurrency

Cache mutation is serialized through a module-local promise queue. Each mutation reads the latest bucket after the previous mutation completes, applies its change, and writes once. A failed mutation does not permanently reject the queue.

Cache hits return immediately from the read path. Updating `lastUsed` is queued separately and does not block the returned value. The current storage key and entry schema remain compatible with existing installations.

Because popup and side panel can run in separate JavaScript contexts, a write rereads and merges the latest stored bucket before committing. A future background-owned cache can provide stronger transactional coordination if usage outgrows this small cache.

## Verification

Tests will be added before implementation and must first fail for the expected behavior. Coverage includes:

- marking a place already saved in another list still opens and selects the requested list;
- exact list-name matching and successful state confirmation;
- provider fetch exceptions and timeouts continue to a fallback;
- total router time remains bounded;
- two concurrent cache writes preserve both entries;
- a failed cache write does not poison later writes.

The final verification will run the worker tests, extension tests, and syntax checks for changed JavaScript modules.

## Compatibility and rollout

The extension remains Manifest V3 and retains existing public module interfaces. No storage migration or new permission is required. The main operational risk is Google Maps DOM variability, so selectors stay centralized in the Maps adapter and timeout failures remain visible in per-postcode results.
