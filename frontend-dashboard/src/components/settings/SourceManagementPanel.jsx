"use client";

import { useEffect, useState } from "react";
import { Database, Radio, RefreshCw } from "lucide-react";

import {
  getAvailableSources,
  getConfiguredRssFeeds,
  ingestRssNews,
} from "@/services/api";

function formatName(value) {
  const labels = {
    rss_news: "RSS News",
    hacker_news: "Hacker News",
    reddit: "Reddit",
    facebook: "Facebook",
    collector: "Collector",
    google_news_mexico: "Google News México",
    google_news_politica_mexico: "Google News Política México",
    bbc_mundo: "BBC Mundo",
    news_site: "News Site",
    social: "Social",
  };

  return labels[value] || value;
}

export default function SourceManagementPanel() {
  const [data, setData] = useState(null);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [updatingRss, setUpdatingRss] = useState(false);

  async function loadSources() {
    setLoadingSources(true);

    try {
      const response = await getAvailableSources();
      setData(response);
    } catch (error) {
      console.error("Error loading sources:", error);
      setData(null);
    } finally {
      setLoadingSources(false);
    }
  }

  async function handleRefreshRss() {
    setUpdatingRss(true);

    try {
      await ingestRssNews();
      await loadSources();

      window.dispatchEvent(new Event("rss-updated"));
    } catch (error) {
      console.error("Error refreshing RSS:", error);
    } finally {
      setUpdatingRss(false);
    }
  }

  async function loadConfiguredRssFeeds() {
    try {
      const response = await getConfiguredRssFeeds();
      setRssFeeds(response.feeds || []);
    } catch (error) {
      console.error("Error loading configured RSS feeds:", error);
      setRssFeeds([]);
    }
  }

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadSources();
      void loadConfiguredRssFeeds();
    }, 0);
    const handleRssUpdated = () => {
      void loadSources();
    };

    window.addEventListener("rss-updated", handleRssUpdated);

    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener("rss-updated", handleRssUpdated);
    };
  }, []);

  const sources = data?.sources || [];
  const platforms = data?.platforms || [];

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Fuentes conectadas
            </h2>

            <p className="text-sm text-slate-400">
              Estado general de fuentes y plataformas activas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadSources}
              disabled={loadingSources}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loadingSources ? "animate-spin" : ""}
              />
              Recargar
            </button>

            <button
              onClick={handleRefreshRss}
              disabled={updatingRss}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={updatingRss ? "animate-spin" : ""}
              />
              Actualizar RSS
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-950/60 p-4">
            <div className="mb-3 text-cyan-300">
              <Database size={20} />
            </div>

            <p className="text-xs text-slate-500">
              Total posts
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {data?.total_posts || 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4">
            <div className="mb-3 text-purple-300">
              <Radio size={20} />
            </div>

            <p className="text-xs text-slate-500">
              Fuentes
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {sources.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4">
            <div className="mb-3 text-emerald-300">
              <Radio size={20} />
            </div>

            <p className="text-xs text-slate-500">
              Plataformas
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {platforms.length}
            </p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Sources
          </h2>

          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {formatName(source.name)}
                  </p>

                  <p className="text-xs text-slate-500">
                    {source.name}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {source.total_posts} posts
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Platforms
          </h2>

          <div className="space-y-3">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {formatName(platform.name)}
                  </p>

                  <p className="text-xs text-slate-500">
                    {platform.name}
                  </p>
                </div>

                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                  {platform.total_posts} posts
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-semibold text-white">
          RSS Feeds configurados
        </h2>

        {rssFeeds.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
            No hay feeds RSS configurados.
          </div>
        ) : (
          <div className="space-y-3">
            {rssFeeds.map((feed) => (
              <div
                key={feed.source}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {formatName(feed.source)}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {feed.url}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Región: {feed.region || "N/A"} · País: {feed.country || "N/A"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      feed.enabled
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {feed.enabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
