import { DocumentIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const problems = [
  {
    title: 'Scattered materials',
    description: 'Notes are scattered across PDFs, documents, slides, and random files — nothing is organized in one place.',
    icon: DocumentIcon,
  },
  {
    title: 'Finding answers takes too long',
    description: 'Searching through pages of notes for one concept wastes study time you don\'t have.',
    icon: MagnifyingGlassIcon,
  },
  {
    title: 'Reading isn\'t enough',
    description: 'Passive rereading doesn\'t stick. You need active recall and practice — but creating those tools manually is tedious.',
    icon: ArrowPathIcon,
  },
  {
    title: 'No help when you\'re stuck',
    description: 'It\'s midnight, you\'re confused, and there\'s no one to explain the concept — not even a generic AI that knows your actual material.',
    icon: ChatBubbleLeftRightIcon,
  },
]

export default function Problems() {
  return (
    <section id="problems" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Studying shouldn&apos;t mean juggling ten different tools.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-indigo-50">
                <problem.icon className="size-5 text-indigo-600" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{problem.title}</h3>
              <p className="mt-2 text-base text-gray-600">{problem.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <p className="text-lg font-medium text-pretty text-gray-700 sm:text-xl">
            <strong className="text-indigo-600">Bubbly brings your materials, AI tutor, and study tools into one workspace.</strong>
          </p>
          <div className="mt-8">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
            >
              Start Studying Free
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
