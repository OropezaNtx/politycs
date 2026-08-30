import DashboardLayout from "@/components/layout/DashboardLayout";
import CrisisIntelligenceV2Panel from "@/components/crisis/CrisisIntelligenceV2Panel";
import ScopeStatusPanel from "@/components/intelligence/ScopeStatusPanel";

export default function CrisisPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-red-400">Crisis Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Crisis Detection Center</h1>
          <p className="mt-2 text-slate-400">Detección explicable de riesgo, aceleración temática y evidencia asociada al alcance activo.</p>
        </div>

        <ScopeStatusPanel compact />
        <CrisisIntelligenceV2Panel />
      </section>
    </DashboardLayout>
  );
}
