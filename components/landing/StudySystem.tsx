import {
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  Squares2X2Icon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: DocumentTextIcon,
    name: 'AI Notes',
    tagline: 'Notes that write themselves',
    description:
      'Get structured, clean notes in seconds from any upload — so you can focus on understanding, not typing. Less cognitive overload, more actual learning.',
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    name: 'AI Summary',
    tagline: 'Review faster, anytime',
    description:
      'Turn lengthy lectures, articles, or textbooks into quick, scannable summaries so you understand the topic fast — perfect before tests or quick revision.',
  },
  {
    icon: Squares2X2Icon,
    name: 'AI Flashcards',
    tagline: 'Make it impossible to forget',
    description:
      'Auto-generate flashcards from your material and practice active recall — the science-backed method that makes information stick.',
  },
  {
    icon: QuestionMarkCircleIcon,
    name: 'AI Quizzes',
    tagline: 'Test yourself before exams do',
    description:
      'Auto-generate quizzes directly from your material. Check your understanding, spot gaps early, and find weak spots before the exam does.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    name: 'AI Tutor',
    tagline: 'Ask questions. Get clarity 24/7',
    description:
      'Chat with the AI Tutor — grounded in your own notes — to explain concepts and clear confusion, any time. On mobile, talk it through out loud.',
  },
  {
    icon: AcademicCapIcon,
    name: 'Exams, Slides & More',
    tagline: 'Practice under exam conditions',
    description:
      'Generate practice exams, study slides, diagrams, and source guides from the same material — one upload, every study tool you need.',
  },
]

export default function StudySystem() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Introducing Bubbly
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            We turn your material into a complete AI study system.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Upload your material and Bubbly builds your entire study session — notes,
            flashcards, quizzes, summary, and AI tutor included.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <feature.icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{feature.name}</h3>
              <p className="mt-1 text-sm font-semibold text-indigo-600">{feature.tagline}</p>
              <p className="mt-3 text-sm/6 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
