'use client';

export function FooterSection() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/10 px-6 py-8 text-sm text-secondary lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="flex items-center gap-2 font-semibold tracking-[0.2em] text-white">
        <span className="text-[#D4AF37]">✦</span> ASTRA
      </div>
      <div className="flex flex-wrap gap-5">
        <a href="#" className="transition hover:text-white">Privacy</a>
        <a href="#" className="transition hover:text-white">Terms</a>
        <a href="#" className="transition hover:text-white">GitHub</a>
        <a href="#" className="transition hover:text-white">Twitter</a>
      </div>
      <p>© 2026 ASTRA</p>
    </footer>
  );
}
