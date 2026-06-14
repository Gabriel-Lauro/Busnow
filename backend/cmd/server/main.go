package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/busnow/backend/internal/config"
	"github.com/busnow/backend/internal/handler"
	firebaserepo "github.com/busnow/backend/internal/repository/firebase"
	"github.com/busnow/backend/internal/service"
	"github.com/busnow/backend/pkg/logger"
	"go.uber.org/zap"
)

func main() {
	configPath := flag.String("config", "config.yaml", "caminho para o arquivo de configuração")
	env := flag.String("env", "development", "ambiente: development | production")
	flag.Parse()

	log, err := logger.New(*env)
	if err != nil {
		fmt.Fprintf(os.Stderr, "erro ao inicializar logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatal("carregar configuração", zap.Error(err))
	}

	ctx := context.Background()

	repo, err := firebaserepo.NewRepository(ctx, cfg.Firebase.ServiceAccountPath, cfg.Firebase.DatabaseURL, log)
	if err != nil {
		log.Fatal("inicializar repositório firebase", zap.Error(err))
	}

	busSvc := service.NewBusService(repo, repo, log)
	busHandler := handler.NewBusHandler(busSvc, log)

	mux := http.NewServeMux()
	busHandler.RegisterRoutes(mux)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("servidor iniciado", zap.String("addr", srv.Addr), zap.String("env", *env))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("servidor encerrado com erro", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("encerrando servidor...")
	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("erro no graceful shutdown", zap.Error(err))
	}
	log.Info("servidor encerrado")
}
