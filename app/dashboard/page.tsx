import { Background } from '../../components/background/background';
import { Dashboard } from '../../components/dashboard/dashboard';
import { Navbar } from '../../components/navbar/navbar';

export const metadata = {
  title: 'Your Chart — ASTRA',
  description: 'Explore your personal birth chart, planetary positions, AI insights, and life timeline.',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />
      <Dashboard />
    </main>
  );
}
