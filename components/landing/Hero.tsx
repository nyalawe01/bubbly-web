"use client";
import DotField from './DotField'
import { MagneticButton } from './ui/magnetic-button'
import { PlayCircleIcon } from '@heroicons/react/20/solid'

const universities = [
  'Princeton University',
  'Stanford University',
  'MIT',
  'University of Cambridge',
  'University of Michigan',
  'University of Toronto',
  'Yale University',
  'National University of Singapore',
  'University of Maryland',
  'University of Southern California',
]

export default function Hero() {
  return (
    <div id="hero" className="relative bg-white overflow-hidden">
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
          {/* Badge */}
          <div className="inline-flex items-center gap-x-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 1c.3 0 .57.17.7.44l1.34 2.7 2.98.43c.33.05.6.29.68.61s-.06.68-.3.87l-2.16 2.1.51 2.97a.75.75 0 0 1-1.09.79L10 10.7l-2.66 1.4a.75.75 0 0 1-1.09-.79l.51-2.96L4.6 6.24a.75.75 0 0 1 .38-1.28l2.98-.43 1.34-2.7A.75.75 0 0 1 10 1Z"
                clipRule="evenodd"
              />
            </svg>
            The #1 AI Study Tool for Modern Students
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            Study Smarter with AI.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Remember More. Stress Less.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg font-medium text-pretty text-gray-600 sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Turn lectures, notes, and any material into a complete, science-backed AI study
            system — so you understand more, remember longer, and stress less.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex items-center justify-center gap-x-4 pointer-events-auto">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              Start My Free Study Session
            </a>
            <MagneticButton strength={0.6} maxDistance={80}>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white/80 px-5 py-3.5 text-base font-semibold text-gray-800 hover:border-indigo-600 hover:text-indigo-600 transition-colors"
              >
                <PlayCircleIcon className="size-5 mr-2 text-indigo-600" aria-hidden="true" />
                Watch How It Works
              </a>
            </MagneticButton>
          </div>
        </div>

        {/* Trusted-by strip */}
        <div className="mt-20 sm:mt-24">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
            Trusted by students at top universities
          </p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="marquee-track flex w-max items-center gap-x-12 pr-12">
              {[...universities, ...universities].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap text-lg font-semibold text-gray-400"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
