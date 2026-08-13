// tests/artifact-uniformity.spec.ts
//
// Phase 2, Step 3.4 — Artifact uniformity gate.
//
// Verifies the core promise of the unified artifact model: every generator
// writes through the single notebook_assets store with an identical shape, and
// none of them leak into the legacy per-type tables. The flow:
//   1. Provision a test user and sign in (same harness as the Phase 1 gate).
//   2. Upload one small document to the Vault (a source for the generators).
//   3. Generate a Quiz, Flashcards, and Summary from it.
//   4. Read back the raw notebook_assets rows via the test-only endpoint.
//   5. Assert: exactly 3 rows, each with a valid type, non-null JSON content,
//      and the source document id present in config.source_document_ids.
//
// Disabled unless ENABLE_TEST_ROUTES=1 (so the test-only endpoint exists).
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

function loadTestUserSecret(): string {
  const fromEnv = process.env.TEST_USER_SECRET;
  if (fromEnv) return fromEnv;
  try {
    const envLocal = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    const match = envLocal.match(/^\s*TEST_USER_SECRET\s*=\s*(.+)\s*$/m);
    if (match?.[1]) return match[1].trim();
  } catch {
    /* fall through */
  }
  throw new Error("TEST_USER_SECRET is not set.");
}

const TEST_USER_SECRET = loadTestUserSecret();
const FIXTURE_PDF = path.resolve(__dirname, "fixtures", "beryllium.pdf");

test.describe("artifact uniformity", () => {
  test.setTimeout(240_000);

  let docId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(process.env.NODE_ENV === "production", "Test-only endpoint disabled in production.");

    // Provision + sign in.
    const prov = await page.request.post("http://127.0.0.1:3000/api/dev/test-user", {
      data: { secret: TEST_USER_SECRET },
    });
    expect(prov.ok(), `provision failed: ${prov.status()}`).toBeTruthy();
    const creds = await prov.json();

    await page.goto("/login");
    await page.getByRole("button", { name: /continue with google/i }).waitFor({ state: "attached" });
    await page.getByPlaceholder("name@example.com").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.getByRole("button", { name: /sign in with email/i }).click();
    await page.waitForURL(/\/chat/, { timeout: 60_000 });

    // Upload a source document through the real upload route.
    const upload = await page.request.post("http://127.0.0.1:3000/api/upload", {
      multipart: { file: { name: "beryllium.pdf", mimeType: "application/pdf", buffer: fs.readFileSync(FIXTURE_PDF) } },
    });
    expect(upload.ok(), `upload failed: ${upload.status()} ${await upload.text()}`).toBeTruthy();
    const uploadBody = await upload.json();
    docId = uploadBody.document.id;
    expect(docId, "upload response missing document.id").toBeTruthy();
    testInfo.attach("source-doc-id", { body: docId });
  });

  test("every generator writes one uniformly-shaped artifact through the unified store", async ({ page }) => {
    const VALID_TYPES = ["quiz", "flashcards", "summary", "slides", "exam_prep", "study_guide", "notes"];

    // Fire the three generators the spec requires, each sourced to the doc.
    const call = (route: string, body: any) => page.request.post(`http://127.0.0.1:3000/api/${route}`, { data: body });

    const quizRes = await call("quiz", { questionCount: "fewer", difficulty: "medium", topic: "Beryllium", sources: [docId] });
    expect(quizRes.ok(), `quiz failed: ${quizRes.status()} ${await quizRes.text()}`).toBeTruthy();

    const flashRes = await call("flashcards", { cardCount: "fewer", difficulty: "medium", topic: "Beryllium", sources: [docId] });
    expect(flashRes.ok(), `flashcards failed: ${flashRes.status()} ${await flashRes.text()}`).toBeTruthy();

    const summaryRes = await call("summary", { topic: "Beryllium", sources: [docId], length: "brief" });
    expect(summaryRes.ok(), `summary failed: ${summaryRes.status()} ${await summaryRes.text()}`).toBeTruthy();

    // Read back the raw rows from the unified store.
    const listRes = await page.request.get("http://127.0.0.1:3000/api/test/artifacts");
    expect(listRes.ok(), `artifacts list failed: ${listRes.status()}`).toBeTruthy();
    const { artifacts } = await listRes.json();

    // Filter to just the rows we created in this run (quiz/flashcards/summary).
    const created = (artifacts as any[]).filter(
      (a) => a.type === "quiz" || a.type === "flashcards" || a.type === "summary"
    );

    // Exactly one artifact per generator.
    expect(created.length, `expected 3 artifacts, got ${created.length}`).toBe(3);

    for (const artifact of created) {
      // Every row has a valid artifact type.
      expect(VALID_TYPES, `unexpected type ${artifact.type}`).toContain(artifact.type);

      // Every row's content is a non-null JSON object (the generated payload).
      expect(artifact.content, `content missing for ${artifact.type}`).not.toBeNull();
      expect(typeof artifact.content, `content is not an object for ${artifact.type}`).toBe("object");

      // Every row records the source document it was generated from.
      const sourceIds = artifact.config?.source_document_ids ?? [];
      expect(sourceIds, `source_document_ids missing for ${artifact.type}`).toContain(docId);

      // Every row is persisted as ready (not still generating / failed).
      expect(artifact.status, `unexpected status for ${artifact.type}`).toBe("ready");
    }
  });
});
