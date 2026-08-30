"use client";

import { Clock3 } from "lucide-react";
import { useTimeWindow } from "@/context/TimeWindowContext";

export default function TimeWindowSelector({ tone = "cyan" }) {
  const { windowHours, setWindowHours, options } = useTimeWindow();
  const activeClasses = tone === "red"
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : tone === "violet"
      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
      : tone === "amber"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500"><Clock3 size={12} /> Ventana</span>
      {options.map((option) => (
        <button
          key={option.hours}
          type="button"
          onClick={() => setWindowHours(option.hours)}
          className={`rounded-lg border px-3 py-2 text-xs transition ${windowHours === option.hours ? activeClasses : "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
