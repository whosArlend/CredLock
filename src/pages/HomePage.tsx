import { HeroMasterInput } from '@/features/home/components/HeroMasterInput';
import { SecurityFeatureIndex } from '@/features/home/components/SecurityFeatureIndex';
import { SecurityOverviewSection } from '@/features/home/components/SecurityOverviewSection';
import { RecentActivitySection } from '@/features/home/components/RecentActivitySection';
import { PrivacyPrinciplesSection } from '@/features/home/components/PrivacyPrinciplesSection';

export function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in duration-300">
      {/* Section A: Hero Master Input Chamber */}
      <HeroMasterInput />

      {/* Section B: Security Feature Index (Asymmetric Editorial Grid) */}
      <SecurityFeatureIndex />

      {/* Section C: Security Overview (Aggregated Activity Telemetry from IndexedDB) */}
      <SecurityOverviewSection />

      {/* Section D: Recent Activity / Audit Log (Unified Timeline from IndexedDB) */}
      <RecentActivitySection />

      {/* Section E: Privacy Architecture Principles */}
      <PrivacyPrinciplesSection />
    </div>
  );
}
