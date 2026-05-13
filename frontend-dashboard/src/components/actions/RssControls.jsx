"use client";

import { useState } from "react";
import { RefreshCw, Newspaper } from "lucide-react";

import { ingestRssNews } from "@/services/api";

export default function RssControls() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleIngest() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const data = await ingestRssNews();
      setResult(data);
    } catch (error) {
      console.error("Error ingesting RSS:", error);
      setErrorMessage("No se pudo actualizar RSS. Revisa backend o conexión.");
    } finally {
      setLoading(false);
    }
  }

  const totalCreated =
    result?.results?.reduce((sum, item) => sum + item.created, 0) || 0;

  const totalDuplicated =
    result?.results?.reduce((sum, item) => sum + item.duplicated, 0) || 0;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
            <Newspaper size={22} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              RSS News Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Actualiza noticias desde fuentes RSS conectadas al pipeline NLP.
            </p>
          </div>
        </div>

        <button
          onClick={handleIngest}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Actualizando..." : "Actualizar RSS"}
        </button>
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 text-xs md:grid-cols-3">
          <div className="rounded-xl bg-slate-950/60 p-3">
            <p className="text-slate-500">Fuentes RSS</p>
            <p className="mt-1 text-lg font-bold text-white">
              {result.total_sources}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3">
            <p className="text-slate-500">Nuevas noticias</p>
            <p className="mt-1 text-lg font-bold text-emerald-300">
              {totalCreated}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3">
            <p className="text-slate-500">Duplicadas</p>
            <p className="mt-1 text-lg font-bold text-amber-300">
              {totalDuplicated}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMessage}
        </p>
      )}
    </article>
  );
}