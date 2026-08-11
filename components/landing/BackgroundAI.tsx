import { PlayCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function BackgroundAI() {
  return (
    <section id="background-ai" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Don&apos;t wait for AI to finish working.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Generate a quiz, flashcard set, summary, or exam and keep studying.
            Bubbly handles generation in the background and updates your workspace when it&apos;s ready.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          {/* Demo of background generation */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Generating: Biology Midterm Quiz</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                In Progress
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: '80%' }}
              />
            </div>
            <p className="text-sm text-gray-500 text-right mb-4">80% complete</p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="size-6 text-indigo-600 animate-spin" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900">25 questions • Medium difficulty</p>
                  <p className="text-sm text-gray-500">Based on 3 Vault documents</p>
                </div>
              </div>
              <PlayCircleIcon className="size-8 text-indigo-600 opacity-50" aria-hidden="true" />
            </div>

            <p className="mt-4 text-center text-sm font-medium text-indigo-600">
              ← You can keep studying other materials while this generates
            </p>
          </div>

          {/* Ready state */}
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="size-8 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-gray-900">Quiz ready: Biology Midterm</p>
                  <p className="text-sm text-gray-500">25 questions • 40 marks • 45 min</p>
                </div>
              </div>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Start Quiz
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
          {[
            { title: 'Non-blocking', desc: 'Generate multiple assets simultaneously' },
            { title: 'Realtime updates', desc: 'Supabase realtime flips status instantly' },
            { title: 'Durable', desc: 'Server-side generation survives tab close' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-bold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}