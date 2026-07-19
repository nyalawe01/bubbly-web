// extension/lib/extractPage.ts
//
// Injected on demand via chrome.scripting.executeScript (activeTab model —
// no manifest content_scripts entry, so nothing runs until the user actually
// invokes the extension). Must be fully self-contained: executeScript
// serializes this function and runs it in the page's isolated world, so it
// can't close over anything from the extension's own modules.
//
// Deliberately simple for the MVP (strip obvious noise, then innerText)
// rather than a full Readability.js port — good enough for "what am I
// reading," upgradeable later without touching the calling code.
export function extractPageText(): { title: string; text: string; url: string } {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style, nav, header, footer, aside, noscript, iframe, svg, form").forEach((el) => el.remove());
  const text = (clone.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
  return { title: document.title, text: text.slice(0, 20000), url: location.href };
}
