import { useState, useId } from 'react';
import { Eye, EyeOff, X, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface BreachPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function BreachPasswordInput({
  value,
  onChange,
  onClear,
  onSubmit,
  isLoading = false,
  disabled = false,
  className,
}: BreachPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !disabled && value.trim().length > 0) {
      e.preventDefault();
      onSubmit();
    }
  };

  const isInputEmpty = value.length === 0;

  return (
    <div className={cn('w-full flex flex-col gap-3', className)}>
      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2 font-mono"
        >
          <KeyRound className="w-3.5 h-3.5 text-accent" />
          <span>CREDENTIAL QUERY CHAMBER</span>
        </label>
        <div className="flex items-center gap-2">
          {!isInputEmpty && (
            <Badge variant="neutral" size="sm">
              <span className="font-mono">{value.length}</span> chars
            </Badge>
          )}
          <Badge variant="amber" size="sm" dot>
            k-Anonymity
          </Badge>
        </div>
      </div>

      {/* Input Row with Show/Hide and Clear Controls */}
      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Enter a password to check exposure against 800M+ breach records..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'w-full h-12 pl-4 pr-24 bg-surface text-foreground placeholder:text-muted text-sm sm:text-base font-mono rounded-lg border border-border transition-colors duration-150',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {!isInputEmpty && (
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading || disabled}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40"
              aria-label="Clear password input"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Local SHA-1 digest calculated in memory. Only 5-character prefix is transmitted.</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isInputEmpty || disabled || isLoading}
          onClick={onSubmit}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Check Password
        </Button>
      </div>
    </div>
  );
}
