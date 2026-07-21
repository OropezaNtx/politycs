"use client";

import { useEffect, useState } from "react";
import { Network, AlertTriangle, ExternalLink } from "lucide-react";

import { getNarrativeAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

function getRiskColor(narrative) {
  if (narrative.negative_ratio >= 0.4 || narrative.toxic_ratio >= 0.2) {
    return "border-red-500/20 bg-red-500/5";
  }

  if (narrative.political_ratio >= 0.5) {
    return "border-amber-500/20 bg-amber-500/5";
  }

  return "border-slate-800 bg-slate-950/60";
}

export default function NarrativeIntelligencePanel() {
  const [data, setData] = useState(null);
  const { source } = useSource();

  useEffect(() => {
    async function loadNarratives() {
      try {
        const response = await getNarrativeAnalytics(source);
        setData(response);
      } catch (error) {
        console.error("Error loading narratives:", error);
        setData(null);
      }
    }

    loadNarratives();

    const interval = setInterval(loadNarratives, 30000);

    window.addEventListener("rss-updated", loadNarratives);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadNarratives);
    };
  }, [source]);

  const narratives = data?.narratives || [];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Narrative Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Narrativas dominantes detectadas por temas, sentimiento y señales públicas.
          </p>
        </div>

        <div className="rounded-xl bg-purple-500/10 p-3 text-purple-300">
          <Network size={22} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Posts analizados</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {data?.total_posts_analyzed || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Narrativas activas</p>
          <p className="mt-1 text-2xl font-bold text-purple-300">
            {data?.total_narratives || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Fuente</p>
          <p className="mt-1 text-lg font-bold text-cyan-300">
            {data?.source || source}
          </p>
        </div>
      </div>

      {narratives.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No se detectaron narrativas para esta fuente.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {narratives.slice(0, 6).map((narrative) => (
            <div
              key={narrative.key}
              className={`rounded-xl border p-4 ${getRiskColor(narrative)}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {narrative.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {narrative.total_mentions} menciones detectadas
                  </p>
                </div>

                {(narrative.negative_ratio >= 0.4 ||
                  narrative.toxic_ratio >= 0.2) && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                    <AlertTriangle size={12} className="mr-1 inline" />
                    Riesgo
                  </span>
                )}
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-slate-500">Político</p>
                  <p className="mt-1 font-bold text-white">
                    {Math.round(narrative.political_ratio * 100)}%
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-slate-500">Negativo</p>
                  <p className="mt-1 font-bold text-white">
                    {Math.round(narrative.negative_ratio * 100)}%
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-slate-500">Tóxico</p>
                  <p className="mt-1 font-bold text-white">
                    {Math.round(narrative.toxic_ratio * 100)}%
                  </p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {Object.entries(narrative.top_topics || {}).map(
                  ([topic, count]) => (
                    <span
                      key={topic}
                      className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                    >
                      {topic}: {count}
                    </span>
                  )
                )}
              </div>

              {narrative.sample_posts?.[0]?.url && (
                <a
                  href={narrative.sample_posts[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Ver ejemplo <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
