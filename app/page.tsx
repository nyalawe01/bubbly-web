import type { Metadata } from "next";
import TopBanner from "@/components/landing/TopBanner";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problems from "@/components/landing/Problems";
import StudySystem from "@/components/landing/StudySystem";
import Upload from "@/components/landing/Upload";
import HowItWorks from "@/components/landing/HowItWorks";
import Science from "@/components/landing/Science";
import Compare from "@/components/landing/Compare";
import StudyAnywhere from "@/components/landing/StudyAnywhere";
import Stats from "@/components/landing/Stats";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Bubbly | The #1 AI Study Tool for Modern Students",
  description:
    "Turn lectures and any material into a complete, science-backed AI study system — AI notes, summaries, flashcards, quizzes, and a 24/7 AI tutor grounded in your own notes. Free to start, right in your browser.",
};

export default function LandingPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto bg-white">
      <div className="sticky top-0 z-50">
        <TopBanner />
        <Navbar />
      </div>

      <main>
        <Hero />
        <Problems />
        <StudySystem />
        <Upload />
        <HowItWorks />
        <Science />
        <Compare />
        <StudyAnywhere />
        <Stats />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
