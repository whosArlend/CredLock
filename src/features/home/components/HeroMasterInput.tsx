import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, X, ArrowRight, KeyRound, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
    <section className="space-y-6">
      {/* Brand Eyebrow & Editorial Heading */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-background-secondary border border-border text-accent text-[11px] font-mono tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span>CREDLOCK // LOCAL SECURITY ENVIRONMENT</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-sans leading-[1.15]">
          Your passwords deserve <br className="hidden sm:inline" />
          <span className="text-accent">better protection.</span>
        </h1>

        <p className="text-sm sm:text-base text-foreground-secondary max-w-2xl leading-relaxed font-sans">
          Inspect password strength locally. Generate stronger credentials. Check exposure without revealing your password.
        </p>
      </div>

      {/* Main Interactive Password Chamber */}
      <div className="rounded-card bg-background-surface border border-border shadow-card p-4 sm:p-6 space-y-4">
        <div className="space-y-2 text-left">
          <label
            htmlFor="hero-password-input"
            className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              Direct Cryptographic Assessment
            </span>
            {password.length > 0 && (
              <span className="font-mono text-[11px] text-foreground-dim tabular-nums">
                {password.length} {password.length === 1 ? 'char' : 'chars'}
              </span>
            )}
          </label>

          {/* Recessed Input Well */}
          <div className="relative flex items-center w-full rounded-md border border-border bg-background-secondary transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
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
              className="w-full h-12 pl-4 pr-24 bg-transparent text-foreground placeholder:text-foreground-dim text-sm sm:text-base font-mono focus:outline-none selection:bg-accent/30 selection:text-accent"
              aria-describedby="hero-password-description"
            />

            {/* Input Controls */}
            <div className="absolute right-2.5 flex items-center gap-1">
              {password.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded text-foreground-dim hover:text-foreground hover:bg-background-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  aria-label="Clear password input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded text-foreground-dim hover:text-foreground hover:bg-background-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p id="hero-password-description" className="sr-only">
            Password evaluation operates strictly in local memory. Input is not stored or transmitted.
          </p>
        </div>

        {/* Real-Time Local Analysis Preview */}
        {analysisResult && (
          <div className="rounded-md border border-border bg-background-secondary/70 p-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Score:</span>
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

              <div className="flex items-center gap-2 text-[11px] font-mono text-foreground-secondary">
                <span className="tabular-nums">~{analysisResult.crackDifficultyBits} bits difficulty</span>
                <span className="text-border-strong">•</span>
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
              <div className="flex items-start gap-2 text-xs text-foreground-dim pt-1">
                <Zap className="w-3.5 h-3.5 shrink-0 text-accent mt-0.5" aria-hidden="true" />
                <span className="leading-snug">{analysisResult.feedback.suggestions[0]}</span>
              </div>
            ) : null}

            {/* Link to Full Diagnostic (without passing password in state or URL) */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-foreground-dim font-mono">
                Transient local memory only
              </span>
              <Link
                to="/analyzer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
              >
                <span>Open Full Diagnostic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link to="/analyzer" className="flex-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Analyze Password
            </Button>
          </Link>
          <Link to="/generator" className="flex-1">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center"
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Generate Secure Password
            </Button>
          </Link>
        </div>

        {/* Tertiary Navigation to Breach Checker */}
        <div className="pt-2 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted">
          <span>Looking to verify an existing credential against data leaks?</span>
          <Link
            to="/breach-checker"
            className="font-mono text-accent hover:underline inline-flex items-center gap-1 self-center sm:self-auto"
          >
            <span>Run k-Anonymity Breach Check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
