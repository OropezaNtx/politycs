import { Activity, AlertTriangle, MessageSquareText, TrendingUp } from "lucide-react";

const kpis = [
  {
    title: "Total posts",
    value: "1,248",
    detail: "Posts procesados",
    icon: MessageSquareText,
  },
  {
    title: "Posts políticos",
    value: "486",
    detail: "Contenido clasificado",
    icon: Activity,
  },
  {
    title: "Negativos",
    value: "132",
    detail: "Sentimiento crítico",
    icon: AlertTriangle,
  },
  {
    title: "Topic principal",
    value: "Seguridad",
    detail: "Tema más mencionado",
    icon: TrendingUp,
  },
];

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                <Icon size={22} />
              </div>
              <span className="text-xs text-emerald-300">Mock data</span>
            </div>

            <p className="text-sm text-slate-400">{item.title}</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{item.value}</h3>
            <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
          </article>
        );
      })}
    </div>
  );
}
