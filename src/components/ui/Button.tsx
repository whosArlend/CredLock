import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      // Obsidian Vault × Cipher Ledger: Amber primary authorization
      primary:
        'bg-accent text-background font-semibold hover:bg-accent-hover active:bg-accent-active shadow-sm',
      // Milled alloy surface elevated
      secondary:
        'bg-background-elevated text-foreground border border-border hover:bg-[#2C3138] hover:border-border-strong',
      // Precision outline
      outline:
        'border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent active:bg-accent/20',
      // Low-profile ghost
      ghost:
        'text-foreground-muted hover:text-foreground hover:bg-background-surface active:bg-background-elevated',
      // High-consequence danger
      danger:
        'bg-status-danger/15 text-[#EF4444] border border-status-danger/30 hover:bg-status-danger/25 active:bg-status-danger/35',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
      md: 'h-10 px-4 text-sm gap-2 rounded-md',
      lg: 'h-12 px-5 text-base gap-2.5 rounded-md',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
