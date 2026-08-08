const testimonials = [
  {
    quote:
      "I've been using Bubbly for about a year now and it has honestly boosted my academic performance so much. The flashcards feature gathers all the info from any document and creates decks for me to study from — a lifesaver when you're juggling 7 classes.",
    name: 'Kari R.',
    role: 'Undergraduate, Princeton University',
  },
  {
    quote:
      "I highly recommend the tools. I teach a full course and the quiz generator turns my video modules into assessments in seconds. My students stay on top of the material between classes.",
    name: 'Amélie L.',
    role: 'University Lecturer',
  },
  {
    quote:
      'Great app. Easy to navigate and input documents — the interface is clean and intuitive. I record lectures in class and by the time I get home the notes and summaries are already there.',
    name: 'Sienna H.',
    role: 'Graduate Student, University of Toronto',
  },
  {
    quote:
      'The AI tutor changed how I prepare for exams. It explains concepts from my own lecture notes, not generic answers, and I can quiz myself right after. My midterm scores have never been better.',
    name: 'Eduard F.',
    role: 'Engineering Student, MIT',
  },
  {
    quote:
      "I used to reread chapters three times and still forget everything. With Bubbly's active-recall flashcards and practice quizzes, I actually remember the material the first time through.",
    name: 'Malik O.',
    role: 'Pre-med Student, University of Maryland',
  },
  {
    quote:
      'Between classes, work, and everything else, I never had time to organize my notes. Bubbly turns my messy uploads into a real study system — notes, summaries, quizzes — all in one place.',
    name: 'Priya S.',
    role: 'Self-learner & Course Creator',
  },
]

function Stars() {
  return (
    <div className="flex gap-x-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="size-4 text-amber-400" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Trusted by learners worldwide
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Loved by students everywhere.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Students across the globe are saving time, reducing stress, and learning faster
            with Bubbly.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-sm/6 text-gray-700">{t.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-x-3 border-t border-gray-100 pt-4">
                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {t.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
