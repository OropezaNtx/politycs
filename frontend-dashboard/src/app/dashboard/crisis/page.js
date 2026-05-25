import DashboardLayout from "@/components/layout/DashboardLayout";
import CrisisDetectionPanel from "@/components/crisis/CrisisDetectionPanel";
import IntelligenceAlertBar from "@/components/intelligence/IntelligenceAlertBar";

export default function CrisisPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-red-400 font-medium">
            Crisis Intelligence
          </p>

          <h1 className="text-3xl font-bold text-white">
            Crisis Detection Center
          </h1>

          <p className="mt-2 text-slate-400">
            Alertas de riesgo por sentimiento, toxicidad, política y temas sensibles.
          </p>
        </div>

        <IntelligenceAlertBar />
        <CrisisDetectionPanel />
      </section>
    </DashboardLayout>
  );
}