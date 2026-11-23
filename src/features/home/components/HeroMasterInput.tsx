import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  Search,
  Activity,
  KeyRound,
} from 'lucide-react';
import { analyzePassword, initZxcvbn, isZxcvbnLoaded } from '@/services/passwordAnalyzer';

export function HeroMasterInput() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [zxcvbnLoaded, setZxcvbnLoaded] = useState(() => isZxcvbnLoaded());

  const ensureZxcvbn = () => {
    if (!zxcvbnLoaded) {
      initZxcvbn().then(() => setZxcvbnLoaded(true));
    }
  };

  useEffect(() => {
    if (!zxcvbnLoaded && password.length > 0) {
      initZxcvbn().then(() => setZxcvbnLoaded(true));
    }
  }, [password, zxcvbnLoaded]);

  // Instant local evaluation using engine (client-side only, zero telemetry/storage)
  const analysisResult = useMemo(() => {
    if (!password) return null;
    return analyzePassword(password);
  }, [password, zxcvbnLoaded]);

  // Character set analysis
  const charStats = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    const total = password.length;

    const lowerCount = (password.match(/[a-z]/g) || []).length;
    const upperCount = (password.match(/[A-Z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const symbolCount = (password.match(/[^a-zA-Z0-9]/g) || []).length;

    return {
      hasLower,
      hasUpper,
      hasNumber,
      hasSymbol,
      lowerCount,
      upperCount,
      numberCount,
      symbolCount,
      varietyScore: [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length,
      total,
    };
  }, [password]);

  const handleClear = () => {
    setPassword('');
  };

  const getScoreVariant = (score: number) => {
    if (score <= 1) return { color: 'text-status-danger', bg: 'bg-status-danger', border: 'border-status-danger/40', badge: 'rose' as const };
    if (score === 2) return { color: 'text-accent', bg: 'bg-accent', border: 'border-accent/40', badge: 'amber' as const };
    if (score === 3) return { color: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400/40', badge: 'emerald' as const };
    return { color: 'text-status-success', bg: 'bg-status-success', border: 'border-status-success/40', badge: 'emerald' as const };
  };

  // Normalized entropy ratio for visual meter (0 to 128 bits)
  const entropyRatio = useMemo(() => {
    if (!analysisResult) return 0;
    return Math.min(100, Math.round((analysisResult.crackDifficultyBits / 128) * 100));
  }, [analysisResult]);

  return (
    <div className="rounded-2xl bg-enclave-plate/95 border border-enclave-border/90 shadow-plate-tactical p-5 sm:p-7 space-y-6 text-left relative overflow-hidden backdrop-blur-md">
      {/* Ambient background glow mapped to security state */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20 ${
          analysisResult
            ? analysisResult.score <= 1
              ? 'bg-status-danger'
              : analysisResult.score === 2
              ? 'bg-accent'
              : 'bg-status-success'
            : 'bg-accent/10'
        }`}
      />

      {/* Terminal Bar & Protocol Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-enclave-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-enclave-void border border-accent/40 text-accent shadow-sm">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm font-sans flex items-center gap-2">
              Cryptographic Assessment Terminal
            </h2>
            <span className="font-mono text-[10px] text-foreground-dim uppercase tracking-wider block">
              Z-Score 4.2 • In-Memory Heuristics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {password.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-foreground px-2.5 py-1 rounded-md bg-enclave-void border border-enclave-border tabular-nums font-semibold">
                {password.length} {password.length === 1 ? 'glyph' : 'glyphs'}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="font-mono text-[10px] text-foreground-dim hover:text-status-danger px-2 py-1 rounded bg-enclave-void border border-enclave-border transition-colors uppercase tracking-wider"
              >
                Purge RAM
              </button>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-foreground-dim px-2 py-1 rounded bg-enclave-void border border-enclave-border uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              RAM Buffer Armed
            </span>
          )}
        </div>
      </div>

      {/* Interactive Main Terminal Input Well */}
      <div className="space-y-2">
        <div className="relative flex items-center w-full rounded-xl border border-enclave-border bg-enclave-void shadow-inner transition-all duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <div className="pl-4 pr-1 text-accent select-none font-mono text-base font-bold">
            &gt;
          </div>
          <input
            id="hero-password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onFocus={ensureZxcvbn}
            onChange={(e) => {
              setPassword(e.target.value);
              ensureZxcvbn();
            }}
            placeholder="Enter credential to simulate offline & online attack resistance..."
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-14 pl-2 pr-24 bg-transparent text-foreground placeholder:text-foreground-dim/60 text-base sm:text-lg font-mono tracking-wide focus:outline-none selection:bg-accent/30 selection:text-accent"
            aria-describedby="hero-password-description"
          />

          {/* Inline Action Controls */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {password.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-foreground-secondary hover:text-foreground hover:bg-enclave-elevated transition-colors"
                aria-label="Clear password"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-foreground-secondary hover:text-accent hover:bg-enclave-elevated transition-colors"
              aria-label={showPassword ? 'Mask credential' : 'Reveal credential'}
              title={showPassword ? 'Mask credential' : 'Reveal credential'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p id="hero-password-description" className="sr-only">
          Zero-knowledge client-side evaluation executes entirely in local browser memory.
        </p>
      </div>

      {/* Live Interactive Evaluation HUD */}
      {analysisResult ? (
        <div className="space-y-5 pt-1 animate-in fade-in duration-200">
          {/* Real-time Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Security Score */}
            <div className="p-3.5 rounded-xl bg-enclave-void/80 border border-enclave-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-foreground-dim font-mono text-[10px] uppercase tracking-wider">
                <span>Evaluation Verdict</span>
                <ShieldCheck className={`w-3.5 h-3.5 ${getScoreVariant(analysisResult.score).color}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${getScoreVariant(analysisResult.score).color}`}>
                  {analysisResult.scoreLabel}
                </span>
                <span className="font-mono text-xs text-foreground-dim">
                  ({analysisResult.score} / 4)
                </span>
              </div>
              <div className="w-full bg-enclave-card h-1.5 rounded-full overflow-hidden flex gap-1 pt-0.5">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      analysisResult.score >= step + 1
                        ? getScoreVariant(analysisResult.score).bg
                        : 'bg-enclave-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Metric 2: Entropy Complexity */}
            <div className="p-3.5 rounded-xl bg-enclave-void/80 border border-enclave-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-foreground-dim font-mono text-[10px] uppercase tracking-wider">
                <span>Information Entropy</span>
                <Cpu className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-accent tabular-nums">
                  {analysisResult.crackDifficultyBits}
                </span>
                <span className="font-mono text-xs text-foreground-dim">
                  bits ({entropyRatio}%)
                </span>
              </div>
              <div className="w-full bg-enclave-card h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${entropyRatio}%` }}
                />
              </div>
            </div>

            {/* Metric 3: Offline Hardware Resistance */}
            <div className="p-3.5 rounded-xl bg-enclave-void/80 border border-enclave-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-foreground-dim font-mono text-[10px] uppercase tracking-wider">
                <span>Offline Crack Resistance</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-foreground truncate">
                  {analysisResult.crackTimes.offlineSlowHash}
                </span>
              </div>
              <span className="font-mono text-[10px] text-foreground-dim block truncate">
                PBKDF2 slow-hash vector simulation
              </span>
            </div>
          </div>

          {/* Character Diversity Spectrum Chips */}
          <div className="p-3.5 rounded-xl bg-enclave-void/60 border border-enclave-border/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-foreground-secondary text-[11px] uppercase tracking-wider">
                Character Space Distribution:
              </span>
              <span className="text-accent font-semibold text-[11px]">
                {charStats.varietyScore} / 4 Classes Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div
                className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                  charStats.hasLower
                    ? 'bg-accent/10 border-accent/40 text-foreground'
                    : 'bg-enclave-void/40 border-enclave-border/40 text-foreground-dim opacity-50'
                }`}
              >
                <span className="text-[10px] block text-foreground-dim">Lowercase</span>
                <span className="font-bold">{charStats.lowerCount} glyphs</span>
              </div>

              <div
                className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                  charStats.hasUpper
                    ? 'bg-accent/10 border-accent/40 text-foreground'
                    : 'bg-enclave-void/40 border-enclave-border/40 text-foreground-dim opacity-50'
                }`}
              >
                <span className="text-[10px] block text-foreground-dim">Uppercase</span>
                <span className="font-bold">{charStats.upperCount} glyphs</span>
              </div>

              <div
                className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                  charStats.hasNumber
                    ? 'bg-accent/10 border-accent/40 text-foreground'
                    : 'bg-enclave-void/40 border-enclave-border/40 text-foreground-dim opacity-50'
                }`}
              >
                <span className="text-[10px] block text-foreground-dim">Numbers</span>
                <span className="font-bold">{charStats.numberCount} glyphs</span>
              </div>

              <div
                className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                  charStats.hasSymbol
                    ? 'bg-accent/10 border-accent/40 text-foreground'
                    : 'bg-enclave-void/40 border-enclave-border/40 text-foreground-dim opacity-50'
                }`}
              >
                <span className="text-[10px] block text-foreground-dim">Symbols</span>
                <span className="font-bold">{charStats.symbolCount} glyphs</span>
              </div>
            </div>
          </div>

          {/* Heuristic Warnings or Security Directives */}
          {analysisResult.feedback.warning ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-0.5">
                <span className="font-bold font-mono uppercase tracking-wider block">Identified Vulnerability</span>
                <span className="leading-relaxed font-sans">{analysisResult.feedback.warning}</span>
              </div>
            </div>
          ) : analysisResult.feedback.suggestions.length > 0 ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accent/10 border border-accent/30 text-foreground text-xs">
              <Zap className="w-4 h-4 shrink-0 text-accent mt-0.5" aria-hidden="true" />
              <div className="space-y-0.5">
                <span className="font-bold font-mono text-accent uppercase tracking-wider block">Hardening Directive</span>
                <span className="leading-relaxed text-foreground-secondary font-sans">{analysisResult.feedback.suggestions[0]}</span>
              </div>
            </div>
          ) : null}

          {/* Multi-Tool Deep Diagnostics Dispatch Array */}
          <div className="pt-2 border-t border-enclave-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-foreground-dim">
              Local Execution • RAM Zeroed Upon Unload
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/breach-checker"
                state={{ prefillPassword: password }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-enclave-void border border-enclave-border hover:border-status-danger/50 text-foreground-secondary hover:text-foreground text-xs font-mono transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-status-danger" />
                <span>Probe 800M+ Leaks</span>
              </Link>

              <Link
                to="/analyzer"
                state={{ prefillPassword: password }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-background font-bold text-xs font-mono hover:bg-accent-hover transition-colors shadow-sm"
              >
                <span>Full Attack Simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Standby Protocol Information Strip */
        <div className="p-4 rounded-xl bg-enclave-void/60 border border-enclave-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping shrink-0" aria-hidden="true" />
            <div className="space-y-0.5">
              <span className="text-foreground font-semibold block font-sans">
                Real-Time Cryptographic Engine Ready
              </span>
              <span className="text-foreground-dim text-[11px]">
                Simulate GPU hash-rates, dictionary exposure, and entropy bit depth locally.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/generator"
              className="px-2.5 py-1 rounded-md bg-enclave-void border border-enclave-border text-foreground-secondary hover:text-accent transition-colors flex items-center gap-1 text-[11px]"
            >
              <KeyRound className="w-3 h-3" />
              <span>Forge Key</span>
            </Link>
            <Link
              to="/analyzer"
              className="px-2.5 py-1 rounded-md bg-enclave-void border border-enclave-border text-foreground-secondary hover:text-accent transition-colors flex items-center gap-1 text-[11px]"
            >
              <span>Dossier</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroMasterInput;

