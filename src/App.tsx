import TopBanner from './components/TopBanner'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import CTA from './components/CTA'
import BentoGrid from './components/BentoGrid'
import SolutionHero from './components/SolutionHero'
import Footer from './components/Footer'
import ScrollReveal from './components/ScrollReveal'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner & Navigation Bar Layout */}
      <div className="sticky top-0 z-50">
        <TopBanner />
        <Navbar />
      </div>

      {/* Main Page Content with Smooth Scroll Reveal */}
      <main>
        <Hero />

        <ScrollReveal>
          <Features />
        </ScrollReveal>

        <ScrollReveal>
          <CTA />
        </ScrollReveal>

        <ScrollReveal>
          <BentoGrid />
        </ScrollReveal>

        <ScrollReveal>
          <SolutionHero />
        </ScrollReveal>

        <Footer />
      </main>
    </div>
  )
}
