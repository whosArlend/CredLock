import React from 'react';
import { cn } from '@/lib/utils';

export type MeterVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export type MeterSize = 'sm' | 'md' | 'lg';

export interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  min?: number;
  max?: number;
  variant?: MeterVariant;
  size?: MeterSize;
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
  description?: React.ReactNode;
  segments?: number; // If set (e.g. 4 or 5), renders discrete calibrated segments; otherwise continuous
}

export function Meter({
  value,
  min = 0,
  max = 100,
  variant = 'accent',
  size = 'md',
  label,
  valueLabel,
  description,
  segments,
  className,
  ...props
}: MeterProps) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const range = max - min;
  const percentage = range > 0 ? Math.round(((clampedValue - min) / range) * 100) : 0;

  // Obsidian Vault × Cipher Ledger semantic fills
  const variantFills: Record<MeterVariant, string> = {
    default: 'bg-foreground-secondary',
    accent: 'bg-accent',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
  };

  const trackHeights: Record<MeterSize, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const isSegmented = typeof segments === 'number' && segments > 1;

  return (
    <div className={cn('w-full flex flex-col gap-2 font-sans text-left', className)} {...props}>
      {/* Header: Label & Value Readout */}
      {(label || valueLabel) && (
        <div className="flex items-center justify-between text-xs gap-2">
          {label && (
            <span className="font-semibold text-foreground tracking-tight flex items-center gap-1.5">
              {label}
            </span>
          )}
          {valueLabel && (
            <span className="font-mono text-xs font-medium text-foreground-secondary tabular-nums">
              {valueLabel}
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={typeof valueLabel === 'string' ? valueLabel : undefined}
        className="w-full"
      >
        {isSegmented ? (
          // Segmented Calibrated Meter Mode
          <div
            className="grid gap-1.5 w-full"
            style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: segments }).map((_, index) => {
              const segmentStart = min + (range * index) / segments;
              const isActive = clampedValue > segmentStart;

              return (
                <div
                  key={index}
                  className={cn(
                    'rounded-sm transition-all duration-200 border',
                    trackHeights[size],
                    isActive
                      ? cn(variantFills[variant], 'border-transparent shadow-sm')
                      : 'bg-background-elevated/40 border-border/60'
                  )}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        ) : (
          // Continuous Linear Meter Mode
          <div
            className={cn(
              'w-full bg-background-secondary rounded-sm border border-border overflow-hidden',
              trackHeights[size]
            )}
          >
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out rounded-sm',
                variantFills[variant]
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Description / Feedback Note */}
      {description && (
        <p className="text-xs text-foreground-dim leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
