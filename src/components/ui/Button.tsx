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
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary:
        'bg-cyber-emerald text-background font-semibold hover:bg-cyber-emerald-hover active:bg-cyber-emerald-active shadow-sm hover:shadow-glow-emerald',
      secondary:
        'bg-background-surface text-foreground border border-border hover:bg-background-elevated hover:border-border-focus text-foreground',
      outline:
        'border border-cyber-emerald/40 text-cyber-emerald hover:bg-cyber-emerald-muted hover:border-cyber-emerald',
      ghost:
        'text-foreground-muted hover:text-foreground hover:bg-background-surface',
      danger:
        'bg-cyber-rose/10 text-cyber-rose border border-cyber-rose/30 hover:bg-cyber-rose/20 active:bg-cyber-rose/30',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
