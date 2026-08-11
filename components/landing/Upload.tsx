import {
  DocumentTextIcon,
  PresentationChartBarIcon,
  DocumentIcon,
  TableCellsIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

const fileTypes = [
  { name: 'PDF', icon: DocumentTextIcon },
  { name: 'Slides (PPTX)', icon: PresentationChartBarIcon },
  { name: 'Text', icon: DocumentIcon },
  { name: 'Spreadsheet', icon: TableCellsIcon },
  { name: 'Web Link', icon: LinkIcon },
]

export default function Upload() {
  return (
    <section id="upload" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Start with what you&apos;re already studying.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Bring your existing learning materials into Bubbly. The Vault organizes them
            into a personal knowledge base ready to power your AI study tools.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {fileTypes.map((file) => (
            <div
              key={file.name}
              className="inline-flex items-center gap-x-2.5 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-indigo-400 hover:text-indigo-600"
            >
              <file.icon className="size-4 text-indigo-600" aria-hidden="true" />
              {file.name}
            </div>
          ))}
        </div>

        <div className="mt-10 mx-auto max-w-2xl">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 text-center">
            <p className="text-base font-medium text-gray-700">
              <strong className="text-indigo-700">Bubbly organizes your materials into a personal knowledge vault</strong>
              — ready to power your AI study tools with document storage, AI summaries,
              and vector retrieval scoped to you.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Upload Your First Document
          </a>
        </div>
      </div>
    </section>
  )
}
