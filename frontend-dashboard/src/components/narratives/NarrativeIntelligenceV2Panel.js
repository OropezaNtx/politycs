"use client";

import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, Network, ShieldAlert } from "lucide-react";

import { getNarrativeIntelligenceV2 } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import EvidenceList from "@/components/intelligence/EvidenceList";

export default function NarrativeIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNarrativeIntelligenceV2({ source, projectId });
      setData(response);
      setSelected(response.narratives?.[0] || null);
    } catch (error) {
      console.error("Error loading narrative intelligence v2:", error);
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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300"><BrainCircuit size={15} /> Narrative Intelligence V2</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Dominant public narratives</h2>
          <p className="mt-1 text-sm text-slate-400">Agrupa conversación por marcos narrativos y expone volumen, negatividad, fuentes y evidencia.</p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-violet-300">Narrativas</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data?.total_narratives ?? 0}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-3">
          {(data?.narratives || []).map((narrative) => (
            <button key={narrative.key} type="button" onClick={() => setSelected(narrative)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.key === narrative.key ? "border-violet-500/30 bg-violet-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><Network size={15} className="text-violet-300" /><p className="font-medium text-white">{narrative.label}</p></div>
                  <p className="mt-1 text-xs text-slate-500">{narrative.total_mentions} menciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-300">{Math.round((narrative.negative_ratio || 0) * 100)}%</p>
                  <p className="text-xs text-slate-500">negativas</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {Object.entries(narrative.sources || {}).slice(0, 3).map(([name, count]) => <span key={name} className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">{name} · {count}</span>)}
                {Object.entries(narrative.top_topics || {}).slice(0, 3).map(([name, count]) => <span key={name} className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{name} · {count}</span>)}
              </div>
            </button>
          ))}
          {!loading && !data?.narratives?.length && <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No se detectaron narrativas para el alcance activo.</p>}
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-300"><ShieldAlert size={14} /> Narrative profile</div>
              <p className="mt-2 text-lg font-medium text-white">{selected.label}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Metric label="Negativo" value={`${Math.round((selected.negative_ratio || 0) * 100)}%`} />
                <Metric label="Político" value={`${Math.round((selected.political_ratio || 0) * 100)}%`} />
                <Metric label="Tóxico" value={`${Math.round((selected.toxic_ratio || 0) * 100)}%`} />
              </div>
            </div>
          )}
          <EvidenceList title={selected ? `Evidencia narrativa · ${selected.label}` : "Evidencia narrativa"} posts={selected?.evidence || []} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg bg-slate-950/60 p-2"><p className="text-slate-500">{label}</p><p className="mt-1 font-medium text-white">{value}</p></div>;
}
