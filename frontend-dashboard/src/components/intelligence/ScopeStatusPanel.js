"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, Filter, History, Radar } from "lucide-react";

import { getProjectScope } from "@/services/api";
import { useProject } from "@/context/ProjectContext";
import { useSource } from "@/context/SourceContext";

function formatDate(value) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ScopeStatusPanel({ compact = false }) {
  const { projectId, activeProject } = useProject();
  const { source } = useSource();
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setScope(await getProjectScope({ source, projectId }));
    } catch (error) {
      console.error("Error loading project scope:", error);
      setScope(null);
    } finally {
      setLoading(false);
    }
  }, [source, projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!projectId || loading) return null;

  const status = scope?.status;
  const recommendation = scope?.recommended_window_hours;

  return (
    <section className={`rounded-2xl border p-4 ${status === "no_matches" ? "border-red-500/20 bg-red-500/5" : status === "historical_only" ? "border-amber-500/20 bg-amber-500/5" : "border-cyan-500/20 bg-cyan-500/5"}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300"><Radar size={14} /> Monitoring scope health</div>
          <h3 className="mt-1 font-semibold text-white">{activeProject?.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {status === "active" && "El proyecto tiene actividad reciente dentro de su alcance."}
            {status === "historical_only" && `Hay ${scope?.historical_posts || 0} coincidencias históricas, pero ninguna en las últimas 24 horas.`}
            {status === "no_matches" && "La configuración actual no coincide con ningún contenido almacenado."}
          </p>
          {recommendation && <p className="mt-2 text-xs text-amber-300">Sugerencia: amplía temporalmente la ventana a {recommendation === 168 ? "7 días" : "30 días"}.</p>}
        </div>

        <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          <Metric icon={History} label="Histórico" value={scope?.historical_posts ?? 0} />
          <Metric icon={Clock3} label="24h" value={scope?.windows?.["24h"] ?? 0} />
          {!compact && <Metric icon={Clock3} label="7d" value={scope?.windows?.["7d"] ?? 0} />}
          {!compact && <Metric icon={Filter} label="Modo" value={scope?.match_mode === "strict" ? "Estricto" : "Amplio"} />}
        </div>
      </div>

      {!compact && scope?.historical_posts > 0 && (
        <div className="mt-3 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
          Primera actividad: {formatDate(scope.first_activity)} · Última actividad: {formatDate(scope.last_activity)}
        </div>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="min-w-28 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500"><Icon size={12} /> {label}</div>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
