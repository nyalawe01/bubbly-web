// extension/lib/tabAttach.ts
//
// Attaching only ever reads the tab that's active AT THE MOMENT of the
// attach click (chrome.tabs.query({active:true}) queried fresh, then
// chrome.scripting.executeScript immediately after — the same pattern
// Chrome's own docs use for activeTab) — the one reliable path.
//
// An earlier version tried to chrome.tabs.update() a BACKGROUND tab to
// "activate" it and then extract it in the same action. That doesn't work:
// activeTab is granted only by a genuine user gesture on the extension
// itself (toolbar click, keyboard shortcut, context menu) tied to whichever
// tab was active at that exact moment — switching focus programmatically
// afterward does not extend or transfer that grant. Side panels compound
// this further: Chrome's own extension team has open, unresolved threads
// about activeTab timing being unreliable across a side panel's tab
// switches, so rather than lean on an ambiguous edge case, picking a
// background tab from the list just switches to it — the user then attaches
// it as the (now genuinely) active tab, a real gesture-driven flow instead
// of a guess.
export interface OpenTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  windowId: number;
}

export interface AttachedTab {
  tabId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  text: string;
}

export async function listOpenTabs(): Promise<OpenTab[]> {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((t): t is chrome.tabs.Tab & { id: number } => t.id != null && !!t.url && !t.url.startsWith("chrome://"))
    .map((t) => ({ id: t.id, title: t.title || t.url || "Untitled tab", url: t.url!, favIconUrl: t.favIconUrl, windowId: t.windowId }));
}

// Switches to a tab in the list — does NOT attach it. The caller (App.tsx)
// shows a hint to attach again now that it's genuinely the active tab.
export async function switchToTab(tab: OpenTab): Promise<void> {
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
}

export async function extractActiveTab(extractFn: () => { title: string; text: string; url: string }): Promise<AttachedTab> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) throw new Error("Couldn't find the active tab.");

  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, func: extractFn });
  if (!result?.text) {
    throw new Error("Couldn't read this tab (it may be a restricted page like a Chrome settings page or the Web Store).");
  }
  return { tabId: activeTab.id, title: result.title || activeTab.title || "Untitled tab", url: result.url || activeTab.url || "", favIconUrl: activeTab.favIconUrl, text: result.text };
}
