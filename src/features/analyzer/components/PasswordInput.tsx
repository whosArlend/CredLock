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
    <div className={cn('w-full flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between pb-1 border-b border-border/80">
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2 font-mono"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/10 border border-accent/30 text-accent">
            <Lock className="w-3 h-3" />
          </div>
          <span>Input Chamber // Volatile RAM</span>
        </label>
        <div className="flex items-center gap-2">
          {value.length > 0 ? (
            <Badge variant="amber" size="sm">
              <span className="font-mono font-bold">{value.length}</span> {value.length === 1 ? 'CHAR' : 'CHARS'}
            </Badge>
          ) : (
            <span className="text-[10px] font-mono text-foreground-dim uppercase">AWAITING BUFFER</span>
          )}
        </div>
      </div>

      <div className="relative flex items-center w-full rounded-xl border border-border-strong bg-enclave-void shadow-inner focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition-all">
        <div className="pl-3.5 pr-2 text-accent font-mono select-none font-bold text-sm">
          &gt;
        </div>
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type or paste password to evaluate..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'w-full h-12 pl-1 pr-24 bg-transparent text-foreground placeholder:text-foreground-dim/60 text-sm sm:text-base font-mono focus:outline-none selection:bg-accent/30 selection:text-accent tracking-wide',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {value.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-enclave-elevated hover:bg-enclave-card text-muted hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Clear password input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-enclave-elevated hover:bg-enclave-card text-muted hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
