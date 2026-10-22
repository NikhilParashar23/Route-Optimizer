import { Header } from '@/components/Header';
import { HeroSequence } from '@/components/HeroSequence';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import { Features } from '@/components/Features';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-bg-grid text-text-primary selection:bg-signal-cyan selection:text-bg-grid">
     
      {/* Centerpiece: 600-frame Canvas Scrollytelling Sequence */}
      <section id="home">
              <HeroSequence />
      </section>

      {/* {Features} */}
     <section id="features">
        <Features />
      </section>

      {/* Interactive District Demo Request Form */}
      <section id="optimizer">
              <ContactForm />
      </section>


      {/* Footer */}
      <section id="about">
        <Footer />
      </section>
      
    </main>
  );
}
