"use client";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/20/solid'

const faqs = [
  {
    question: 'Who is Bubbly for?',
    answer:
      'Bubbly is built for students — high school, college, university, and grad school — as well as self-learners, exam preppers, educators, and professionals who want to turn any material into a structured AI study system.',
  },
  {
    question: 'How is Bubbly different from other AI tools?',
    answer:
      'Unlike general-purpose chatbots, Bubbly is grounded in your own material. Upload a lecture, PDF, slides, or link and it builds notes, summaries, flashcards, quizzes, and a tutor context from exactly what you need to know — not generic answers.',
  },
  {
    question: 'How does Bubbly work?',
    answer:
      'Create a study session, upload or record your material, and Bubbly instantly processes it into organized study tools: AI notes, summaries, flashcards, quizzes, and an AI tutor you can chat with any time. You can even talk through it out loud.',
  },
  {
    question: 'What types of files are accepted?',
    answer:
      'You can upload PDFs, Word documents, slides (PPTX), spreadsheets (XLSX), text files, audio files, web links, and YouTube videos — or record a live lecture directly from the app.',
  },
  {
    question: 'Are there usage limits?',
    answer:
      'Getting started is free — no credit card required. Generous free tiers cover everyday study sessions, and you can upgrade when you need more processing, storage, and priority access.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Everything you upload lives in your private Vault, protected by per-user row-level security, and your questions are answered only from your own material.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-5xl">
            Everything you need to know.
          </h2>
          <p className="mt-4 text-lg text-pretty text-gray-600">
            Questions about the product, billing, and how Bubbly works.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq) => (
            <Disclosure key={faq.question} as="div" className="rounded-xl border border-gray-200 bg-white">
              <DisclosureButton className="group flex w-full items-center justify-between gap-x-4 px-6 py-5 text-left">
                <span className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {faq.question}
                </span>
                <PlusIcon className="size-5 flex-none text-gray-400 transition-transform duration-300 group-data-[open]:rotate-45 group-data-[open]:text-indigo-600" aria-hidden="true" />
              </DisclosureButton>
              <DisclosurePanel className="px-6 pb-5 text-sm/6 text-gray-600">
                {faq.answer}
              </DisclosurePanel>
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  )
}
