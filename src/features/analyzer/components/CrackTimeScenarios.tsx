import { Clock, Cpu, Server, ShieldAlert } from 'lucide-react';
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
      rate: '10,000 guesses/sec',
      methodology: 'Benchmark for adaptive hashes (e.g. bcrypt, Argon2); actual rates depend on configured cost factors',
      time: isEmpty ? '—' : crackTimes.offlineSlowHash,
      icon: Cpu,
      highlight: true,
    },
    {
      title: 'Offline Fast Hash',
      rate: '10,000,000,000 guesses/sec',
      methodology: 'Raw cryptographic hashes (e.g. MD5, SHA-256) on GPU clusters',
      time: isEmpty ? '—' : crackTimes.offlineFastHash,
      icon: Cpu,
      highlight: false,
    },
    {
      title: 'Online Unthrottled',
      rate: '10 guesses/sec',
      methodology: 'Web authentication endpoint without rate-limiting or CAPTCHA',
      time: isEmpty ? '—' : crackTimes.onlineUnthrottled,
      icon: Server,
      highlight: false,
    },
    {
      title: 'Online Throttled',
      rate: '100 guesses/hour',
      methodology: 'Modern login endpoint with IP rate-limiting and account lockout',
      time: isEmpty ? '—' : crackTimes.onlineThrottled,
      icon: Clock,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-3 p-4 rounded-card bg-background-surface/80 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyber-amber" />
          Estimated Crack Time by Attack Scenario
        </h3>
        <span className="text-[11px] font-mono text-foreground-dim">Threat Models</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.title}
              className="p-3 rounded-lg bg-background-elevated/40 border border-border/50 flex flex-col justify-between text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-foreground-dim" />
                  {sc.title}
                </span>
                <span className="font-mono text-[11px] text-foreground-dim">
                  {sc.rate}
                </span>
              </div>
              <p className="text-[11px] text-foreground-dim leading-snug">
                {sc.methodology}
              </p>
              <div className="pt-1.5 border-t border-border/40 flex justify-between items-baseline">
                <span className="text-[11px] text-foreground-muted">Estimated Time:</span>
                <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
                  {sc.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-foreground-dim leading-relaxed flex items-start gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-cyber-amber shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground-muted">Methodology & Limitations:</strong> Crack-time estimates depend on assumed attack speed and methodology. Adaptive algorithms like bcrypt and Argon2 vary widely in cracking speed depending on their configured work and memory parameters. Hardware advances, distributed botnets, and pre-computed rainbow tables can alter crack times significantly. Estimates do not constitute a guarantee of security.
        </p>
      </div>
    </div>
  );
}
