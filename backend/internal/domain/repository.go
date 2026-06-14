package domain

import "context"

// BusRepository define as operações de persistência para ônibus.
type BusRepository interface {
	// SaveLocation persiste a localização atual de um ônibus.
	SaveLocation(ctx context.Context, loc Location) error

	// GetLocation retorna a última localização conhecida de um ônibus.
	GetLocation(ctx context.Context, busID string) (*Location, error)

	// ListBuses retorna todos os ônibus registrados.
	ListBuses(ctx context.Context) ([]Bus, error)
}

// LineRepository define as operações de persistência para linhas.
type LineRepository interface {
	// SaveLine persiste uma linha e suas paradas.
	SaveLine(ctx context.Context, line Line) error

	// GetLine retorna uma linha pelo ID.
	GetLine(ctx context.Context, lineID string) (*Line, error)

	// ListLines retorna todas as linhas cadastradas.
	ListLines(ctx context.Context) ([]Line, error)
}
