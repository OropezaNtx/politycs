"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Flame, Network, Radio } from "lucide-react";

import {
  getCrisisAnalytics,
  getEmergingTopics,
  getNarrativeAnalytics,
  getRecentPosts,
} from "@/services/api";

import { useSource } from "@/context/SourceContext";

function getRiskStyle(level) {
  if (level === "high") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (level === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function getRiskLabel(level) {
  if (level === "high") return "Riesgo alto";
  if (level === "medium") return "Riesgo medio";
  return "Riesgo bajo";
}

export default function IntelligenceAlertBar() {
  const { source } = useSource();

  const [crisis, setCrisis] = useState(null);
  const [emergingTopic, setEmergingTopic] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    async function loadSignals() {
      try {
        const [
          crisisResponse,
          emergingResponse,
          narrativeResponse,
          recentResponse,
        ] = await Promise.all([
          getCrisisAnalytics(source),
          getEmergingTopics(source),
          getNarrativeAnalytics(source),
          getRecentPosts(source),
        ]);

        setCrisis(crisisResponse);

        setEmergingTopic(
          emergingResponse?.emerging_topics?.[0] || null
        );

        setNarrative(
          narrativeResponse?.narratives?.[0] || null
        );

        setRecentCount(
          recentResponse?.total_returned || 0
        );
      } catch (error) {
        console.error("Error loading intelligence alert bar:", error);
      }
    }

    loadSignals();

    const interval = setInterval(loadSignals, 30000);

    window.addEventListener("rss-updated", loadSignals);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadSignals);
    };
  }, [source]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/20">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        <div
          className={`rounded-xl border p-4 ${getRiskStyle(
            crisis?.risk_level
          )}`}
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <AlertTriangle size={15} />
            Crisis
          </div>

          <p className="text-lg font-bold">
            {getRiskLabel(crisis?.risk_level)}
          </p>

          <p className="mt-1 text-xs opacity-80">
            {crisis?.total_alerts || 0} alertas detectadas
          </p>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-orange-200">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Flame size={15} />
            Topic emergente
          </div>

          <p className="text-lg font-bold">
            {emergingTopic?.topic || "Sin señal"}
          </p>

          <p className="mt-1 text-xs opacity-80">
            Crecimiento x{emergingTopic?.growth_score || 0}
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-purple-200">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Network size={15} />
            Narrativa dominante
          </div>

          <p className="text-lg font-bold">
            {narrative?.label || "Sin narrativa"}
          </p>

          <p className="mt-1 text-xs opacity-80">
            {narrative?.total_mentions || 0} menciones
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-200">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Radio size={15} />
            Actividad reciente
          </div>

          <p className="text-lg font-bold">
            {recentCount} señales
          </p>

          <p className="mt-1 text-xs opacity-80">
            Última ventana activa
          </p>
        </div>
      </div>
    </section>
  );
}