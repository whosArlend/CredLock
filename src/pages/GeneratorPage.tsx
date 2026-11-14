import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  generatePassword,
  validateGeneratorOptions,
  DEFAULT_GENERATOR_OPTIONS,
} from '@/services/passwordGenerator';
import { PasswordDisplay } from '@/features/generator/components/PasswordDisplay';
import { LengthControl } from '@/features/generator/components/LengthControl';
import { CategoryToggles } from '@/features/generator/components/CategoryToggles';
import { GeneratorNoticeCard } from '@/features/generator/components/GeneratorNoticeCard';
import type { GeneratorOptions, GeneratorResult } from '@/types';
import { ShieldCheck, ArrowRight, ShieldAlert } from 'lucide-react';

export function GeneratorPage() {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_GENERATOR_OPTIONS);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Core password generation function
  const executeGeneration = useCallback((currentOptions: GeneratorOptions) => {
    const validation = validateGeneratorOptions(currentOptions);
    if (!validation.isValid) {
      setValidationError(validation.error ?? 'Invalid generator configuration');
      return;
    }

    try {
      setValidationError(null);
      const newResult = generatePassword(currentOptions);
      setResult(newResult);
      setIsCopied(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate password';
      setValidationError(message);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message,
      });
    }
  }, [showToast]);

  // Generate an initial secure password on component mount
  useEffect(() => {
    executeGeneration(DEFAULT_GENERATOR_OPTIONS);
  }, [executeGeneration]);

  // Handle length change
  const handleLengthChange = (newLength: number) => {
    const newOptions = { ...options, length: newLength };
    setOptions(newOptions);
    executeGeneration(newOptions);
  };

  // Handle category options change
  const handleCategoriesChange = (newOptions: GeneratorOptions) => {
    setOptions(newOptions);
    const validation = validateGeneratorOptions(newOptions);
    if (validation.isValid) {
      executeGeneration(newOptions);
    } else {
      setValidationError(validation.error ?? 'Invalid configuration');
    }
  };

  // Regenerate action
  const handleRegenerate = () => {
    executeGeneration(options);
  };

  // Clear action: completely purge password from memory
  const handleClear = () => {
    setResult(null);
    setIsCopied(false);
    showToast({
      type: 'info',
      title: 'Memory Cleared',
      message: 'Generated password has been wiped from transient memory.',
    });
  };

  // Secure copy to clipboard with explicit feedback and non-absolute disclosure
  const handleCopy = async () => {
    if (!result || !result.password) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result.password);
        setIsCopied(true);

        showToast({
          type: 'success',
          title: 'Password Copied',
          message: 'Copied to clipboard. Remember that other apps may access clipboard contents.',
        });

        setTimeout(() => {
          setIsCopied(false);
        }, 3500);
      } else {
        throw new Error('Clipboard API is unavailable in this browser context.');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Clipboard Error',
        message: err instanceof Error ? err.message : 'Failed to copy to clipboard',
      });
    }
  };

  // Navigate to Analyzer with current password in state (avoiding query string persistence)
  const handleAnalyzeGeneratedPassword = () => {
    if (!result?.password) return;
    navigate('/analyzer', { state: { prefillPassword: result.password } });
  };

  const isConfigValid = !validationError;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Secure Password Generator"
        description="High-entropy random password generation powered exclusively by the Web Crypto API."
        badge={<Badge variant="cyan" size="sm" dot>CSPRNG Powered</Badge>}
      />

      {/* Primary Generator Display */}
      <PasswordDisplay
        result={result}
        onRegenerate={handleRegenerate}
        onClear={handleClear}
        onCopy={handleCopy}
        isCopied={isCopied}
        disabled={!isConfigValid}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div
          role="alert"
          className="rounded-xl border border-cyber-rose/40 bg-cyber-rose/10 p-4 text-xs text-cyber-rose flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Configuration Required</h4>
            <p className="text-foreground-muted">{validationError}</p>
          </div>
        </div>
      )}

      {/* Controls: Length & Character Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LengthControl
          length={options.length}
          onChange={handleLengthChange}
        />
        <CategoryToggles
          options={options}
          onChange={handleCategoriesChange}
        />
      </div>

      {/* Optional Transition: Test in Password Analyzer */}
      {result && result.password && (
        <div className="rounded-xl border border-border/80 bg-background-surface/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyber-emerald shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Want to evaluate this password's resilience against attacks?
              </p>
              <p className="text-[11px] text-foreground-muted">
                Analyze estimated crack times, dictionary resilience, and composition.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeGeneratedPassword}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            Test in Analyzer
          </Button>
        </div>
      )}

      {/* Security & Privacy Notice */}
      <GeneratorNoticeCard />
    </div>
  );
}
