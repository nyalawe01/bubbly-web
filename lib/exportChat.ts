// lib/exportChat.ts
//
// Per-conversation Markdown export — dependency-free (Blob + a throwaway <a
// download>), unlike a PDF export which would need a new library. Reuses the
// same {role, text} shape shareChat() already builds a transcript from in
// app/chat/page.tsx.
export function chatToMarkdown(chat: { title?: string; history?: any[] }): string {
  const lines = [`# ${chat.title || "bubbly chat"}`, ""];
  for (const m of chat.history || []) {
    lines.push(m.role === "user" ? "**You**" : "**bubbly**", "", m.text || "", "");
  }
  return lines.join("\n");
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadChatMarkdown(chat: { title?: string; history?: any[] }) {
  const safeName = (chat.title || "bubbly-chat").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  downloadBlob(`${safeName || "bubbly-chat"}.md`, chatToMarkdown(chat), "text/markdown;charset=utf-8");
}

export function downloadBlobResponse(filename: string, content: string) {
  downloadBlob(filename, content, "application/json;charset=utf-8");
}
