const problems = [
  {
    title: 'Lost in long lectures',
    quote: '"I zoned out 20 minutes in... now I\'m completely lost"',
  },
  {
    title: 'Scattered notes',
    quote: '"Scattered across Google Docs, Notion, and random papers"',
  },
  {
    title: 'Read it. Forgot it',
    quote: '"I read this chapter 3 times and still can\'t remember it"',
  },
  {
    title: 'Stuck with no help',
    quote: '"It\'s midnight, I\'m confused, and there\'s no one to explain this to me"',
  },
]

export default function Problems() {
  return (
    <section id="problems" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Sound familiar?
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Studying feels harder than it should.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-red-500" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{problem.title}</h3>
              <p className="mt-2 text-base text-gray-600 italic">{problem.quote}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-lg font-medium text-pretty text-gray-700 sm:text-xl">
          There&apos;s a better way. Bubbly turns the chaos into a{' '}
          <span className="font-bold text-indigo-600">structured study system</span> — automatically.
        </p>

        <div className="mt-8 text-center">
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
