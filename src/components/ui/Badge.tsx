import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  // Obsidian Vault × Cipher Ledger: Restrained technical badges
  const variants = {
    emerald: 'bg-status-success/12 text-status-success border-status-success/30',
    amber: 'bg-accent/12 text-accent border-accent/30',
    rose: 'bg-status-danger/12 text-[#EF4444] border-status-danger/30',
    cyan: 'bg-status-info/12 text-status-info border-status-info/30',
    neutral: 'bg-background-elevated text-foreground-secondary border-border',
  };

  const dotColors = {
    emerald: 'bg-status-success',
    amber: 'bg-accent',
    rose: 'bg-status-danger',
    cyan: 'bg-status-info',
    neutral: 'bg-foreground-dim',
  };

  const sizes = {
    sm: 'text-[10px] font-mono px-1.5 py-0.5 gap-1 rounded-sm',
    md: 'text-xs font-mono px-2 py-0.5 gap-1.5 rounded-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border select-none transition-colors duration-150 tracking-tight',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
