"use client";

import { useState } from "react";
import type { BusWithLocation } from "@/types";
import { Bus, ChevronUp, ChevronDown, Clock, Navigation, RefreshCw } from "lucide-react";
import { formatSpeed } from "@/lib/utils";

interface ETAPanelProps {
  buses: BusWithLocation[];
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onBusFocus?: (bus: BusWithLocation) => void;
}

export function ETAPanel({
  buses,
  loading,
  lastUpdated,
  onRefresh,
  onBusFocus,
}: ETAPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort buses by ETA (closest first), then by buses without ETA
  const sorted = [...buses].sort((a, b) => {
    if (a.eta && b.eta) return a.eta.eta_seconds - b.eta.eta_seconds;
    if (a.eta) return -1;
    if (b.eta) return 1;
    return 0;
  });

  const visibleBuses = expanded ? sorted : sorted.slice(0, 3);
  const closestBus = sorted[0];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%)",
        border: "1px solid #1F1F1F",
        borderBottom: "none",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {/* Drag Handle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full pt-3 pb-1 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
        aria-label={expanded ? "Recolher painel" : "Expandir painel"}
      >
        <div
          className="w-10 h-1 rounded-full"
          style={{ backgroundColor: "#2A2A2A" }}
        />
        {expanded ? (
          <ChevronDown size={14} style={{ color: "#4A4A4A" }} />
        ) : (
          <ChevronUp size={14} style={{ color: "#4A4A4A" }} />
        )}
      </button>

      {/* Header row */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-base tracking-tight">
            Ônibus próximos
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#E8001D" }}
            />
            <span className="text-xs" style={{ color: "#5A5A5A" }}>
              {lastUpdated ? `Atualizado ${formatTime(lastUpdated)}` : "Carregando..."}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:opacity-80 active:scale-95"
          style={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #2A2A2A",
          }}
        >
          <RefreshCw
            size={13}
            style={{ color: "#6B6B6B" }}
            className={loading ? "animate-spin" : ""}
          />
          <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>
            Atualizar
          </span>
        </button>
      </div>

      {/* Nearest bus highlight */}
      {closestBus?.eta && !loading && (
        <div className="mx-4 mb-3">
          <button
            onClick={() => onBusFocus?.(closestBus)}
            className="w-full rounded-2xl p-3 text-left transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, #E8001D 0%, #C0001A 100%)",
              boxShadow: "0 4px 20px rgba(232,0,29,0.25)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(0,0,0,0.2)",
                  }}
                >
                  <Bus size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {closestBus.line_name || closestBus.line_id}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {closestBus.location?.current_stop || "Em rota"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-xl leading-none">
                  {closestBus.eta.eta_minutes === 0
                    ? "< 1"
                    : closestBus.eta.eta_minutes}
                </p>
                <p className="text-white/70 text-xs">min</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Bus list */}
      <div className="px-4 pb-6 space-y-2">
        {loading && buses.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#E8001D", borderTopColor: "transparent" }}
            />
          </div>
        ) : visibleBuses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: "#4A4A4A" }}>
              Nenhum ônibus encontrado
            </p>
          </div>
        ) : (
          visibleBuses.slice(closestBus?.eta ? 1 : 0).map((bus) => (
            <BusListItem
              key={bus.id}
              bus={bus}
              onFocus={() => onBusFocus?.(bus)}
            />
          ))
        )}

        {/* Show more / less */}
        {sorted.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "#E8001D" }}
          >
            {expanded
              ? "Ver menos"
              : `Ver mais ${sorted.length - 3} ônibus`}
          </button>
        )}
      </div>
    </div>
  );
}

function BusListItem({
  bus,
  onFocus,
}: {
  bus: BusWithLocation;
  onFocus: () => void;
}) {
  return (
    <button
      onClick={onFocus}
      className="w-full rounded-xl px-3 py-2.5 flex items-center gap-3 text-left transition-all hover:opacity-80 active:scale-[0.99]"
      style={{
        backgroundColor: "#141414",
        border: "1px solid #1F1F1F",
      }}
    >
      {/* Bus icon */}
      <div
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{
          width: 36,
          height: 36,
          backgroundColor: "rgba(232,0,29,0.12)",
          border: "1px solid rgba(232,0,29,0.2)",
        }}
      >
        <Bus size={16} style={{ color: "#E8001D" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">
          {bus.line_name || bus.line_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {bus.location?.current_stop && (
            <p className="text-xs truncate" style={{ color: "#5A5A5A" }}>
              {bus.location.current_stop}
            </p>
          )}
          {bus.location && bus.location.speed_kmh > 0 && (
            <span className="text-xs shrink-0" style={{ color: "#3A3A3A" }}>
              · {formatSpeed(bus.location.speed_kmh)}
            </span>
          )}
        </div>
      </div>

      {/* ETA or navigation */}
      <div className="shrink-0 text-right">
        {bus.eta ? (
          <>
            <div className="flex items-center gap-1 justify-end">
              <Clock size={10} style={{ color: "#6B6B6B" }} />
              <p
                className="text-sm font-bold"
                style={{ color: "#E8001D" }}
              >
                {bus.eta.eta_minutes === 0 ? "<1" : bus.eta.eta_minutes}
                <span className="text-xs font-normal ml-0.5" style={{ color: "#6B6B6B" }}>
                  min
                </span>
              </p>
            </div>
          </>
        ) : (
          <Navigation size={14} style={{ color: "#3A3A3A" }} />
        )}
      </div>
    </button>
  );
}
