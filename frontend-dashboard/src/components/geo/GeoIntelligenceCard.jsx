"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { getGeoAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

export default function GeoIntelligenceCard() {
  const [data, setData] = useState(null);
  const { source } = useSource();

  useEffect(() => {
    async function loadGeoData() {
      try {
        const response = await getGeoAnalytics(source);
        setData(response);
      } catch (error) {
        console.error("Error loading geo analytics:", error);
        setData(null);
      }
    }

    loadGeoData();

    window.addEventListener("rss-updated", loadGeoData);

    return () => {
      window.removeEventListener("rss-updated", loadGeoData);
    };
  }, [source]);

  const locations = data?.locations || [];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Geo Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Zonas detectadas por menciones en contenido público.
          </p>
        </div>

        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
          <MapPin size={22} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Posts analizados</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {data?.total_posts_analyzed || 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-4">
          <p className="text-xs text-slate-500">Zonas detectadas</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">
            {data?.total_locations || 0}
          </p>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No se detectaron zonas para esta fuente.
        </div>
      ) : (
        <div className="space-y-3">
          {locations.slice(0, 6).map((location) => (
            <div
              key={location.key}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {location.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {location.type} · {location.state}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {location.total_mentions} menciones
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(location.top_topics || {}).map(
                  ([topic, count]) => (
                    <span
                      key={topic}
                      className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                    >
                      {topic}: {count}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}