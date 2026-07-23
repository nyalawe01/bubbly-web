"use client";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, GlobeAltIcon } from '@heroicons/react/20/solid'
import StaggeredMenu from './StaggeredMenu'
import { MagneticButton } from './ui/magnetic-button'

const logoImg = '/landing/logo.png'

const productDropdownItems = [
  {
    name: 'Web Command Center',
    description: 'Your disciplined academic dashboard',
    href: '#platforms',
    icon: ComputerDesktopIcon,
  },
  {
    name: 'Mobile Companion',
    description: 'Capture and share, online or off',
    href: '#platforms',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Browser Extension',
    description: 'Assistance inside every tab',
    href: '#platforms',
    icon: GlobeAltIcon,
  },
]

const mainNavLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Platforms', href: '#platforms' },
  { name: 'About', href: '#about' },
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
              { label: 'Product', ariaLabel: 'Product', link: '#platforms' },
              ...mainNavLinks.map((item) => ({
                label: item.name,
                ariaLabel: item.name,
                link: item.href,
              })),
              { label: 'Log In', ariaLabel: 'Log In', link: '/login' },
              { label: 'Sign Up Free', ariaLabel: 'Sign Up Free', link: '/login' },
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
          {/* Product Dropdown Menu */}
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-800 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer py-1">
              Product
              <ChevronDownIcon className="size-4 text-gray-500" aria-hidden="true" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute left-0 z-50 mt-2 w-80 origin-top-left rounded-2xl bg-white p-2 text-sm/6 shadow-xl ring-1 ring-gray-900/10 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="p-1">
                {productDropdownItems.map((item) => (
                  <MenuItem key={item.name}>
                    <a
                      href={item.href}
                      onClick={(e) => scrollToSection(e, item.href)}
                      className="group flex items-start gap-x-3.5 rounded-xl p-3 hover:bg-indigo-50/70 transition-colors"
                    >
                      <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-0.5">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 leading-snug">{item.description}</p>
                      </div>
                    </a>
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>

          {/* Main Links */}
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

        {/* Desktop Top Right: Log in & Bordered Sign Up Free */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
          <a
            href="/login"
            className="text-sm/6 font-semibold text-gray-800 hover:text-indigo-600 transition-colors px-3 py-2"
          >
            Log in
          </a>

          {/* Bordered Button uses MagneticButton */}
          <MagneticButton strength={0.6} maxDistance={80}>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Sign up free
            </a>
          </MagneticButton>
        </div>
      </nav>
    </header>
  )
}
