import { PlanetDashboard } from '../../../components/dashboard/planet-dashboard';

export const metadata = {
  title: 'Birth Chart',
  description: 'Explore your birth chart and planetary positions.',
};

export default function ChartPage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <PlanetDashboard />
    </div>
  );
}
