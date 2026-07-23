"use client";
import { useEffect, useRef, useState } from 'react'
import { MagneticButton } from './ui/magnetic-button'

export default function CTA() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div id="how-it-works" ref={sectionRef} className="relative bg-gray-900 transition-colors duration-1000">
      {/* Unique Light-to-Dark Scroll Transition Divider */}
      <div className="relative w-full overflow-hidden pointer-events-none">
        {/* Soft top gradient bridge from light background */}
        <div className="h-20 sm:h-28 bg-gradient-to-b from-white via-white/80 to-gray-900/60" />

        {/* Organic SVG Wave Divider with Glow */}
        <div className="relative -mt-12 sm:-mt-16">
          <svg
            className="w-full h-16 sm:h-24 text-gray-900 fill-current"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0,32L60,42.7C120,53,240,75,360,80C480,85,600,75,720,58.7C840,43,960,21,1080,16C1200,11,1320,21,1380,26.7L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>

          {/* Glowing accent border line bridging light & dark */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-indigo-500 opacity-70 blur-[1px]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-16 sm:px-6 sm:py-24 lg:px-8">
        <div
          className={`relative isolate overflow-hidden bg-gray-800 px-6 pt-16 after:pointer-events-none after:absolute after:inset-0 after:rounded-none ring-1 ring-inset ring-white/10 sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0 transform transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}
        >
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                <stop stopColor="#7775D6" />
                <stop offset={1} stopColor="#E935C1" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
              Boost your academic productivity. Start using Bubbly today.
            </h2>
            <p className="mt-6 text-lg/8 text-pretty text-gray-300">
              Chat, generate study material, and keep your research organized — free to start, no credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              {/* Primary Solid Button */}
              <a
                href="/login"
                className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Get started
              </a>

              {/* Secondary Bordered Button uses MagneticButton */}
              <MagneticButton strength={0.6} maxDistance={80}>
                <a href="#features" className="text-sm/6 font-semibold text-white hover:text-gray-100 px-3 py-2 border border-white/20 rounded-md">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </MagneticButton>
            </div>
          </div>
          <div className="relative mt-16 h-80 lg:mt-8 flex items-center justify-center lg:justify-start">
            {/* Illustrative chat preview (not a literal screenshot) */}
            <div className="w-full max-w-md rounded-xl bg-white/5 ring-1 ring-white/10 p-4 font-mono text-xs text-gray-300 shadow-2xl">
              <div className="flex items-center gap-1.5 pb-3 border-b border-white/10 mb-3">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-yellow-400/70" />
                <span className="size-2.5 rounded-full bg-green-400/70" />
                <span className="ml-2 text-indigo-300">Bubbly</span>
              </div>
              <p className="text-gray-400">You: summarize chapter 4 and quiz me on it</p>
              <p className="mt-2 text-indigo-300">Bubbly: here's a 5-question quiz from your notes ↓</p>
              <div className="mt-3 space-y-1.5">
                <div className="h-2 bg-indigo-500/20 rounded w-full" />
                <div className="h-2 bg-white/10 rounded w-5/6" />
                <div className="h-2 bg-white/10 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
