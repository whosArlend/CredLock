import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
}

export function Card({ className, isInteractive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-background-surface/80 p-5 shadow-card transition-all duration-200',
        isInteractive &&
          'cursor-pointer hover:border-border-focus hover:bg-background-surface focus-within:border-cyber-emerald focus-within:ring-1 focus-within:ring-cyber-emerald active:scale-[0.99]',
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
      className={cn('text-base font-semibold text-foreground tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-foreground-muted leading-relaxed', className)} {...props} />
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
