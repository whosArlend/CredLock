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
  const variants = {
    emerald: 'bg-cyber-emerald-muted text-cyber-emerald border-cyber-emerald-border',
    amber: 'bg-cyber-amber-muted text-cyber-amber border-cyber-amber-border',
    rose: 'bg-cyber-rose-muted text-cyber-rose border-cyber-rose-border',
    cyan: 'bg-cyber-cyan-muted text-cyber-cyan border-cyber-cyan-border',
    neutral: 'bg-background-elevated text-foreground-muted border-border',
  };

  const dotColors = {
    emerald: 'bg-cyber-emerald',
    amber: 'bg-cyber-amber',
    rose: 'bg-cyber-rose',
    cyan: 'bg-cyber-cyan',
    neutral: 'bg-foreground-dim',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border select-none transition-colors duration-150',
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
