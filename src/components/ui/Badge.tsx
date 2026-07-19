import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'green' | 'red' | 'yellow' | 'blurple' | 'gray';
}

const colors: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 dark:text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/15 text-red-400 dark:text-red-400 border-red-500/30',
  yellow: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30',
  blurple: 'bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/30',
  gray: 'bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30',
};

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
}
