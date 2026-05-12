"use client";

import { useEffect, useState } from "react";
import { getTopPoliticalPosts } from "@/services/api";

function normalizeArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.posts)) return response.posts;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export default function RelevantPostsFeed() {
  const [posts, setPosts] = useState([]);

    useEffect(() => {
      async function loadPosts() {
        try {
          const response = await getTopPoliticalPosts();
          setPosts(normalizeArray(response));
        } catch (error) {
          console.error("Error loading posts:", error);
        }
      }

      loadPosts();

      const interval = setInterval(loadPosts, 30000);

      return () => clearInterval(interval);
    }, []);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Posts relevantes</h2>
      <p className="mb-6 text-sm text-slate-400">
        Contenido priorizado por score político.
      </p>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">No hay posts disponibles.</p>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id || index}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {post.source || post.platform || "unknown"}
                </span>

                <span className="text-xs text-cyan-300">
                  Score {post.political_score ?? post.score ?? 0}
                </span>
              </div>

              <h3 className="text-sm font-medium text-white leading-relaxed">
                {post.title || post.raw_content || post.content || "Sin título"}
              </h3>

              <p className="mt-3 text-xs text-slate-500">
                Sentimiento:{" "}
                <span className="text-slate-300">
                  {post.sentiment || "N/A"}
                </span>
              </p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
