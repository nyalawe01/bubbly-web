// lib/api/vaultUpload.ts
//
// Every generator (quiz/flashcards/slides/summary/exam) expects `sources` as an
// array of already-uploaded vault document IDs, but the modals collect raw
// browser File objects. This uploads them through the existing /api/upload route
// first and returns the resulting document IDs.

export async function uploadFilesToVault(files: File[]): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Failed to upload ${file.name}`);
    }
    ids.push(data.document.id);
  }
  return ids;
}
