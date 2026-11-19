import { Clock, Cpu, Server, ChevronDown } from 'lucide-react';
import type { AttackScenarioCrackTime } from '@/services/passwordAnalyzer';

export interface CrackTimeScenariosProps {
  crackTimes: AttackScenarioCrackTime;
  isEmpty: boolean;
}

export function CrackTimeScenarios({
  crackTimes,
  isEmpty,
}: CrackTimeScenariosProps) {
  const scenarios = [
    {
      title: 'Offline Slow Hash',
      rate: '10,000 / sec',
      methodology: 'Adaptive hashes (bcrypt, Argon2) with standard work factors',
      time: isEmpty ? '—' : crackTimes.offlineSlowHash,
      icon: Cpu,
    },
    {
      title: 'Offline Fast Hash',
      rate: '10B / sec',
      methodology: 'Raw cryptographic hashes (MD5, SHA-256) on GPU clusters',
      time: isEmpty ? '—' : crackTimes.offlineFastHash,
      icon: Cpu,
    },
    {
      title: 'Online Unthrottled',
      rate: '10 / sec',
      methodology: 'Web authentication endpoint without rate-limiting or CAPTCHA',
      time: isEmpty ? '—' : crackTimes.onlineUnthrottled,
      icon: Server,
    },
    {
      title: 'Online Throttled',
      rate: '100 / hour',
      methodology: 'Authentication endpoint with IP rate-limiting and account lockout',
      time: isEmpty ? '—' : crackTimes.onlineThrottled,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-3 p-4 rounded-card bg-background-surface/80 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-accent" />
          Estimated Crack Time by Attack Scenario
        </h3>
        <span className="text-[11px] font-mono text-foreground-dim">Threat Models</span>
      </div>

      {/* Compact 4-scenario layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.title}
              className="p-3 rounded-lg bg-background-elevated/40 border border-border/50 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{sc.title}</span>
                </div>
                <div className="font-mono text-[10px] text-muted">
                  {sc.rate}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <span className="text-[10px] text-muted-dim block font-mono">Estimated Time</span>
                <span className="font-mono text-xs font-bold text-accent tracking-tight truncate block">
                  {sc.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progressive Disclosure: Methodology & Limitations */}
      <details className="group border-t border-border/40 pt-2 text-xs">
        <summary className="cursor-pointer font-mono text-[11px] text-accent hover:underline flex items-center gap-1.5 select-none focus:outline-none">
          <span>How are these estimates calculated?</span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2.5 space-y-2 text-[11px] text-muted leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenarios.map((sc) => (
              <div key={sc.title} className="p-2 rounded bg-background-base/60 border border-border/50">
                <strong className="text-foreground block">{sc.title} ({sc.rate})</strong>
                <span>{sc.methodology}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-dim font-mono pt-1">
            * Methodology & Limitations: Crack times depend on assumed attack rates and heuristic patterns from zxcvbn. They represent theoretical benchmarks and do not constitute absolute security guarantees against tailored dictionaries or emerging hardware.
          </p>
        </div>
      </details>
    </div>
  );
}
