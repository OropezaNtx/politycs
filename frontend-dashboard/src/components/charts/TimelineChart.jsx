"use client";

import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getTimelineAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

function formatTrendsResponse(response) {
  if (Array.isArray(response)) {
    return response.map((item) => ({
      hour: item.hour || "N/A",
      posts: item.count || 0,
    }));
  }

  if (!response?.trends) {
    return [];
  }

  return Object.entries(response.trends).map(([date, topics]) => {
    const total = Object.values(topics).reduce((sum, value) => sum + value, 0);

    return {
      hour: date,
      posts: total,
    };
  });
}

export default function TimelineChart() {
  const [data, setData] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getTimelineAnalytics(source);
        const formatted = formatTrendsResponse(response);
        setData(formatted);
      } catch (error) {
        console.error("Error loading timeline:", error);
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
      <h2 className="text-lg font-semibold text-white">
        Timeline de actividad
      </h2>

      <p className="mb-6 text-sm text-slate-400">
        Actividad de conversación agrupada por día.
      </p>

      <div className="h-80 min-h-80 min-w-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No hay actividad registrada para esta fuente.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#1e293b" />

              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />

              <YAxis stroke="#94a3b8" fontSize={12} />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="posts"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}