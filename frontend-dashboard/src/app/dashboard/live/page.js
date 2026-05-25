import DashboardLayout from "@/components/layout/DashboardLayout";
import LiveIntelligenceFeed from "@/components/live/LiveIntelligenceFeed";
import RelevantPostsFeed from "@/components/feed/RelevantPostsFeed";

export default function LivePage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-emerald-400 font-medium">
            Live Intelligence
          </p>

          <h1 className="text-3xl font-bold text-white">
            Live Monitoring Feed
          </h1>

          <p className="mt-2 text-slate-400">
            Señales recientes y posts políticamente relevantes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <LiveIntelligenceFeed />
          <RelevantPostsFeed />
        </div>
      </section>
    </DashboardLayout>
  );
}