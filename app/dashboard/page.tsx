import { Dashboard } from '../../components/dashboard/dashboard';

export const metadata = {
  title: 'Your Chart — ASTRA',
  description: 'Explore your personal birth chart, planetary positions, AI insights, and life timeline.',
};

export default function DashboardPage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <Dashboard />
    </div>
  );
}
