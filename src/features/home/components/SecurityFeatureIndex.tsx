import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function SecurityFeatureIndex() {
  return (
    <section className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim font-mono">
          [ CORE SECURITY TOOLS // 01 — 03 ]
        </h2>
        <span className="text-[11px] font-mono text-foreground-dim">
          Local Engine Architecture
        </span>
      </div>

      {/* Asymmetric Editorial Grid: Feature 01 is emphasized, 02 and 03 form secondary columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 01 — Password Analyzer (Primary Emphasis, 6 cols on desktop) */}
        <Card
          variant="default"
          padding="lg"
          isInteractive
          className="lg:col-span-6 flex flex-col justify-between border-border hover:border-accent/50 group relative overflow-hidden"
        >
          <Link to="/analyzer" className="block focus:outline-none h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-accent tracking-widest">
                  01 // HEURISTIC EVALUATION
                </span>
                <div className="p-2 rounded-md bg-background-secondary border border-border text-accent group-hover:border-accent/40 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground font-sans tracking-tight group-hover:text-accent transition-colors">
                  Password Strength Analyzer
                </h3>
                <p className="text-sm text-foreground-secondary leading-relaxed font-sans">
                  Evaluate password strength, character composition, patterns, and estimated attack difficulty.
                </p>
              </div>

              {/* Technical Capability Indicator */}
              <div className="pt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-foreground-dim">
                <span className="px-2 py-0.5 rounded-sm bg-background-secondary border border-border">
                  @zxcvbn-ts v4.2
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-background-secondary border border-border">
                  4 Attack Scenarios
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-background-secondary border border-border">
                  Entropy Bits
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-accent font-mono">
              <span>Open Analyzer</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </Card>

        {/* Column Group for 02 & 03 (Secondary Editorial Entries, 6 cols on desktop) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* 02 — Secure Generator */}
          <Card
            variant="default"
            padding="md"
            isInteractive
            className="flex flex-col justify-between border-border hover:border-accent/50 group"
          >
            <Link to="/generator" className="block focus:outline-none h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground-dim tracking-widest group-hover:text-accent transition-colors">
                    02 // CSPRNG KEYGEN
                  </span>
                  <div className="p-1.5 rounded-md bg-background-secondary border border-border text-foreground-secondary group-hover:text-accent group-hover:border-accent/40 transition-colors">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground font-sans tracking-tight group-hover:text-accent transition-colors">
                    Secure Password Generator
                  </h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed font-sans">
                    Create strong passwords using browser-native cryptographic randomness.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-foreground-secondary group-hover:text-accent font-mono transition-colors">
                <span>Generate Password</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </Card>

          {/* 03 — Breach Checker */}
          <Card
            variant="default"
            padding="md"
            isInteractive
            className="flex flex-col justify-between border-border hover:border-status-danger/50 group"
          >
            <Link to="/breach-checker" className="block focus:outline-none h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground-dim tracking-widest group-hover:text-status-danger transition-colors">
                    03 // k-ANONYMITY LOOKUP
                  </span>
                  <div className="p-1.5 rounded-md bg-background-secondary border border-border text-foreground-secondary group-hover:text-status-danger group-hover:border-status-danger/40 transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground font-sans tracking-tight group-hover:text-status-danger transition-colors">
                    Password Breach Checker
                  </h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed font-sans">
                    Check whether a password appears in known breach datasets using a privacy-preserving lookup method.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-foreground-secondary group-hover:text-status-danger font-mono transition-colors">
                <span>Check Exposure</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
