"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Gauge, MapPin, ShieldAlert, TrendingUp } from "lucide-react";

import { getCrisisIntelligenceV2 } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import { useTimeWindow } from "@/context/TimeWindowContext";
import EvidenceList from "@/components/intelligence/EvidenceList";
import TimeWindowSelector from "@/components/intelligence/TimeWindowSelector";

function riskTone(level) {
  if (level === "high") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (level === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

function factorLabel(value) {
  return value.replaceAll("_", " ");
}

function windowLabel(hours) {
  if (hours === 720) return "30 días";
  if (hours === 168) return "7 días";
  return `${hours} horas`;
}

export default function CrisisIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const { windowHours } = useTimeWindow();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCrisisIntelligenceV2({ source, projectId, windowHours, baselineDays: 30 });
      setData(response);
      setSelected(response.alerts?.[0] || null);
    } catch (error) {
      console.error("Error loading crisis intelligence v2.2:", error);
      setData(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId, windowHours]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-300"><ShieldAlert size={15} /> Crisis Intelligence V2.2</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Calibrated, explainable risk detection</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">Combina señales del contenido con aceleración temporal, diversidad de fuentes y confianza territorial. El score global resume intensidad y convergencia de señales, no una predicción de crisis.</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <TimeWindowSelector tone="red" />
          <div className={`rounded-xl border px-4 py-3 text-center ${riskTone(data?.risk_level)}`}>
            <p className="text-[11px] uppercase tracking-wide opacity-70">Risk level</p>
            <p className="mt-1 text-lg font-bold uppercase">{data?.risk_level || (loading ? "..." : "low")}</p>
            <p className="mt-1 text-xs opacity-70">Score {data?.overall_risk_score ?? 0}/10</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Posts analizados" value={data?.posts_analyzed ?? 0} icon={<Gauge size={14} />} />
        <Metric label="Alertas" value={data?.total_alerts ?? 0} />
        <Metric label="High risk" value={data?.high_risk_alerts ?? 0} />
        <Metric label="Temas acelerando" value={data?.accelerating_topics ?? 0} icon={<TrendingUp size={14} />} />
        <Metric label="Geo alta confianza" value={data?.high_confidence_territorial_alerts ?? 0} icon={<MapPin size={14} />} />
      </div>

      {!!Object.keys(data?.factor_distribution || {}).length && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distribución de factores</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(data.factor_distribution).map(([factor, count]) => <span key={factor} className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">{factorLabel(factor)} · {count}</span>)}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-3">
          {(data?.alerts || []).slice(0, 12).map((alert) => (
            <button key={alert.id} type="button" onClick={() => setSelected(alert)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === alert.id ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${alert.severity === "high" ? "bg-red-500/10 text-red-300" : alert.severity === "medium" ? "bg-amber-500/10 text-amber-300" : "bg-slate-800 text-slate-300"}`}>Risk {alert.risk_score} · {alert.severity}</span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">{alert.source}</span>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{alert.sentiment || "unknown"}</span>
              </div>
              <p className="text-sm font-medium leading-6 text-white">{alert.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(alert.factors || []).map((factor, index) => <span key={`${factor.factor}-${index}`} className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400">{factorLabel(factor.factor)} +{factor.points}</span>)}
              </div>
            </button>
          ))}
          {!loading && !data?.alerts?.length && <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No se detectaron señales que superen el umbral de alerta en los últimos {windowLabel(windowHours)} para este alcance.</p>}
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-300"><AlertTriangle size={14} /> Por qué importa</div>
              <p className="mt-2 text-sm font-medium text-white">{selected.title}</p>
              <div className="mt-3 space-y-2">
                {(selected.factors || []).map((factor, index) => (
                  <div key={`${factor.factor}-${index}`} className="rounded-lg bg-slate-950/50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-3"><span className="text-slate-300">{factorLabel(factor.factor)}</span><span className="text-red-300">+{factor.points}</span></div>
                    {factor.explanation && <p className="mt-1 text-slate-500">{factor.explanation}</p>}
                  </div>
                ))}
              </div>
              {!!selected.territorial_evidence?.length && <div className="mt-3 rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3"><p className="flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300"><MapPin size={13} /> Evidencia territorial</p>{selected.territorial_evidence.map((geo) => <div key={geo.key} className="mt-2 text-xs text-slate-300"><span className="font-medium text-white">{geo.label}</span> · {geo.state} · confianza {geo.confidence}</div>)}</div>}
            </div>
          )}
          <EvidenceList title="Fuente seleccionada" posts={selected ? [selected] : []} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, icon = null }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">{icon}{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>;
}
