"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getTopicsAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

export default function TopicsChart() {
  const [data, setData] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getTopicsAnalytics(source);
        const topics = response.topics || {};

        const formatted = Object.entries(topics)
          .map(([topic, posts]) => ({
            topic,
            posts,
          }))
          .sort((a, b) => b.posts - a.posts)
          .slice(0, 8);

        setData(formatted);
      } catch (error) {
        console.error("Error loading topics:", error);
        setData([]);
      }
    }

    loadData();

    window.addEventListener("rss-updated", loadData);

    return () => {
      window.removeEventListener("rss-updated", loadData);
    };
  }, [source]);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Topics principales</h2>
      <p className="mb-6 text-sm text-slate-400">
        Temas con mayor volumen de conversación.
      </p>

      <div className="h-72 min-h-72 min-w-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No hay topics para esta fuente.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="topic" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="posts" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}