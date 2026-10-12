import assert from "node:assert/strict";
import { test } from "node:test";

import { createTabController } from "../build/src/ui/tabs.js";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, enabled) {
    if (enabled) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.attributes = new Map();
    this.hidden = false;
    this.tabIndex = 0;
    this.focused = false;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.({ preventDefault() {}, ...event });
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  focus() {
    this.focused = true;
  }
}

function setup(initialTab = "postcode") {
  const postcodeButton = new FakeElement({ workspaceTab: "postcode" });
  const aiButton = new FakeElement({ workspaceTab: "ai" });
  const postcodePanel = new FakeElement({ workspacePanel: "postcode" });
  const aiPanel = new FakeElement({ workspacePanel: "ai" });
  const changes = [];
  const controller = createTabController({
    buttons: [postcodeButton, aiButton],
    panels: [postcodePanel, aiPanel],
    initialTab,
    onChange: (tab) => changes.push(tab),
  });
  return {
    controller,
    postcodeButton,
    aiButton,
    postcodePanel,
    aiPanel,
    changes,
  };
}

test("postcode tools are the default visible tab", () => {
  const ui = setup();

  assert.equal(ui.controller.current(), "postcode");
  assert.equal(ui.postcodePanel.hidden, false);
  assert.equal(ui.aiPanel.hidden, true);
  assert.equal(ui.postcodeButton.getAttribute("aria-selected"), "true");
  assert.equal(ui.aiButton.tabIndex, -1);
});

test("clicking AI shows only the AI panel and records the preference", () => {
  const ui = setup();

  ui.aiButton.dispatch("click");

  assert.equal(ui.controller.current(), "ai");
  assert.equal(ui.postcodePanel.hidden, true);
  assert.equal(ui.aiPanel.hidden, false);
  assert.equal(ui.aiButton.classList.contains("is-active"), true);
  assert.deepEqual(ui.changes, ["ai"]);
});

test("arrow keys switch tabs and move keyboard focus", () => {
  const ui = setup("ai");

  ui.aiButton.dispatch("keydown", { key: "ArrowRight" });

  assert.equal(ui.controller.current(), "postcode");
  assert.equal(ui.postcodeButton.focused, true);
});

test("AI postcode actions can return to the postcode tools programmatically", () => {
  const ui = setup("ai");

  ui.controller.activate("postcode");

  assert.equal(ui.postcodePanel.hidden, false);
  assert.equal(ui.aiPanel.hidden, true);
  assert.deepEqual(ui.changes, ["postcode"]);
});
