"use client";

import { useEffect, useState } from "react";
import { Activity, ExternalLink } from "lucide-react";

import { getRecentPosts } from "@/services/api";
import { useSource } from "@/context/SourceContext";

function getSentimentStyle(sentiment) {
  if (sentiment === "negative") {
    return "bg-red-500/10 text-red-300";
  }

  if (sentiment === "positive") {
    return "bg-emerald-500/10 text-emerald-300";
  }

  return "bg-slate-700 text-slate-300";
}

export default function LiveIntelligenceFeed() {
  const [posts, setPosts] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadRecentPosts() {
      try {
        const response = await getRecentPosts(source);
        setPosts(response.posts || []);
      } catch (error) {
        console.error("Error loading recent posts:", error);
        setPosts([]);
      }
    }

    loadRecentPosts();

    const interval = setInterval(loadRecentPosts, 30000);

    window.addEventListener("rss-updated", loadRecentPosts);

    return () => {
      clearInterval(interval);
      window.removeEventListener("rss-updated", loadRecentPosts);
    };
  }, [source]);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Live Intelligence Feed
          </h2>
          <p className="text-sm text-slate-400">
            Últimas señales detectadas en fuentes públicas.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
          <Activity size={22} />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
          No hay señales recientes para esta fuente.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                  {post.source || "unknown"}
                </span>

                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                  {post.platform || "unknown"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs ${getSentimentStyle(
                    post.sentiment
                  )}`}
                >
                  {post.sentiment || "unknown"}
                </span>

                {post.political_score > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    political {post.political_score.toFixed(2)}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-medium leading-relaxed text-white">
                {post.title}
              </h3>

              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Abrir fuente <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}