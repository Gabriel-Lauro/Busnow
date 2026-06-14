package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/busnow/backend/internal/domain"
	"github.com/busnow/backend/internal/service"
	"go.uber.org/zap"
)

type BusHandler struct {
	svc *service.BusService
	log *zap.Logger
}

func NewBusHandler(svc *service.BusService, log *zap.Logger) *BusHandler {
	return &BusHandler{svc: svc, log: log}
}

func (h *BusHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /buses/{busID}/location", h.UpdateLocation)
	mux.HandleFunc("GET /buses/{busID}/location", h.GetLocation)
	mux.HandleFunc("GET /buses/{busID}/eta", h.GetETA)
	mux.HandleFunc("GET /buses", h.ListBuses)

	mux.HandleFunc("POST /lines", h.RegisterLine)
	mux.HandleFunc("GET /lines", h.ListLines)
	mux.HandleFunc("GET /lines/{lineID}", h.GetLine)
}

// POST /buses/{busID}/location
func (h *BusHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	busID := r.PathValue("busID")

	var body struct {
		Lat         float64 `json:"lat"`
		Lng         float64 `json:"lng"`
		SpeedKmh    float64 `json:"speed_kmh"`
		CurrentStop string  `json:"current_stop"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}

	loc := domain.Location{
		BusID:       busID,
		Lat:         body.Lat,
		Lng:         body.Lng,
		SpeedKmh:    body.SpeedKmh,
		CurrentStop: body.CurrentStop,
	}
	if err := h.svc.UpdateLocation(r.Context(), loc); err != nil {
		h.log.Error("update location", zap.Error(err))
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GET /buses/{busID}/location
func (h *BusHandler) GetLocation(w http.ResponseWriter, r *http.Request) {
	busID := r.PathValue("busID")

	loc, err := h.svc.GetLocation(r.Context(), busID)
	if err != nil {
		h.log.Error("get location", zap.Error(err))
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if loc == nil {
		respondError(w, http.StatusNotFound, "ônibus sem localização registrada")
		return
	}

	respondJSON(w, http.StatusOK, loc)
}

// GET /buses/{busID}/eta?lat=X&lng=Y
func (h *BusHandler) GetETA(w http.ResponseWriter, r *http.Request) {
	busID := r.PathValue("busID")

	var targetLat, targetLng float64
	if _, err := parseQueryFloat(r, "lat", &targetLat); err != nil {
		respondError(w, http.StatusBadRequest, "parâmetro lat inválido")
		return
	}
	if _, err := parseQueryFloat(r, "lng", &targetLng); err != nil {
		respondError(w, http.StatusBadRequest, "parâmetro lng inválido")
		return
	}

	eta, err := h.svc.CalculateETA(r.Context(), busID, targetLat, targetLng)
	if err != nil {
		h.log.Error("calculate eta", zap.Error(err))
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"bus_id":     busID,
		"eta_seconds": int(eta.Seconds()),
		"eta_minutes": int(eta.Minutes()),
		"eta_human":  formatETA(eta),
	})
}

// GET /buses
func (h *BusHandler) ListBuses(w http.ResponseWriter, r *http.Request) {
	buses, err := h.svc.ListBuses(r.Context())
	if err != nil {
		h.log.Error("list buses", zap.Error(err))
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, buses)
}

// POST /lines
func (h *BusHandler) RegisterLine(w http.ResponseWriter, r *http.Request) {
	var line domain.Line
	if err := json.NewDecoder(r.Body).Decode(&line); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido: "+err.Error())
		return
	}
	if err := h.svc.RegisterLine(r.Context(), line); err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, line)
}

// GET /lines
func (h *BusHandler) ListLines(w http.ResponseWriter, r *http.Request) {
	lines, err := h.svc.ListLines(r.Context())
	if err != nil {
		h.log.Error("list lines", zap.Error(err))
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, lines)
}

// GET /lines/{lineID}
func (h *BusHandler) GetLine(w http.ResponseWriter, r *http.Request) {
	lineID := r.PathValue("lineID")
	line, err := h.svc.GetLine(r.Context(), lineID)
	if err != nil {
		h.log.Error("get line", zap.Error(err))
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if line == nil {
		respondError(w, http.StatusNotFound, "linha não encontrada")
		return
	}
	respondJSON(w, http.StatusOK, line)
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func respondJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}

func parseQueryFloat(r *http.Request, key string, dst *float64) (bool, error) {
	val := r.URL.Query().Get(key)
	if val == "" {
		return false, nil
	}
	_, err := fmt.Sscanf(val, "%f", dst)
	return err == nil, err
}

func formatETA(d time.Duration) string {
	minutes := int(d.Minutes())
	if minutes < 1 {
		return "menos de 1 minuto"
	}
	if minutes == 1 {
		return "1 minuto"
	}
	return fmt.Sprintf("%d minutos", minutes)
}
