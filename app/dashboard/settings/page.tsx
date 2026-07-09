import { SettingsPanel } from '../../../components/dashboard/settings';

export const metadata = {
  title: 'Settings',
  description: 'Manage your ASTRA account settings, birth details, and preferences.',
};

export default function SettingsPage() {
  return (
    <div className="relative px-6 py-8 lg:px-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Account</p>
        <h1 className="font-display text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#B8BCC8]">Manage your profile, preferences, and account.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
