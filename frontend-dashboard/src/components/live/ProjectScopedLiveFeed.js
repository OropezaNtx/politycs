"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";

import { getIntelligenceEvidence } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";
import EvidenceList from "@/components/intelligence/EvidenceList";

export default function ProjectScopedLiveFeed() {
  const { projectId, activeProject } = useProject();
  const { source } = useSource();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getIntelligenceEvidence({ source, projectId, limit: 30 });
      setData(response);
    } catch (error) {
      console.error("Error loading project scoped live feed:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    window.addEventListener("rss-updated", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", load);
    };
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300"><Radio size={15} /> Scoped Live Intelligence</div>
          <h2 className="mt-2 text-xl font-semibold text-white">{activeProject?.name || "Global intelligence feed"}</h2>
          <p className="mt-1 text-sm text-slate-400">Evidencia reciente que cumple el alcance de monitoreo seleccionado.</p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-800 p-2 text-slate-400"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
      </div>
      <EvidenceList title={`${data?.total_returned ?? 0} publicaciones recientes`} posts={data?.posts || []} />
    </section>
  );
}
