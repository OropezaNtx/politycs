import DashboardLayout from "@/components/layout/DashboardLayout";
import CrisisIntelligenceV2Panel from "@/components/crisis/CrisisIntelligenceV2Panel";
import CrisisDetectionPanel from "@/components/crisis/CrisisDetectionPanel";
import IntelligenceAlertBar from "@/components/intelligence/IntelligenceAlertBar";

export default function CrisisPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-red-400">Crisis Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Crisis Detection Center</h1>
          <p className="mt-2 text-slate-400">Detección explicable de riesgo, aceleración temática y evidencia asociada.</p>
        </div>

        <IntelligenceAlertBar />
        <CrisisIntelligenceV2Panel />

        <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">Ver modelo de alertas V1</summary>
          <div className="mt-5"><CrisisDetectionPanel /></div>
        </details>
      </section>
    </DashboardLayout>
  );
}
