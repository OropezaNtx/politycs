"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, Radar } from "lucide-react";

import { getGeoIntelligenceV2 } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import EvidenceList from "@/components/intelligence/EvidenceList";

export default function GeoIntelligenceV2Panel() {
  const { projectId } = useProject();
  const { source } = useSource();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getGeoIntelligenceV2({ source, projectId, windowHours: 168 });
      setData(response);
      setSelected(response.territories?.[0] || null);
    } catch (error) {
      console.error("Error loading geo intelligence v2:", error);
      setData(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300"><Radar size={15} /> Territorial Intelligence V2</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Where the conversation is concentrating</h2>
          <p className="mt-1 text-sm text-slate-400">Cruza menciones geográficas con negatividad, relevancia política, topics y evidencia.</p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-cyan-400">Territorios</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data?.total_territories ?? 0}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.territories || []).map((territory) => (
            <button key={territory.key} type="button" onClick={() => setSelected(territory)} className={`rounded-xl border p-4 text-left transition ${selected?.key === territory.key ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-white"><MapPin size={15} className="text-cyan-300" /><span className="font-medium">{territory.label}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{territory.state} · {territory.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{territory.mentions}</p>
                  <p className="text-xs text-slate-500">menciones</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2"><span className="text-slate-500">Negativo</span><p className="mt-1 text-red-300">{Math.round((territory.negative_ratio || 0) * 100)}%</p></div>
                <div className="rounded-lg bg-slate-950/60 p-2"><span className="text-slate-500">Políticos</span><p className="mt-1 text-violet-300">{territory.political_posts || 0}</p></div>
              </div>
            </button>
          ))}
          {!loading && !data?.territories?.length && <p className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">No se detectaron territorios en la ventana seleccionada.</p>}
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300"><Navigation size={14} /> {selected.label}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(selected.top_topics || {}).map(([topic, count]) => <span key={topic} className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">{topic} · {count}</span>)}
              </div>
              <p className="mt-3 text-xs text-slate-500">Lat {selected.lat} · Lng {selected.lng}</p>
            </div>
          )}
          <EvidenceList title={selected ? `Evidencia territorial · ${selected.label}` : "Evidencia territorial"} posts={selected?.evidence || []} />
        </div>
      </div>
    </section>
  );
}
