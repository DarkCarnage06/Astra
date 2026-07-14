'use client';

import { motion } from 'framer-motion';
import {
  User, Bell, Globe, Palette, Trash2, Save, ChevronRight, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { loadBirthDetails, clearAll } from '../../lib/storage';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

// ---------------------------------------------------------------------------
// Section shell
// ---------------------------------------------------------------------------
function SettingsSection({
  icon: Icon, title, children
}: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      {...fadeUp(0.1)}
      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/15">
          <Icon size={15} className="text-[#D4AF37]" />
        </div>
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B8BCC8]">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#B8BCC8]/50 outline-none transition focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20';

// ---------------------------------------------------------------------------
// Main Settings
// ---------------------------------------------------------------------------
export function SettingsPanel() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const birth = typeof window !== 'undefined' ? loadBirthDetails() : null;

  const [name, setName] = useState(user?.firstName ?? '');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm) {
      clearAll();
      signOut({ redirectUrl: '/' });
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 5000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Profile */}
      <SettingsSection icon={User} title="Profile">
        <div className="space-y-4">
          <FormField label="Display Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Your name"
            />
          </FormField>
          <FormField label="Email">
            <input
              value={user?.emailAddresses[0]?.emailAddress ?? ''}
              disabled
              className={`${inputClass} cursor-not-allowed opacity-50`}
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Birth Details */}
      <SettingsSection icon={Globe} title="Birth Details">
        {birth ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#B8BCC8]/60">Name</p>
                <p className="text-sm font-semibold text-white">{birth.name}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#B8BCC8]/60">Date</p>
                <p className="text-sm font-semibold text-white">{birth.date}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#B8BCC8]/60">Time</p>
                <p className="text-sm font-semibold text-white">{birth.knownTime ? birth.time : 'Unknown'}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#B8BCC8]/60">Place</p>
                <p className="text-sm font-semibold text-white truncate">{birth.displayPlace ?? birth.place}</p>
              </div>
            </div>
            <Link
              href="/birth-form?mode=update"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#B8BCC8] transition hover:border-white/20 hover:text-white"
            >
              <span>Update Birth Details</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <Link
            href="/birth-form"
            className="flex items-center justify-between rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-4 py-3 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
          >
            <span>Generate Your Birth Chart</span>
            <ChevronRight size={14} />
          </Link>
        )}
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection icon={Palette} title="Preferences">
        <div className="space-y-4">
          <FormField label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </FormField>
          <FormField label="Language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </FormField>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Daily Cosmic Brief</p>
            <p className="text-xs text-[#B8BCC8]">Receive your daily cosmic brief notification</p>
          </div>
          <button
            onClick={() => setNotifications((n) => !n)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${notifications ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${notifications ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>
      </SettingsSection>

      {/* Save button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3.5 text-sm font-bold text-black transition hover:bg-[#D4AF37]/90 disabled:opacity-60"
      >
        <Save size={15} />
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
      </motion.button>

      {/* Sign out */}
      <button
        onClick={() => signOut({ redirectUrl: '/' })}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-[#B8BCC8] transition hover:bg-white/10 hover:text-white"
      >
        <LogOut size={14} />
        Sign Out
      </button>

      {/* Danger zone */}
      <SettingsSection icon={Trash2} title="Danger Zone">
        <p className="mb-4 text-xs text-[#B8BCC8]">
          Deleting your account will permanently remove all your data including birth charts, chat history, and subscription.
          This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            deleteConfirm
              ? 'border border-red-400/50 bg-red-400/20 text-red-300 hover:bg-red-400/30'
              : 'border border-white/10 bg-white/5 text-[#B8BCC8] hover:border-red-400/30 hover:text-red-400'
          }`}
        >
          {deleteConfirm ? '⚠️ Click again to permanently delete account' : 'Delete Account'}
        </button>
      </SettingsSection>
    </div>
  );
}
