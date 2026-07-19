// extension/entrypoints/background.ts
//
// Two jobs: (1) make the toolbar icon open the side panel directly instead
// of a popup, (2) own the "Ask bubbly about this" context menu — since
// chrome.contextMenus.onClicked already hands over the selected text
// directly (info.selectionText), no content script or page injection is
// needed for that path. Selected text is stashed in chrome.storage.session
// (in-memory, cleared on browser close) for the side panel to pick up once
// it opens, since there's no direct return channel from a context menu click
// to a not-yet-open side panel.
export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "ask-bubbly-selection",
      title: "Ask bubbly about this",
      contexts: ["selection"],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "ask-bubbly-selection" || !info.selectionText) return;
    await chrome.storage.session.set({
      pendingContext: { text: info.selectionText, source: "selection", url: tab?.url || "" },
    });
    if (tab?.windowId != null) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
});
