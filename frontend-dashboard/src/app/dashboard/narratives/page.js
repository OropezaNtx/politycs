import DashboardLayout from "@/components/layout/DashboardLayout";
import NarrativeIntelligencePanel from "@/components/narratives/NarrativeIntelligencePanel";

export default function NarrativesPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-purple-400 font-medium">
            Narrative Intelligence
          </p>

          <h1 className="text-3xl font-bold text-white">
            Narrative Monitoring
          </h1>

          <p className="mt-2 text-slate-400">
            Narrativas dominantes detectadas a partir de fuentes públicas.
          </p>
        </div>

        <NarrativeIntelligencePanel />
      </section>
    </DashboardLayout>
  );
}
