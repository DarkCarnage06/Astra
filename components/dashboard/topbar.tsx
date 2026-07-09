'use client';

import { Bell, Sparkles } from 'lucide-react';
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
  '/ask-astra': 'Ask Astra',
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#05060A]/60 px-6 backdrop-blur-xl">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Ask Astra shortcut */}
        <Link
          href="/ask-astra"
          className="hidden items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 sm:flex"
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
