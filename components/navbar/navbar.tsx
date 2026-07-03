'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems } from '../constants';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#05060A]/70 py-3 backdrop-blur-xl' : 'bg-transparent py-5'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Brand */}
          <a href="#" className="flex items-center gap-3 text-[1.05rem] font-semibold tracking-[0.2em] text-white">
            <span className="text-lg text-[#D4AF37]">✦</span>
            ASTRA
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-[#B8BCC8] md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/25 hover:text-white"
            >
              Login
            </a>
            <a
              href="#cta"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/25 hover:bg-white/10 md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  <X size={18} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  <Menu size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile drawer + backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-[80vw] max-w-[320px] flex-col bg-[#05060A]/95 shadow-2xl backdrop-blur-2xl md:hidden"
            >
              {/* Drawer top bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <a
                  href="#"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-[1rem] font-semibold tracking-[0.2em] text-white"
                >
                  <span className="text-[#D4AF37]">✦</span>
                  ASTRA
                </a>
                <button
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={closeMenu}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + index * 0.055, duration: 0.3 }}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[0.95rem] font-medium text-[#B8BCC8] transition hover:bg-white/5 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]/40 transition group-hover:bg-[#D4AF37]" />
                    {item}
                  </motion.a>
                ))}
              </nav>

              {/* Bottom CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                className="flex flex-col gap-3 border-t border-white/10 px-6 py-6"
              >
                <a
                  href="#"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-white/80 transition hover:border-white/25 hover:text-white"
                >
                  Login
                </a>
                <a
                  href="#cta"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-full bg-[#D4AF37]/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D4AF37]/25"
                >
                  Get Started ✦
                </a>
              </motion.div>

              {/* Decorative gold gradient accent */}
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#D4AF37]/8 blur-3xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
