import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectScopedLiveFeed from "@/components/live/ProjectScopedLiveFeed";
import LiveIntelligenceFeed from "@/components/live/LiveIntelligenceFeed";
import RelevantPostsFeed from "@/components/feed/RelevantPostsFeed";

export default function LivePage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-emerald-400">Live Intelligence</p>
          <h1 className="text-3xl font-bold text-white">Live Monitoring Feed</h1>
          <p className="mt-2 text-slate-400">Evidencia reciente filtrada por el alcance activo y monitoreo general del sistema.</p>
        </div>

        <ProjectScopedLiveFeed />

        <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">Ver feeds generales V1</summary>
          <div className="mt-5 grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <LiveIntelligenceFeed />
            <RelevantPostsFeed />
          </div>
        </details>
      </section>
    </DashboardLayout>
  );
}
