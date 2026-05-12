"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Positivo", value: 320 },
  { name: "Neutral", value: 796 },
  { name: "Negativo", value: 132 },
];

const COLORS = ["#22c55e", "#38bdf8", "#ef4444"];

export default function SentimentChart() {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Sentimiento</h2>
      <p className="mb-6 text-sm text-slate-400">
        Distribución general de sentimiento.
      </p>

      <div className="h-72">
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
                <Cell key={entry.name} fill={COLORS[index]} />
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
      </div>
    </article>
  );
}
