import type { ReactNode } from 'react';
import { Info, Lightbulb, Keyboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  variant?: 'info' | 'tip' | 'keys';
  className?: string;
}

export function InfoHint({ children, variant = 'info', className = '' }: Props) {
  const config = {
    info: { icon: Info, bg: 'bg-[#5865F2]/8 border-[#5865F2]/20', text: 'text-[#5865F2]' },
    tip: { icon: Lightbulb, bg: 'bg-amber-500/8 border-amber-500/20', text: 'text-amber-500' },
    keys: { icon: Keyboard, bg: 'bg-emerald-500/8 border-emerald-500/20', text: 'text-emerald-500' },
  };
  const { icon: Icon, bg, text } = config[variant];

  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border ${bg} ${className}`}>
      <Icon size={15} className={`${text} shrink-0 mt-0.5`} />
      <div className={`text-xs leading-relaxed ${text} opacity-90`}>{children}</div>
    </div>
  );
}
