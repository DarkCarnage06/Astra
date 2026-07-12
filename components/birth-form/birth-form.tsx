'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Calendar, Clock, MapPin, Sparkles, User } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GeocodeError } from '../../lib/api/geocode';
import { generateChart, ChartApiError } from '../../lib/api/chart';
import { saveBirthDetails, saveChartResponse } from '../../lib/storage';
import { validateBirthDetails, sanitizeString } from '../../lib/validators/birthData';
import { track, ANALYTICS_EVENTS } from '../../lib/analytics';
import type { BirthDetails } from '../../lib/types/chart';
import { LocationAutocomplete, LocationResult } from './location-autocomplete';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormState {
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
  error?: string;
}

// ---------------------------------------------------------------------------
// Animated field wrapper
// ---------------------------------------------------------------------------
function FormField({ label, icon, children, index, error }: FieldProps) {
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
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-red-400"
        >
          <AlertCircle size={11} />
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Input style helper
// ---------------------------------------------------------------------------
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all duration-200 focus:border-[#D4AF37]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#D4AF37]/30 hover:border-white/20 text-sm';

const inputErrorClass =
  'w-full rounded-2xl border border-red-400/40 bg-white/5 px-5 py-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all duration-200 focus:border-red-400/60 focus:ring-1 focus:ring-red-400/30 text-sm';

// ---------------------------------------------------------------------------
// Loading step labels
// ---------------------------------------------------------------------------
const LOADING_STEPS = [
  'Locating your birthplace…',
  'Calculating planetary positions…',
  'Mapping your Nakshatra…',
  'Computing Vimshottari Dasha…',
  'Preparing your chart…',
];

// ---------------------------------------------------------------------------
// BirthForm component
// ---------------------------------------------------------------------------
export function BirthForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    date: '',
    time: '',
    place: '',
    knownTime: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const isFormReady =
    form.name.trim().length > 0 &&
    form.date.length > 0 &&
    selectedLocation !== null &&
    (form.knownTime ? form.time.length > 0 : true);

  function advanceStep() {
    setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
  }

  // ---------------------------------------------------------------------------
  // Submit — real pipeline
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // 1. Client-side validation
    const birthDraft: Partial<BirthDetails> = {
      name: form.name,
      date: form.date,
      time: form.time,
      place: form.place,
      knownTime: form.knownTime,
    };

    const validation = validateBirthDetails(birthDraft);
    if (!validation.valid) {
      const errs: Record<string, string> = {};
      validation.errors.forEach((e) => { errs[e.field] = e.message; });
      setFieldErrors(errs);
      track(ANALYTICS_EVENTS.FORM_VALIDATION_FAIL, { errorCount: validation.errors.length });
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    track(ANALYTICS_EVENTS.FORM_SUBMITTED);

    try {
      // 2. Extract location details
      advanceStep();
      if (!selectedLocation) {
        setGlobalError('Please select a valid birthplace from the suggestions.');
        throw new Error('No valid location selected');
      }

      const latitude = selectedLocation.latitude;
      const longitude = selectedLocation.longitude;
      const timezone = selectedLocation.timezone;
      const displayPlace = selectedLocation.displayPlace;

      // 3. Build complete birth details object
      const birthDetails: BirthDetails = {
        name: sanitizeString(form.name),
        date: form.date,
        time: form.knownTime ? form.time : '12:00',
        place: form.place,
        knownTime: form.knownTime,
        latitude,
        longitude,
        timezone,
        displayPlace,
      };

      // 4. Generate birth chart via FastAPI backend
      advanceStep();
      advanceStep();
      track(ANALYTICS_EVENTS.CHART_REQUESTED);

      const chart = await generateChart(birthDetails);

      advanceStep();

      // 5. Persist both to localStorage for the dashboard
      saveBirthDetails(birthDetails);
      saveChartResponse(chart);

      advanceStep();

      // 6. Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      // GeocodeError is already handled above — only set a message if one isn't set
      if (err instanceof GeocodeError) {
        // globalError already set in inner catch; do nothing
      } else if (err instanceof ChartApiError) {
        if (err.statusCode === 0) {
          setGlobalError('Cannot reach the ASTRA server. Is the backend running?');
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-24 lg:px-8">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-[#7C3AED]/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
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
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4AF37]/8 blur-3xl" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            {/* Full name */}
            <FormField label="Full Name" icon={<User size={12} />} index={0} error={fieldErrors.name}>
              <input
                id="birth-name"
                type="text"
                placeholder="e.g. Arjun Mehta"
                value={form.name}
                onChange={set('name')}
                className={fieldErrors.name ? inputErrorClass : inputClass}
                required
                autoComplete="name"
                disabled={loading}
              />
            </FormField>

            {/* Date of birth */}
            <FormField label="Date of Birth" icon={<Calendar size={12} />} index={1} error={fieldErrors.date}>
              <input
                id="birth-date"
                type="date"
                value={form.date}
                onChange={set('date')}
                className={`${fieldErrors.date ? inputErrorClass : inputClass} [color-scheme:dark]`}
                required
                disabled={loading}
              />
            </FormField>

            {/* Time of birth */}
            <FormField label="Time of Birth" icon={<Clock size={12} />} index={2} error={fieldErrors.time}>
              <div className="flex flex-col gap-3">
                <input
                  id="birth-time"
                  type="time"
                  value={form.time}
                  onChange={set('time')}
                  disabled={!form.knownTime || loading}
                  className={`${fieldErrors.time ? inputErrorClass : inputClass} [color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-35`}
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
                      disabled={loading}
                    />
                    <div className="h-4 w-8 rounded-full border border-white/20 bg-white/10 transition-colors peer-checked:border-[#D4AF37]/40 peer-checked:bg-[#D4AF37]/20" />
                    <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white/50 transition-transform peer-checked:translate-x-4 peer-checked:bg-[#D4AF37]" />
                  </div>
                  I don't know my exact birth time
                </label>
              </div>
            </FormField>

            {/* Place of birth */}
            <FormField label="Place of Birth" icon={<MapPin size={12} />} index={3} error={fieldErrors.place}>
              <LocationAutocomplete
                onLocationSelect={(loc) => {
                  setSelectedLocation(loc);
                  setForm((prev) => ({ ...prev, place: loc ? loc.place : '' }));
                }}
                error={fieldErrors.place}
                disabled={loading}
              />
            </FormField>

            {/* Global error */}
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-400"
                >
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{globalError}</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                disabled={!isFormReady || loading}
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
                      {LOADING_STEPS[loadingStep]}
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
          Your data is processed locally and never stored on our servers.
        </motion.p>
      </motion.div>
    </section>
  );
}
