"use client";

import { useEffect, useState } from "react";
import { Radio, AlertTriangle, Activity, MessageSquareText } from "lucide-react";

import { getPlatformSummary } from "@/services/api";

function formatPlatformName(platform) {
  const labels = {
    rss_news: "RSS News",
    news_site: "News Site",
    social: "Social",
    reddit: "Reddit",
    facebook: "Facebook",
    twitter: "Twitter / X",
    mexico: "México",
    MexicoCity: "Mexico City",
    unknown: "Unknown",
  };

  return labels[platform] || platform;
}

export default function PlatformSummaryCard() {
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    async function loadPlatformSummary() {
      try {
        const response = await getPlatformSummary();
        setPlatforms(response.platforms || []);
      } catch (error) {
        console.error("Error loading platform summary:", error);
        setPlatforms([]);
      }
    }

    loadPlatformSummary();

    window.addEventListener("rss-updated", loadPlatformSummary);

    return () => {
      window.removeEventListener("rss-updated", loadPlatformSummary);
    };
  }, []);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Platform Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Comparativo de actividad por tipo de fuente.
          </p>
        </div>

        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
          <Radio size={22} />
        </div>
      </div>

      {platforms.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No hay datos por plataforma.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {platforms.map((platform) => {
            const topTopic =
              Object.keys(platform.top_topics || {})[0] || "N/A";

            return (
              <div
                key={platform.platform}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {formatPlatformName(platform.platform)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Top topic: {topTopic}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    {platform.total_posts} posts
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="mb-2 text-cyan-300">
                      <Activity size={16} />
                    </div>
                    <p className="text-slate-500">Políticos</p>
                    <p className="mt-1 font-bold text-white">
                      {Math.round(platform.political_ratio * 100)}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="mb-2 text-red-300">
                      <AlertTriangle size={16} />
                    </div>
                    <p className="text-slate-500">Negativos</p>
                    <p className="mt-1 font-bold text-white">
                      {Math.round(platform.negative_ratio * 100)}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="mb-2 text-amber-300">
                      <MessageSquareText size={16} />
                    </div>
                    <p className="text-slate-500">Tóxicos</p>
                    <p className="mt-1 font-bold text-white">
                      {Math.round(platform.toxic_ratio * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}