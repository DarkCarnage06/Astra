'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, LogOut } from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';
import { NAV_ITEMS } from './sidebar';

interface DashboardMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardMobileNav({ isOpen, onClose }: DashboardMobileNavProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 md:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-white/10 bg-[#080a11] shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10">
                  <span className="text-lg text-gold">✦</span>
                </div>
                <span className="font-display text-lg font-semibold tracking-[0.15em] text-text">
                  ASTRA
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary hover:text-white transition"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 overscroll-contain">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex min-h-12 items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-gold/10 text-gold border border-gold/20'
                        : 'text-secondary hover:bg-white/5 hover:text-text'
                    }`}
                  >
                    <Icon size={19} className="flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Launch Banner */}
            <div className="mx-3 mb-3 rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/10 to-transparent p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Sparkles size={14} className="text-gold" />
                <p className="text-xs font-semibold text-gold tracking-wide uppercase">Launch Special</p>
              </div>
              <p className="mb-2 text-[11px] leading-relaxed text-secondary">
                All features are 100% free for everyone. Premium memberships coming soon.
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                ✦ Free Launch Access
              </div>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="border-t border-white/5 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt={user.firstName ?? 'User'}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold border border-gold/20">
                    {user?.firstName?.[0] ?? 'A'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text">
                    {user?.fullName ?? user?.firstName ?? 'Astra User'}
                  </p>
                  <p className="truncate text-[10px] text-secondary">
                    {user?.primaryEmailAddress?.emailAddress ?? ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:text-red-400 hover:bg-white/5 transition flex-shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
