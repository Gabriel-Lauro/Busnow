package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/busnow/backend/internal/domain"
	"go.uber.org/zap"
)

type BusService struct {
	busRepo  domain.BusRepository
	lineRepo domain.LineRepository
	log      *zap.Logger
}

func NewBusService(busRepo domain.BusRepository, lineRepo domain.LineRepository, log *zap.Logger) *BusService {
	return &BusService{busRepo: busRepo, lineRepo: lineRepo, log: log}
}

// UpdateLocation valida e persiste a localização de um ônibus.
func (s *BusService) UpdateLocation(ctx context.Context, loc domain.Location) error {
	if loc.BusID == "" {
		return fmt.Errorf("bus_id é obrigatório")
	}
	if loc.Lat < -90 || loc.Lat > 90 {
		return fmt.Errorf("latitude inválida: %f", loc.Lat)
	}
	if loc.Lng < -180 || loc.Lng > 180 {
		return fmt.Errorf("longitude inválida: %f", loc.Lng)
	}

	loc.UpdatedAt = time.Now().UTC()

	if err := s.busRepo.SaveLocation(ctx, loc); err != nil {
		return fmt.Errorf("persistir localização: %w", err)
	}

	s.log.Info("location updated",
		zap.String("bus_id", loc.BusID),
		zap.Float64("lat", loc.Lat),
		zap.Float64("lng", loc.Lng),
		zap.Float64("speed_kmh", loc.SpeedKmh),
	)
	return nil
}

// GetLocation retorna a última localização conhecida de um ônibus.
func (s *BusService) GetLocation(ctx context.Context, busID string) (*domain.Location, error) {
	if busID == "" {
		return nil, fmt.Errorf("bus_id é obrigatório")
	}
	return s.busRepo.GetLocation(ctx, busID)
}

// ListBuses retorna todos os ônibus registrados.
func (s *BusService) ListBuses(ctx context.Context) ([]domain.Bus, error) {
	return s.busRepo.ListBuses(ctx)
}

// RegisterLine cadastra uma nova linha com suas paradas.
func (s *BusService) RegisterLine(ctx context.Context, line domain.Line) error {
	if line.ID == "" {
		return fmt.Errorf("line.id é obrigatório")
	}
	if line.Name == "" {
		return fmt.Errorf("line.name é obrigatório")
	}
	if len(line.Stops) < 2 {
		return fmt.Errorf("uma linha precisa ter ao menos 2 paradas")
	}
	return s.lineRepo.SaveLine(ctx, line)
}

// GetLine retorna uma linha pelo ID.
func (s *BusService) GetLine(ctx context.Context, lineID string) (*domain.Line, error) {
	return s.lineRepo.GetLine(ctx, lineID)
}

// ListLines retorna todas as linhas cadastradas.
func (s *BusService) ListLines(ctx context.Context) ([]domain.Line, error) {
	return s.lineRepo.ListLines(ctx)
}

// CalculateETA estima o tempo de chegada de um ônibus a uma parada alvo.
// Usa distância haversine e velocidade atual reportada pelo tracker.
func (s *BusService) CalculateETA(ctx context.Context, busID string, targetLat, targetLng float64) (time.Duration, error) {
	loc, err := s.busRepo.GetLocation(ctx, busID)
	if err != nil {
		return 0, fmt.Errorf("obter localização: %w", err)
	}
	if loc == nil {
		return 0, fmt.Errorf("ônibus %s sem localização registrada", busID)
	}

	distanceKm := haversineKm(loc.Lat, loc.Lng, targetLat, targetLng)

	speed := loc.SpeedKmh
	if speed < 1 {
		speed = 30 // velocidade média urbana padrão
	}

	hours := distanceKm / speed
	return time.Duration(hours * float64(time.Hour)), nil
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371
	dLat := toRad(lat2 - lat1)
	dLng := toRad(lng2 - lng1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	return R * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func toRad(deg float64) float64 {
	return deg * math.Pi / 180
}
