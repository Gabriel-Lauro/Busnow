# Spec 01 — Atualização de Localização

## Objetivo

Permitir que o tracker do motorista envie a posição atual de um ônibus para o backend, que valida e persiste os dados no Firebase Realtime Database.

---

## Rota

```
POST /buses/{busID}/location
```

---

## Entrada

**Path param**

| Campo   | Tipo   | Obrigatório | Descrição              |
|---------|--------|-------------|------------------------|
| `busID` | string | sim         | Identificador do ônibus |

**Body JSON**

| Campo          | Tipo    | Obrigatório | Descrição                          |
|----------------|---------|-------------|------------------------------------|
| `lat`          | float64 | sim         | Latitude (−90 a +90)               |
| `lng`          | float64 | sim         | Longitude (−180 a +180)            |
| `speed_kmh`    | float64 | não         | Velocidade atual em km/h           |
| `current_stop` | string  | não         | Nome da parada mais recente        |

**Exemplo**

```json
{
  "lat": -21.3712,
  "lng": -46.5268,
  "speed_kmh": 32.5,
  "current_stop": "Terminal Central"
}
```

---

## Regras de negócio

1. `busID` não pode ser vazio.
2. `lat` deve estar no intervalo `[-90, 90]`; caso contrário, retornar erro 422.
3. `lng` deve estar no intervalo `[-180, 180]`; caso contrário, retornar erro 422.
4. O campo `updated_at` é gerado pelo servidor (UTC) — o tracker nunca o envia.
5. Cada chamada sobrescreve a localização anterior do mesmo `busID` no Firebase (last-write-wins).

---

## Saída de sucesso

**HTTP 200**

```json
{ "status": "ok" }
```

---

## Saídas de erro

| Situação                  | Status | Body                                      |
|---------------------------|--------|-------------------------------------------|
| Body JSON malformado      | 400    | `{ "error": "body inválido: ..." }`       |
| `lat` ou `lng` inválidos  | 422    | `{ "error": "latitude inválida: -91.0" }` |
| `busID` vazio             | 422    | `{ "error": "bus_id é obrigatório" }`     |
| Falha no Firebase         | 500    | `{ "error": "persistir localização: ..." }` |

---

## Camadas envolvidas

```
BusHandler.UpdateLocation
  └── BusService.UpdateLocation   ← validação + carimbo de updated_at
        └── BusRepository.SaveLocation  ← grava em /buses/{busID}/location no Firebase
```

---

## Casos de borda

- `speed_kmh` ausente ou zero: aceito; o cálculo de ETA usa velocidade padrão de 30 km/h nesse caso.
- `current_stop` ausente: aceito como string vazia.
- Mesmo `busID` chamado duas vezes seguidas: a segunda chamada sobrescreve a primeira sem erro.
