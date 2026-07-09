import { DashaTimeline } from '../../../components/dashboard/dasha-timeline';

export const metadata = {
  title: 'Dasha Timeline',
  description: 'Your complete Vimshottari Dasha timeline.',
};

export default function TimelinePage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <DashaTimeline />
    </div>
  );
}
