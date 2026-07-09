import { CompatibilityTool } from '../../../components/dashboard/compatibility';

export const metadata = {
  title: 'Compatibility Analysis',
  description: 'Analyze your astrological compatibility with your partner.',
};

export default function CompatibilityPage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <CompatibilityTool />
    </div>
  );
}
