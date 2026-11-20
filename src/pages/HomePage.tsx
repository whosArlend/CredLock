import { HeroMasterInput } from '@/features/home/components/HeroMasterInput';
import { SecurityFeatureIndex } from '@/features/home/components/SecurityFeatureIndex';
import { SecurityIntelligenceSection } from '@/features/home/components/SecurityIntelligenceSection';
import { Modul1IntegrationWidget } from '@/features/home/components/Modul1IntegrationWidget';
import { RecentActivitySection } from '@/features/home/components/RecentActivitySection';

export function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Compact Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-border/40">
        <div className="space-y-0.5 text-left">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
            Security Command Center
          </h1>
          <p className="text-xs text-muted font-sans">
            Client-side credential analysis, CSPRNG generation, and global breach telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-[11px] text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>Local Enclave Active</span>
        </div>
      </div>

      {/* 2. Primary Workspace (Password Entry) + Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <HeroMasterInput />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <SecurityFeatureIndex />
        </div>
      </div>

      {/* 3. Security Intelligence — Live Backend API Telemetry */}
      <SecurityIntelligenceSection />

      {/* 4. Bottom Row: Recent Local Activity & Modul 1 Adapter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <RecentActivitySection />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <Modul1IntegrationWidget />
        </div>
      </div>
    </div>
  );
}
