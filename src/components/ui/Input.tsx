import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      leftElement,
      rightElement,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-foreground-muted select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-foreground-dim">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full h-10 px-3.5 bg-background-surface text-foreground placeholder:text-foreground-dim text-sm rounded-lg border border-border transition-colors duration-150',
              'focus:outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-cyber-rose focus:border-cyber-rose focus:ring-cyber-rose',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-foreground-dim">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-cyber-rose mt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-foreground-dim mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
