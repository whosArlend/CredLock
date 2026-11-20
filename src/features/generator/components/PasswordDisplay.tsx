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
      <div className="relative rounded-xl border border-border bg-surface p-4 transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Generated Credential
            </span>
          </div>

          {result && result.password.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="cyan" size="sm">
                <span className="font-mono">{result.length}</span> chars
              </Badge>
              <Badge variant="neutral" size="sm">
                <span className="font-mono">{result.poolSize}</span>-char pool
              </Badge>
              <Tooltip content="Theoretical pool-based entropy estimate: length * log2(poolSize). Upper-bound estimate assuming unconstrained uniform selection.">
                <div>
                  <Badge variant="emerald" size="sm">
                    ~<span className="font-mono">{result.theoreticalPoolEntropyBits}</span> bits
                  </Badge>
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Password Output Area */}
        <div className="min-h-[52px] flex items-center justify-between rounded-lg bg-background-base px-3.5 py-2.5 border border-border/80">
          {result && result.password.length > 0 ? (
            <div
              className="font-mono text-base sm:text-lg tracking-wider text-accent font-semibold break-all select-all selection:bg-accent selection:text-background-base"
              aria-live="polite"
              aria-label={isVisible ? 'Generated password' : 'Generated password hidden'}
            >
              {isVisible ? result.password : '•'.repeat(result.length)}
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-muted/60 italic font-mono select-none">
              Memory purged. Click "Generate" below to create a credential.
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
                      <EyeOff className="w-3.5 h-3.5 text-muted" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-muted" />
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
                  className="text-muted hover:text-danger"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  <span className="text-xs">Purge</span>
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
                  className={`w-3.5 h-3.5 text-accent transition-transform ${
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
                  variant={isCopied ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={onCopy}
                  aria-label={isCopied ? 'Password copied' : 'Copy password to clipboard'}
                  leftIcon={
                    isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  <span className="text-xs font-semibold">
                    {isCopied ? 'Copied' : 'Copy'}
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
          className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent flex items-start gap-2 animate-in fade-in duration-150"
        >
          <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <span className="font-semibold">Copied to clipboard. </span>
            <span className="text-foreground/80">
              Clear your clipboard history after pasting into your password manager or login form.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
