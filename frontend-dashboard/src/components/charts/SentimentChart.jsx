"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { getSentimentAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

const COLORS = ["#ef4444", "#38bdf8", "#22c55e", "#a855f7"];

export default function SentimentChart() {
  const [data, setData] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getSentimentAnalytics(source);

        const formatted = Object.entries(response.sentiment || {}).map(
          ([name, value]) => ({
            name,
            value,
          })
        );

        setData(formatted);
      } catch (error) {
        console.error("Error loading sentiment:", error);
      }
    }

    loadData();

    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, [source]);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Sentimiento</h2>
      <p className="mb-6 text-sm text-slate-400">
        Distribución general de sentimiento.
      </p>

      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No hay datos de sentimiento para esta fuente.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}