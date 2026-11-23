import { HeroMasterInput } from '@/features/home/components/HeroMasterInput';
import { SecurityFeatureIndex } from '@/features/home/components/SecurityFeatureIndex';
import { SecurityIntelligenceSection } from '@/features/home/components/SecurityIntelligenceSection';
import { RecentActivitySection } from '@/features/home/components/RecentActivitySection';
import { Shield, Cpu, Lock } from 'lucide-react';

export function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Tactical Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-strong/70">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-accent/10 border border-accent/30">
              OPERATIONAL // SEC-OPS CONSOLE
            </span>
            <span className="text-[10px] font-mono text-foreground-dim hidden sm:inline">
              ISO/IEC 27001 ALIGNED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Security Intelligence Command Center
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary font-sans max-w-2xl">
            Zero-knowledge client-side credential diagnostics, cryptographic CSPRNG key synthesis, and live breach telemetry.
          </p>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 font-mono text-xs px-3 py-1.5 rounded-xl bg-enclave-plate border border-border-strong shadow-sm">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" aria-hidden="true" />
          <div className="text-left leading-none">
            <span className="text-[10px] text-foreground-dim block">MEMORY ENCLAVE</span>
            <span className="text-foreground font-bold text-xs">LOCAL ARMED</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Workspace (Terminal Console) + Security Utilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <HeroMasterInput />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <SecurityFeatureIndex />
        </div>
      </div>

      {/* 3. Global Threat Telemetry — Live Backend API Operations */}
      <SecurityIntelligenceSection />

      {/* 4. Cryptographic Audit Log / Local Activity Ledger */}
      <RecentActivitySection />
    </div>
  );
}
