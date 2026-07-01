type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, className = '' }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[#D4AF37]">{eyebrow}</p>
      <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary">{description}</p> : null}
    </div>
  );
}
