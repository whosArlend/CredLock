import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { History, Save } from 'lucide-react';
import {
  analyzePassword,
  createSanitizedAnalysisRecord,
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
  const { showToast } = useToast();

  // Security purge: Wipe navigation state from browser history immediately upon consumption
  useEffect(() => {
    if (location.state && (location.state as { prefillPassword?: string }).prefillPassword) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // Instant local evaluation
  const analysisResult = useMemo(() => analyzePassword(password), [password]);
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

      {/* Password Input Card */}
      <div className="p-4 sm:p-5 rounded-card bg-background-surface/80 border border-border shadow-card">
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

      {/* Character Composition */}
      <CharacterCompositionBadges composition={analysisResult.composition} />

      {/* Attack Scenario Crack Times */}
      <CrackTimeScenarios
        crackTimes={analysisResult.crackTimes}
        isEmpty={isEmpty}
      />

      {/* Feedback & Detected Patterns */}
      <FeedbackCard
        warning={analysisResult.feedback.warning}
        suggestions={analysisResult.feedback.suggestions}
        patterns={analysisResult.patternsDetected}
        isEmpty={isEmpty}
      />

      {/* Actions Toolbar */}
      {!isEmpty && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-card bg-background-surface/80 border border-border">
          <div className="text-xs text-foreground-muted">
            <span>Ready to archive this evaluation? Only sanitized metadata will be preserved.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveToHistory}
              className="w-full sm:w-auto"
            >
              Save to Analysis History
            </Button>
            <Link to="/analysis-history" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Inspect History
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Privacy Notice Card */}
      <PrivacyNoticeCard />
    </div>
  );
}
