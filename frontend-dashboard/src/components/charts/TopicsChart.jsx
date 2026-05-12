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

export default function TopicsChart() {
  const [data, setData] = useState([]);

    useEffect(() => {
      async function loadData() {
        try {
          const response = await getTopicsAnalytics();

          const formatted = Object.entries(response.topics || {}).map(
            ([topic, count]) => ({
              topic,
              posts: count,
            })
          );

          setData(formatted);
        } catch (error) {
          console.error("Error loading topics:", error);
        }
      }

      loadData();

      const interval = setInterval(loadData, 30000);

      return () => clearInterval(interval);
    }, []);
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Topics principales</h2>
      <p className="mb-6 text-sm text-slate-400">
        Temas con mayor volumen de conversación.
      </p>

      <div className="h-72">
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
      </div>
    </article>
  );
}
