import {
  ComputerDesktopIcon,
  CloudIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const highlights = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: '24/7 AI Tutor',
    description:
      'Chat with your tutor — grounded in your own notes — to explain concepts and clear confusion any time.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Study Tools in One Place',
    description:
      'Notes, summaries, flashcards, quizzes, slides, and practice exams generated from your uploads, all in one Vault.',
  },
  {
    icon: CloudIcon,
    title: 'Your Vault, Secured',
    description:
      'Every document and chat stays private to you, protected on our server, on all your devices.',
  },
]

export default function StudyAnywhere() {
  return (
    <section id="platforms" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            The Web App
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Your AI study studio, right in the browser.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            The full Bubbly experience lives on the web — free to start, no downloads. Sign in from
            any device and pick up right where you left off.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <item.icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm/6 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <ComputerDesktopIcon className="size-5" aria-hidden="true" />
            Open the Web App
          </a>
        </div>
      </div>
    </section>
  )
}