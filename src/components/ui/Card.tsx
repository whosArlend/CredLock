import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'inset' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  isInteractive = false,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-background-surface border border-border shadow-card',
    elevated: 'bg-background-elevated border border-border-strong shadow-elevated',
    inset: 'bg-background-secondary border border-border shadow-inset',
    flat: 'bg-background-surface border border-border',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'rounded-card transition-all duration-200 text-left',
        variants[variant],
        paddings[padding],
        isInteractive &&
          'cursor-pointer hover:border-border-strong hover:bg-[#1F2226] focus-within:border-accent focus-within:ring-1 focus-within:ring-accent active:scale-[0.995]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-foreground tracking-tight font-sans', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-foreground-muted leading-relaxed font-sans', className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-border/60 text-xs text-foreground-muted', className)}
      {...props}
    />
  );
}
