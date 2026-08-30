"use client";

import { ExternalLink, FileSearch } from "lucide-react";

export default function EvidenceList({ posts = [], title = "Evidence", empty = "No hay evidencia para este filtro." }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <FileSearch size={15} /> {title}
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span>{post.source || "unknown"}</span>
                {post.platform && <span>· {post.platform}</span>}
                {post.sentiment && <span>· {post.sentiment}</span>}
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-200">{post.title || "Sin título"}</p>
              {post.url && (
                <a href={post.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200">
                  Abrir fuente <ExternalLink size={12} />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
