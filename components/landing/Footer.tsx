"use client";
import { useState } from 'react'

const logoImg = '/landing/logo.png'

const navigation = {
  product: [
    { name: 'AI Notes', href: '#features' },
    { name: 'AI Summary', href: '#features' },
    { name: 'AI Flashcards', href: '#features' },
    { name: 'AI Quizzes', href: '#features' },
    { name: 'AI Tutor', href: '#features' },
  ],
solutions: [
    { name: 'Web Command Center', href: '#platforms' },
    { name: 'Mobile Companion', href: '#platforms' },
    { name: 'Browser Extension', href: '#platforms' },
    { name: 'Study Vault', href: '#platforms' },
    { name: 'Voice-to-Voice Tutor', href: '#platforms' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  company: [
    { name: 'About', href: '#compare' },
    { name: 'Contact Us', href: '/help' },
    { name: 'Status', href: '/help' },
  ],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.7998L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5654L18.6862 19.8835H16.2995L11.5541 13.096V13.0956Z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState('')

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.replace('#', '')
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800/80">
      {/* Newsletter */}
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-gray-800/80 pb-12 md:flex-row md:items-center">
          <div className="max-w-md">
            <h3 className="text-xl font-bold text-white">Get study tips, straight to your inbox</h3>
            <p className="mt-2 text-sm text-gray-400">
              A short note on studying smarter and new features, a few times a month.
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (email) window.location.href = '/login'
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex-none rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-12 pb-12 lg:px-8 lg:pt-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Column */}
          <div className="space-y-8">
            <a href="#hero" onClick={(e) => scrollToSection(e, '#hero')} className="flex items-center gap-x-3">
              <img src={logoImg} alt="Bubbly Logo" className="h-10 w-auto object-contain" />
              <span className="text-2xl font-bold text-white tracking-tight">Bubbly</span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              The AI study tool for faster, more effective learning. Turn any material into
              notes, flashcards, quizzes, and a 24/7 AI tutor — on web, mobile, and your browser.
            </p>

            {/* Social Links */}
            <div className="flex gap-x-6 pt-2">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
              <ul role="list" className="mt-6 space-y-3.5">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      onClick={(e) => scrollToSection(e, item.href)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Solutions</h3>
              <ul role="list" className="mt-6 space-y-3.5">
                {navigation.solutions.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      onClick={(e) => scrollToSection(e, item.href)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
              <ul role="list" className="mt-6 space-y-3.5">
                {navigation.support.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
              <ul role="list" className="mt-6 space-y-3.5">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-gray-800/80 pt-8 sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 leading-5">
            &copy; {new Date().getFullYear()} Bubbly. Built for modern students worldwide.
          </p>
          <div className="mt-4 flex gap-x-6 sm:mt-0 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-gray-400">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
