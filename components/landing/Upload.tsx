import {
  DocumentTextIcon,
  PresentationChartBarIcon,
  DocumentIcon,
  TableCellsIcon,
  MicrophoneIcon,
  LinkIcon,
  VideoCameraIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'

const fileTypes = [
  { name: 'PDF File', icon: DocumentTextIcon },
  { name: 'Slides (PPTX)', icon: PresentationChartBarIcon },
  { name: 'Text File', icon: DocumentIcon },
  { name: 'Spreadsheet (XLSX)', icon: TableCellsIcon },
  { name: 'Audio File', icon: MicrophoneIcon },
  { name: 'Web Link', icon: LinkIcon },
  { name: 'Record Lecture', icon: VideoCameraIcon },
  { name: 'YouTube Video', icon: PlayCircleIcon },
]

export default function Upload() {
  return (
    <section id="upload" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Upload anything. Learn everything.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Record live lectures or upload any file. Bubbly instantly turns them into notes,
            summaries, flashcards, quizzes, and a 24/7 AI tutor.
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

        <p className="mx-auto mt-10 max-w-2xl text-center text-base font-medium text-gray-700">
          Any file. Any format. Any subject — PDFs, slides, YouTube videos, audio, web links,
          and more.
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
