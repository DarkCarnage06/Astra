import { Background } from '../components/background/background';
import { CtaSection } from '../components/cta/cta-section';
import { FeaturesSection } from '../components/features/features-section';
import { HeroSection } from '../components/hero/hero-section';
import { Navbar } from '../components/navbar/navbar';
import { TestimonialsSection } from '../components/testimonials/testimonials-section';
import { TimelineSection } from '../components/timeline/timeline-section';
import { FooterSection } from '../components/footer/footer-section';

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TimelineSection />
      <TestimonialsSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
