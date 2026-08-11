import { FolderIcon, MagnifyingGlassIcon, DocumentTextIcon, SparklesIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const vaultFeatures = [
  {
    name: 'Organized Documents',
    icon: FolderIcon,
    description: 'All your study materials in one searchable place — PDFs, slides, notes, and more.',
  },
  {
    name: 'AI Summaries',
    icon: DocumentTextIcon,
    description: 'Every document gets an automatic AI summary so you know what\'s inside at a glance.',
  },
  {
    name: 'Semantic Search',
    icon: MagnifyingGlassIcon,
    description: 'Find exactly what you need across all documents — search by meaning, not just keywords.',
  },
  {
    name: 'Source-Aware Answers',
    icon: SparklesIcon,
    description: 'AI responses cite the exact documents and passages they draw from — no hallucinations.',
  },
  {
    name: 'Persistent Study Assets',
    icon: ClockIcon,
    description: 'Generated quizzes, flashcards, slides, and exams stay saved and synced across devices.',
  },
  {
    name: 'Private & Secure',
    icon: ShieldCheckIcon,
    description: 'Per-user row-level security ensures your materials never leak to other students.',
  },
]

export default function Vault() {
  return (
    <section id="vault" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Your knowledge. Your Vault.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Your study materials become a searchable knowledge base that Bubbly uses when
            answering questions and generating study resources.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vaultFeatures.map((feature) => (
            <div
              key={feature.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <feature.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{feature.name}</h3>
              <p className="mt-2 text-sm/6 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* RAG Explanation */}
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
            <h3 className="text-center font-semibold text-indigo-700">How the Vault powers Bubbly AI</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">1</div>
                <span>Upload documents → AI extracts text & creates embeddings (768-dim vectors)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">2</div>
                <span>You ask a question → Bubbly embeds it & searches your Vault semantically</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">3</div>
                <span>Relevant chunks retrieved → injected into prompt with source citations [src=N | filename]</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">4</div>
                <span>AI generates grounded response → you see sources alongside the answer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}