'use client';

import { Bell, Sparkles, Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/chart': 'Birth Chart',
  '/dashboard/timeline': 'Dasha Timeline',
  '/dashboard/compatibility': 'Compatibility',
  '/dashboard/settings': 'Settings',
  '/dashboard/billing': 'Billing & Plans',
  '/dashboard/panchang': "Today's Panchang",
  '/dashboard/yogas': 'Yogas & Doshas',
  '/dashboard/remedies': 'Remedies',
  '/ask-astra': 'Ask Astra',
};

export function DashboardTopbar({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#05060A]/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile hamburger + Page title */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary hover:text-white hover:bg-white/10 transition md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gold md:hidden">✦</span>
          <h2 className="font-display text-base sm:text-lg font-semibold text-white truncate max-w-[180px] sm:max-w-none">
            {title}
          </h2>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Launch status pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold">
          <span>✦</span> All Features Free
        </div>

        {/* Ask Astra shortcut */}
        <Link
          href="/ask-astra"
          className="hidden sm:flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
        >
          <Sparkles size={12} />
          Ask Astra
        </Link>

        {/* Notifications placeholder */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#B8BCC8] transition hover:text-white"
          title="Notifications"
        >
          <Bell size={14} />
        </button>

        {/* Clerk user button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 ring-2 ring-[#D4AF37]/30',
              userButtonPopoverCard: 'bg-[#0A0B10] border border-white/10',
              userButtonPopoverActionButton: 'text-white hover:bg-white/5',
              userButtonPopoverActionButtonText: 'text-white',
              userButtonPopoverFooter: 'border-white/10',
            },
          }}
        />
      </div>
    </header>
  );
}
