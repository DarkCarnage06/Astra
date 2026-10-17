'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSidebar } from './sidebar';
import { DashboardTopbar } from './topbar';
import { DashboardMobileNav } from './mobile-nav';

interface DashboardShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function DashboardShell({ children, contentClassName }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile menu when navigating to another route
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile / small screens) */}
      <div className="hidden md:flex md:h-full md:flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* Mobile Drawer (visible only on small screens when mobileOpen is true) */}
      <DashboardMobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main
          className={`flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)] ${
            contentClassName ?? ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
