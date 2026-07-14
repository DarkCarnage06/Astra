import { DashaTimeline } from '../../../components/dashboard/dasha-timeline';

import PremiumLock from '../../../components/dashboard/premium-lock';

export const metadata = {
  title: 'Dasha Timeline',
  description: 'Your complete Vimshottari Dasha timeline.',
};

export default function TimelinePage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <PremiumLock requiredPlan="PRO">
        <DashaTimeline />
      </PremiumLock>
    </div>
  );
}
