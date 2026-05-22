"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { getGeoAnalytics } from "@/services/api";
import { useSource } from "@/context/SourceContext";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function GeoMap() {
  const [locations, setLocations] = useState([]);
  const { source } = useSource();

  useEffect(() => {
    async function loadGeoData() {
      try {
        const response = await getGeoAnalytics(source);
        setLocations(response.locations || []);
      } catch (error) {
        console.error("Error loading geo map:", error);
        setLocations([]);
      }
    }

    loadGeoData();

    window.addEventListener("rss-updated", loadGeoData);

    return () => {
      window.removeEventListener("rss-updated", loadGeoData);
    };
  }, [source]);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Mapa de actividad</h2>
      <p className="mb-6 text-sm text-slate-400">
        Zonas detectadas por menciones en fuentes públicas.
      </p>

      <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-800">
        <MapContainer
          center={[19.4326, -99.1332]}
          zoom={9}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {locations.map((location) => (
            <CircleMarker
              key={location.key}
              center={[location.lat, location.lng]}
              radius={Math.max(8, Math.min(location.total_mentions * 4, 35))}
              pathOptions={{
                color: "#06b6d4",
                fillColor: "#06b6d4",
                fillOpacity: 0.35,
              }}
            >
              <Popup>
                <strong>{location.label}</strong>
                <br />
                {location.total_mentions} menciones
                <br />
                {location.state}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </article>
  );
}