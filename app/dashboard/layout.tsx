import { Background } from '../../components/background/background';
import { DashboardSidebar } from '../../components/dashboard/sidebar';
import { DashboardTopbar } from '../../components/dashboard/topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05060A]">
      <Background />
      {/* Sidebar */}
      <DashboardSidebar />
      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
