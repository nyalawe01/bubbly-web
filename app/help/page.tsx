import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Help Center - bubbly",
  description: "Frequently asked questions and support for bubbly.",
};

const CONTACT_EMAIL = "nyalawe2004@gmail.com";

export default function HelpPage() {
  return (
    <LegalLayout title="Help Center">
      <LegalSection title="What is bubbly?">
        <p>
          bubbly is an AI study assistant. Chat with it about anything you're learning, upload your
          notes or textbooks to your Vault, and generate quizzes, flashcards, slides, summaries, and
          practice exams from that material — on the web, on mobile, or through the browser extension.
        </p>
      </LegalSection>

      <LegalSection title="How do the generators work?">
        <p>
          Quiz, flashcard, slide, summary, and exam generation all read from whatever you've uploaded
          to your Vault (or a topic you type in directly) and use AI to produce study material from it.
          Results are saved to your history so you can revisit them later.
        </p>
      </LegalSection>

      <LegalSection title="What is the voice conversation feature?">
        <p>
          On mobile, tapping the composer's button when there's no text started opens a live,
          spoken back-and-forth with the AI tutor — it listens, responds out loud, and adapts like a
          real tutoring conversation, instead of typed chat.
        </p>
      </LegalSection>

      <LegalSection title="How do I delete my data or my account?">
        <p>
          Open Settings → Data to export or delete all your chats, or Settings → Profile to delete your
          account entirely. Account deletion removes your data from our systems — see the{" "}
          <a href="/privacy" className="underline">Privacy Policy</a> for details.
        </p>
      </LegalSection>

      <LegalSection title="Is my data used to train AI models?">
        <p>
          Not unless you opt in. Settings → Data has an "Improve the model for everyone" toggle, off by
          default — see the Privacy Policy for what that does today.
        </p>
      </LegalSection>

      <LegalSection title="Still need help?">
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>{" "}
          and describe what you're running into — screenshots help.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
