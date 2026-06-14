// Usa o proxy do Next.js (/proxy/*) para evitar CORS.
// Em produção, NEXT_PUBLIC_API_URL fica vazio e a rota /proxy/* encaminha ao backend.
// Para chamar o backend diretamente (sem proxy), defina NEXT_PUBLIC_USE_PROXY=false.
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY !== "false";
const DIRECT_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function url(path: string) {
  if (USE_PROXY) return `/proxy${path}`;
  return `${DIRECT_URL}${path}`;
}

export async function fetchBuses() {
  const res = await fetch(url("/buses"));
  if (!res.ok) throw new Error("Falha ao buscar ônibus");
  return res.json();
}

export async function fetchBusLocation(busId: string) {
  const res = await fetch(url(`/buses/${busId}/location`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao buscar localização do ônibus ${busId}`);
  return res.json();
}

export async function fetchBusETA(busId: string, lat: number, lng: number) {
  const res = await fetch(url(`/buses/${busId}/eta?lat=${lat}&lng=${lng}`));
  if (!res.ok) throw new Error(`Falha ao calcular ETA do ônibus ${busId}`);
  return res.json();
}

export async function fetchLines() {
  const res = await fetch(url("/lines"));
  if (!res.ok) throw new Error("Falha ao buscar linhas");
  return res.json();
}

export async function fetchLine(lineId: string) {
  const res = await fetch(url(`/lines/${lineId}`));
  if (!res.ok) throw new Error(`Falha ao buscar linha ${lineId}`);
  return res.json();
}
