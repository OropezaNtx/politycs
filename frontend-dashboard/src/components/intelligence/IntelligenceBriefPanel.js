"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, MapPin, Radar, RefreshCw, Target } from "lucide-react";

import { getIntelligenceBrief } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";

const WINDOWS = [
  { label: "1h", value: 1 },
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "7d", value: 168 },
];

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function IntelligenceBriefPanel() {
  const [windowHours, setWindowHours] = useState(24);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { projectId, activeProject } = useProject();
  const { source } = useSource();

  const loadBrief = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getIntelligenceBrief({ source, projectId, windowHours, baselineDays: 30 });
      setBrief(data);
    } catch (requestError) {
      console.error(requestError);
      setError("No fue posible generar el brief de inteligencia.");
    } finally {
      setLoading(false);
    }
  }, [source, projectId, windowHours]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBrief();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBrief]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <Radar size={16} /> Intelligence Brief V2
            {activeProject && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 normal-case tracking-normal text-cyan-200">
                <Target size={12} /> {activeProject.name}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {loading ? "Analizando señales..." : brief?.headline || "Sin señales relevantes"}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            {error || brief?.summary || "Todavía no hay suficiente información para generar un resumen."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WINDOWS.map((item) => (
            <button key={item.value} type="button" onClick={() => setWindowHours(item.value)} className={`rounded-lg border px-3 py-2 text-xs transition ${windowHours === item.value ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"}`}>
              {item.label}
            </button>
          ))}
          <button type="button" onClick={loadBrief} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-slate-400 transition hover:text-cyan-300" aria-label="Actualizar intelligence brief">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {brief && !loading && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Metric label="Posts" value={brief.metrics?.posts ?? 0} />
            <Metric label="Negativo" value={`${Math.round((brief.metrics?.negative_ratio || 0) * 100)}%`} />
            <Metric label="Riesgo" value={(brief.metrics?.risk_level || "low").toUpperCase()} />
            <Metric label="Alertas" value={brief.metrics?.alerts ?? 0} />
            <Metric label="Territorios" value={brief.metrics?.territories ?? 0} />
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-300"><Activity size={15} /> Señal principal</div>
              <p className="mt-2 font-medium text-white">{brief.leading_signal?.topic || "Sin aceleración relevante"}</p>
              <p className="mt-1 text-sm text-slate-400">{brief.leading_signal?.growth_score ? `Crecimiento relativo x${brief.leading_signal.growth_score}` : "Sin baseline suficiente para comparar"}</p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300"><MapPin size={15} /> Territorio principal</div>
              <p className="mt-2 font-medium text-white">{brief.leading_territory?.label || "Sin territorio dominante"}</p>
              <p className="mt-1 text-sm text-slate-400">{brief.leading_territory ? `${brief.leading_territory.mentions} menciones · ${Math.round((brief.leading_territory.negative_ratio || 0) * 100)}% negativas` : "No se detectaron menciones geográficas en esta ventana"}</p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-300"><AlertTriangle size={15} /> Watchlist</div>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                {(brief.watch_items || []).slice(0, 3).map((item, index) => <p key={`${item.type}-${item.label}-${index}`}>• {item.label}</p>)}
                {!brief.watch_items?.length && <p className="text-slate-500">Sin señales prioritarias.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
