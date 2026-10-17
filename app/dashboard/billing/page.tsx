import { BillingPlans } from '../../../components/dashboard/billing';
import { getUserPlan } from '../../../lib/auth';

export const metadata = {
  title: 'Billing & Plans',
  description: 'Choose your ASTRA subscription plan.',
};

export default async function BillingPage() {
  const plan = await getUserPlan();

  return (
    <div className="relative px-6 py-8 lg:px-10">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">✦ Early Launch Access</p>
        <h1 className="font-display text-4xl font-bold text-white">All Features Free For Launch</h1>
        <p className="mt-3 text-[#B8BCC8] max-w-xl mx-auto">
          Every chart, yoga, dosha, remedy, timeline, and AI conversation is 100% free for everyone. Premium subscription tiers are coming soon!
        </p>
      </div>
      <BillingPlans currentPlan={plan} />

      <div className="mt-8 text-center">
        <p className="text-xs text-[#B8BCC8]/50">
          ASTRA Launch Phase · 100% Free Access Unlocked · Paid Memberships Coming Soon
        </p>
      </div>
    </div>
  );
}
