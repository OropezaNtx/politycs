import Link from "next/link";
import { BarChart3, Home, Radio, Settings, ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-800 bg-slate-950/95 p-6 lg:block">
        <div className="mb-10">
          <h2 className="text-2xl font-bold">Politycs</h2>
          <p className="text-sm text-slate-400">Intelligence Platform</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-cyan-500/10 px-4 py-3 text-cyan-300"
          >
            <BarChart3 size={20} />
            Dashboard
          </Link>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900"
          >
            <Home size={20} />
            Inicio
          </Link>

          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500">
            <Radio size={20} />
            Monitoreo
          </div>

          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500">
            <ShieldCheck size={20} />
            Riesgo político
          </div>

          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500">
            <Settings size={20} />
            Configuración
          </div>
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Proyecto</p>
              <h1 className="font-semibold">Politycs Dashboard</h1>
            </div>

            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
              Backend Ready
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">{children}</div>
      </section>
    </main>
  );
}
