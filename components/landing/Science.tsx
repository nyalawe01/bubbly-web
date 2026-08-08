import {
  Squares2X2Icon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'

const methods = [
  {
    icon: Squares2X2Icon,
    method: 'Active Recall',
    feature: 'AI Flashcards',
    description:
      'Retrieving information beats rereading every time. Bubbly auto-generates flashcards so you can practice real recall.',
  },
  {
    icon: QuestionMarkCircleIcon,
    method: 'Practice Testing',
    feature: 'AI Quizzes',
    description:
      'Testing yourself improves exam performance more than rereading. Bubbly generates quizzes so you find gaps early.',
  },
  {
    icon: DocumentTextIcon,
    method: 'Spaced Repetition',
    feature: 'AI Notes',
    description:
      'Reviewing over time locks information into long-term memory. Bubbly creates organized notes you can revisit anytime.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    method: 'Self-Explanation',
    feature: 'AI Tutor',
    description:
      'Explaining concepts deepens understanding. Bubbly\'s AI Tutor lets you ask questions and talk through ideas 24/7.',
  },
]

export default function Science() {
  return (
    <section id="science" className="bg-gradient-to-b from-white via-indigo-50/40 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Built on learning science
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            AI study tools built on how your brain learns.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Every feature is built on proven cognitive science, so you learn faster without
            the burnout.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {methods.map((item) => (
            <div
              key={item.method}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-center gap-x-4">
                <div className="flex size-11 flex-none items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <item.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {item.method}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{item.feature}</p>
                </div>
              </div>
              <p className="mt-4 text-sm/6 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
