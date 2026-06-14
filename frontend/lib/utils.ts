import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s atrás`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min atrás`;
  return `${Math.floor(diffMin / 60)}h atrás`;
}

export function getBusColor(lineId: string): string {
  const colors = ["#E8001D", "#FF4444", "#CC0018", "#FF2233", "#D4001A"];
  let hash = 0;
  for (let i = 0; i < lineId.length; i++) {
    hash = lineId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatSpeed(kmh: number): string {
  if (kmh < 1) return "Parado";
  return `${Math.round(kmh)} km/h`;
}
