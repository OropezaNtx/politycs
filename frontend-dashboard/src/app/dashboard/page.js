"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import KpiGrid from "@/components/dashboard/KpiGrid";

import SentimentChart from "@/components/charts/SentimentChart";
import TopicsChart from "@/components/charts/TopicsChart";
import TrendsChart from "@/components/charts/TrendsChart";
import TimelineChart from "@/components/charts/TimelineChart";

import RelevantPostsFeed from "@/components/feed/RelevantPostsFeed";

import RssControls from "@/components/actions/RssControls";

import GeoIntelligenceCard from "@/components/geo/GeoIntelligenceCard";
import GeoMap from "@/components/geo/GeoMap";

import PlatformSummaryCard from "@/components/intelligence/PlatformSummaryCard";
import IntelligenceAlertBar from "@/components/intelligence/IntelligenceAlertBar";

import LiveIntelligenceFeed from "@/components/live/LiveIntelligenceFeed";

import CrisisDetectionPanel from "@/components/crisis/CrisisDetectionPanel";

import NarrativeIntelligencePanel from "@/components/narratives/NarrativeIntelligencePanel";

import EmergingTopicsPanel from "@/components/temporal/EmergingTopicsPanel";

import { getHealth } from "@/services/api";
import LiveMetricsHeader from "@/components/header/LiveMetricsHeader";


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
            Centro de monitoreo de conversación pública, medios, narrativas, riesgo y territorio.
          </p>

          <div className="mt-4 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            {backendStatus}
          </div>
        </div>
        
        <LiveMetricsHeader />
        <IntelligenceAlertBar />

        <RssControls />

        <KpiGrid />

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <div className="2xl:col-span-2">
            <GeoMap />
          </div>

          <CrisisDetectionPanel />
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <NarrativeIntelligencePanel />
          <EmergingTopicsPanel />
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <PlatformSummaryCard />
          <GeoIntelligenceCard />
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <LiveIntelligenceFeed />
          <RelevantPostsFeed />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SentimentChart />
          <TopicsChart />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TrendsChart />
          <TimelineChart />
        </div>
      </section>
    </DashboardLayout>
  );
}
