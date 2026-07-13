'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast, Toast } from '../../lib/toast';

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toast.subscribe((newToasts) => {
      setActiveToasts(newToasts);
    });
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl pointer-events-auto ${
              t.type === 'error'
                ? 'border-red-500/20 bg-red-950/80 text-red-200'
                : t.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-950/80 text-emerald-200'
                : 'border-white/10 bg-zinc-950/80 text-zinc-200'
            }`}
          >
            {t.type === 'error' && <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />}
            {t.type === 'success' && <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
            {t.type === 'info' && <Info size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />}
            
            <p className="text-xs font-medium leading-5 flex-1">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
