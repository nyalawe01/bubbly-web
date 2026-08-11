const stats = [
  { value: '30', label: 'Interface languages' },
  { value: '5+', label: 'Study generation tools' },
  { value: '24/7', label: 'AI study assistance' },
  { value: '3', label: 'Platforms (Web, Mobile, Extension)' },
]

export default function Stats() {
  return (
    <section id="stats" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-y-10 text-center sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </dd>
              <dd className="mt-2 text-sm font-medium text-gray-600">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
