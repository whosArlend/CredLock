import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function LoadingIndicator({
  label = 'Processing cryptographic data...',
  size = 'md',
  fullScreen = false,
  className,
}: LoadingIndicatorProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-3', className)}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            'border-2 border-cyber-emerald/20 border-t-cyber-emerald rounded-full animate-spin',
            sizes[size]
          )}
        />
        <Shield
          className={cn(
            'absolute text-cyber-emerald/40',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-6 h-6'
          )}
        />
      </div>
      {label && <p className="text-xs text-foreground-dim font-medium animate-pulse">{label}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
