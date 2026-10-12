const VALID_TABS = new Set(["postcode", "ai"]);

export function normalizeWorkspaceTab(value) {
  return VALID_TABS.has(value) ? value : "postcode";
}

/**
 * Small, DOM-agnostic tab controller shared by popup and side-panel layouts.
 * The caller owns persistence; this module only manages visibility and ARIA.
 */
export function createTabController({
  buttons,
  panels,
  initialTab = "postcode",
  onChange = () => {},
}) {
  const tabButtons = Array.from(buttons || []);
  const tabPanels = Array.from(panels || []);
  let activeTab = normalizeWorkspaceTab(initialTab);

  function render({ focus = false, notify = false } = {}) {
    for (const button of tabButtons) {
      const selected = button.dataset.workspaceTab === activeTab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle("is-active", selected);
      if (selected && focus) button.focus();
    }

    for (const panel of tabPanels) {
      panel.hidden = panel.dataset.workspacePanel !== activeTab;
    }

    if (notify) onChange(activeTab);
  }

  function activate(tab, options = {}) {
    activeTab = normalizeWorkspaceTab(tab);
    render({ focus: !!options.focus, notify: options.notify !== false });
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      activate(button.dataset.workspaceTab);
    });

    button.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
      if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      }
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabButtons.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activate(tabButtons[nextIndex].dataset.workspaceTab, { focus: true });
    });
  });

  render();

  return {
    activate,
    current: () => activeTab,
  };
}
