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

  useEffect(() => {
    if (location.state && (location.state as { prefillPassword?: string }).prefillPassword) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!zxcvbnLoaded) {
      initZxcvbn().then(() => setZxcvbnLoaded(true));
    }
  }, [zxcvbnLoaded]);

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
      title: 'Analysis Record Archived',
      message: `Sanitized dossier #${sanitizedRecord.id.slice(0, 8)} saved to local IndexedDB. Zero passwords recorded.`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Password Strength Analyzer"
        description="Comprehensive client-side evaluation of keyspace entropy, brute-force crack difficulty, and pattern vulnerabilities."
        badge={<Badge variant="emerald" size="sm" dot>Local Enclave // Active</Badge>}
        actions={
          <Link to="/analysis-history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4 text-accent" />}>
              Audit Ledger
            </Button>
          </Link>
        }
      />

      {/* 2-Column Responsive Diagnostic Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input, Gauge & Metrics (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Password Input Terminal */}
          <div className="p-5 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-enclave-plate border border-border-strong shadow-sm">
              <div className="text-xs text-foreground-secondary font-sans text-left">
                <span>Archive evaluation to persistent local audit storage?</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveToHistory}
                  className="w-full sm:w-auto font-mono text-xs"
                >
                  Save Dossier
                </Button>
                <Link to="/analysis-history" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto font-mono text-xs">
                    Inspect Ledger
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Privacy Notice Card */}
          <PrivacyNoticeCard />
        </div>

        {/* Right Column: Feedback & Crack Scenarios (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-5">
          {!isEmpty ? (
            <>
              {/* Feedback & Detected Patterns */}
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
            <div className="p-6 rounded-2xl bg-enclave-plate border border-border-strong space-y-5 text-left shadow-plate-tactical">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
                  <Shield className="w-4 h-4" />
                  <span>Evaluation Engine Armed</span>
                </div>
                <Badge variant="neutral" size="sm">zxcvbn 4.2 Local</Badge>
              </div>

              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed font-sans">
                CredLock computes real-time cryptographic metrics without transmitting data over the network. Input a candidate password to inspect:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-enclave-card border border-border-strong space-y-1">
                  <span className="font-mono text-accent text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Keyspace Entropy
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed font-sans">
                    Log2 keyspace calculations and raw guess-work estimations under optimized attacker models.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-enclave-card border border-border-strong space-y-1">
                  <span className="font-mono text-status-success text-xs font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    4 Threat Scenarios
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed font-sans">
                    Crack resistance against unthrottled web APIs, modern GPU clusters, and slow adaptive hashes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-enclave-card border border-border-strong space-y-1">
                  <span className="font-mono text-status-info text-xs font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Pattern Analysis
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed font-sans">
                    Recognition of dictionary keywords, spatial keyboard sequences, leetspeak, and repetition.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-enclave-card border border-border-strong space-y-1">
                  <span className="font-mono text-status-danger text-xs font-bold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Zero Plaintext Logs
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed font-sans">
                    Passwords live only in transient browser RAM. IndexedDB saves only sanitized structural metrics.
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
