"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, TrendingUp } from "lucide-react";

import { getTemporalIntelligence } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import EvidenceList from "@/components/intelligence/EvidenceList";

const WINDOWS = [1, 6, 24, 168];

export default function TemporalIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const [windowHours, setWindowHours] = useState(24);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTemporalIntelligence({ source, projectId, windowHours, baselineDays: 30 });
      setData(response);
      setSelected(response.signals?.[0] || null);
    } catch (error) {
      console.error("Error loading temporal intelligence:", error);
      setData(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId, windowHours]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300"><TrendingUp size={15} /> Temporal Intelligence V2</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Acceleration & emerging signals</h2>
          <p className="mt-1 text-sm text-slate-400">Compara la actividad reciente contra un baseline de 30 días.</p>
        </div>
        <div className="flex gap-2">
          {WINDOWS.map((value) => <button key={value} type="button" onClick={() => setWindowHours(value)} className={`rounded-lg border px-3 py-2 text-xs ${windowHours === value ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-slate-800 text-slate-400"}`}>{value === 168 ? "7d" : `${value}h`}</button>)}
          <button type="button" onClick={load} className="rounded-lg border border-slate-800 p-2 text-slate-400"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Posts ventana" value={data?.current_posts ?? 0} />
        <Metric label="Posts baseline" value={data?.baseline_posts ?? 0} />
        <Metric label="Señales" value={data?.signals?.length ?? 0} />
        <Metric label="Acelerando" value={(data?.signals || []).filter((item) => item.accelerating).length} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-3">
          {(data?.signals || []).slice(0, 10).map((signal) => (
            <button key={signal.topic} type="button" onClick={() => setSelected(signal)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.topic === signal.topic ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{signal.topic}</p>
                  <p className="mt-1 text-xs text-slate-500">{signal.current_count} recientes · {signal.baseline_count} baseline</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${signal.accelerating ? "text-amber-300" : "text-slate-300"}`}>{signal.growth_score ? `x${signal.growth_score}` : "NEW"}</p>
                  <p className="text-xs text-slate-500">{signal.accelerating ? "Acelerando" : "Estable"}</p>
                </div>
              </div>
            </button>
          ))}
          {!loading && !data?.signals?.length && <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No hay señales temporales suficientes en esta ventana.</p>}
        </div>
        <EvidenceList title={selected ? `Evidencia · ${selected.topic}` : "Evidencia"} posts={selected?.evidence || []} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Activity size={13} /> {label}</div><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}
