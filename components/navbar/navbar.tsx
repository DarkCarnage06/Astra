'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { navItems } from '../constants';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/70 py-3 backdrop-blur-xl' : 'bg-transparent py-5'}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 text-[1.05rem] font-semibold tracking-[0.2em] text-white">
          <span className="text-lg text-[#D4AF37]">✦</span>
          ASTRA
        </a>
        <nav className="hidden items-center gap-8 text-sm text-secondary md:flex">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-white">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/25 hover:text-white sm:block">
            Login
          </a>
          <a href="#cta" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            Get Started
          </a>
        </div>
      </div>
    </motion.header>
  );
}
