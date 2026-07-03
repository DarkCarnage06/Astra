'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, User } from 'lucide-react';
import { FormEvent, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormData {
  name: string;
  date: string;
  time: string;
  place: string;
  knownTime: boolean;
}

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  index: number;
}

// ---------------------------------------------------------------------------
// Animated field wrapper
// ---------------------------------------------------------------------------
function FormField({ label, icon, children, index }: FieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
      className="group flex flex-col gap-2"
    >
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
        <span className="opacity-70">{icon}</span>
        {label}
      </label>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Input style helper
// ---------------------------------------------------------------------------
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/25 outline-none backdrop-blur-xl transition-all duration-200 focus:border-[#D4AF37]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#D4AF37]/30 hover:border-white/20 text-sm';

// ---------------------------------------------------------------------------
// BirthForm component
// ---------------------------------------------------------------------------
export function BirthForm() {
  const [form, setForm] = useState<FormData>({
    name: '',
    date: '',
    time: '',
    place: '',
    knownTime: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid =
    form.name.trim().length > 0 &&
    form.date.length > 0 &&
    form.place.trim().length > 0 &&
    (form.knownTime ? form.time.length > 0 : true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    // Simulate async chart generation
    await new Promise((r) => setTimeout(r, 2200));
    setLoading(false);
    setSubmitted(true);
  };

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-24 lg:px-8">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-[#7C3AED]/10 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-lg"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-10 text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#B8BCC8] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                Step 1 of 3 — Birth Details
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Where did your
                <br />
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#f0d060] to-[#D4AF37] bg-clip-text text-transparent">
                  story begin?
                </span>
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#B8BCC8]">
                Your birth chart is calculated from the exact moment and place you arrived in this world.
              </p>
            </motion.div>

            {/* Card */}
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_80px_rgba(124,58,237,0.08)] backdrop-blur-2xl sm:p-10">
              {/* Inner corner glow */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4AF37]/8 blur-3xl" />

              <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                {/* Full name */}
                <FormField label="Full Name" icon={<User size={12} />} index={0}>
                  <input
                    id="birth-name"
                    type="text"
                    placeholder="e.g. Arjun Mehta"
                    value={form.name}
                    onChange={set('name')}
                    className={inputClass}
                    required
                    autoComplete="name"
                  />
                </FormField>

                {/* Date of birth */}
                <FormField label="Date of Birth" icon={<Calendar size={12} />} index={1}>
                  <input
                    id="birth-date"
                    type="date"
                    value={form.date}
                    onChange={set('date')}
                    className={`${inputClass} [color-scheme:dark]`}
                    required
                  />
                </FormField>

                {/* Time of birth + unknown toggle */}
                <FormField label="Time of Birth" icon={<Clock size={12} />} index={2}>
                  <div className="flex flex-col gap-3">
                    <input
                      id="birth-time"
                      type="time"
                      value={form.time}
                      onChange={set('time')}
                      disabled={!form.knownTime}
                      className={`${inputClass} [color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-35`}
                    />
                    <label className="flex cursor-pointer items-center gap-3 text-xs text-[#B8BCC8]">
                      <div className="relative">
                        <input
                          id="birth-time-unknown"
                          type="checkbox"
                          checked={!form.knownTime}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, knownTime: !e.target.checked, time: e.target.checked ? '' : prev.time }))
                          }
                          className="peer sr-only"
                        />
                        <div className="h-4 w-8 rounded-full border border-white/20 bg-white/10 transition-colors peer-checked:border-[#D4AF37]/40 peer-checked:bg-[#D4AF37]/20" />
                        <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white/50 transition-transform peer-checked:translate-x-4 peer-checked:bg-[#D4AF37]" />
                      </div>
                      I don't know my exact birth time
                    </label>
                  </div>
                </FormField>

                {/* Place of birth */}
                <FormField label="Place of Birth" icon={<MapPin size={12} />} index={3}>
                  <input
                    id="birth-place"
                    type="text"
                    placeholder="e.g. Mumbai, India"
                    value={form.place}
                    onChange={set('place')}
                    className={inputClass}
                    required
                    autoComplete="off"
                  />
                </FormField>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                  className="pt-2"
                >
                  <button
                    id="birth-form-submit"
                    type="submit"
                    disabled={!isValid || loading}
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block"
                          >
                            <Sparkles size={15} />
                          </motion.span>
                          Generating your chart…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          Generate My Birth Chart
                          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </form>
            </div>

            {/* Privacy note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-xs text-[#B8BCC8]/50"
            >
              Your data is never stored or shared. Used only for chart generation.
            </motion.p>
          </motion.div>
        ) : (
          /* Success state */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full max-w-lg text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_60px_rgba(212,175,55,0.25)]"
            >
              <Sparkles size={36} />
            </motion.div>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white">
              Your chart is ready
            </h2>
            <p className="mt-4 text-[#B8BCC8]">
              Welcome, <span className="font-semibold text-white">{form.name}</span>. Your cosmic blueprint
              has been woven from the stars.
            </p>
            <div className="mt-4 text-sm text-[#B8BCC8]/60">
              {form.date} · {form.knownTime && form.time ? form.time : 'Time unknown'} · {form.place}
            </div>
            <a
              href="/dashboard"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#D4AF37]/20"
            >
              Explore Your Chart <ArrowRight size={15} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
