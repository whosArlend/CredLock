import { HeroMasterInput } from '@/features/home/components/HeroMasterInput';
import { SecurityFeatureIndex } from '@/features/home/components/SecurityFeatureIndex';
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

      {/* Section C: Security Overview (Aggregated Activity Telemetry from IndexedDB) */}
      <SecurityOverviewSection />

      {/* Section D: Modul 1 REST API Integration Widget */}
      <Modul1IntegrationWidget />

      {/* Section E: Recent Activity / Audit Log (Unified Timeline from IndexedDB) */}
      <RecentActivitySection />
    </div>
  );
}
