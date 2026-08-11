"use client";
import StaggeredMenu from './StaggeredMenu'
import { MagneticButton } from './ui/magnetic-button'

const logoImg = '/landing/logo.png'

const mainNavLinks = [
  { name: 'Product', href: '#product' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Resources', href: '#resources' },
]

export default function Navbar() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header className="relative z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Desktop Navbar */}
      <nav aria-label="Global" className="mx-auto max-w-7xl flex items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <a
            href="#hero"
            onClick={(e) => scrollToSection(e, '#hero')}
            className="-m-1.5 p-1.5 flex items-center gap-x-3 group"
          >
            <img
              alt="Bubbly Logo"
              src={logoImg}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Bubbly</span>
          </a>
        </div>

        {/* Mobile Hamburger StaggeredMenu Trigger */}
        <div className="flex lg:hidden">
          <StaggeredMenu
            position="right"
            items={[
              ...mainNavLinks.map((item) => ({
                label: item.name,
                ariaLabel: item.name,
                link: item.href,
              })),
              { label: 'Sign In', ariaLabel: 'Sign In', link: '/login' },
              { label: 'Start Free', ariaLabel: 'Start Free', link: '/login' },
            ]}
            displaySocials={false}
            displayItemNumbering={true}
            menuButtonColor="#111827"
            openMenuButtonColor="#4f46e5"
            accentColor="#4f46e5"
            colors={['#C7D2FE', '#4F46E5']}
            logoUrl={logoImg}
            isFixed={true}
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-8">
          {mainNavLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              className="text-sm/6 font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Top Right: Sign in & Start Free */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
          <a
            href="/login"
            className="text-sm/6 font-semibold text-gray-800 hover:text-indigo-600 transition-colors px-3 py-2"
          >
            Sign in
          </a>

          <MagneticButton strength={0.6} maxDistance={80}>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Start Free
            </a>
          </MagneticButton>
        </div>
      </nav>
    </header>
  )
}
