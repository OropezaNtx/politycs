"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, ExternalLink } from "lucide-react";

import { getCrisisAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

function getRiskStyle(level) {
  if (level === "high") {
    return "bg-red-500/10 text-red-300 border-red-500/20";
  }

  if (level === "medium") {
    return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }

  return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
}

function getRiskLabel(level) {
  if (level === "high") return "Alto";
  if (level === "medium") return "Medio";
  return "Bajo";
}

export default function CrisisDetectionPanel() {
  const [data, setData] = useState(null);
  const { source } = useSource();

  useEffect(() => {
    async function loadCrisisData() {
      try {
        const response = await getCrisisAnalytics(source);
        setData(response);
      } catch (error) {
        console.error("Error loading crisis analytics:", error);
        setData(null);
      }
    }

    loadCrisisData();

    const interval = setInterval(loadCrisisData, 30000);

    window.addEventListener("rss-updated", loadCrisisData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadCrisisData);
    };
  }, [source]);

  const alerts = data?.alerts || [];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Crisis Detection
          </h2>
          <p className="text-sm text-slate-400">
            Alertas preliminares por sentimiento, toxicidad, política y temas sensibles.
          </p>
        </div>

        <div className="rounded-xl bg-red-500/10 p-3 text-red-300">
          <ShieldAlert size={22} />
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
          <p className="text-xs text-slate-500">Alertas</p>
          <p className="mt-1 text-2xl font-bold text-red-300">
            {data?.total_alerts || 0}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${getRiskStyle(data?.risk_level)}`}>
          <p className="text-xs opacity-80">Nivel de riesgo</p>
          <p className="mt-1 text-2xl font-bold">
            {getRiskLabel(data?.risk_level)}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No hay alertas críticas para esta fuente.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 6).map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-red-500/10 bg-slate-950/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                  Riesgo {alert.risk_score}
                </span>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                  {alert.source}
                </span>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {alert.sentiment || "unknown"}
                </span>
              </div>

              <h3 className="text-sm font-medium leading-relaxed text-white">
                {alert.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {(alert.reasons || []).map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                  >
                    <AlertTriangle size={12} className="mr-1 inline" />
                    {reason}
                  </span>
                ))}
              </div>

              {alert.url && (
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Abrir fuente <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}