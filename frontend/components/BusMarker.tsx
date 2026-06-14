"use client";

import { useState } from "react";
import { MapMarker } from "@/components/map/MapCore";
import type { BusWithLocation } from "@/types";
import { getTimeSince, formatSpeed } from "@/lib/utils";
import { Bus, Clock, Zap, MapPin } from "lucide-react";

interface BusMarkerProps {
  bus: BusWithLocation;
  isHighlighted?: boolean;
}

export function BusMarker({ bus, isHighlighted }: BusMarkerProps) {
  const [open, setOpen] = useState(false);

  if (!bus.location) return null;

  const eta = bus.eta;
  const etaMin = eta?.eta_minutes ?? null;

  return (
    <MapMarker longitude={bus.location.lng} latitude={bus.location.lat}>
      <div className="relative" style={{ zIndex: isHighlighted ? 100 : 10 }}>
        {/* Ping animation for active buses */}
        {bus.location.speed_kmh > 1 && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{
                backgroundColor: "#E8001D",
                animationDuration: "2s",
              }}
            />
          </span>
        )}

        {/* Bus Icon Button */}
        <button
          onClick={() => setOpen(!open)}
          className="relative flex items-center justify-center rounded-full border-2 shadow-2xl transition-all duration-200 hover:scale-110 focus:outline-none"
          style={{
            width: isHighlighted ? 44 : 36,
            height: isHighlighted ? 44 : 36,
            backgroundColor: "#E8001D",
            borderColor: isHighlighted ? "#fff" : "#1a1a1a",
            boxShadow: isHighlighted
              ? "0 0 0 3px #E8001D, 0 4px 20px rgba(232,0,29,0.5)"
              : "0 4px 12px rgba(0,0,0,0.5)",
          }}
          aria-label={`Ônibus ${bus.id}`}
        >
          <Bus
            size={isHighlighted ? 20 : 16}
            className="text-white"
            strokeWidth={2.5}
          />
          {/* ETA badge */}
          {etaMin !== null && etaMin <= 30 && (
            <div
              className="absolute -top-2 -right-2 rounded-full text-white font-bold flex items-center justify-center"
              style={{
                fontSize: "9px",
                minWidth: "18px",
                height: "18px",
                padding: "0 3px",
                backgroundColor: "#0A0A0A",
                border: "1.5px solid #E8001D",
              }}
            >
              {etaMin === 0 ? "1" : etaMin}m
            </div>
          )}
        </button>

        {/* Popup */}
        {open && (
          <div
            className="absolute bottom-full left-1/2 mb-3 w-52 rounded-xl border shadow-2xl overflow-hidden"
            style={{
              transform: "translateX(-50%)",
              backgroundColor: "#111111",
              borderColor: "#2A2A2A",
            }}
          >
            {/* Header */}
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: "#E8001D" }}
            >
              <Bus size={14} className="text-white" />
              <span className="text-white font-bold text-xs tracking-wide uppercase">
                {bus.line_name || bus.line_id}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-white/70 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-3 py-2.5 space-y-2">
              {bus.location.current_stop && (
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="mt-0.5 shrink-0" style={{ color: "#6B6B6B" }} />
                  <span className="text-xs" style={{ color: "#9B9B9B" }}>
                    {bus.location.current_stop}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Zap size={11} style={{ color: "#E8001D" }} />
                  <span className="text-xs" style={{ color: "#9B9B9B" }}>
                    {formatSpeed(bus.location.speed_kmh)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} style={{ color: "#6B6B6B" }} />
                  <span className="text-xs" style={{ color: "#6B6B6B" }}>
                    {getTimeSince(bus.location.updated_at)}
                  </span>
                </div>
              </div>

              {eta && (
                <div
                  className="rounded-lg px-3 py-1.5 flex items-center justify-between"
                  style={{ backgroundColor: "#1A1A1A" }}
                >
                  <span className="text-xs font-medium" style={{ color: "#9B9B9B" }}>
                    Chega em você em
                  </span>
                  <span className="text-sm font-bold" style={{ color: "#E8001D" }}>
                    {eta.eta_human}
                  </span>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div
              className="absolute left-1/2 bottom-0 translate-y-full -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: "7px solid #2A2A2A",
              }}
            />
          </div>
        )}
      </div>
    </MapMarker>
  );
}
