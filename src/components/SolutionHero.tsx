const LOGIN_URL = 'https://bubbly-web-five.vercel.app/login'

export default function SolutionHero() {
  return (
    <div id="about" className="overflow-hidden bg-white dark:bg-neutral-900 py-16 sm:py-24">
      <div id="pricing" className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="relative mx-auto max-w-4xl grid space-y-5 sm:space-y-10">
          {/* Title */}
          <div className="text-center">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
              Student Workspace Solutions
            </p>
            <h1 className="text-3xl text-gray-900 dark:text-neutral-100 font-bold sm:text-5xl lg:text-6xl lg:leading-tight">
              Turn online research into <span className="text-indigo-600 dark:text-indigo-400">lifetime academic success</span>
            </h1>
          </div>
          {/* End Title */}

          {/* Get Started CTA */}
          <div className="flex justify-center pt-4">
            <a
              href={LOGIN_URL}
              className="inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors px-8 py-3.5"
            >
              Get started free
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          {/* End Get Started CTA */}

        </div>
      </div>
    </div>
  )
}
