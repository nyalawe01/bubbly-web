import { MagneticButton } from './ui/magnetic-button'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
      {/* Glow accents */}
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 left-1/4 h-72 w-[36rem] rounded-full bg-purple-600/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-5xl">
          Stop studying harder. Start studying smarter.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-gray-300">
          Bring your notes. Bubbly builds the study system.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <MagneticButton strength={0.6} maxDistance={80}>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Start Studying Free
              <ArrowRightIcon className="size-5" aria-hidden="true" />
            </a>
          </MagneticButton>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-8 py-4 text-base font-semibold text-gray-200 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-colors"
          >
            Explore Bubbly
          </a>
        </div>
      </div>
    </section>
  )
}
