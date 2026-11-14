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
    <div className={cn('w-full flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-cyber-emerald" />
          Password to Evaluate
        </label>
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <Badge variant="neutral" size="sm">
              {value.length} {value.length === 1 ? 'character' : 'characters'}
            </Badge>
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
            'w-full h-12 pl-4 pr-24 bg-background-surface text-foreground placeholder:text-foreground-dim text-sm sm:text-base font-mono rounded-lg border border-border transition-colors duration-150',
            'focus:outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded text-foreground-dim hover:text-foreground hover:bg-background-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-emerald"
              aria-label="Clear password input"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1.5 rounded text-foreground-dim hover:text-foreground hover:bg-background-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-emerald"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-foreground-dim leading-relaxed">
        Password analysis runs locally in your browser memory. Input is never transmitted or saved.
      </p>
    </div>
  );
}
