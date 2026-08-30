"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { getCrisisIntelligenceV2 } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import EvidenceList from "@/components/intelligence/EvidenceList";

function riskTone(level) {
  if (level === "high") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (level === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

export default function CrisisIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCrisisIntelligenceV2({ source, projectId, windowHours: 24, baselineDays: 30 });
      setData(response);
      setSelected(response.alerts?.[0] || null);
    } catch (error) {
      console.error("Error loading crisis intelligence v2:", error);
      setData(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-300"><ShieldAlert size={15} /> Crisis Intelligence V2</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Explainable risk detection</h2>
          <p className="mt-1 text-sm text-slate-400">Combina negatividad, relevancia política, toxicidad, temas sensibles, aceleración y diversidad de fuentes.</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-center ${riskTone(data?.risk_level)}`}>
          <p className="text-[11px] uppercase tracking-wide opacity-70">Risk level</p>
          <p className="mt-1 text-lg font-bold uppercase">{data?.risk_level || (loading ? "..." : "low")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Alertas" value={data?.total_alerts ?? 0} />
        <Metric label="High risk" value={data?.high_risk_alerts ?? 0} />
        <Metric label="Medium risk" value={data?.medium_risk_alerts ?? 0} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-3">
          {(data?.alerts || []).slice(0, 12).map((alert) => (
            <button key={alert.id} type="button" onClick={() => setSelected(alert)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === alert.id ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">Risk {alert.risk_score}</span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">{alert.source}</span>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{alert.sentiment || "unknown"}</span>
              </div>
              <p className="text-sm font-medium leading-6 text-white">{alert.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(alert.factors || []).map((factor, index) => <span key={`${factor.factor}-${index}`} className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400">{factor.factor.replaceAll("_", " ")} +{factor.points}</span>)}
              </div>
            </button>
          ))}
          {!loading && !data?.alerts?.length && <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No se detectaron alertas V2 en las últimas 24 horas.</p>}
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-300"><AlertTriangle size={14} /> Why this matters</div>
              <p className="mt-2 text-sm font-medium text-white">{selected.title}</p>
              <div className="mt-3 space-y-2">
                {(selected.factors || []).map((factor, index) => (
                  <div key={`${factor.factor}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-xs">
                    <span className="text-slate-400">{factor.factor.replaceAll("_", " ")}</span>
                    <span className="text-red-300">+{factor.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <EvidenceList title="Fuente seleccionada" posts={selected ? [selected] : []} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>;
}
