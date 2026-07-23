import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import TopBanner from "@/components/landing/TopBanner";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import BentoGrid from "@/components/landing/BentoGrid";
import SolutionHero from "@/components/landing/SolutionHero";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/landing/ScrollReveal";

// Scoped to this page only (via the wrapper div's className below) — the rest
// of the app keeps its own Inter/Lora font system (app/layout.tsx). These two
// match eduos-site's original design exactly without touching the app-wide
// --font-sans/--font-body variables everything else already depends on.
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-landing-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-landing-display", display: "swap" });

export const metadata: Metadata = {
  title: "Bubbly | The AI Workspace Built for the Modern Student",
  description: "Chat with an AI tutor that generates quizzes, flashcards, slides, and exams from your own notes — free to start, on web, mobile, and your browser.",
};

export default function LandingPage() {
  return (
    <div
      className={`${plusJakarta.variable} ${spaceGrotesk.variable} h-[100dvh] overflow-y-auto bg-white`}
      style={{ fontFamily: "var(--font-landing-sans)" }}
    >
      <style>{`#landing-root h1, #landing-root h2, #landing-root h3 { font-family: var(--font-landing-display); }`}</style>
      <div id="landing-root">
        {/* Top Banner & Navigation Bar Layout */}
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
    </div>
  );
}
