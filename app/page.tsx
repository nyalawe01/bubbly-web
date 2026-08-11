import type { Metadata } from "next";
import TopBanner from "@/components/landing/TopBanner";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problems from "@/components/landing/Problems";
import StudySystem from "@/components/landing/StudySystem";
import Upload from "@/components/landing/Upload";
import AITutor from "@/components/landing/AITutor";
import StudyGenerators from "@/components/landing/StudyGenerators";
import Vault from "@/components/landing/Vault";
import HowItWorks from "@/components/landing/HowItWorks";
import BackgroundAI from "@/components/landing/BackgroundAI";
import StudyAnywhere from "@/components/landing/StudyAnywhere";
import VoiceVisual from "@/components/landing/VoiceVisual";
import Science from "@/components/landing/Science";
import Compare from "@/components/landing/Compare";
import Stats from "@/components/landing/Stats";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Bubbly | Turn Your Study Materials Into Your Personal AI Study System",
  description:
    "Upload your notes, PDFs, slides, or text. Bubbly turns them into summaries, flashcards, quizzes, practice exams, presentations, and an AI tutor that understands what you're studying.",
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
        <AITutor />
        <StudyGenerators />
        <Vault />
        <HowItWorks />
        <BackgroundAI />
        <StudyAnywhere />
        <VoiceVisual />
        <Science />
        <Compare />
        <Stats />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
