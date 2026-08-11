// tests/attachment-grounding.spec.ts
//
// Phase 1.4 — E2E GATE.
//
// Verifies the trust-gap fix end-to-end: a PDF a student attaches to chat is
// actually read by the AI, so the reply is *grounded* in the file (not a guess),
// and the file shows up in the message's Sources panel.
//
// Flow:
//   1. Create an ephemeral test account via the gated /api/dev/test-user fixture.
//   2. Sign in through the real /login form (exercises auth + cookie session).
//   3. Attach tests/fixtures/beryllium.pdf in the composer.
//   4. Ask a question only answerable by reading that file.
//   5. Assert the answer contains the grounded fact and that the file appears in Sources.
//
// Run: npm run test:e2e  (or)  npx playwright test attachment-grounding
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "node:fs";

// Resolve the fixture-endpoint secret without ever hardcoding it:
//   1. process.env — set by the CI workflow's `env:` block, or exported locally.
//   2. .env.local — gitignored; the natural place for a local secret. Parse it by
//      hand (no dotenv dep) so CI/local agree on a single value.
function loadTestUserSecret(): string {
  const fromEnv = process.env.TEST_USER_SECRET;
  if (fromEnv) return fromEnv;

  try {
    const envLocal = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    const match = envLocal.match(/^\s*TEST_USER_SECRET\s*=\s*(.+)\s*$/m);
    if (match?.[1]) return match[1].trim();
  } catch {
    /* .env.local absent — fall through to the error below */
  }

  throw new Error(
    "TEST_USER_SECRET is not set. Export it locally or add it to .env.local / a GitHub secret (CI)."
  );
}

const TEST_USER_SECRET = loadTestUserSecret();
const FIXTURE_PDF = path.resolve(__dirname, "fixtures", "beryllium.pdf");

test.describe("chat attachment grounding", () => {
  // Auth + Next dev cold-start + streaming AI replies can all take a while on a
  // single worker; give the suite room before the test-level timeout aborts it.
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }, testInfo) => {
    // 1) Provision a real (email, password) pair through the test-only fixture
    //    endpoint. Email confirmation is bypassed server-side so the account is
    //    immediately sign-inable.
    const res = await page.request.post(
      "http://127.0.0.1:3000/api/dev/test-user",
      { data: { secret: TEST_USER_SECRET } }
    );
    if (!res.ok()) {
      const body = await res.text();
      throw new Error(
        `Could not provision test user (status ${res.status()}): ${body.slice(0, 200)}`
      );
    }
    const creds = await res.json();
    testInfo.attach("provisioned-user", { body: JSON.stringify(creds) });

    // Diagnostics: surface any client-side errors the login page emits.
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        console.log(`PAGE ${msg.type()}: ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));

    // 2) Sign in through the real login surface so the browser carries a genuine
    //    session cookie into /chat.
    await page.goto("/login");
    await test.step("sign in as provisioned user", async () => {
      await page.getByRole("button", { name: /continue with google/i }).waitFor({
        state: "attached",
      });
      await page.getByPlaceholder("name@example.com").fill(creds.email);
      await page.getByPlaceholder("Password").fill(creds.password);
      await page.getByRole("button", { name: /sign in with email/i }).click();
    });

    // Wait until the workspace is fully authenticated and the composer is ready.
    try {
      await page.waitForURL(/\/chat/, { timeout: 60_000 });
    } catch (err) {
      const banner = await page
        .$eval("body", (b) => b.textContent)
        .catch(() => "");
      console.log("LOGIN FAILED — page text:", banner?.slice(0, 2000));
      fs.writeFileSync(
        path.resolve(`./login-failure.html`),
        await page.content()
      );
      console.log("LOGIN FAILED — url:", page.url());
      throw err;
    }
    await page
      .locator('textarea[placeholder^="Message bubbly"]')
      .or(page.locator("textarea"))
      .first()
      .waitFor({ state: "visible" });
  });

  test("attached PDF is read by the AI and surfaced in Sources", async ({
    page,
  }) => {
    // Debug: log every network response so a stalled /process request is visible.
    page.on("response", (r) => {
      const u = r.url();
      if (u.includes("/api/chat/attachments/process")) {
        console.log(
          `NETWORK /process status=${r.status()} url=${u.slice(-80)}`
        );
      }
    });
    page.on("requestfailed", (r) => {
      if (r.url().includes("googleapis.com") || r.url().includes("/process")) {
        console.log(
          "NETWORK FAILED",
          r.url().slice(-80),
          r.failure()?.errorText
        );
      }
    });
    // 3) Attach the fixture PDF via the hidden file input (opened through the
    //    composer's Attach affordance). The input only renders once the upload
    //    grid is open, so expand it first.
    await page.getByRole("button", { name: /attach/i }).click();
    await page.locator("input[type=file]").first().setInputFiles(FIXTURE_PDF);

    // The file input's onChange auto-closes the grid and shows a thumbnail. The
    // onAttach useEffect then runs OCR extraction via /api/chat/attachments/process
    // (Gemini Vision on the PDF), which takes ~10-20s cold. Wait for it to finish.
    await expect(page.locator("text=Indexing…")).toBeHidden({
      timeout: 120_000,
    });
    // The spinner clearing above is the authoritative signal: it only hides once
    // the fetch to /api/chat/attachments/process succeeds and React flips
    // indexing:false — which can only happen for a real attached file.

    // 4) Ask a question that can only be answered from the attached file.
    const textarea = page.locator("textarea").first();
    await textarea.fill(
      "Based on the file I just attached, what is the atomic number of Beryllium? Answer in a single number."
    );
    // Enter submits (ChatInput sends on Enter without Shift).
    await textarea.press("Enter");

    // 5) The reply streams in. Wait until streaming completes: the model's
    //    trailing [SOURCES] tag renders a "Referenced from … source(s)" line below
    //    the finished answer, which only appears when isGenerating === false.
    // The chat route compiles on first hit under `next dev`, and the model's first
    // streamed reply (including its trailing [SOURCES] tag) can take a while on a
    // cold box — give it generous headroom so CI isn't flaky.
    test.slow();
    const lastAi = page.locator('[data-testid="ai-message"]').last();
    const sourcesChip = lastAi.locator("text=/Referenced from/i");
    await expect(sourcesChip).toBeVisible({ timeout: 90_000 });

    // Grounded answer: must state the number found in the PDF (not hallucinate).
    await expect(lastAi.locator(".prose")).toContainText(
      /\b4\b/,
      { timeout: 10_000 }
    );

    // 6) Sources panel carries the attachment's filename — proves the AI actually
    //    grounded the answer in the attached file, not a guess. The SourceViewerModal
    //    is rendered inside the AIMessage wrapper (which carries data-testid), so
    //    scope to it to avoid matching the mobile-menu overlay that shares the same
    //    `fixed inset-0 bg-black/60` classes, and any "Sources" prose the model
    //    emitted in its reply.
    await sourcesChip.click();
    const modal = lastAi.locator("div.fixed.inset-0.bg-black\\/60");
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal.locator("text=beryllium.pdf")).toBeVisible({
      timeout: 5_000,
    });
  });
});
