import { useState, useId } from 'react';
import { Eye, EyeOff, X, KeyRound, ArrowRight, ShieldCheck, Search } from 'lucide-react';
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
    <div className={cn('w-full flex flex-col gap-4 text-left', className)}>
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2 font-mono"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 border border-accent/30 text-accent">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <span>Credential Query Chamber // k-Anonymity</span>
        </label>
        <div className="flex items-center gap-2">
          {!isInputEmpty && (
            <Badge variant="cyan" size="sm">
              <span className="font-mono font-bold">{value.length}</span> CHARS
            </Badge>
          )}
          <Badge variant="amber" size="sm" dot>
            k-Anonymity 5-Hex
          </Badge>
        </div>
      </div>

      {/* Input row + Scan action */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1 flex items-center rounded-xl border border-border-strong bg-enclave-void shadow-inner focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition-all">
          <div className="pl-3.5 pr-2 text-accent font-mono select-none font-bold text-sm">
            &gt;
          </div>
          <input
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder="Input password to verify against global data breaches..."
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
                disabled={disabled || isLoading}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-enclave-elevated hover:bg-enclave-card text-muted hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                aria-label="Clear password input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled || isLoading}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-enclave-elevated hover:bg-enclave-card text-muted hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onSubmit}
          disabled={disabled || isLoading || isInputEmpty}
          isLoading={isLoading}
          leftIcon={<Search className="w-4 h-4" />}
          className="h-12 px-5 font-mono text-xs font-bold shrink-0"
        >
          Scan Breach Index
        </Button>
      </div>

      {/* Mathematical guarantee strip */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-foreground-dim pt-0.5">
        <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
        <span>SHA-1 hash prefix only (first 20 bits). Raw password never leaves your browser RAM.</span>
      </div>
    </div>
  );
}
