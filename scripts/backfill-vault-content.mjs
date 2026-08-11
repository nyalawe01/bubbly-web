// scripts/backfill-vault-content.mjs
//
// Phase 2 (Week 1-2): Heal the Vault. Reconstructs file_content for documents
// that are missing it, then stamps preview_status so the Vault page can render a
// fast preview instead of a broken/blank one.
//
// Two paths, in priority order:
//   1. Reconstruct from vault_embeddings chunks (always available for indexed
//      documents). This is the same fallback the Vault preview already uses.
//   2. For documents that have a storage_path (new uploads going forward), the
//      original bytes could be re-extracted through the ingestion pipeline — but
//      that pipeline relies on @/ path aliases and lives inside Next.js, so this
//      script leaves those as 'pending' for now rather than re-implementing OCR.
//
// Documents with neither chunks nor content are marked 'unavailable'.
//
// Run from the repo root:
//   node scripts/backfill-vault-content.mjs            # dry-run (no writes)
//   node scripts/backfill-vault-content.mjs --commit   # apply changes
//
// Reads .env.local for the service-role key (bypasses RLS to reach every user's
// documents). Rate-limited to a few updates per second.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- env loading (.env.local, no dotenv dep) ---
const envPath = path.resolve(process.cwd(), ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    env[line.slice(0, eq)] = line.slice(eq + 1).replace(/^["']|["']$/g, "");
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const DRY_RUN = !process.argv.includes("--commit");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Documents missing usable content, prioritized by last_accessed (most-recent first).
  const { data: docs, error } = await supabase
    .from("vault_documents")
    .select("id, file_name, file_content, storage_path, last_accessed")
    .or("file_content.is.null,file_content.eq.")
    .order("last_accessed", { ascending: false, nullsLast: true })
    .limit(1000);

  if (error) {
    console.error("Failed to list documents:", error.message);
    process.exit(1);
  }

  console.log(`Found ${docs.length} documents missing file_content. ${DRY_RUN ? "[DRY RUN — no writes]" : "[COMMITTING]"}`);

  let ready = 0;
  let unavailable = 0;
  let pendingStorage = 0;
  let failed = 0;

  for (const doc of docs) {
    // Path 1: reconstruct from embedding chunks.
    const { data: chunks, error: chunkErr } = await supabase
      .from("vault_embeddings")
      .select("content")
      .eq("document_id", doc.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (chunkErr) {
      console.warn(`  ! ${doc.id} (${doc.file_name}): chunk query failed — ${chunkErr.message}`);
      failed++;
      await sleep(200);
      continue;
    }

    const reconstructed = (chunks || []).map((c) => c.content || "").join("\n\n").trim();

    if (reconstructed) {
      if (!DRY_RUN) {
        const { error: updErr } = await supabase
          .from("vault_documents")
          .update({ file_content: reconstructed, preview_status: "ready" })
          .eq("id", doc.id);
        if (updErr) {
          console.warn(`  ! ${doc.id}: update failed — ${updErr.message}`);
          failed++;
          await sleep(200);
          continue;
        }
      }
      ready++;
      console.log(`  ✓ ${doc.id} (${doc.file_name}): reconstructed ${reconstructed.length} chars from ${chunks.length} chunks`);
    } else if (doc.storage_path) {
      // Path 2: original bytes exist but chunk reconstruction yielded nothing.
      // Leave as 'pending' — full re-extraction needs the Next.js ingestion pipeline.
      if (!DRY_RUN) {
        await supabase.from("vault_documents").update({ preview_status: "pending" }).eq("id", doc.id);
      }
      pendingStorage++;
      console.log(`  ~ ${doc.id} (${doc.file_name}): has storage_path, marked pending (needs pipeline re-extraction)`);
    } else {
      if (!DRY_RUN) {
        await supabase.from("vault_documents").update({ preview_status: "unavailable" }).eq("id", doc.id);
      }
      unavailable++;
      console.log(`  ✗ ${doc.id} (${doc.file_name}): no content, no chunks — marked unavailable`);
    }

    await sleep(150); // rate-limit our own writes
  }

  console.log(`\nDone. ready=${ready} unavailable=${unavailable} pendingStorage=${pendingStorage} failed=${failed}`);
  if (DRY_RUN) console.log("Re-run with --commit to apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
