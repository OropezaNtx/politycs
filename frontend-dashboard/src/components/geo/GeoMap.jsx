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


function getMarkerColor(location) {
  const sentiment = location.sentiment || {};

  const negative = sentiment.negative || 0;

  const total = Object.values(sentiment)
    .reduce((sum, value) => sum + value, 0);

  const ratio =
    total > 0
      ? negative / total
      : 0;

  if (ratio >= 0.50) {
    return "#ef4444";
  }

  if (ratio >= 0.25) {
    return "#f59e0b";
  }

  return "#22c55e";
}


function getRiskLabel(location) {
  const sentiment = location.sentiment || {};

  const negative = sentiment.negative || 0;

  const total = Object.values(sentiment)
    .reduce((sum, value) => sum + value, 0);

  const ratio =
    total > 0
      ? negative / total
      : 0;

  if (ratio >= 0.50) {
    return "Alto";
  }

  if (ratio >= 0.25) {
    return "Medio";
  }

  return "Bajo";
}


export default function GeoMap() {

  const [locations, setLocations] = useState([]);

  const { source } = useSource();


  useEffect(() => {

    async function loadGeoData() {

      try {

        const response =
          await getGeoAnalytics(source);

        setLocations(
          response.locations || []
        );

      } catch (error) {

        console.error(
          "Error loading geo map:",
          error
        );

        setLocations([]);
      }

    }

    loadGeoData();

    window.addEventListener(
      "rss-updated",
      loadGeoData
    );

    return () => {

      window.removeEventListener(
        "rss-updated",
        loadGeoData
      );

    };

  }, [source]);


  return (

    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">

      <div className="mb-5">

        <h2 className="text-lg font-semibold text-white">

          Mapa Inteligente Territorial

        </h2>

        <p className="text-sm text-slate-400">

          Riesgo geográfico basado en conversación pública.

        </p>

      </div>


      <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-800">

        <MapContainer
          center={[19.4326, -99.1332]}
          zoom={9}
          scrollWheelZoom={true}
          className="h-full w-full"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {locations.map((location) => (

            <CircleMarker

              key={location.key}

              center={[
                location.lat,
                location.lng
              ]}

              radius={
                Math.max(
                  8,
                  Math.min(
                    location.total_mentions * 4,
                    35
                  )
                )
              }

              pathOptions={{

                color:
                  getMarkerColor(location),

                fillColor:
                  getMarkerColor(location),

                fillOpacity:0.40,

              }}

            >

              <Popup>

                <div className="space-y-2">

                  <div>

                    <strong>

                      {location.label}

                    </strong>

                  </div>

                  <div>

                    Estado:

                    {" "}

                    {location.state}

                  </div>

                  <div>

                    Menciones:

                    {" "}

                    {location.total_mentions}

                  </div>

                  <div>

                    Riesgo:

                    {" "}

                    <strong>

                      {getRiskLabel(location)}

                    </strong>

                  </div>

                  <hr />

                  <div>

                    Negativas:

                    {" "}

                    {location.sentiment?.negative || 0}

                  </div>

                  <div>

                    Positivas:

                    {" "}

                    {location.sentiment?.positive || 0}

                  </div>

                  <div>

                    Neutrales:

                    {" "}

                    {location.sentiment?.neutral || 0}

                  </div>

                </div>

              </Popup>

            </CircleMarker>

          ))}

        </MapContainer>

      </div>


      <div className="mt-4 flex flex-wrap gap-4 text-xs">

        <div className="flex items-center gap-2">

          <div className="h-3 w-3 rounded-full bg-green-500"></div>

          Riesgo bajo

        </div>

        <div className="flex items-center gap-2">

          <div className="h-3 w-3 rounded-full bg-amber-500"></div>

          Riesgo medio

        </div>

        <div className="flex items-center gap-2">

          <div className="h-3 w-3 rounded-full bg-red-500"></div>

          Riesgo alto

        </div>

      </div>

    </article>

  );

}