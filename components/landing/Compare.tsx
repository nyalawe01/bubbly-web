const oldWay = [
  'Scattered materials',
  'Random study methods',
  'Manual note-taking',
  'Endless rereading',
  'No instant help',
]

const bubblyWay = [
  'Everything in one place',
  'Proven learning methods',
  'Auto-generated notes',
  'Active learning',
  'AI tutor on demand',
]

export default function Compare() {
  return (
    <section id="compare" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Study smarter. Learn faster.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Bubbly turns your course material into a complete study system, so you can stop
            spinning and start learning.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* The Old Way */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <h3 className="text-lg font-bold text-gray-500">The Old Way</h3>
            <ul role="list" className="mt-6 space-y-4">
              {oldWay.map((item) => (
                <li key={item} className="flex items-center gap-x-3 text-sm font-medium text-gray-500">
                  <span className="flex size-6 flex-none items-center justify-center rounded-full bg-gray-200">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-gray-500" aria-hidden="true">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* The Bubbly Way */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
            <h3 className="text-lg font-bold text-indigo-700">The Bubbly Way</h3>
            <ul role="list" className="mt-6 space-y-4">
              {bubblyWay.map((item) => (
                <li key={item} className="flex items-center gap-x-3 text-sm font-semibold text-gray-800">
                  <span className="flex size-6 flex-none items-center justify-center rounded-full bg-indigo-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5 text-white" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
