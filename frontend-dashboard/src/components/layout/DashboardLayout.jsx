"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Globe2,
  LayoutDashboard,
  Map,
  Radio,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Live Feed",
    href: "/dashboard/live",
    icon: Radio,
  },
  {
    label: "Geo Intelligence",
    href: "/dashboard/geo",
    icon: Map,
  },
  {
    label: "Crisis",
    href: "/dashboard/crisis",
    icon: AlertTriangle,
  },
  {
    label: "Narratives",
    href: "/dashboard/narratives",
    icon: BrainCircuit,
  },
  {
    label: "Trends",
    href: "/dashboard/trends",
    icon: BarChart3,
  },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950/95 p-6 xl:block">
          <div className="mb-10">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Globe2 size={26} />
            </div>

            <h1 className="text-xl font-bold tracking-tight">
              Politycs
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Intelligence Platform
            </p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-300">
              <Activity size={16} />
              <span className="text-xs font-semibold uppercase">
                System
              </span>
            </div>

            <p className="text-sm font-medium text-white">
              Monitoring active
            </p>

            <p className="mt-1 text-xs text-slate-500">
              RSS · NLP · Geo · Crisis
            </p>
          </div>

          <button className="mt-6 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-white">
            <Settings size={18} />
            Settings
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}