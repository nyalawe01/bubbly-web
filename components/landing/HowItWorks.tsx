import { ArrowRightIcon, DocumentArrowUpIcon, SparklesIcon, BookOpenIcon, TrophyIcon } from '@heroicons/react/24/outline'

const steps = [
  {
    number: '01',
    title: 'Upload',
    icon: DocumentArrowUpIcon,
    description: 'Add your notes, PDFs, slides, or other study materials to your Vault.',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    number: '02',
    title: 'Understand',
    icon: SparklesIcon,
    description: 'Ask Bubbly questions or generate summaries, quizzes, flashcards, slides, and exams.',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    number: '03',
    title: 'Practice',
    icon: BookOpenIcon,
    description: 'Review, test yourself with active recall, and return to your materials whenever you need them.',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    number: '04',
    title: 'Master',
    icon: TrophyIcon,
    description: 'Walk into your exam confident — you\'ve understood, practiced, and mastered the material.',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            From material to mastery in four steps.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center lg:text-left">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg lg:mx-0">
                {step.number}
              </div>
              <div className="mt-5">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl lg:mx-0">
                  <step.icon className="size-6 text-indigo-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm/6 text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual flow */}
        <div className="mt-16 hidden lg:block">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-600 px-4 py-3 text-white font-semibold">
              UPLOAD
            </div>
            <ArrowRightIcon className="size-6 text-indigo-400" aria-hidden="true" />
            <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-50 px-4 py-3 text-indigo-700 font-semibold">
              UNDERSTAND
            </div>
            <ArrowRightIcon className="size-6 text-indigo-400" aria-hidden="true" />
            <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-emerald-700 font-semibold">
              PRACTICE
            </div>
            <ArrowRightIcon className="size-6 text-indigo-400" aria-hidden="true" />
            <div className="rounded-2xl border-2 border-amber-600 bg-amber-50 px-4 py-3 text-amber-700 font-semibold">
              MASTER
            </div>
          </div>
        </div>

        <div className="mt-14 text-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Start Your First Session
          </a>
        </div>
      </div>
    </section>
  )
}
