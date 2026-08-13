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
  Award,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ask-astra', label: 'Ask Astra', icon: MessageSquare },
  { href: '/dashboard/yogas', label: 'Yogas & Doshas', icon: Award },
  { href: '/dashboard/remedies', label: 'Remedies', icon: Sparkles },
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
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'PREMIUM' | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch('/api/payment/history');
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan);
        }
      } catch (err) {
        console.error('Failed to load user plan for sidebar:', err);
      }
    };
    if (user) {
      fetchPlan();
    }
  }, [user]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r border-white/5 bg-background/90 backdrop-blur-3xl"
    >
      {/* Top — Logo */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
          <span className="text-lg text-gold">✦</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="font-display text-lg font-semibold tracking-[0.15em] text-text"
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
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-gold'
                  : 'text-secondary hover:bg-white/5 hover:text-text'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold/10 to-transparent border-l-2 border-gold"
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
        {!collapsed && userPlan !== 'PRO' && userPlan !== 'PREMIUM' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-4 overflow-hidden rounded-[16px] border border-gold/10 bg-gradient-to-b from-gold/5 to-transparent p-4 relative"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gold/10 blur-2xl rounded-full" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <Crown size={14} className="text-gold" />
                <p className="text-xs font-semibold text-gold tracking-wide uppercase">Go Premium</p>
              </div>
              <p className="mb-4 text-[11px] leading-relaxed text-secondary/80">
                Unlock deeper layers of your chart and relationships.
              </p>
              <Link
                href="/dashboard/billing"
                className="block rounded-lg bg-surface border border-gold/20 py-2 text-center text-xs font-semibold text-gold transition hover:bg-gold hover:text-black hover:border-gold"
              >
                Upgrade Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User + Sign out */}
      <div className="border-t border-white/5 px-2 py-3">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
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
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <span className="truncate text-xs font-semibold text-text">
                  {user?.firstName ?? 'Astra User'}
                </span>
                <span className="truncate text-[10px] text-secondary">
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
                className="flex-shrink-0 rounded-lg p-1.5 text-secondary transition hover:bg-white/10 hover:text-text"
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
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/5 bg-surface text-secondary shadow-lg transition hover:text-text hover:border-white/20"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
