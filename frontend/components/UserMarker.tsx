"use client";

import { MapMarker } from "@/components/map/MapCore";

interface UserMarkerProps {
  lat: number;
  lng: number;
}

export function UserMarker({ lat, lng }: UserMarkerProps) {
  return (
    <MapMarker longitude={lng} latitude={lat}>
      <div className="relative flex items-center justify-center" style={{ zIndex: 200 }}>
        <span
          className="absolute rounded-full animate-ping"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.15)",
            animationDuration: "2.5s",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            width: 28,
            height: 28,
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        />
        <div
          className="rounded-full border-2 border-white shadow-lg"
          style={{
            width: 16,
            height: 16,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 0 0 3px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.5)",
          }}
        />
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-white font-semibold whitespace-nowrap"
          style={{
            fontSize: "9px",
            backgroundColor: "rgba(10,10,10,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            letterSpacing: "0.05em",
          }}
        >
          VOCÊ
        </div>
      </div>
    </MapMarker>
  );
}
