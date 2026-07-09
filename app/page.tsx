'use client';

import { useEffect, useState } from 'react';
import { useScroll } from 'framer-motion';
import { Background } from '../components/background/background';
import { CtaSection } from '../components/cta/cta-section';
import { FeaturesSection } from '../components/features/features-section';
import { HeroSection } from '../components/hero/hero-section';
import { LoadingUniverse } from '../components/loading/loading-universe';
import { Navbar } from '../components/navbar/navbar';
import { TestimonialsSection } from '../components/testimonials/testimonials-section';
import { TimelineSection } from '../components/timeline/timeline-section';
import { FooterSection } from '../components/footer/footer-section';

export default function Home() {
  // Show the loading universe once per session
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('astra_loaded');
    if (!seen) {
      setShowLoader(true);
    }
  }, []);

  const handleLoadComplete = () => {
    sessionStorage.setItem('astra_loaded', '1');
    setShowLoader(false);
  };

  const { scrollY } = useScroll();

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden">
      {showLoader && <LoadingUniverse onComplete={handleLoadComplete} duration={3800} />}
      <Background scrollY={scrollY} />
      <Navbar />
      <HeroSection scrollY={scrollY} />
      <FeaturesSection />
      <TimelineSection />
      <TestimonialsSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
