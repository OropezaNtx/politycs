"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, Radar, ShieldCheck } from "lucide-react";

import { getGeoIntelligenceV2 } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import { useTimeWindow } from "@/context/TimeWindowContext";
import TimeWindowSelector from "@/components/intelligence/TimeWindowSelector";

const confidenceOptions = [
  { value: "low", label: "Todas" },
  { value: "medium", label: "Media+" },
  { value: "high", label: "Alta" },
];

function ConfidenceBadge({ value }) {
  const style = value === "high" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : value === "medium" ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-slate-800 text-slate-400 border-slate-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${style}`}>Confianza {value}</span>;
}

export default function GeoIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const { windowHours } = useTimeWindow();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minConfidence, setMinConfidence] = useState("low");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getGeoIntelligenceV2({ source, projectId, windowHours, minConfidence });
      setData(response);
      setSelected(response.territories?.[0] || null);
    } catch (error) {
      console.error("Error loading geo intelligence v2.1:", error);
      setData(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId, windowHours, minConfidence]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300"><Radar size={15} /> Territorial Intelligence V2.1</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Where the conversation is concentrating</h2>
          <p className="mt-1 text-sm text-slate-400">Ubicaciones canónicas, confianza de detección y evidencia auditable por territorio.</p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <TimeWindowSelector tone="cyan" />
          <div className="flex flex-wrap items-center gap-2">
            {confidenceOptions.map((option) => <button key={option.value} type="button" onClick={() => setMinConfidence(option.value)} className={`rounded-lg border px-3 py-2 text-xs ${minConfidence === option.value ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-slate-800 bg-slate-950/40 text-slate-500"}`}>{option.label}</button>)}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-right"><p className="text-xs uppercase tracking-wide text-cyan-400">Territorios</p><p className="mt-1 text-2xl font-semibold text-white">{data?.total_territories ?? 0}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.territories || []).map((territory) => (
            <button key={territory.key} type="button" onClick={() => setSelected(territory)} className={`rounded-xl border p-4 text-left transition ${selected?.key === territory.key ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-white"><MapPin size={15} className="text-cyan-300" /><span className="font-medium">{territory.label}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{territory.state} · {territory.country} · {territory.type}</p>
                  <div className="mt-2"><ConfidenceBadge value={territory.dominant_confidence} /></div>
                </div>
                <div className="text-right"><p className="text-lg font-semibold text-white">{territory.mentions}</p><p className="text-xs text-slate-500">menciones</p><p className="mt-1 text-[11px] text-cyan-400">peso {territory.weighted_mentions}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2"><span className="text-slate-500">Negativo</span><p className="mt-1 text-red-300">{Math.round((territory.negative_ratio || 0) * 100)}%</p></div>
                <div className="rounded-lg bg-slate-950/60 p-2"><span className="text-slate-500">Políticos</span><p className="mt-1 text-violet-300">{territory.political_posts || 0}</p></div>
                <div className="rounded-lg bg-slate-950/60 p-2"><span className="text-slate-500">Alta conf.</span><p className="mt-1 text-emerald-300">{territory.confidence_counts?.high || 0}</p></div>
              </div>
            </button>
          ))}
          {!loading && !data?.territories?.length && <p className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No se detectaron territorios con el nivel de confianza seleccionado en esta ventana.</p>}
        </div>

        <div className="space-y-3">
          {selected && <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300"><Navigation size={14} /> {selected.label}</div><p className="mt-2 text-sm text-white">{selected.type} · {selected.state} · {selected.country}</p><div className="mt-3 flex flex-wrap gap-2">{Object.entries(selected.top_topics || {}).map(([topic,count]) => <span key={topic} className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">{topic} · {count}</span>)}</div><p className="mt-3 text-xs text-slate-500">Lat {selected.lat} · Lng {selected.lng}</p></div>}

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><ShieldCheck size={14} /> Evidencia territorial</div>
            <div className="mt-3 space-y-3">
              {(selected?.evidence || []).map((post) => <article key={post.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><div className="flex flex-wrap items-center gap-2"><ConfidenceBadge value={post.geo_confidence} /><span className="text-[11px] text-slate-500">{post.source || "Sin fuente"}</span></div><p className="mt-2 text-sm text-white">{post.title}</p><div className="mt-2 flex flex-wrap gap-1.5">{(post.geo_evidence || []).map((hit,index) => <span key={`${hit.field}-${index}`} className="rounded-md border border-slate-800 px-2 py-1 text-[11px] text-slate-300">{hit.field}: <span className="text-white">{hit.value}</span></span>)}</div>{post.url && <a href={post.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-cyan-300 hover:text-cyan-200">Abrir fuente ↗</a>}</article>)}
              {!selected?.evidence?.length && <p className="text-sm text-slate-500">No hay evidencia para el territorio seleccionado.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
