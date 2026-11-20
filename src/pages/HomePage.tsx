import { HeroMasterInput } from '@/features/home/components/HeroMasterInput';
import { SecurityFeatureIndex } from '@/features/home/components/SecurityFeatureIndex';
import { SecurityIntelligenceSection } from '@/features/home/components/SecurityIntelligenceSection';
import { SecurityOverviewSection } from '@/features/home/components/SecurityOverviewSection';
import { Modul1IntegrationWidget } from '@/features/home/components/Modul1IntegrationWidget';
import { RecentActivitySection } from '@/features/home/components/RecentActivitySection';

export function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-12 animate-in fade-in duration-300">
      {/* Section A: Hero Master Input Chamber */}
      <HeroMasterInput />

      {/* Section B: Security Feature Index */}
      <SecurityFeatureIndex />

      {/* Section C: Security Intelligence — Live Backend API Data (Phase 3.4B) */}
      <SecurityIntelligenceSection />

      {/* Section D: Security Overview (Aggregated Activity Telemetry from IndexedDB) */}
      <SecurityOverviewSection />

      {/* Section E: Modul 1 REST API Integration Widget */}
      <Modul1IntegrationWidget />

      {/* Section F: Recent Activity / Audit Log (Unified Timeline from IndexedDB) */}
      <RecentActivitySection />
    </div>
  );
}
