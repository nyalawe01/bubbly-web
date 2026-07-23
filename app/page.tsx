import type { Metadata } from "next";
import TopBanner from "@/components/landing/TopBanner";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import BentoGrid from "@/components/landing/BentoGrid";
import SolutionHero from "@/components/landing/SolutionHero";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/landing/ScrollReveal";

export const metadata: Metadata = {
  title: "Bubbly | The AI Workspace Built for the Modern Student",
  description: "Chat with an AI tutor that generates quizzes, flashcards, slides, and exams from your own notes — free to start, on web, mobile, and your browser.",
};

// No custom Google Fonts here (Plus Jakarta Sans/Space Grotesk, from the
// original eduos-site design) — next/font/google fetches font files over the
// network at build time, and that fetch (a first-time request for these two
// specific fonts, no prior successful build to cache from) was the actual
// cause of the Vercel build failing outright ("socket hang up", confirmed via
// a local `next build` needing 4 retries on the exact same fetch before it
// happened to succeed). Inherits the app's existing Inter font (--font-body,
// app/layout.tsx) instead — already proven to build reliably everywhere else.
export default function LandingPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto bg-white">
      <div className="sticky top-0 z-50">
        <TopBanner />
        <Navbar />
      </div>

      {/* Main Page Content with Smooth Scroll Reveal */}
      <main>
        <Hero />

        <ScrollReveal>
          <Features />
        </ScrollReveal>

        <ScrollReveal>
          <CTA />
        </ScrollReveal>

        <ScrollReveal>
          <BentoGrid />
        </ScrollReveal>

        <ScrollReveal>
          <SolutionHero />
        </ScrollReveal>

        <Footer />
      </main>
    </div>
  );
}
