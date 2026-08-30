import DashboardLayout from "@/components/layout/DashboardLayout";
import GeoIntelligenceV2Panel from "@/components/geo/GeoIntelligenceV2Panel";
import ScopeStatusPanel from "@/components/intelligence/ScopeStatusPanel";

export default function GeoPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-cyan-400">Geo Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Territorial Monitoring</h1>
          <p className="mt-2 text-slate-400">Concentración territorial, negatividad, temas y evidencia geográfica dentro del alcance activo.</p>
        </div>

        <ScopeStatusPanel compact />
        <GeoIntelligenceV2Panel />
      </section>
    </DashboardLayout>
  );
}
