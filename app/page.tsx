import { Header } from '@/components/Header';
import { HeroSequence } from '@/components/HeroSequence';
import { DashboardPanels } from '@/components/DashboardPanels';
// import { ServicesSection } from '@/components/ServicesSection';
import { ProductsSection } from '@/components/ProductsSection';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-bg-grid text-text-primary selection:bg-signal-cyan selection:text-bg-grid">
      {/* Fixed Glassmorphic Pill Header */}
      {/* <Header /> */}

      {/* Centerpiece: 600-frame Canvas Scrollytelling Sequence */}
      <HeroSequence />

      {/* Interactive District Demo Request Form */}
      <ContactForm />

      {/* Post-sequence continuation: One Intelligent Fleet Dashboard Panels */}
      {/* <DashboardPanels /> */}

      {/* Implementation, Onboarding, & Operations Services */}
      {/* <ServicesSection /> */}

      {/* Full Product Architecture Showcase */}
      {/* <ProductsSection /> */}

      {/* District Director Testimonials */}
      {/* <TestimonialsCarousel /> */}

      {/* Footer */}
      <Footer />
    </main>
  );
}
