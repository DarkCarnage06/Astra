'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Star,
  Clock,
  Heart,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ask-astra', label: 'Ask Astra', icon: MessageSquare },
  { href: '/dashboard/chart', label: 'Birth Chart', icon: Star },
  { href: '/dashboard/timeline', label: 'Timeline', icon: Clock },
  { href: '/dashboard/compatibility', label: 'Compatibility', icon: Heart },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r border-white/10 bg-[#05060A]/80 backdrop-blur-2xl"
    >
      {/* Top — Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
          <span className="text-lg text-[#D4AF37]">✦</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="font-display text-lg font-semibold tracking-[0.15em] text-white"
            >
              ASTRA
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'text-[#B8BCC8] hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-2xl bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon size={18} className="relative z-10 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade banner */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-2 mb-3 overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Crown size={14} className="text-[#D4AF37]" />
              <p className="text-xs font-semibold text-[#D4AF37]">Go Premium</p>
            </div>
            <p className="mb-3 text-[11px] leading-4 text-[#B8BCC8]">
              Unlock compatibility, PDF reports & more
            </p>
            <Link
              href="/dashboard/billing"
              className="block rounded-xl bg-[#D4AF37] py-2 text-center text-xs font-bold text-black transition hover:bg-[#D4AF37]/90"
            >
              Upgrade Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User + Sign out */}
      <div className="border-t border-white/10 px-2 py-3">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt={user.firstName ?? 'User'}
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-[#D4AF37]/30"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-xs font-bold text-[#D4AF37]">
              {user?.firstName?.[0] ?? 'A'}
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <span className="truncate text-xs font-semibold text-white">
                  {user?.firstName ?? 'Astra User'}
                </span>
                <span className="truncate text-[10px] text-[#B8BCC8]">
                  {user?.emailAddresses[0]?.emailAddress ?? ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => signOut({ redirectUrl: '/' })}
                title="Sign out"
                className="flex-shrink-0 rounded-lg p-1.5 text-[#B8BCC8] transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#05060A] text-[#B8BCC8] shadow-lg transition hover:text-white"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
