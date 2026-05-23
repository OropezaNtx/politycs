"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Database, Network, Radio } from "lucide-react";

import {
  getAnalyticsSummary,
  getAvailableSources,
  getCrisisAnalytics,
  getNarrativeAnalytics,
} from "@/services/api";

import { useSource } from "@/context/SourceContext";

export default function LiveMetricsHeader() {
  const { source } = useSource();

  const [metrics, setMetrics] = useState({
    totalPosts: 0,
    activeSources: 0,
    totalAlerts: 0,
    totalNarratives: 0,
    lastUpdated: null,
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [
          summaryResponse,
          sourcesResponse,
          crisisResponse,
          narrativeResponse,
        ] = await Promise.all([
          getAnalyticsSummary(source),
          getAvailableSources(),
          getCrisisAnalytics(source),
          getNarrativeAnalytics(source),
        ]);

        setMetrics({
          totalPosts: summaryResponse?.total_posts || 0,
          activeSources: sourcesResponse?.sources?.length || 0,
          totalAlerts: crisisResponse?.total_alerts || 0,
          totalNarratives: narrativeResponse?.total_narratives || 0,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error("Error loading live metrics:", error);
      }
    }

    loadMetrics();

    const interval = setInterval(loadMetrics, 30000);

    window.addEventListener("rss-updated", loadMetrics);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadMetrics);
    };
  }, [source]);

  const lastUpdatedText = metrics.lastUpdated
    ? metrics.lastUpdated.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Sin actualizar";

  const items = [
    {
      label: "Posts",
      value: metrics.totalPosts,
      icon: Database,
      color: "text-cyan-300",
    },
    {
      label: "Fuentes",
      value: metrics.activeSources,
      icon: Radio,
      color: "text-purple-300",
    },
    {
      label: "Alertas",
      value: metrics.totalAlerts,
      icon: AlertTriangle,
      color: "text-red-300",
    },
    {
      label: "Narrativas",
      value: metrics.totalNarratives,
      icon: Network,
      color: "text-emerald-300",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            <Activity size={14} />
            Live Intelligence Center
          </div>

          <h2 className="text-xl font-bold text-white">
            Monitor operativo activo
          </h2>

          <p className="text-sm text-slate-400">
            Última actualización: {lastUpdatedText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className={`mb-2 ${item.color}`}>
                  <Icon size={18} />
                </div>

                <p className="text-xs text-slate-500">{item.label}</p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}