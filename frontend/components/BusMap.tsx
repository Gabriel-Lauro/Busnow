"use client";

import { useState, useCallback } from "react";
import { Map, MapControls, FlyTo } from "@/components/map/MapCore";
import { BusMarker } from "@/components/BusMarker";
import { UserMarker } from "@/components/UserMarker";
import { ETAPanel } from "@/components/ETAPanel";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBuses } from "@/hooks/useBuses";
import type { BusWithLocation } from "@/types";
import { MapPin, AlertCircle } from "lucide-react";

export function BusMap() {
  const { lat, lng, loading: geoLoading } = useGeolocation();
  const { buses, loading, error, lastUpdated, refresh } = useBuses(lat, lng);
  const [focusedBus, setFocusedBus] = useState<BusWithLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Default center: user location or Muzambinho/MG
  const mapCenter: [number, number] = lng && lat ? [lng, lat] : [-46.525, -21.37];

  const handleBusFocus = useCallback((bus: BusWithLocation) => {
    setFocusedBus(bus);
    if (bus.location) {
      setFlyTarget([bus.location.lng, bus.location.lat]);
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <Map center={mapCenter} zoom={13} className="absolute inset-0">
        <MapControls />

        {/* Fly to focused bus */}
        {flyTarget && <FlyTo center={flyTarget} zoom={15} />}

        {/* User location */}
        {lat && lng && !geoLoading && (
          <UserMarker lat={lat} lng={lng} />
        )}

        {/* Bus markers */}
        {buses.map((bus) => (
          <BusMarker
            key={bus.id}
            bus={bus}
            isHighlighted={focusedBus?.id === bus.id}
          />
        ))}
      </Map>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-safe-top pt-5 pb-3 flex items-center justify-between pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.9) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E8001D" }}
          >
            <span className="text-white font-black text-xs">BN</span>
          </div>
          <div>
            <h1 className="text-white font-black text-base tracking-tight leading-none">
              BusNow
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#5A5A5A" }}>
              {buses.length} {buses.length === 1 ? "ônibus" : "ônibus"} em rota
            </p>
          </div>
        </div>

        {/* GPS indicator */}
        {lat && lng && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 pointer-events-auto"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              border: "1px solid #1F1F1F",
            }}
          >
            <MapPin size={12} style={{ color: "#E8001D" }} />
            <span className="text-xs font-medium" style={{ color: "#9B9B9B" }}>
              GPS ativo
            </span>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="absolute top-20 left-4 right-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{
            backgroundColor: "rgba(30,10,10,0.95)",
            border: "1px solid rgba(232,0,29,0.3)",
          }}
        >
          <AlertCircle size={14} style={{ color: "#E8001D" }} />
          <p className="text-xs" style={{ color: "#CC6666" }}>
            {error}
          </p>
        </div>
      )}

      {/* Bottom ETA Panel */}
      <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 10 }}>
        <ETAPanel
          buses={buses}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          onBusFocus={handleBusFocus}
        />
      </div>
    </div>
  );
}
