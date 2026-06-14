export interface Bus {
  id: string;
  line_id: string;
  line_name: string;
}

export interface Location {
  bus_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  current_stop: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sequence: number;
}

export interface Line {
  id: string;
  name: string;
  stops: Stop[];
}

export interface ETAResponse {
  bus_id: string;
  eta_seconds: number;
  eta_minutes: number;
  eta_human: string;
}

export interface BusWithLocation extends Bus {
  location?: Location;
  eta?: ETAResponse;
}
