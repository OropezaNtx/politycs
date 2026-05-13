"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getTrendsAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

export default function TrendsChart() {
  const [data, setData] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getTrendsAnalytics(source);

        const formatted = Object.entries(response.trends || {}).map(
          ([date, topics]) => ({
            date,
            total: Object.values(topics).reduce(
              (sum, value) => sum + value,
              0
            ),
            seguridad: topics.seguridad || 0,
            agua: topics.agua || 0,
            corrupcion: topics.corrupcion || 0,
            transporte: topics.transporte || 0,
            general: topics.general || 0,
          })
        );

        setData(formatted);
      } catch (error) {
        console.error("Error loading trends:", error);
      }
    }

    loadData();

    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, [source]);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Tendencias</h2>
      <p className="mb-6 text-sm text-slate-400">
        Evolución diaria de conversación detectada.
      </p>

      <div className="h-80 min-h-80 min-w-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No hay datos de tendencias para esta fuente.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}