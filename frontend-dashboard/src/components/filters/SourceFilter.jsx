"use client";

import { useEffect, useState } from "react";

import { useSource } from "@/context/SourceContext";
import { getAvailableSources } from "@/services/api";

function formatSourceName(source) {
  const labels = {
    all: "Todas las fuentes",
    hacker_news: "Hacker News",
    reddit: "Reddit",
    facebook: "Facebook",
    collector: "Collector",
  };

  return labels[source] || source;
}

export default function SourceFilter() {
  const { source, setSource } = useSource();
  const [sources, setSources] = useState([
    {
      name: "all",
      total_posts: 0,
    },
  ]);

  useEffect(() => {
    async function loadSources() {
      try {
        const data = await getAvailableSources();

        const dynamicSources = data.sources || [];

        setSources([
          {
            name: "all",
            total_posts: data.total_posts || 0,
          },
          ...dynamicSources,
        ]);
      } catch (error) {
        console.error("Error loading sources:", error);
      }
    }

    loadSources();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <span className="text-sm text-slate-400">Fuente:</span>

      <select
        value={source}
        onChange={(event) => setSource(event.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
      >
        {sources.map((item) => (
          <option key={item.name} value={item.name}>
            {formatSourceName(item.name)} ({item.total_posts})
          </option>
        ))}
      </select>
    </div>
  );
}