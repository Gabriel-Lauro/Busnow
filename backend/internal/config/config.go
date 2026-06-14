package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Firebase FirebaseConfig `yaml:"firebase"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type FirebaseConfig struct {
	ServiceAccountPath string `yaml:"service_account_path"`
	DatabaseURL        string `yaml:"database_url"`
}

func Load(path string) (*Config, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("abrir config %s: %w", path, err)
	}
	defer f.Close()

	var cfg Config
	if err := yaml.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decodificar config: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (c *Config) validate() error {
	if c.Firebase.ServiceAccountPath == "" {
		return fmt.Errorf("firebase.service_account_path é obrigatório")
	}
	if c.Firebase.DatabaseURL == "" {
		return fmt.Errorf("firebase.database_url é obrigatório")
	}
	if c.Server.Port == "" {
		c.Server.Port = "8080"
	}
	return nil
}
