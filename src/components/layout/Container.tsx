import React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'compact' | 'editorial' | 'default' | 'wide' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({
  className,
  size = 'default',
  ...props
}: ContainerProps) {
  const sizes: Record<string, string> = {
    // Semantic responsive sizes
    compact: 'max-w-3xl',      // 768px: focused utility tools, narrow forms
    editorial: 'max-w-4xl',    // 896px: long-form articles, readable line lengths
    default: 'max-w-5xl',      // 1024px: general application views, tools, record details
    wide: 'max-w-7xl',         // 1280px: dashboards, data catalogues, intelligence feeds, tables
    // Legacy sizes (preserved for 100% backward compatibility)
    sm: 'max-w-xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  const selectedSizeClass = sizes[size] ?? sizes.default;

  return (
    <div
      className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', selectedSizeClass, className)}
      {...props}
    />
  );
}
