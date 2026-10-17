import { Background } from '../../components/background/background';
import { DashboardShell } from '../../components/dashboard/dashboard-shell';

export default function AskAstraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen min-h-[100dvh] overflow-hidden bg-[#05060A]">
      <Background />
      <DashboardShell contentClassName="px-3 sm:px-6 py-4 sm:py-8 lg:px-10">
        {children}
      </DashboardShell>
    </div>
  );
}
