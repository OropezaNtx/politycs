import DashboardLayout from "@/components/layout/DashboardLayout";
import NarrativeIntelligenceV2Panel from "@/components/narratives/NarrativeIntelligenceV2Panel";
import NarrativeIntelligencePanel from "@/components/narratives/NarrativeIntelligencePanel";

export default function NarrativesPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-purple-400">Narrative Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Narrative Monitoring</h1>
          <p className="mt-2 text-slate-400">Narrativas dominantes, composición temática, negatividad y evidencia por proyecto.</p>
        </div>

        <NarrativeIntelligenceV2Panel />

        <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">Ver agrupación narrativa V1</summary>
          <div className="mt-5"><NarrativeIntelligencePanel /></div>
        </details>
      </section>
    </DashboardLayout>
  );
}
