const useCases = [
  {
    title: 'University Students',
    description: 'Turn lecture notes into revision material — summaries, flashcards, quizzes, and practice exams all from one upload.',
    icon: '🎓',
  },
  {
    title: 'Exam Candidates',
    description: 'Generate practice exams from coursework. Configurable marks, time limits, and AI grading with detailed feedback.',
    icon: '📝',
  },
  {
    title: 'Busy Students',
    description: 'Get quick explanations without searching through dozens of pages. Ask the AI Tutor questions grounded in your Vault.',
    icon: '⚡',
  },
  {
    title: 'Self-Learners',
    description: 'Build a personal knowledge base from any material. Semantic search finds exactly what you need, when you need it.',
    icon: '📚',
  },
  {
    title: 'Educators',
    description: 'Turn video modules and lecture slides into assessments in seconds. Students stay on top of material between classes.',
    icon: '👨‍🏫',
  },
  {
    title: 'Multilingual Learners',
    description: 'Study in your preferred language — 30 UI languages with full RTL support. AI replies in the language you write in.',
    icon: '🌍',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Built for the way students actually study.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Real use cases from the students and educators Bubbly was built for.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => (
            <figure
              key={uc.title}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="text-4xl mb-3">{uc.icon}</div>
              <h3 className="font-bold text-gray-900">{uc.title}</h3>
              <blockquote className="mt-3 flex-1 text-sm/6 text-gray-700">{uc.description}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
