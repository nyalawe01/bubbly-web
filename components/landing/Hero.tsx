"use client";
import DotField from './DotField'
import { MagneticButton } from './ui/magnetic-button'
import TextRotate from './fancy/text-rotate'
import { LayoutGroup } from 'framer-motion'

export default function Hero() {
  return (
    <div id="hero" className="relative bg-white overflow-hidden min-h-[calc(100vh-120px)] flex flex-col justify-center">
      {/* Interactive Light Theme DotField Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto opacity-85">
        <DotField
          dotRadius={1.5}
          dotSpacing={16}
          bulgeStrength={67}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="rgba(79, 70, 229, 0.3)"
          gradientTo="rgba(147, 51, 234, 0.2)"
          glowColor="rgba(99, 102, 241, 0.15)"
        />
      </div>

      <div className="relative isolate z-10 px-6 py-12 sm:py-16 lg:py-20 pointer-events-none my-auto">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div>
            <LayoutGroup>
              <h1 className="text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-6xl lg:text-7xl leading-tight">
                The AI{' '}
                <TextRotate
                  texts={['Extension', 'Mobile App', 'Web App']}
                  mainClassName="text-white px-3 sm:px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden justify-center rounded-xl inline-flex shadow-lg"
                  staggerFrom="last"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-120%', opacity: 0 }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden py-0.5"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  rotationInterval={2500}
                />{' '}
                Built for the Modern Student.
              </h1>
            </LayoutGroup>

            <p className="mt-6 text-base font-medium text-pretty text-gray-600 sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto">
              Chat with an AI tutor that generates quizzes, flashcards, slides, and exams from your own notes —
              or talk it through out loud with the voice-to-voice study mode. Bubbly keeps your research organized
              in one Vault and works the same way across web, mobile, and your browser.
            </p>

            <div className="mt-8 flex items-center justify-center gap-x-5 pointer-events-auto">
              {/* Primary Solid Button (No magnetic effect for borderless) */}
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                Claim Your Free Workspace
              </a>

              {/* Secondary Bordered Button (Uses MagneticButton for bordered buttons) */}
              <MagneticButton strength={0.6} maxDistance={80}>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white/80 px-4 py-3 text-base font-semibold text-gray-800 hover:border-indigo-600 hover:text-indigo-600 transition-colors"
                >
                  See how it works <span aria-hidden="true" className="ml-1.5">→</span>
                </a>
              </MagneticButton>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-25 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          />
        </div>
      </div>
    </div>
  )
}
