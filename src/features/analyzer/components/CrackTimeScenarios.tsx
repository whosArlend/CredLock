import { Clock, Cpu, Server } from 'lucide-react';
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
      methodology: 'Adaptive hashes (bcrypt, Argon2) with work factor',
      time: isEmpty ? '—' : crackTimes.offlineSlowHash,
      icon: Cpu,
      color: 'text-status-success',
    },
    {
      title: 'Offline Fast Hash',
      rate: '10B / sec',
      methodology: 'Raw cryptographic digest (MD5, SHA-256) on GPU clusters',
      time: isEmpty ? '—' : crackTimes.offlineFastHash,
      icon: Cpu,
      color: 'text-accent',
    },
    {
      title: 'Online Unthrottled',
      rate: '10 / sec',
      methodology: 'Exposed authentication API without rate limiting',
      time: isEmpty ? '—' : crackTimes.onlineUnthrottled,
      icon: Server,
      color: 'text-status-danger',
    },
    {
      title: 'Online Throttled',
      rate: '100 / hour',
      methodology: 'Hardened endpoint with rate-limiting & IP lockouts',
      time: isEmpty ? '—' : crackTimes.onlineThrottled,
      icon: Clock,
      color: 'text-status-info',
    },
  ];

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-accent" />
          <span>Brute-Force Resistance Matrix</span>
        </h3>
        <span className="text-[10px] font-mono text-foreground-dim uppercase">4 Attack Vectors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.title}
              className="p-3.5 rounded-xl bg-enclave-card border border-border-strong space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground font-sans flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${sc.color}`} />
                  {sc.title}
                </span>
                <span className="text-[10px] font-mono text-foreground-dim">{sc.rate}</span>
              </div>
              <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                {sc.time}
              </p>
              <p className="text-[11px] text-foreground-muted leading-tight font-sans">
                {sc.methodology}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
