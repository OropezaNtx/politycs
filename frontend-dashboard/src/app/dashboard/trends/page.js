import DashboardLayout from "@/components/layout/DashboardLayout";
import TemporalIntelligenceV2Panel from "@/components/temporal/TemporalIntelligenceV2Panel";
import EmergingTopicsPanel from "@/components/temporal/EmergingTopicsPanel";
import TrendsChart from "@/components/charts/TrendsChart";
import TimelineChart from "@/components/charts/TimelineChart";
import TopicsChart from "@/components/charts/TopicsChart";

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-amber-400">Temporal Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Trends & Emerging Topics</h1>
          <p className="mt-2 text-slate-400">Aceleración, señales emergentes y evolución temporal contra un baseline histórico.</p>
        </div>

        <TemporalIntelligenceV2Panel />

        <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">Ver analítica temporal V1</summary>
          <div className="mt-5 space-y-6">
            <EmergingTopicsPanel />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <TrendsChart />
              <TimelineChart />
            </div>
            <TopicsChart />
          </div>
        </details>
      </section>
    </DashboardLayout>
  );
}
