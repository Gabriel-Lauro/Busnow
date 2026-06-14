package domain

import "time"

// Bus representa um ônibus em operação.
type Bus struct {
	ID       string `json:"id"`
	LineID   string `json:"line_id"`
	LineName string `json:"line_name"`
}

// Location representa a posição atual de um ônibus.
type Location struct {
	BusID       string    `json:"bus_id"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	SpeedKmh    float64   `json:"speed_kmh"`
	CurrentStop string    `json:"current_stop"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Stop representa uma parada de ônibus.
type Stop struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Sequence int     `json:"sequence"`
}

// Line representa uma linha de ônibus com suas paradas.
type Line struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Stops []Stop `json:"stops"`
}
