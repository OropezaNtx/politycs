import DashboardLayout from "@/components/layout/DashboardLayout";
import EmergingTopicsPanel from "@/components/temporal/EmergingTopicsPanel";
import TrendsChart from "@/components/charts/TrendsChart";
import TimelineChart from "@/components/charts/TimelineChart";
import TopicsChart from "@/components/charts/TopicsChart";

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-amber-400 font-medium">
            Temporal Intelligence
          </p>

          <h1 className="text-3xl font-bold text-white">
            Trends & Emerging Topics
          </h1>

          <p className="mt-2 text-slate-400">
            Tendencias, actividad temporal y temas emergentes.
          </p>
        </div>

        <EmergingTopicsPanel />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TrendsChart />
          <TimelineChart />
        </div>

        <TopicsChart />
      </section>
    </DashboardLayout>
  );
}