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
    <div className="space-y-3">
      {/* Generated Password Box */}
      <div className="relative rounded-xl border border-border bg-background-surface/80 p-4 transition-all focus-within:border-cyber-cyan focus-within:ring-1 focus-within:ring-cyber-cyan shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Generated Password (In-Memory Only)
            </span>
          </div>

          {result && result.password.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="cyan" size="sm">
                {result.length} characters
              </Badge>
              <Badge variant="neutral" size="sm">
                {result.poolSize}-char pool
              </Badge>
              <Tooltip content="Theoretical pool-based entropy estimate: length * log2(poolSize). Upper-bound estimate assuming unconstrained uniform selection; category requirements slightly restrict the keyspace.">
                <div>
                  <Badge variant="emerald" size="sm">
                    ~{result.theoreticalPoolEntropyBits} bits (Pool Est.)
                  </Badge>
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Password Output Area */}
        <div className="min-h-[56px] flex items-center justify-between rounded-lg bg-background-base/90 px-4 py-3 border border-border/60">
          {result && result.password.length > 0 ? (
            <div
              className="font-mono text-base md:text-lg tracking-wider text-cyber-cyan font-medium break-all select-all selection:bg-cyber-cyan selection:text-background"
              aria-live="polite"
              aria-label={isVisible ? 'Generated password' : 'Generated password hidden'}
            >
              {isVisible ? result.password : '•'.repeat(result.length)}
            </div>
          ) : (
            <div className="text-xs md:text-sm text-foreground-muted/60 italic font-mono select-none">
              No password in memory. Click "Generate Password" below.
            </div>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            {hasPassword && (
              <Tooltip
                content={isVisible ? 'Hide password characters' : 'Reveal password characters'}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(!isVisible)}
                  aria-label={isVisible ? 'Hide password' : 'Show password'}
                  leftIcon={
                    isVisible ? (
                      <EyeOff className="w-4 h-4 text-foreground-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-foreground-muted" />
                    )
                  }
                >
                  <span className="text-xs">{isVisible ? 'Hide' : 'Show'}</span>
                </Button>
              </Tooltip>
            )}

            {hasPassword && (
              <Tooltip content="Purge generated password from memory">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  aria-label="Clear password from memory"
                  className="text-foreground-muted hover:text-cyber-rose"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  <span className="text-xs">Clear</span>
                </Button>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRegenerateClick}
              disabled={disabled}
              aria-label="Generate new password"
              leftIcon={
                <RotateCw
                  className={`w-4 h-4 text-cyber-cyan transition-transform ${
                    isSpinning ? 'rotate-180 duration-300' : ''
                  }`}
                />
              }
            >
              <span className="text-xs font-semibold">
                {hasPassword ? 'Regenerate' : 'Generate'}
              </span>
            </Button>

            {hasPassword && (
              <Tooltip content="Copy password to device clipboard">
                <Button
                  variant={isCopied ? 'outline' : 'primary'}
                  size="sm"
                  onClick={onCopy}
                  aria-label={isCopied ? 'Password copied' : 'Copy password to clipboard'}
                  leftIcon={
                    isCopied ? (
                      <Check className="w-4 h-4 text-cyber-emerald" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  <span className="text-xs font-semibold">
                    {isCopied ? 'Copied!' : 'Copy'}
                  </span>
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Non-Absolute Clipboard Security Notice */}
      {isCopied && (
        <div
          role="status"
          className="rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 px-3 py-2 text-xs text-cyber-cyan-hover flex items-start gap-2 animate-in fade-in duration-150"
        >
          <Check className="w-4 h-4 mt-0.5 shrink-0 text-cyber-cyan" aria-hidden="true" />
          <div>
            <span className="font-semibold">Copied to clipboard. </span>
            <span className="text-foreground-muted">
              Device clipboard contents may be accessible to other running applications or
              system clipboard managers. Paste into your target application and clear your
              clipboard when finished.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
