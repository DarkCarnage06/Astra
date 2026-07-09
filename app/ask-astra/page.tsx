import { AskAstraChat } from '../../components/ask-astra/chat';
import { Background } from '../../components/background/background';
import { DashboardSidebar } from '../../components/dashboard/sidebar';
import { DashboardTopbar } from '../../components/dashboard/topbar';

export const metadata = {
  title: 'Ask Astra',
  description: 'Discuss your birth chart, dasha timeline, and planetary placements with ASTRA AI.',
};

export default function AskAstraPage() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05060A]">
      <Background />
      {/* Sidebar */}
      <DashboardSidebar />
      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <AskAstraChat />
        </main>
      </div>
    </div>
  );
}
