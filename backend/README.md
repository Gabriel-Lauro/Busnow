# BusNow — Backend

API REST em Go para rastreamento de ônibus em tempo real. Múltiplos ônibus, múltiplas linhas, cálculo de ETA.

## Arquitetura

```
cmd/server/          → entrypoint (main.go)
internal/
  config/            → carregamento e validação do config.yaml
  domain/            → entidades e interfaces de repositório
  handler/           → handlers HTTP (camada de entrada)
  repository/        
    firebase/        → implementação Firebase dos repositórios
  service/           → lógica de negócio (BusService)
pkg/
  logger/            → logger estruturado (zap)
```

Segue Clean Architecture: o domínio não conhece Firebase, o serviço não conhece HTTP. Cada camada depende apenas das interfaces definidas em `domain/`.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/buses/{busID}/location` | Tracker envia nova localização |
| `GET`  | `/buses/{busID}/location` | Última localização de um ônibus |
| `GET`  | `/buses/{busID}/eta?lat=X&lng=Y` | ETA até coordenada do usuário |
| `GET`  | `/buses` | Lista todos os ônibus |
| `POST` | `/lines` | Cadastra uma linha com paradas |
| `GET`  | `/lines` | Lista todas as linhas |
| `GET`  | `/lines/{lineID}` | Detalhes de uma linha |

## Setup

### 1. Pré-requisitos
- Go 1.22+
- Projeto criado no [Firebase Console](https://console.firebase.google.com)

### 2. Credenciais Firebase
- Firebase Console > Project Settings > Service accounts > Generate new private key
- Salve como `backend/serviceAccountKey.json`

### 3. Configuração
```bash
cp config.example.yaml config.yaml
# edite config.yaml com sua database_url
```

### 4. Rodar
```bash
go mod tidy
make run
```

### 5. Testar um endpoint
```bash
# Enviar localização de um ônibus
curl -X POST http://localhost:8080/buses/bus-001/location \
  -H "Content-Type: application/json" \
  -d '{"lat": -21.3700, "lng": -46.5250, "speed_kmh": 32.5, "current_stop": "Terminal Central"}'

# Calcular ETA
curl "http://localhost:8080/buses/bus-001/eta?lat=-21.3500&lng=-46.5130"
```

## Variáveis de ambiente alternativas

Você pode passar o caminho do config via flag:
```bash
./bin/busnow-server -config /etc/busnow/config.yaml -env production
```
