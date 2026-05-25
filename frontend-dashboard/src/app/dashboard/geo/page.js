import DashboardLayout from "@/components/layout/DashboardLayout";
import GeoMap from "@/components/geo/GeoMap";
import GeoIntelligenceCard from "@/components/geo/GeoIntelligenceCard";

export default function GeoPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-cyan-400 font-medium">
            Geo Intelligence
          </p>

          <h1 className="text-3xl font-bold text-white">
            Territorial Monitoring
          </h1>

          <p className="mt-2 text-slate-400">
            Mapa y análisis territorial basado en menciones detectadas.
          </p>
        </div>

        <GeoMap />
        <GeoIntelligenceCard />
      </section>
    </DashboardLayout>
  );
}