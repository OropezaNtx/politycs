"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import KpiGrid from "@/components/dashboard/KpiGrid";
import SentimentChart from "@/components/charts/SentimentChart";
import TopicsChart from "@/components/charts/TopicsChart";
import TrendsChart from "@/components/charts/TrendsChart";
import RelevantPostsFeed from "@/components/feed/RelevantPostsFeed";

import { getHealth } from "@/services/api";

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState("Conectando...");

  useEffect(() => {
    async function testConnection() {
      try {
        const data = await getHealth();

        console.log("Backend response:", data);

        setBackendStatus("Backend conectado");
      } catch (error) {
        console.error(error);

        setBackendStatus("Error de conexión");
      }
    }

    testConnection();
  }, []);

  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-cyan-400 font-medium">
            Dashboard general
          </p>

          <h1 className="text-3xl font-bold text-white">
            Politycs Intelligence Overview
          </h1>

          <p className="mt-2 text-slate-400">
            Resumen visual de conversación pública, sentimiento, temas y posts
            relevantes.
          </p>

          <div className="mt-4 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            {backendStatus}
          </div>
        </div>

        <KpiGrid />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SentimentChart />
          <TopicsChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TrendsChart />
          </div>

          <RelevantPostsFeed />
        </div>
      </section>
    </DashboardLayout>
  );
}
