import { ShieldCheck, Cpu, EyeOff } from 'lucide-react';

interface PrincipleItem {
  number: string;
  title: string;
  headline: string;
  description: string;
  icon: typeof ShieldCheck;
}

const PRINCIPLES: PrincipleItem[] = [
  {
    number: '01',
    title: 'LOCAL ANALYSIS',
    headline: 'Password strength analysis runs directly in your browser.',
    description:
      'Zero remote telemetry. Pattern matching, heuristic scoring, and crack-time estimations are calculated entirely client-side using zxcvbn-ts.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'CRYPTOGRAPHIC GENERATION',
    headline: "Password generation uses the browser's Web Crypto API.",
    description:
      'Entropy is sourced from CSPRNG (crypto.getRandomValues) and candidate generation uses rejection sampling to guarantee a uniform distribution.',
    icon: Cpu,
  },
  {
    number: '03',
    title: 'PRIVACY-PRESERVING LOOKUP',
    headline: 'The breach checker uses a truncated hash-prefix lookup. Only the required prefix is transmitted when a check is performed.',
    description:
      'Using the k-anonymity mathematical model, only the first 5 characters of a SHA-1 digest leave your device. The full password or complete hash is never transmitted.',
    icon: EyeOff,
  },
];

export function PrivacyPrinciplesSection() {
  return (
    <section aria-labelledby="privacy-principles-title" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-4 border-b border-border">
        <div>
          <span className="font-mono text-[11px] font-medium tracking-wider text-muted uppercase">
            ARCHITECTURE // ZERO-KNOWLEDGE PRINCIPLES
          </span>
          <h2 id="privacy-principles-title" className="text-xl font-bold tracking-tight text-foreground mt-1">
            Privacy is part of the architecture.
          </h2>
        </div>
        <div className="font-mono text-xs text-muted">
          CLIENT-SIDE ENCLAVE
        </div>
      </div>

      {/* 3 Principles Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRINCIPLES.map((principle) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.number}
              className="group relative flex flex-col justify-between p-6 rounded-lg bg-surface border border-border transition-colors duration-200 hover:border-border-subtle"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-accent">
                      {principle.number}
                    </span>
                    <span className="text-xs text-border">//</span>
                    <span className="font-mono text-[11px] tracking-wider text-muted uppercase">
                      {principle.title}
                    </span>
                  </div>
                  <Icon className="w-4 h-4 text-muted group-hover:text-accent transition-colors duration-200" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {principle.headline}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-dim uppercase tracking-wider">
                  ENFORCEMENT: CLIENT-SIDE ONLY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
