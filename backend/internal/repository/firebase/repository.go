package firebase

import (
	"context"
	"fmt"
	"time"

	firebasev4 "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/db"
	"github.com/busnow/backend/internal/domain"
	"go.uber.org/zap"
	"google.golang.org/api/option"
)

type Repository struct {
	client *db.Client
	log    *zap.Logger
}

func NewRepository(ctx context.Context, serviceAccountPath, databaseURL string, log *zap.Logger) (*Repository, error) {
	opt := option.WithCredentialsFile(serviceAccountPath)
	app, err := firebasev4.NewApp(ctx, &firebasev4.Config{
		DatabaseURL: databaseURL,
	}, opt)
	if err != nil {
		return nil, fmt.Errorf("inicializar firebase app: %w", err)
	}

	client, err := app.Database(ctx)
	if err != nil {
		return nil, fmt.Errorf("inicializar firebase database client: %w", err)
	}

	return &Repository{client: client, log: log}, nil
}

// ─── BusRepository ───────────────────────────────────────────────────────────

func (r *Repository) SaveLocation(ctx context.Context, loc domain.Location) error {
	ref := r.client.NewRef(fmt.Sprintf("buses/%s/location", loc.BusID))
	payload := map[string]any{
		"lat":          loc.Lat,
		"lng":          loc.Lng,
		"speed_kmh":    loc.SpeedKmh,
		"current_stop": loc.CurrentStop,
		"updated_at":   loc.UpdatedAt.UnixMilli(),
	}
	if err := ref.Set(ctx, payload); err != nil {
		return fmt.Errorf("salvar localização bus %s: %w", loc.BusID, err)
	}
	r.log.Debug("location saved", zap.String("bus_id", loc.BusID))
	return nil
}

func (r *Repository) GetLocation(ctx context.Context, busID string) (*domain.Location, error) {
	ref := r.client.NewRef(fmt.Sprintf("buses/%s/location", busID))

	var raw map[string]any
	if err := ref.Get(ctx, &raw); err != nil {
		return nil, fmt.Errorf("buscar localização bus %s: %w", busID, err)
	}
	if raw == nil {
		return nil, nil
	}

	loc := &domain.Location{
		BusID:       busID,
		Lat:         raw["lat"].(float64),
		Lng:         raw["lng"].(float64),
		SpeedKmh:    raw["speed_kmh"].(float64),
		CurrentStop: raw["current_stop"].(string),
		UpdatedAt:   time.UnixMilli(int64(raw["updated_at"].(float64))),
	}
	return loc, nil
}

func (r *Repository) ListBuses(ctx context.Context) ([]domain.Bus, error) {
	ref := r.client.NewRef("buses")

	var raw map[string]map[string]any
	if err := ref.Get(ctx, &raw); err != nil {
		return nil, fmt.Errorf("listar ônibus: %w", err)
	}

	buses := make([]domain.Bus, 0, len(raw))
	for id, data := range raw {
		bus := domain.Bus{ID: id}
		if info, ok := data["info"].(map[string]any); ok {
			bus.LineID = stringOrEmpty(info, "line_id")
			bus.LineName = stringOrEmpty(info, "line_name")
		}
		buses = append(buses, bus)
	}
	return buses, nil
}

// ─── LineRepository ───────────────────────────────────────────────────────────

func (r *Repository) SaveLine(ctx context.Context, line domain.Line) error {
	ref := r.client.NewRef(fmt.Sprintf("lines/%s", line.ID))
	if err := ref.Set(ctx, line); err != nil {
		return fmt.Errorf("salvar linha %s: %w", line.ID, err)
	}
	return nil
}

func (r *Repository) GetLine(ctx context.Context, lineID string) (*domain.Line, error) {
	ref := r.client.NewRef(fmt.Sprintf("lines/%s", lineID))

	var line domain.Line
	if err := ref.Get(ctx, &line); err != nil {
		return nil, fmt.Errorf("buscar linha %s: %w", lineID, err)
	}
	return &line, nil
}

func (r *Repository) ListLines(ctx context.Context) ([]domain.Line, error) {
	ref := r.client.NewRef("lines")

	var raw map[string]domain.Line
	if err := ref.Get(ctx, &raw); err != nil {
		return nil, fmt.Errorf("listar linhas: %w", err)
	}

	lines := make([]domain.Line, 0, len(raw))
	for _, line := range raw {
		lines = append(lines, line)
	}
	return lines, nil
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func stringOrEmpty(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}
