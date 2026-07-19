// extension/lib/extractInteractive.ts
//
// Injected on demand via chrome.scripting.executeScript, same activeTab-
// scoped model as lib/extractPage.ts — must be fully self-contained (no
// closures over anything outside this function; executeScript serializes it
// and runs it in the page's own isolated world).
//
// The "X-ray": walks the DOM for interactive elements, tags each with a
// stable data-bubbly-id attribute (so a LATER, separate executeScript call
// can re-select the exact same element by that attribute — script
// injections don't share JS state/references across calls), and returns a
// simplified list instead of raw HTML, which is both far cheaper in tokens
// and the actual point of the exercise: the model only ever sees "field 3
// is a text input labeled First Name," never the page's full markup.
export interface InteractiveElement {
  id: number;
  tag: string;
  type: string;
  label: string;
  placeholder: string;
  currentValue: string;
  isSubmit: boolean;
}

export function extractInteractiveElements(): InteractiveElement[] {
  const SELECTOR = "input, textarea, select, button, a[href], [role='button'], [contenteditable='true']";
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));

  const isVisible = (el: HTMLElement): boolean => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const labelFor = (el: HTMLElement): string => {
    const aria = el.getAttribute("aria-label");
    if (aria?.trim()) return aria.trim();

    if (el.id) {
      const labelled = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (labelled?.textContent?.trim()) return labelled.textContent.trim();
    }
    const wrappingLabel = el.closest("label");
    if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent.trim().slice(0, 200);

    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      const placeholder = (el as HTMLInputElement).placeholder;
      if (placeholder?.trim()) return placeholder.trim();
      const name = (el as HTMLInputElement).name;
      if (name?.trim()) return name.trim();
    }
    if (el.textContent?.trim()) return el.textContent.trim().slice(0, 200);
    const title = el.getAttribute("title");
    if (title?.trim()) return title.trim();
    return "";
  };

  let nextId = 1;
  const results: InteractiveElement[] = [];

  for (const el of nodes) {
    if ((el as HTMLInputElement).disabled) continue;
    if (!isVisible(el)) continue;

    const id = nextId++;
    el.setAttribute("data-bubbly-id", String(id));

    const tag = el.tagName.toLowerCase();
    const type = tag === "input" ? (el as HTMLInputElement).type || "text" : tag;
    const placeholder = tag === "input" || tag === "textarea" ? (el as HTMLInputElement).placeholder || "" : "";
    const currentValue = tag === "input" || tag === "textarea" || tag === "select" ? (el as HTMLInputElement).value || "" : "";
    // A <button>'s .type IDL attribute already defaults to "submit" per spec
    // when unset inside a form, so this check alone is accurate — no need to
    // separately handle a missing type attribute.
    const isSubmit = (tag === "button" && (el as HTMLButtonElement).type === "submit") || (tag === "input" && type === "submit");

    results.push({ id, tag, type, label: labelFor(el), placeholder, currentValue, isSubmit });
  }

  return results;
}
