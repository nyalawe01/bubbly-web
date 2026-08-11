"use client";
import DotField from './DotField'
import { MagneticButton } from './ui/magnetic-button'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

export default function Hero() {
  return (
    <section id="hero" className="relative bg-white overflow-hidden">
      {/* Subtle interactive DotField background */}
      <div className="absolute inset-0 z-0 pointer-events-auto opacity-40">
        <DotField
          dotRadius={1.2}
          dotSpacing={18}
          bulgeStrength={55}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="rgba(79, 70, 229, 0.2)"
          gradientTo="rgba(147, 51, 234, 0.12)"
          glowColor="rgba(99, 102, 241, 0.1)"
        />
      </div>

      <div className="relative isolate z-10 mx-auto max-w-7xl px-6 pt-16 pb-16 sm:pt-24 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge - removed "The #1" claim */}
          <div className="inline-flex items-center gap-x-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI Workspace for Students
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            Turn Your Study Materials Into Your{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Personal AI Study System
            </span>
            .
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg font-medium text-pretty text-gray-600 sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Upload your notes, PDFs, slides, or text. Bubbly turns them into summaries,
            flashcards, quizzes, practice exams, presentations, and an AI tutor that
            understands what you&apos;re studying.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex items-center justify-center gap-x-4 pointer-events-auto">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              Start Studying Free
              <ArrowRightIcon className="size-5" aria-hidden="true" />
            </a>
            <MagneticButton strength={0.6} maxDistance={80}>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white/80 px-5 py-3.5 text-base font-semibold text-gray-800 hover:border-indigo-600 hover:text-indigo-600 transition-colors"
              >
                See How It Works
              </a>
            </MagneticButton>
          </div>
        </div>

        {/* Hero Visual Placeholder - would show workspace screenshot */}
        <div className="mt-16 relative">
          <div className="aspect-video rounded-2xl border border-gray-200 bg-gray-50 shadow-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p className="text-center px-8">
                Workspace Preview<br />
                <span className="text-sm">AI Tutor • Vault • Flashcards • Quiz • Study Assets</span>
              </p>
            </div>
            {/* In production, replace with actual workspace screenshot/video */}
          </div>
        </div>
      </div>
    </section>
  )
}
