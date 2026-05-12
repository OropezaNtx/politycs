"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Lun", posts: 120, political: 40 },
  { day: "Mar", posts: 180, political: 72 },
  { day: "Mié", posts: 150, political: 61 },
  { day: "Jue", posts: 260, political: 130 },
  { day: "Vie", posts: 230, political: 112 },
  { day: "Sáb", posts: 170, political: 74 },
  { day: "Dom", posts: 210, political: 95 },
];

export default function TrendsChart() {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">
        Tendencia semanal
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        Evolución de conversación total y política.
      </p>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
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
              dataKey="posts"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="political"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.18}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
