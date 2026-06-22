# Spec 02 — Cálculo de ETA (Haversine)

## Objetivo

Calcular o tempo estimado de chegada (ETA) de um ônibus a um ponto geográfico informado pelo passageiro, usando a fórmula de Haversine para distância e a velocidade atual reportada pelo tracker.

---

## Rota

```
GET /buses/{busID}/eta?lat=X&lng=Y
```

---

## Entrada

**Path param**

| Campo   | Tipo   | Obrigatório | Descrição              |
|---------|--------|-------------|------------------------|
| `busID` | string | sim         | Identificador do ônibus |

**Query params**

| Campo | Tipo    | Obrigatório | Descrição                            |
|-------|---------|-------------|--------------------------------------|
| `lat` | float64 | sim         | Latitude do ponto de destino         |
| `lng` | float64 | sim         | Longitude do ponto de destino        |

**Exemplo**

```
GET /buses/bus-001/eta?lat=-21.3750&lng=-46.5300
```

---

## Algoritmo

### 1. Obter última localização

Busca `Location` do ônibus no Firebase. Se não existir, retorna 500 com mensagem descritiva.

### 2. Calcular distância (Haversine)

```
R = 6371 km   (raio médio da Terra)

dLat = toRad(targetLat − busLat)
dLng = toRad(targetLng − busLng)

a = sin(dLat/2)² + cos(toRad(busLat)) × cos(toRad(targetLat)) × sin(dLng/2)²

distanceKm = R × 2 × atan2(√a, √(1−a))
```

### 3. Determinar velocidade

- Usa `speed_kmh` da última localização.
- Se `speed_kmh < 1` (parado ou não informado), assume **30 km/h** (velocidade média urbana).

### 4. Calcular ETA

```
hours   = distanceKm / speed
duration = hours × 3600  (segundos)
```

---

## Saída de sucesso

**HTTP 200**

```json
{
  "bus_id":      "bus-001",
  "eta_seconds": 420,
  "eta_minutes": 7,
  "eta_human":   "7 minutos"
}
```

**Formatação de `eta_human`**

| Condição              | Texto exibido          |
|-----------------------|------------------------|
| `minutes < 1`         | `"menos de 1 minuto"`  |
| `minutes == 1`        | `"1 minuto"`           |
| `minutes >= 2`        | `"{n} minutos"`        |

---

## Saídas de erro

| Situação                        | Status | Body                                              |
|---------------------------------|--------|---------------------------------------------------|
| `lat` ou `lng` ausentes/inválidos | 400  | `{ "error": "parâmetro lat inválido" }`           |
| Ônibus sem localização registrada | 500  | `{ "error": "ônibus bus-001 sem localização registrada" }` |
| Falha ao acessar Firebase        | 500  | `{ "error": "obter localização: ..." }`           |

---

## Camadas envolvidas

```
BusHandler.GetETA
  └── BusService.CalculateETA
        ├── BusRepository.GetLocation   ← lê posição atual do Firebase
        └── haversineKm()               ← função pura, sem efeitos colaterais
```

---

## Casos de borda

- Ônibus e destino no mesmo ponto: distância ≈ 0, ETA retorna `"menos de 1 minuto"`.
- `speed_kmh = 0`: substituído por 30 km/h para evitar divisão por zero.
- Localização desatualizada (tracker parado há minutos): a rota não valida staleness — responsabilidade do frontend exibir o `updated_at` ao usuário.
