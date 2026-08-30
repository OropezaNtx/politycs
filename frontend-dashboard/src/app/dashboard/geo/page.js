import DashboardLayout from "@/components/layout/DashboardLayout";
import GeoMap from "@/components/geo/GeoMap";
import GeoIntelligenceCard from "@/components/geo/GeoIntelligenceCard";
import GeoIntelligenceV2Panel from "@/components/geo/GeoIntelligenceV2Panel";

export default function GeoPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-cyan-400">Geo Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Territorial Monitoring</h1>
          <p className="mt-2 text-slate-400">Concentración territorial, negatividad, temas y evidencia geográfica.</p>
        </div>

        <GeoIntelligenceV2Panel />
        <GeoMap />

        <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">Ver resumen territorial V1</summary>
          <div className="mt-5"><GeoIntelligenceCard /></div>
        </details>
      </section>
    </DashboardLayout>
  );
}
