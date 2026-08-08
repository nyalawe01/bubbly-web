const steps = [
  {
    number: '1',
    title: 'Create a Study Session',
    description:
      'One session per lecture, chapter, or exam topic. A dedicated space where everything stays organized from the start.',
  },
  {
    number: '2',
    title: 'Record lectures or upload anything',
    description:
      'Drop in PDFs, slides, audio, YouTube videos, or web links — or record a live lecture straight from the app.',
  },
  {
    number: '3',
    title: 'Instant AI processing',
    description:
      'Bubbly extracts the content and builds your notes, summary, flashcards, quizzes, and tutor context automatically.',
  },
  {
    number: '4',
    title: 'Learn, practice, ask, master',
    description:
      'Review your notes, drill flashcards, test yourself with quizzes, and ask the AI tutor anything — 24/7.',
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
            Create a session, add your material, and let Bubbly do the rest.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center lg:text-left">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg lg:mx-0">
                {step.number}
              </div>
              <h3 className="mt-5 text-base font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm/6 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Start My Free Study Session
          </a>
        </div>
      </div>
    </section>
  )
}
