import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { History, Save, Sparkles, Shield, Cpu, Lock } from 'lucide-react';
import {
  analyzePassword,
  createSanitizedAnalysisRecord,
  initZxcvbn,
  isZxcvbnLoaded,
} from '@/services/passwordAnalyzer';
import { addAnalysisRecord } from '@/services/historyStorage';
import { PasswordInput } from '@/features/analyzer/components/PasswordInput';
import { StrengthMeter } from '@/features/analyzer/components/StrengthMeter';
import { CharacterCompositionBadges } from '@/features/analyzer/components/CharacterCompositionBadges';
import { CrackTimeScenarios } from '@/features/analyzer/components/CrackTimeScenarios';
import { FeedbackCard } from '@/features/analyzer/components/FeedbackCard';
import { PrivacyNoticeCard } from '@/features/analyzer/components/PrivacyNoticeCard';

export function AnalyzerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = (location.state as { prefillPassword?: string } | null)?.prefillPassword || '';
  const [password, setPassword] = useState(prefill);
  const [zxcvbnLoaded, setZxcvbnLoaded] = useState(() => isZxcvbnLoaded());
  const { showToast } = useToast();

  // Security purge: Wipe navigation state from browser history immediately upon consumption
  useEffect(() => {
    if (location.state && (location.state as { prefillPassword?: string }).prefillPassword) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // Ensure full zxcvbn dictionary engine is initialized for deep diagnostics
  useEffect(() => {
    if (!zxcvbnLoaded) {
      initZxcvbn().then(() => setZxcvbnLoaded(true));
    }
  }, [zxcvbnLoaded]);

  // Instant local evaluation (recomputed when input changes or when full dictionary loads)
  const analysisResult = useMemo(
    () => analyzePassword(password),
    [password, zxcvbnLoaded]
  );
  const isEmpty = password.length === 0;

  const handleClear = () => {
    setPassword('');
  };

  const handleSaveToHistory = () => {
    if (isEmpty) return;

    const sanitizedRecord = createSanitizedAnalysisRecord(analysisResult);
    addAnalysisRecord(sanitizedRecord);

    showToast({
      type: 'success',
      title: 'Analysis Saved to History',
      message: `Sanitized evaluation #${sanitizedRecord.id.slice(0, 8)} recorded. Plaintext password was not saved.`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Password Strength Analyzer"
        description="Comprehensive client-side evaluation of password entropy, length, character diversity, and vulnerability patterns."
        badge={<Badge variant="emerald" size="sm" dot>Local Evaluation</Badge>}
        actions={
          <Link to="/analysis-history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />}>
              View History
            </Button>
          </Link>
        }
      />

      {/* 2-Column Responsive Diagnostic Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Input, Gauge & Metrics (7 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Password Input Card */}
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
            <PasswordInput
              value={password}
              onChange={setPassword}
              onClear={handleClear}
            />
          </div>

          {/* Strength Gauge & Estimator Metrics */}
          <StrengthMeter
            score={analysisResult.score}
            isEmpty={isEmpty}
            crackDifficultyBits={analysisResult.crackDifficultyBits}
            guesses={analysisResult.guesses}
            calculationTimeMs={analysisResult.calculationTimeMs}
          />

          {/* Character Diversity Badges */}
          <CharacterCompositionBadges composition={analysisResult.composition} />

          {/* Actions Toolbar */}
          {!isEmpty && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border">
              <div className="text-xs text-muted">
                <span>Preserve evaluation? Only sanitized metadata is recorded.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveToHistory}
                  className="w-full sm:w-auto"
                >
                  Save to History
                </Button>
                <Link to="/analysis-history" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    Inspect
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Privacy Notice Card */}
          <PrivacyNoticeCard />
        </div>

        {/* Right Column: Feedback & Crack Scenarios (5 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          {!isEmpty ? (
            <>
              {/* Feedback & Detected Patterns at the top for immediate visibility */}
              <FeedbackCard
                warning={analysisResult.feedback.warning}
                suggestions={analysisResult.feedback.suggestions}
                patterns={analysisResult.patternsDetected}
                isEmpty={isEmpty}
              />

              {/* Attack Scenario Crack Times */}
              <CrackTimeScenarios
                crackTimes={analysisResult.crackTimes}
                isEmpty={isEmpty}
              />
            </>
          ) : (
            /* Empty State: Standby Guidance Panel */
            <div className="p-5 rounded-xl bg-surface/60 border border-border/80 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                  <Shield className="w-4 h-4" />
                  <span>Evaluation Engine Ready</span>
                </div>
                <Badge variant="neutral" size="sm">zxcvbn Heuristic</Badge>
              </div>

              <p className="text-muted leading-relaxed">
                CredLock performs exhaustive client-side cryptographic analysis as you type. Real-time metrics will render automatically across multiple threat vectors:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border/40 space-y-1">
                  <span className="font-mono text-accent text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Entropy & Guesses
                  </span>
                  <p className="text-[11px] text-muted leading-snug">
                    Log2 keyspace calculations and raw guess-work estimations under optimal cracking models.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border/40 space-y-1">
                  <span className="font-mono text-accent text-[11px] font-semibold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    4 Threat Scenarios
                  </span>
                  <p className="text-[11px] text-muted leading-snug">
                    Projected times against unthrottled online attacks, GPU clusters, and slow adaptive hashes.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border/40 space-y-1">
                  <span className="font-mono text-accent text-[11px] font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Pattern Recognition
                  </span>
                  <p className="text-[11px] text-muted leading-snug">
                    Detection of dictionary words, keyboard walks, leetspeak substitutions, and dates.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border/40 space-y-1">
                  <span className="font-mono text-accent text-[11px] font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Zero Persistence
                  </span>
                  <p className="text-[11px] text-muted leading-snug">
                    Passwords live only in transient volatile memory. Archival saves only sanitized audit stats.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
