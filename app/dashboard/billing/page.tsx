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
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">✦ Unlock Your Full Potential</p>
        <h1 className="font-display text-4xl font-bold text-white">Choose Your Plan</h1>
        <p className="mt-3 text-[#B8BCC8]">
          Start free, upgrade when you&apos;re ready. Cancel anytime.
        </p>
      </div>
      <BillingPlans currentPlan={plan} />

      <div className="mt-8 text-center">
        <p className="text-xs text-[#B8BCC8]/50">
          Secured by Razorpay · All amounts in INR · Test mode active
        </p>
      </div>
    </div>
  );
}
