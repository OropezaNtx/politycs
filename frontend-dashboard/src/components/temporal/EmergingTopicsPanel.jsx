"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import { getEmergingTopics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

function getGrowthStyle(score) {
  if (score >= 2) {
    return "text-red-300 bg-red-500/10";
  }

  if (score >= 1.3) {
    return "text-amber-300 bg-amber-500/10";
  }

  return "text-emerald-300 bg-emerald-500/10";
}

export default function EmergingTopicsPanel() {
  const [data, setData] = useState(null);
  const { source } = useSource();

  useEffect(() => {
    async function loadEmergingTopics() {
      try {
        const response = await getEmergingTopics(source);
        setData(response);
      } catch (error) {
        console.error("Error loading emerging topics:", error);
        setData(null);
      }
    }

    loadEmergingTopics();

    const interval = setInterval(loadEmergingTopics, 30000);

    window.addEventListener("rss-updated", loadEmergingTopics);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadEmergingTopics);
    };
  }, [source]);

  const topics = data?.emerging_topics || [];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Emerging Topics
          </h2>
          <p className="text-sm text-slate-400">
            Temas con crecimiento reciente frente al historial.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
          <TrendingUp size={22} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Posts analizados</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {data?.total_posts_analyzed || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Ventana reciente</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">
            {data?.recent_window || 0}
          </p>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No hay temas emergentes para esta fuente.
        </div>
      ) : (
        <div className="space-y-3">
          {topics.slice(0, 8).map((topic) => (
            <div
              key={topic.topic}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {topic.topic}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {topic.recent_count} recientes / {topic.historical_count} históricos
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getGrowthStyle(
                    topic.growth_score
                  )}`}
                >
                  x{topic.growth_score}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: `${Math.min(topic.growth_score * 25, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}