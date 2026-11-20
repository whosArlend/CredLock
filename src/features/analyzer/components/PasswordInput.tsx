import { useState, useId } from 'react';
import { Eye, EyeOff, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export function PasswordInput({
  value,
  onChange,
  onClear,
  disabled = false,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  return (
    <div className={cn('w-full flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono"
        >
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>Password Evaluation Chamber</span>
        </label>
        <div className="flex items-center gap-2">
          {value.length > 0 ? (
            <Badge variant="neutral" size="sm">
              <span className="font-mono">{value.length}</span> {value.length === 1 ? 'char' : 'chars'}
            </Badge>
          ) : (
            <span className="text-[11px] font-mono text-muted-dim">Ready for input</span>
          )}
        </div>
      </div>

      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type or paste a password to inspect..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'w-full h-11 pl-3.5 pr-20 bg-background-base text-foreground placeholder:text-muted/60 text-sm sm:text-base font-mono rounded-lg border border-border transition-colors duration-150',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Clear password input"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted-dim leading-snug">
        Client-side evaluation in memory. Keystrokes are never transmitted or logged.
      </p>
    </div>
  );
}
