import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { markSinglePostcode } from "../build/src/marking/content.js";

const originalDocument = globalThis.document;
const originalEvent = globalThis.Event;
const originalSetTimeout = globalThis.setTimeout;

const lang = {
  waitElementTimeout: "Timed out waiting for %s",
  skipPostcode: "Skip %s",
  postcodeAlreadySaved: "Already saved %s",
  postcodeMarked: "Marked %s",
  postcodeMarkFailed: "Failed %s",
  postcodePlaceholder: "Postcode: %s, Australia",
};

afterEach(() => {
  globalThis.document = originalDocument;
  globalThis.Event = originalEvent;
  globalThis.setTimeout = originalSetTimeout;
});

function installMapsDom({ saveLabel = "Save" } = {}) {
  let menuOpen = false;
  const input = {
    value: "",
    dispatchEvent() {},
  };
  const targetItem = {
    textContent: "Target WHV",
    checked: false,
    getAttribute(name) {
      return name === "aria-checked" ? String(this.checked) : null;
    },
    click() {
      this.checked = true;
    },
  };
  const otherItem = {
    textContent: "WHV Archive",
    getAttribute(name) {
      return name === "aria-checked" ? "false" : null;
    },
    click() {},
  };
  const saveButton = {
    textContent: saveLabel,
    getAttribute(name) {
      return name === "aria-label" ? saveLabel : null;
    },
    click() {
      menuOpen = true;
    },
  };
  const searchButton = { click() {} };

  globalThis.Event = class Event {};
  globalThis.setTimeout = (callback) => {
    callback();
    return 1;
  };
  globalThis.document = {
    querySelector(selector) {
      if (selector === 'input[name="q"]') return input;
      if (selector.includes('aria-label="搜索"')) return searchButton;
      if (selector === 'div[role="menuitemradio"]') {
        return menuOpen ? otherItem : null;
      }
      if (
        selector.includes('aria-label="保存"') ||
        selector.includes('aria-label="Save"') ||
        selector.includes('aria-label="Saved"')
      ) {
        return saveButton;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'div[role="menuitemradio"]' && menuOpen) {
        return [otherItem, targetItem];
      }
      return [];
    },
  };

  return { targetItem };
}

test("a place saved elsewhere is added to the requested list", async () => {
  const { targetItem } = installMapsDom({ saveLabel: "Saved" });

  const result = await markSinglePostcode(2832, lang, "Target WHV");

  assert.deepEqual(result, { status: "marked" });
  assert.equal(targetItem.getAttribute("aria-checked"), "true");
});

test("a list-name substring is not accepted", async () => {
  installMapsDom({ saveLabel: "Save" });

  const result = await markSinglePostcode(2832, lang, "WHV");

  assert.deepEqual(result, {
    status: "failed",
    reason: "target_list_not_found",
  });
});
