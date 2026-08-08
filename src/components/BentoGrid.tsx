export default function BentoGrid() {
  return (
    <div id="features" className="bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-base/7 font-semibold text-indigo-400 uppercase tracking-wider">
          Core Features
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl">
          The End of Copy-Paste Nightmares.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-gray-400">
          This is where we translate engineering power into pure student productivity—built to solve real academic friction.
        </p>

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
          
          {/* Feature 1: Perfect Formatting, Every Time */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-gray-800 lg:rounded-l-3xl" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(1.5rem+1px)]">
              <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Feature 01</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-white max-lg:text-center">
                  Perfect Formatting, Every Time.
                </p>
                <p className="mt-1 text-sm font-medium text-indigo-300 max-lg:text-center">
                  The End of Copy-Paste Nightmares.
                </p>
                <p className="mt-3 text-sm/6 text-gray-400 max-lg:text-center">
                  Upload your raw Word or PowerPoint templates. Our engine seamlessly weaves your new, AI-generated content right into the original design. Your fonts, your layouts, and your margins remain perfectly intact.
                </p>
              </div>
              <div className="@container relative min-h-80 w-full grow max-lg:mx-auto max-lg:max-w-sm mt-6">
                <div className="absolute inset-x-8 top-6 bottom-0 overflow-hidden rounded-t-2xl border-x border-t border-gray-700 bg-gray-900/90 p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <span className="text-xs font-mono text-indigo-300">Template_Preserved.docx</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Layout Intact</span>
                  </div>
                  <div className="space-y-2 text-[11px] font-mono text-gray-400">
                    <div className="h-3 bg-indigo-500/20 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                    <div className="h-3 bg-indigo-500/30 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 lg:rounded-l-3xl" />
          </div>

          {/* Feature 2: A Vault, Not a Dumpster */}
          <div className="relative max-lg:row-start-1">
            <div className="absolute inset-px rounded-lg bg-gray-800 max-lg:rounded-t-3xl" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(1.5rem+1px)]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Feature 02</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-white max-lg:text-center">
                  A Vault, Not a Dumpster.
                </p>
                <p className="mt-1 text-sm font-medium text-indigo-300 max-lg:text-center">
                  A Disciplined Academic Repository.
                </p>
                <p className="mt-2 text-sm/6 text-gray-400 max-lg:text-center">
                  Say goodbye to "Final_Report_v4.docx". Toggle effortlessly between your raw research materials and your pristine, AI-generated final exports. Clean, organized, and always synced.
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center px-8 py-6 sm:px-10">
                <div className="w-full bg-gray-900/80 rounded-xl p-3 border border-white/10 flex items-center justify-between text-xs font-mono text-gray-300">
                  <span className="text-emerald-400">Raw Research → Clean Export</span>
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px]">Synced</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 max-lg:rounded-t-3xl" />
          </div>

          {/* Feature 3: Real Guidance, Not Generic Chat */}
          <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
            <div className="absolute inset-px rounded-lg bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Feature 03</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-white max-lg:text-center">
                  Real Guidance, Not Generic Chat.
                </p>
                <p className="mt-1 text-sm font-medium text-indigo-300 max-lg:text-center">
                  Your Personal Academic Mentor.
                </p>
                <p className="mt-2 text-sm/6 text-gray-400 max-lg:text-center">
                  When you're making big decisions about your major or career, you don't need a robot guessing the answer. Our mentor mode pauses, asks you the right discovery questions, and helps you build a real strategy.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15" />
          </div>

          {/* Feature 4: Tangible Results. Zero Clutter */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-gray-800 max-lg:rounded-b-3xl lg:rounded-r-3xl" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-b-[calc(1.5rem+1px)] lg:rounded-r-[calc(1.5rem+1px)]">
              <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Feature 04</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-white max-lg:text-center">
                  Tangible Results. Zero Clutter.
                </p>
                <p className="mt-1 text-sm font-medium text-indigo-300 max-lg:text-center">
                  Assets You Can Actually Use.
                </p>
                <p className="mt-3 text-sm/6 text-gray-400 max-lg:text-center">
                  We don't flood your screen with endless, overwhelming text blocks. Ask for a complex six-month study plan, and we’ll quietly compile it in the background, handing you a crisp, downloadable PDF right in the chat.
                </p>
              </div>
              <div className="relative min-h-60 w-full grow mt-4">
                <div className="absolute top-6 right-0 bottom-0 left-8 overflow-hidden rounded-tl-xl bg-gray-900/80 border-t border-l border-white/10 p-4 font-mono text-xs text-gray-300">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-indigo-400 font-semibold">6-Month_Study_Plan.pdf</span>
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded cursor-pointer">Download PDF</span>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">Compiled in background • Ready for submission</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 max-lg:rounded-b-3xl lg:rounded-r-3xl" />
          </div>

        </div>
      </div>
    </div>
  )
}
