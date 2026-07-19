// extension/lib/agentActions.ts
//
// Executes ONE action against a data-bubbly-id-tagged element (see
// lib/extractInteractive.ts). Self-contained for chrome.scripting.
// executeScript injection — no closures over anything outside this file.
//
// The 350ms pause + highlight before acting is for the user to SEE what's
// happening, full stop — it is not, and must never become, a timing trick
// aimed at looking human to a detector. It's a single fixed constant, not
// randomized, not tuned against anything. Every DOM interaction below uses
// the plain, standard API a real integration would use (native value
// setters + dispatched input/change events, .click()) — nothing here
// simulates a pointer path or synthesizes input at the OS/event level.
export interface AgentAction {
  type: "type" | "click" | "select" | "check" | "uncheck" | "scrollTo";
  id: number;
  value: string | null;
}

export interface AgentActionResult {
  success: boolean;
  error?: string;
}

export async function executeAgentAction(action: AgentAction): Promise<AgentActionResult> {
  const el = document.querySelector(`[data-bubbly-id="${action.id}"]`) as HTMLElement | null;
  if (!el) return { success: false, error: `That element isn't on the page anymore.` };

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const prevOutline = el.style.outline;
  const prevOffset = el.style.outlineOffset;
  el.style.outline = "3px solid #6d28d9";
  el.style.outlineOffset = "2px";

  await new Promise((resolve) => setTimeout(resolve, 350));

  try {
    switch (action.type) {
      case "type": {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        setter?.call(input, action.value ?? "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return { success: true };
      }
      case "select": {
        const select = el as HTMLSelectElement;
        const target = (action.value || "").trim();
        const option = Array.from(select.options).find((o) => o.text.trim() === target);
        if (!option) return { success: false, error: `Couldn't find the option "${action.value}".` };
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return { success: true };
      }
      case "check":
      case "uncheck": {
        const checkbox = el as HTMLInputElement;
        checkbox.checked = action.type === "check";
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        return { success: true };
      }
      case "click": {
        el.click();
        return { success: true };
      }
      case "scrollTo": {
        return { success: true }; // already scrolled into view above
      }
      default:
        return { success: false, error: `Unknown action type.` };
    }
  } finally {
    setTimeout(() => {
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
    }, 400);
  }
}

// A click is treated as a "submit" action — needing its own extra
// confirmation even after the rest of a plan was bulk-approved — if the
// extraction step (lib/extractInteractive.ts) identified it as a native
// submit control, OR its visible label strongly implies a send/pay/delete/
// confirm action. Checked client-side against data already captured during
// extraction — no extra page access needed.
export function isSubmitLikeAction(action: AgentAction, element: { isSubmit: boolean; label: string }): boolean {
  if (action.type !== "click") return false;
  return element.isSubmit || /submit|pay|delete|confirm|purchase|send|checkout/i.test(element.label);
}
