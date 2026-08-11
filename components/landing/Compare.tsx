const comparisonRows = [
  { traditional: 'Read notes passively', bubbly: 'Read + AI explanations grounded in your material' },
  { traditional: 'Manually make flashcards', bubbly: 'Generate flashcards from your documents in seconds' },
  { traditional: 'Search for practice questions', bubly: 'Generate quizzes (MCQ, multi-select, short answer, diagrams) from your content' },
  { traditional: 'Create practice exams manually', bubbly: 'Generate full exams or study guides with configurable marks & time' },
  { traditional: 'Switch between apps for notes, flashcards, quizzes', bubbly: 'One workspace: Vault + Tutor + 5 generators + persistent assets' },
  { traditional: 'Search through documents by keyword', bubbly: 'AI-powered semantic search with source citations' },
  { traditional: 'Study alone with no help', bubbly: '24/7 AI study partner that knows your coursework' },
  { traditional: 'Wait for AI to finish before continuing', bubbly: 'Non-blocking background generation with realtime updates' },
]

export default function Compare() {
  return (
    <section id="compare" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Less time organizing your studying. More time actually studying.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Bubbly turns your course material into a complete study system, so you can stop
            spinning and start learning.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-900">Traditional workflow</th>
                <th className="pb-3 font-semibold text-gray-900 pl-8">With Bubbly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisonRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-4 text-gray-600">
                    <span className="flex items-center gap-2 text-sm">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-gray-400" aria-hidden="true">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                      {row.traditional}
                    </span>
                  </td>
                  <td className="py-4 text-gray-900 pl-8">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-emerald-500" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      {row.bubbly}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
