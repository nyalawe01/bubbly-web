import { MicrophoneIcon, PhotoIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const voiceVisualFeatures = [
  {
    name: 'Voice Input',
    icon: MicrophoneIcon,
    description: 'Speak your question and let Bubbly turn your voice into an AI study session. Real-time transcription powered by Gemini.',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    name: 'Visual Understanding',
    icon: PhotoIcon,
    description: 'Upload images, diagrams, or charts — Bubbly\'s Vision mode understands visual material and explains it in context.',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    name: 'AI-Generated Images',
    icon: SparklesIcon,
    description: 'Generate custom diagrams, illustrations, and visual study aids. Primary: Seedream 4.5 via fal.ai. Fallback: Gemini Imagen.',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  {
    name: 'Visual Study Materials',
    icon: ChartBarIcon,
    description: 'Auto-generated slides include charts, diagrams, and Mermaid flowcharts. Quizzes can reference document images directly.',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
]

export default function VoiceVisual() {
  return (
    <section id="voice-visual" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Learn beyond the keyboard.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Voice, vision, and generated visuals — study the way that works best for you.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {voiceVisualFeatures.map((feature) => (
            <div
              key={feature.name}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 flex-none items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <feature.icon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                  <p className="mt-1 text-sm/6 text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-gray-600">
            Web implementation: MediaRecorder → /api/transcribe (Gemini) → inserts text into composer.
            Image generation: dual-provider (fal.ai → Gemini fallback).
          </p>
        </div>
      </div>
    </section>
  )
}