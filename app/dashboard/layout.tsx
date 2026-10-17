import { Background } from '../../components/background/background';
import { DashboardShell } from '../../components/dashboard/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen min-h-[100dvh] overflow-hidden bg-[#05060A]">
      <Background />
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
