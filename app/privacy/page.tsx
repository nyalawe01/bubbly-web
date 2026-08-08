import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy - bubbly",
  description: "How bubbly collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "July 23, 2026";
const CONTACT_EMAIL = "nyalawe2004@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <LegalSection title="1. Who this covers">
        <p>
          bubbly is developed and operated by an individual developer, not a registered company. This
          policy applies to the bubbly web app, mobile app, and browser extension, all of which share
          the same account and backend. Your chats are never shared for ads or marketing.
        </p>
      </LegalSection>

      <LegalSection title="2. Data we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Account data:</strong> your email and password.</li>
          <li><strong>Content you create:</strong> chat messages and conversation history, documents and files you upload to your Vault, and anything you generate — quizzes, flashcards, slides, summaries, practice exams, diagrams, and images.</li>
          <li><strong>Usage preferences:</strong> theme, language, and interface settings you choose in Settings.</li>
        </ul>
        <p>
          We don't collect payment information (bubbly doesn't currently charge for anything), and we
          don't run advertising or analytics trackers.
        </p>
      </LegalSection>

      <LegalSection title="3. How your data is stored">
        <p>
          Everything above is stored in Supabase (our database, file storage, and authentication
          provider), scoped to your account with row-level security so only you can read your own
          chats, documents, and generated content.
        </p>
      </LegalSection>

      <LegalSection title="4. Third parties that process your content">
        <p>
          To actually generate a response, relevant parts of your message (and, if you've attached
          them, your document text or images) are sent to whichever AI provider is handling that
          request — currently Groq, OpenRouter (which itself routes to providers like DeepSeek and
          Google Gemini), Google's Gemini API directly, and fal.ai for image generation. These
          providers process the content to return a result to you; they are not authorized to use it
          for their own advertising. If you use the web-search feature, your search query (not your
          account identity) is sent to public search APIs (DuckDuckGo, Wikipedia, SearXNG) to fetch
          results.
        </p>
      </LegalSection>

      <LegalSection title={'5. "Improve the model for everyone"'}>
        <p>
          In Settings, you can opt in to letting your content be used to improve bubbly's underlying
          models in the future. This is off by default. Turning it on doesn't change anything about
          how your account works today — no such training pipeline exists yet — it simply records
          your preference for if and when one is built.
        </p>
      </LegalSection>

      <LegalSection title="6. Your controls">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Delete an individual chat, or use "Delete all chats" in Settings to clear your entire chat history.</li>
          <li>Export a copy of your data from Settings at any time.</li>
          <li>Delete your account entirely from Settings — this removes your account and associated data from our systems.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Children's privacy">
        <p>
          bubbly is built as a study tool and may be used by students, including those under 18.
          Account creation includes an age-confirmation step during onboarding. We don't knowingly
          collect personal information from children in a manner inconsistent with applicable law; if
          you believe a child has provided us data improperly, contact us and we'll remove it.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          All traffic to bubbly is encrypted in transit (HTTPS), and data access is restricted by
          per-user database policies. No system is perfectly secure, but we take reasonable steps to
          protect your information.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          If this policy changes in a meaningful way, we'll update the effective date above. Continued
          use of bubbly after a change means you accept the update.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about your data or this policy? Reach out at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
