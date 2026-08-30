"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Radio, TrendingUp } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import KpiGrid from "@/components/dashboard/KpiGrid";
import RssControls from "@/components/actions/RssControls";
import GeoMap from "@/components/geo/GeoMap";
import PlatformSummaryCard from "@/components/intelligence/PlatformSummaryCard";
import IntelligenceAlertBar from "@/components/intelligence/IntelligenceAlertBar";
import IntelligenceBriefPanel from "@/components/intelligence/IntelligenceBriefPanel";
import LiveMetricsHeader from "@/components/header/LiveMetricsHeader";
import CrisisDetectionPanel from "@/components/crisis/CrisisDetectionPanel";
import NarrativeIntelligencePanel from "@/components/narratives/NarrativeIntelligencePanel";
import EmergingTopicsPanel from "@/components/temporal/EmergingTopicsPanel";
import { useProject } from "@/context/ProjectContext";
import { getHealth } from "@/services/api";

const workspaces = [
  { href: "/dashboard/crisis", label: "Crisis Intelligence", description: "Riesgo explicable y evidencia", icon: AlertTriangle, tone: "text-red-300" },
  { href: "/dashboard/geo", label: "Geo Intelligence", description: "Concentración territorial", icon: MapPin, tone: "text-cyan-300" },
  { href: "/dashboard/trends", label: "Temporal Intelligence", description: "Aceleración contra baseline", icon: TrendingUp, tone: "text-amber-300" },
  { href: "/dashboard/live", label: "Live Evidence", description: "Posts del alcance activo", icon: Radio, tone: "text-emerald-300" },
];

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState("Conectando...");
  const { activeProject } = useProject();

  useEffect(() => {
    async function testConnection() {
      try {
        await getHealth();
        setBackendStatus("Backend conectado");
      } catch (error) {
        console.error(error);
        setBackendStatus("Error de conexión");
      }
    }
    testConnection();
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-medium text-cyan-400">Executive Overview</p>
          <h1 className="text-3xl font-bold text-white">Politycs Intelligence Center</h1>
          <p className="mt-2 text-slate-400">Resumen ejecutivo de conversación pública, medios, narrativas, riesgo y territorio.</p>
          <div className="mt-4 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">{backendStatus}</div>
        </div>

        <IntelligenceBriefPanel />

        {activeProject && (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {workspaces.map((workspace) => {
              const Icon = workspace.icon;
              return (
                <Link key={workspace.href} href={workspace.href} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900">
                  <Icon size={19} className={workspace.tone} />
                  <p className="mt-3 font-medium text-white">{workspace.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{workspace.description}</p>
                </Link>
              );
            })}
          </div>
        )}

        <details open={!activeProject} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">
            {activeProject ? "Ver métricas operativas globales (fuera del filtro del proyecto)" : "System-wide operational intelligence"}
          </summary>
          <div className="mt-6 space-y-8">
            <LiveMetricsHeader />
            <IntelligenceAlertBar />
            <RssControls />
            <KpiGrid />
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
              <div className="2xl:col-span-2"><GeoMap /></div>
              <CrisisDetectionPanel />
            </div>
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <NarrativeIntelligencePanel />
              <EmergingTopicsPanel />
            </div>
            <PlatformSummaryCard />
          </div>
        </details>
      </section>
    </DashboardLayout>
  );
}
