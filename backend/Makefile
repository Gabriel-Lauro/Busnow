.PHONY: run build test lint tidy

run:
	go run ./cmd/server -config config.yaml

build:
	go build -o bin/busnow-server ./cmd/server

test:
	go test ./... -v

lint:
	golangci-lint run ./...

tidy:
	go mod tidy
