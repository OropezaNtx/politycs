"use client";

import { useEffect, useState } from "react";
import SourceFilter from "@/components/filters/SourceFilter";
import GeoMap from "@/components/geo/GeoMap";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KpiGrid from "@/components/dashboard/KpiGrid";
import SentimentChart from "@/components/charts/SentimentChart";
import TopicsChart from "@/components/charts/TopicsChart";
import TrendsChart from "@/components/charts/TrendsChart";
import TimelineChart from "@/components/charts/TimelineChart";
import RelevantPostsFeed from "@/components/feed/RelevantPostsFeed";
import GeoIntelligenceCard from "@/components/geo/GeoIntelligenceCard";
import { getHealth } from "@/services/api";
import PlatformSummaryCard from "@/components/intelligence/PlatformSummaryCard";
import LiveIntelligenceFeed from "@/components/live/LiveIntelligenceFeed";
import CrisisDetectionPanel from "@/components/crisis/CrisisDetectionPanel";
import EmergingTopicsPanel from "@/components/temporal/EmergingTopicsPanel";
import IntelligenceAlertBar from "@/components/intelligence/IntelligenceAlertBar";
import NarrativeIntelligencePanel from "@/components/narratives/NarrativeIntelligencePanel";

import RssControls from "@/components/actions/RssControls";

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState("Conectando...");

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
          <SourceFilter />
        </div>
        <IntelligenceAlertBar />
        <RssControls />
        <PlatformSummaryCard />
        <CrisisDetectionPanel />
        <NarrativeIntelligencePanel />
        <LiveIntelligenceFeed />
        <EmergingTopicsPanel />
        <GeoIntelligenceCard />
        <GeoMap />
        <KpiGrid />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SentimentChart />
          <TopicsChart />
        </div>

        <TimelineChart />

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
