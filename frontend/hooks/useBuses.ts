"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchBuses, fetchBusLocation, fetchBusETA } from "@/lib/api";
import type { Bus, BusWithLocation } from "@/types";

// Configurável via NEXT_PUBLIC_POLL_INTERVAL (em segundos). Padrão: 3s.
const POLL_INTERVAL =
  Number(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? 3) * 1000;

export function useBuses(userLat: number | null, userLng: number | null) {
  const [buses, setBuses] = useState<BusWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const busList: Bus[] = await fetchBuses();

      const busesWithData = await Promise.all(
        busList.map(async (bus) => {
          const [location, eta] = await Promise.allSettled([
            fetchBusLocation(bus.id),
            userLat && userLng
              ? fetchBusETA(bus.id, userLat, userLng)
              : Promise.resolve(null),
          ]);

          return {
            ...bus,
            location:
              location.status === "fulfilled" ? location.value : undefined,
            eta:
              eta.status === "fulfilled" && eta.value ? eta.value : undefined,
          } as BusWithLocation;
        })
      );

      // Only include buses with known location
      setBuses(busesWithData.filter((b) => b.location != null));
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { buses, loading, error, lastUpdated, refresh: fetchAll };
}
