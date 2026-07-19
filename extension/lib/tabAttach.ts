// extension/lib/tabAttach.ts
//
// Lets the user attach a specific open tab as chat context — not necessarily
// the one currently active. The "tabs" permission (wxt.config.ts) only
// unlocks metadata (title/url/favIconUrl) for every open tab; it does NOT
// grant content access to a tab that isn't active. So picking a background
// tab activates it first (bringing its window forward too, if it's in a
// different one) — same activeTab boundary as everywhere else in this
// extension, deliberately not broadened to host_permissions/<all_urls>.
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

export async function activateAndExtractTab(tab: OpenTab, extractFn: () => { title: string; text: string; url: string }): Promise<AttachedTab> {
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });

  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractFn });
  if (!result?.text) {
    throw new Error("Couldn't read that tab (it may be a restricted page like a Chrome settings page or the Web Store).");
  }
  return { tabId: tab.id, title: result.title || tab.title, url: result.url || tab.url, favIconUrl: tab.favIconUrl, text: result.text };
}
