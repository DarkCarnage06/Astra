import { DashboardShell } from '../../components/dashboard/dashboard-shell';

export default function AskAstraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-[#0d0c14]">
      <DashboardShell fixedContent contentClassName="px-2 py-2 sm:px-6 sm:py-5 lg:px-10">
        {children}
      </DashboardShell>
    </div>
  );
}
