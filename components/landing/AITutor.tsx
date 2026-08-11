import { BoltIcon, SparklesIcon, EyeIcon, CpuChipIcon } from '@heroicons/react/24/outline'

const modelPills = [
  {
    name: 'Instant',
    icon: BoltIcon,
    description: 'Fast answers for quick questions',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    name: 'Expert',
    icon: SparklesIcon,
    description: 'Deeper explanations for complex topics',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    name: 'Vision',
    icon: EyeIcon,
    description: 'Understand images, diagrams, and visual material',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Automatic',
    icon: CpuChipIcon,
    description: 'Chooses the right mode for every request',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
]

export default function AITutor() {
  return (
    <section id="ai-tutor" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Meet your 24/7 AI study partner.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Ask questions, explain difficult concepts, explore ideas, or get help
            understanding your coursework. Bubbly&apos;s AI Tutor works with your study
            materials and adapts its response to what you&apos;re trying to accomplish.
          </p>
        </div>

        {/* Model Pills */}
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Choose your mode — or let Automatic decide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {modelPills.map((pill) => (
                <div
                  key={pill.name}
                  className={`flex items-center gap-2 rounded-xl border p-3 ${pill.color}`}
                >
                  <pill.icon className="size-5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-gray-900">{pill.name}</p>
                    <p className="text-xs text-gray-600">{pill.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Example Chat UI */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <SparklesIcon className="size-5 text-indigo-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Bubbly AI Tutor</p>
                  <p className="text-xs text-gray-500">Grounded in your Vault</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Online
              </span>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-indigo-600 px-4 py-3">
                  <p className="text-white text-sm">
                    "Explain this topic like I&apos;m preparing for tomorrow&apos;s exam."
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm text-gray-700">
                      Based on your lecture notes on <strong>Database Systems</strong>, here&apos;s a focused explanation:
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Normalization organizes data to reduce redundancy and improve integrity.
                      The key forms are 1NF (atomic values), 2NF (no partial dependencies),
                      3NF (no transitive dependencies), and BCNF (stricter 3NF). For your exam,
                      focus on identifying functional dependencies and walking through the
                      decomposition process step by step.
                    </p>
                  </div>

                  {/* Sources */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Sources:</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                      📄 Lecture 04.pdf
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                      📄 Database Systems Notes.pdf
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <BoltIcon className="size-5 text-gray-400" aria-hidden="true" />
                <span className="flex-1 text-sm text-gray-500">Ask a follow-up...</span>
                <EyeIcon className="size-5 text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Streaming chat • Multiple model tiers • Automatic intent routing • Provider failover
        </p>
      </div>
    </section>
  )
}