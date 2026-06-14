"use client";

import {
  useEffect,
  useRef,
  createContext,
  useContext,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Context ─────────────────────────────────────────────────────────────────

interface MapContextValue {
  map: maplibregl.Map | null;
}

const MapContext = createContext<MapContextValue>({ map: null });

export function useMap() {
  return useContext(MapContext);
}

// ─── Map ─────────────────────────────────────────────────────────────────────

interface MapProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onLoad?: (map: maplibregl.Map) => void;
}

export function Map({
  center,
  zoom = 13,
  children,
  className = "",
  style,
  onLoad,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
      onLoad?.(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MapContext.Provider value={{ map: mapReady ? mapRef.current : null }}>
      <div
        ref={containerRef}
        className={`relative w-full h-full ${className}`}
        style={style}
      />
      {mapReady && children}
    </MapContext.Provider>
  );
}

// ─── MapMarker ────────────────────────────────────────────────────────────────

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children: ReactNode;
  anchor?: maplibregl.PositionAnchor;
}

export function MapMarker({
  longitude,
  latitude,
  children,
  anchor = "center",
}: MapMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const elRef = useRef<HTMLDivElement>(document.createElement("div"));

  useEffect(() => {
    if (!map) return;

    const marker = new maplibregl.Marker({
      element: elRef.current,
      anchor,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, anchor]);

  // Update position when coords change
  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  // Render children into the marker element via a portal-like approach
  return (
    <MarkerPortal element={elRef.current}>{children}</MarkerPortal>
  );
}

// ─── MarkerPortal ─────────────────────────────────────────────────────────────

import { createPortal } from "react-dom";

function MarkerPortal({
  element,
  children,
}: {
  element: HTMLElement;
  children: ReactNode;
}) {
  return createPortal(children, element);
}

// ─── MapControls ─────────────────────────────────────────────────────────────

export function MapControls() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const nav = new maplibregl.NavigationControl({ showCompass: false });
    map.addControl(nav, "bottom-right");

    return () => {
      map.removeControl(nav);
    };
  }, [map]);

  return null;
}

// ─── FlyTo ───────────────────────────────────────────────────────────────────

interface FlyToProps {
  center: [number, number];
  zoom?: number;
}

export function FlyTo({ center, zoom }: FlyToProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    map.flyTo({ center, zoom, speed: 1.2, curve: 1.4 });
  }, [map, center, zoom]);

  return null;
}
