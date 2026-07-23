import type { Metadata } from "next";
import Link from "next/link";
import { colors } from "@/components/theme/ThemeProvider";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Use - bubbly",
  description: "Terms of Use for bubbly, the AI-powered academic platform.",
};

const EFFECTIVE_DATE = "July 23, 2026";
const CONTACT_EMAIL = "nyalawe2004@gmail.com";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" effectiveDate={EFFECTIVE_DATE}>
      <LegalSection title="1. Agreement to these terms">
        <p>
          bubbly ("bubbly," "we," "us," or "our") is an independently developed academic platform
          available as a web app, a mobile app, and a browser extension. By creating an account or
          using bubbly in any form, you agree to these Terms of Use. If you do not agree, please
          don't use the service.
        </p>
      </LegalSection>

      <LegalSection title="2. What bubbly does">
        <p>
          bubbly helps you study by chatting with an AI assistant, generating quizzes, flashcards,
          slides, summaries, and practice exams from your own material, storing documents you upload
          ("Vault"), and offering a voice-based tutoring conversation mode. Some features call
          third-party AI providers to produce a response — see our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          for which ones and why.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and eligibility">
        <p>
          You need an account to use bubbly, created with an email/password or Google sign-in. You're
          responsible for keeping your login credentials secure and for anything that happens under
          your account. bubbly's onboarding includes an age confirmation step; if you're old enough to
          need parental or guardian permission to use an online service in your country, please get it
          before signing up.
        </p>
      </LegalSection>

      <LegalSection title="4. Your content">
        <p>
          You keep ownership of whatever you upload or write into bubbly — notes, documents, chat
          messages, anything in your Vault. By using the service, you give us permission to process
          that content (including sending relevant pieces of it to the AI providers listed in the
          Privacy Policy) solely to generate the responses, summaries, quizzes, and other outputs you
          asked for. We don't sell your content or use it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="5. AI-generated content — please read this one">
        <p>
          Chat replies, quizzes, flashcards, summaries, exams, and anything else bubbly generates are
          produced by AI models and can be incomplete, outdated, or simply wrong. Always check
          important facts yourself before relying on them, and don't submit AI-generated material as
          your own original work where that would violate your school's academic integrity policy —
          that's on you, not on bubbly.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to use bubbly to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Break the law, or generate content that's illegal, harassing, or hateful.</li>
          <li>Try to extract, abuse, or overload the underlying AI models or infrastructure.</li>
          <li>Upload content you don't have the right to upload (e.g. copyrighted material you don't own or have permission to use).</li>
          <li>Impersonate someone else or misrepresent your affiliation with any person or organization.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Termination">
        <p>
          You can stop using bubbly and delete your account at any time from Settings. We may suspend
          or terminate accounts that violate these terms or abuse the service, with notice where
          reasonably possible.
        </p>
      </LegalSection>

      <LegalSection title="8. No warranty, limited liability">
        <p>
          bubbly is provided "as is," without warranties of any kind. As an independently developed
          app, we can't guarantee it will always be available, accurate, or error-free. To the extent
          allowed by law, bubbly and its developer aren't liable for indirect or consequential damages
          arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to these terms">
        <p>
          We may update these terms as the product evolves. Meaningful changes will update the
          effective date above; continuing to use bubbly after a change means you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these terms? Reach out at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
