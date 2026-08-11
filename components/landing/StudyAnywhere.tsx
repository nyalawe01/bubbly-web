import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

const platforms = [
  {
    icon: ComputerDesktopIcon,
    name: 'Web',
    description: 'Deep study sessions and full workspace — chat with your tutor, generate study material, and keep everything in one Vault.',
    status: 'Available now',
    available: true,
  },
  {
    icon: DevicePhoneMobileIcon,
    name: 'Mobile',
    description: 'Review flashcards, ask questions, and study on the move. Voice-to-voice tutor for when you\'d rather talk it through.',
    status: 'In development',
    available: false,
  },
  {
    icon: GlobeAltIcon,
    name: 'Browser Extension',
    description: 'Bring Bubbly into your browsing workflow — summarize what you\'re reading and ask follow-up questions without losing your place.',
    status: 'In development',
    available: false,
  },
]

export default function StudyAnywhere() {
  return (
    <section id="platforms" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Your study workspace, wherever you learn.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            The same chat, Vault, and generators on web, mobile, and in your browser.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <platform.icon className="size-6" aria-hidden="true" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    platform.available
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {platform.status}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{platform.name}</h3>
              <p className="mt-2 flex-1 text-sm/6 text-gray-600">{platform.description}</p>
              <a
                href="/login"
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-indigo-600 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
              >
                {platform.available ? 'Open Web App' : 'Join Waitlist'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}