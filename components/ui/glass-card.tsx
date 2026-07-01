import { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return <div className={`rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl ${className}`}>{children}</div>;
}
