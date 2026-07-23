"use client";
import { useState } from 'react'
import { ComputerDesktopIcon, DevicePhoneMobileIcon, GlobeAltIcon } from '@heroicons/react/20/solid'
import CardSwap, { Card } from './CardSwap'

const section2Img = '/landing/section2.png'
const studentHeroImg = '/landing/student-hero.png'
const heroImg = '/landing/hero.png'

const features = [
  {
    id: 0,
    name: 'The Command Center (Web)',
    description:
      'Chat with your AI tutor, generate quizzes, flashcards, slides, summaries, and exams from your own material, and keep every document in one organized Vault — all from one dashboard.',
    icon: ComputerDesktopIcon,
    image: section2Img,
  },
  {
    id: 1,
    name: 'On-the-Go Companion (Mobile)',
    description:
      "Keep studying between classes. Same chat, same Vault, same generators — plus a voice-to-voice tutor mode for when you'd rather talk it through than type. (Coming soon to the app stores.)",
    icon: DevicePhoneMobileIcon,
    image: studentHeroImg,
  },
  {
    id: 2,
    name: 'The Real-Time Companion (Browser)',
    description:
      'Researching a thesis? Keep your tutor right in your active browser tab. Summarize what you\'re reading and ask follow-up questions without losing your train of thought.',
    icon: GlobeAltIcon,
    image: heroImg,
  },
]

export default function Features() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  return (
    <div id="platforms" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
          {/* Left Column: Clean List (Clicking rotates Cards to front) */}
          <div className="lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                Indispensable Academic Companions
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Your Workspace, Everywhere You Are.
              </p>
              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                We are framing your three platforms not just as software, but as indispensable companions for your daily academic life. Click any companion below to bring its card to the front.
              </p>

              <dl className="mt-10 max-w-xl space-y-8 text-base text-gray-600 lg:max-w-none">
                {features.map((feature, idx) => (
                  <div
                    key={feature.name}
                    className={`relative pl-9 cursor-pointer group transition-colors ${
                      activeCardIndex === idx ? 'text-gray-950 font-medium' : 'text-gray-600'
                    }`}
                    onClick={() => setActiveCardIndex(idx)}
                  >
                    <dt className="inline font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      <feature.icon
                        aria-hidden="true"
                        className={`absolute top-1 left-1 size-5 ${
                          activeCardIndex === idx ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                        }`}
                      />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right Column: Image Touches All 4 Card Side Borders (Top, Bottom, Left, Right) */}
          <div className="relative min-h-[500px] lg:min-h-[540px] w-full flex items-center justify-center">
            <CardSwap
              width={720}
              height={465}
              autoSwap={false}
              activeIndex={activeCardIndex}
              onCardClick={(idx) => setActiveCardIndex(idx)}
            >
              {features.map((feature) => (
                <Card
                  key={feature.id}
                  className="shadow-2xl border border-gray-300/80 bg-slate-950 rounded-2xl overflow-hidden p-0 cursor-pointer flex items-center justify-center transition-all"
                >
                  <img
                    src={feature.image}
                    alt={feature.name}
                    className="w-full h-full object-fill select-none pointer-events-none rounded-2xl block border-0 p-0 m-0"
                  />
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </div>
  )
}
