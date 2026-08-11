import { ArrowRightIcon } from '@heroicons/react/20/solid'

const generators = [
  {
    name: 'Summaries',
    icon: '📝',
    description: 'Understand the important concepts without rereading everything.',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    features: ['Brief or detailed length', 'Key points highlighted', 'Source citations'],
  },
  {
    name: 'Flashcards',
    icon: '🧠',
    description: 'Turn your materials into active-recall practice.',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    features: ['Fewer / Standard / More', 'Multiple difficulty levels', 'Spaced review ready'],
  },
  {
    name: 'Quizzes',
    icon: '❓',
    description: 'Test your understanding with different question formats.',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    features: ['MCQ, Multi-select, True/False', 'Short answer & diagram Qs', 'Instant grading'],
  },
  {
    name: 'Slides',
    icon: '📊',
    description: 'Transform your material into structured presentations.',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    features: ['Detailed or presenter format', 'Auto-generated speaker notes', 'Charts & diagrams included'],
  },
  {
    name: 'Practice Exams',
    icon: '🎯',
    description: 'Simulate exam preparation using your own study content.',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    features: ['Guide or full exam mode', 'Configurable marks & time', 'AI grading with feedback'],
  },
]

export default function StudyGenerators() {
  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            One upload. An entire study system.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Your document branches into every study tool you need — all grounded in
            your actual materials, not generic AI output.
          </p>
        </div>

        {/* Visual: One document branching into tools */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="relative">
            {/* Central document */}
            <div className="flex justify-center">
              <div className="relative z-10 rounded-xl border-2 border-indigo-300 bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Lecture Notes</p>
                    <p className="text-sm text-gray-500">Your source material</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Branching lines and tools */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {generators.map((gen) => (
                <div
                  key={gen.name}
                  className={`relative rounded-2xl border p-6 ${gen.color} transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="text-4xl mb-3">{gen.icon}</div>
                  <h3 className="font-bold text-gray-900">{gen.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{gen.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {gen.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-gray-600">
            Each generator uses your Vault context with source citations — so every
            answer, flashcard, and quiz question traces back to your material.
          </p>
        </div>
      </div>
    </section>
  )
}