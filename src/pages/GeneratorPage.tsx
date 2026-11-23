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
import { ShieldCheck, ArrowRight, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export function GeneratorPage() {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_GENERATOR_OPTIONS);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    executeGeneration(DEFAULT_GENERATOR_OPTIONS);
  }, [executeGeneration]);

  const handleLengthChange = (newLength: number) => {
    const newOptions = { ...options, length: newLength };
    setOptions(newOptions);
    executeGeneration(newOptions);
  };

  const handleCategoriesChange = (newOptions: GeneratorOptions) => {
    setOptions(newOptions);
    const validation = validateGeneratorOptions(newOptions);
    if (validation.isValid) {
      executeGeneration(newOptions);
    } else {
      setValidationError(validation.error ?? 'Invalid configuration');
    }
  };

  const handleRegenerate = () => {
    executeGeneration(options);
  };

  const handleClear = () => {
    setResult(null);
    setIsCopied(false);
    setValidationError(null);
    showToast({
      type: 'info',
      title: 'Buffer Purged',
      message: 'Generated password purged from volatile browser memory.',
    });
  };

  const handleCopy = async () => {
    if (!result?.password) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setIsCopied(true);
      showToast({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Password copied. Clipboard should be cleared after use.',
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Unable to write to clipboard. Select text manually.',
      });
    }
  };

  const handleAnalyzeGenerated = () => {
    if (!result?.password) return;
    navigate('/analyzer', { state: { prefillPassword: result.password } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Secure Password Generator"
        description="Cryptographically secure pseudo-random number generator (CSPRNG) with unbiased candidate rejection sampling."
        badge={<Badge variant="amber" size="sm" dot>Web Crypto CSPRNG</Badge>}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs text-[#EF4444] flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span className="font-medium font-sans">{validationError}</span>
        </div>
      )}

      {/* Key Output Stage */}
      <PasswordDisplay
        result={result}
        onRegenerate={handleRegenerate}
        onClear={handleClear}
        onCopy={handleCopy}
        isCopied={isCopied}
      />

      {/* Action to send to analyzer */}
      {result && result.password.length > 0 && (
        <div className="p-4 rounded-xl bg-enclave-plate border border-border-strong flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-foreground font-sans block">
              Verify Theoretical Resilience
            </span>
            <span className="text-[11px] text-foreground-secondary font-sans">
              Pipe this generated credential directly into the password analyzer for attack scenario simulation.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeGenerated}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto font-mono text-xs shrink-0"
          >
            Inspect in Analyzer
          </Button>
        </div>
      )}

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <LengthControl
          length={options.length}
          onChange={handleLengthChange}
        />
        <CategoryToggles
          options={options}
          onChange={handleCategoriesChange}
        />
      </div>

      {/* Security Architecture & Guarantees */}
      <GeneratorNoticeCard />
    </div>
  );
}
