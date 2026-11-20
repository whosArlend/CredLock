import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, X, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Meter } from '@/components/ui/Meter';
import { analyzePassword } from '@/services/passwordAnalyzer';

export function HeroMasterInput() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Instant local evaluation using existing engine (client-side only, zero telemetry/storage)
  const analysisResult = useMemo(() => {
    if (!password) return null;
    return analyzePassword(password);
  }, [password]);

  const handleClear = () => {
    setPassword('');
  };

  const getScoreVariant = (score: number) => {
    if (score <= 1) return 'danger' as const;
    if (score === 2) return 'warning' as const;
    return 'success' as const;
  };

  return (
    <div className="rounded-xl bg-surface border border-border shadow-card p-4 sm:p-5 space-y-4 text-left">
      {/* Workspace Header / Label */}
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor="hero-password-input"
          className="font-semibold text-foreground flex items-center gap-2 font-sans"
        >
          <div className="p-1 rounded bg-surface-elevated text-accent border border-border/60">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span>Direct Password Assessment</span>
        </label>
        {password.length > 0 ? (
          <span className="font-mono text-[11px] text-muted tabular-nums px-2 py-0.5 rounded bg-background-base border border-border/50">
            {password.length} {password.length === 1 ? 'char' : 'chars'}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-muted-dim hidden sm:inline">
            In-Memory Only
          </span>
        )}
      </div>

      {/* Recessed Input Well */}
      <div className="relative flex items-center w-full rounded-lg border border-border bg-background-base transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        <input
          id="hero-password-input"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Type or paste a password for real-time assessment..."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-12 pl-4 pr-20 bg-transparent text-foreground placeholder:text-muted/60 text-sm sm:text-base font-mono focus:outline-none selection:bg-accent/30 selection:text-accent"
          aria-describedby="hero-password-description"
        />

        {/* Input Controls */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {password.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Clear password input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p id="hero-password-description" className="sr-only">
        Password evaluation operates strictly in local memory. Input is not stored or transmitted.
      </p>

      {/* Real-Time Local Analysis Preview */}
      {analysisResult ? (
        <div className="rounded-lg border border-border/80 bg-background-base/60 p-3.5 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground font-sans">Strength:</span>
              <Badge
                variant={
                  analysisResult.score <= 1
                    ? 'rose'
                    : analysisResult.score === 2
                    ? 'amber'
                    : 'emerald'
                }
                size="sm"
                dot
              >
                {analysisResult.scoreLabel} ({analysisResult.score}/4)
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
              <span className="tabular-nums">~{analysisResult.crackDifficultyBits} bits</span>
              <span className="text-border">•</span>
              <span>{analysisResult.crackTimes.offlineSlowHash}</span>
            </div>
          </div>

          {/* Segmented Calibrated Meter */}
          <Meter
            value={analysisResult.score}
            min={0}
            max={4}
            segments={4}
            variant={getScoreVariant(analysisResult.score)}
            size="sm"
            valueLabel={`${analysisResult.score} / 4`}
          />

          {/* Warning or Suggestion Feedback */}
          {analysisResult.feedback.warning ? (
            <div className="flex items-start gap-2 text-xs text-status-danger pt-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{analysisResult.feedback.warning}</span>
            </div>
          ) : analysisResult.feedback.suggestions.length > 0 ? (
            <div className="flex items-start gap-2 text-xs text-muted pt-1">
              <Zap className="w-3.5 h-3.5 shrink-0 text-accent mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{analysisResult.feedback.suggestions[0]}</span>
            </div>
          ) : null}

          {/* Navigation Action to Full Diagnostic */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[10px] text-muted font-mono">
              Real-time heuristic evaluation
            </span>
            <Link
              to="/analyzer"
              state={{ prefillPassword: password }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            >
              <span>Detailed Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Idle Prompt Strip */
        <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <span>Zero-Knowledge Evaluation</span>
          </div>
          <Link
            to="/analyzer"
            className="text-accent hover:underline inline-flex items-center gap-1 font-sans text-xs"
          >
            <span>Open Analyzer</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
