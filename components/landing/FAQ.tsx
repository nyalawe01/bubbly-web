"use client";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/20/solid'

const faqs = [
  {
    question: 'What is Bubbly?',
    answer:
      'Bubbly is an AI-powered study workspace that helps students understand, organize, and practice their coursework. Upload your materials and Bubbly builds your entire study system — summaries, flashcards, quizzes, slides, practice exams, and an AI tutor.',
  },
  {
    question: 'Can Bubbly use my own notes?',
    answer:
      'Yes. Your uploaded study materials are stored in your private Vault and used to ground AI responses and generate study resources. Everything is scoped to you with row-level security.',
  },
  {
    question: 'What can Bubbly generate?',
    answer:
      'Summaries, flashcards, quizzes (MCQ, multi-select, true/false, short answer, diagram), slides (detailed or presenter format), and practice exams (guide or full exam mode). All grounded in your materials.',
  },
  {
    question: 'Can I ask questions about my documents?',
    answer:
      'Yes. The AI Tutor uses your stored materials as context when answering questions. You\'ll see source citations [src=N | filename] alongside every response so you know exactly where the answer comes from.',
  },
  {
    question: 'Is Bubbly just another AI chatbot?',
    answer:
      'No. The AI Tutor is only one part of Bubbly. The platform combines your knowledge Vault, AI tutor, and automated study generators into one workspace. Your materials power everything — not generic AI output.',
  },
  {
    question: 'Can I study on my phone?',
    answer:
      'The web app works great on mobile browsers. Native iOS and Android apps are in development — join the waitlist to get early access.',
  },
  {
    question: 'Can I use Bubbly without saving a conversation?',
    answer:
      'Yes, through Incognito Mode. It starts a fresh AI conversation without saving to your study history, skips the semantic cache, and never writes to your chat sessions. Perfect for quick questions or sensitive topics.',
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
            Questions about the product, privacy, and how Bubbly works.
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
