import { ArrowDownIcon } from '@heroicons/react/20/solid'

export default function StudySystem() {
  return (
    <section id="product" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Meet Your AI Study Workspace
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            One workspace. Everything you need to learn.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Your materials become the foundation for everything Bubbly generates.
          </p>
        </div>

        {/* Visual Flow Diagram */}
        <div className="mx-auto mt-14 max-w-5xl">
          <div className="relative">
            {/* Top: Your Materials */}
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 px-6 py-4 text-center">
                <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Your Materials</p>
                <p className="mt-1 text-lg font-medium text-gray-900">Notes • PDFs • Slides • Text</p>
              </div>
              <ArrowDownIcon className="mt-4 size-6 text-indigo-400" aria-hidden="true" />
            </div>

            {/* Middle: Bubbly AI */}
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-600 px-6 py-4 text-center shadow-lg">
                <p className="text-sm font-semibold text-white uppercase tracking-wider">BUBBLY AI</p>
                <p className="mt-1 text-lg font-bold text-white">Understands • Organizes • Generates</p>
              </div>
              <ArrowDownIcon className="mt-4 size-6 text-indigo-400" aria-hidden="true" />
            </div>

            {/* Bottom: Study Tools Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-5">
              {[
                { name: 'AI Tutor', icon: '💬', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                { name: 'Quiz', icon: '❓', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                { name: 'Flashcards', icon: '🧠', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                { name: 'Summary', icon: '📝', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                { name: 'Exams', icon: '🎯', color: 'bg-rose-100 text-rose-700 border-rose-200' },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className={`rounded-2xl border ${tool.color} p-4 text-center`}
                >
                  <div className="text-3xl mb-2">{tool.icon}</div>
                  <p className="font-semibold text-gray-900">{tool.name}</p>
                </div>
              ))}
            </div>

            {/* Final outcome */}
            <ArrowDownIcon className="mx-auto mt-6 size-6 text-indigo-400" aria-hidden="true" />
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-6 py-4 text-center">
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Better Preparation</p>
              <p className="mt-1 text-lg font-medium text-gray-900">Master the material. Walk in confident.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
