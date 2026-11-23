import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, RotateCw, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import type { GeneratorResult } from '@/types';

interface PasswordDisplayProps {
  result: GeneratorResult | null;
  onRegenerate: () => void;
  onClear: () => void;
  onCopy: () => void;
  isCopied: boolean;
  disabled?: boolean;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  result,
  onRegenerate,
  onClear,
  onCopy,
  isCopied,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const hasPassword = Boolean(result && result.password.length > 0);

  const handleRegenerateClick = () => {
    setIsSpinning(true);
    onRegenerate();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Generated Password Box */}
      <div className="relative rounded-2xl border border-border-strong bg-enclave-plate p-5 sm:p-6 transition-all focus-within:border-accent shadow-plate-tactical">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono">
              Cryptographic Key Chamber
            </span>
          </div>

          {result && result.password.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap font-mono">
              <Badge variant="cyan" size="sm">
                <span className="font-bold">{result.length}</span> CHARS
              </Badge>
              <Badge variant="neutral" size="sm">
                <span>{result.poolSize}</span> POOL
              </Badge>
              <Tooltip content="Theoretical pool-based entropy estimate: length * log2(poolSize). Upper-bound estimate assuming unconstrained uniform selection.">
                <div>
                  <Badge variant="emerald" size="sm">
                    ~<span className="font-bold">{result.theoreticalPoolEntropyBits}</span> BITS
                  </Badge>
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Password Monospace Value Area */}
        <div className="relative flex items-center justify-between min-h-[4rem] rounded-xl bg-enclave-void border border-border-strong px-4 py-3 shadow-inner my-1">
          {hasPassword && result ? (
            <div
              className="w-full font-mono text-base sm:text-lg text-foreground tracking-wider select-all break-all overflow-x-auto pr-3 leading-relaxed"
              aria-label="Generated Password Output"
            >
              {isVisible ? (
                result.password
              ) : (
                <span className="text-foreground-dim tracking-[0.3em]">
                  {'•'.repeat(result.password.length)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-mono text-foreground-dim italic">
              Buffer empty. Click "Synthesize Key" below.
            </div>
          )}

          {/* Visibility Toggle */}
          {hasPassword && (
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              disabled={disabled}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-enclave-elevated hover:bg-enclave-card text-muted hover:text-foreground transition-colors border border-border shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label={isVisible ? 'Hide password characters' : 'Show password characters'}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />}
              onClick={handleRegenerateClick}
              disabled={disabled}
              className="font-mono text-xs font-bold"
            >
              Synthesize Key
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={isCopied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-accent" />}
              onClick={onCopy}
              disabled={disabled || !hasPassword}
              className="font-mono text-xs"
            >
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {hasPassword && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={onClear}
              disabled={disabled}
              className="text-foreground-dim hover:text-status-danger text-xs font-mono self-end sm:self-auto"
            >
              Purge Buffer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
