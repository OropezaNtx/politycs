"use client";

import { useSource } from "@/context/SourceContext";

export default function SourceFilter() {
  const { source, setSource } = useSource();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400">
        Fuente:
      </span>

      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="
          rounded-xl
          border
          border-slate-700
          bg-slate-900
          px-4
          py-2
          text-white
          outline-none
        "
      >
        <option value="all">All</option>
        <option value="reddit">Reddit</option>
        <option value="hacker_news">Hacker News</option>
      </select>
    </div>
  );
}