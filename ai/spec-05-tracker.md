# Spec 05 — Tracker Desktop do Motorista

## Objetivo

Fornecer ao motorista uma interface web local (abre automaticamente no navegador) com um mapa interativo. Ao clicar em qualquer ponto do mapa, a posição é enviada imediatamente ao backend como a nova localização do ônibus.

---

## Stack

- **Python 3.10+** com Flask (servidor local)
- **Leaflet.js** (via CDN) para o mapa interativo
- **OpenStreetMap** como tile provider
- Comunicação com o backend Go via `requests` (HTTP POST)

---

## Configuração

Editável diretamente no topo de `tracker.py`:

| Constante     | Padrão                       | Descrição                        |
|---------------|------------------------------|----------------------------------|
| `BACKEND_URL` | `http://localhost:8080`      | URL do backend Go                |
| `BUS_ID`      | `bus-001`                    | ID do ônibus operado pelo motorista |

---

## Inicialização

1. Ao executar `python tracker.py`, Flask sobe na porta **5050**.
2. Uma thread daemon aguarda 1 segundo e abre `http://localhost:5050` no navegador padrão do sistema.
3. O mapa centraliza nas coordenadas iniciais de `state` (`lat: -21.3700, lng: -46.5250`).

---

## Interface

### Layout

```
┌─────────────────────────────────────────────────────┐
│  BusNow — Tracker Desktop       Bus ID: bus-001     │  ← header azul
├─────────────────────────────────────────────────────┤
│  Parada atual: [________________]   Enviado — lat…  │  ← barra de controles
├─────────────────────────────────────────────────────┤
│                                                     │
│                    MAPA LEAFLET                     │  ← ocupa o espaço restante
│              (marcador de ônibus azul)              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [00:00:00] Tracker iniciado. Clique no mapa…       │  ← log monocromático (110px)
└─────────────────────────────────────────────────────┘
```

### Componentes

**Header** — título, subtítulo com `Bus ID` em negrito.

**Barra de controles**
- Input de texto "Parada atual" (placeholder: `ex: Terminal Central`).
- Indicador de status à direita:
  - Aguardando: `"Aguardando clique no mapa..."`
  - Sucesso (classe `.ok`, verde): `"Enviado — lat: X.XXXX lng: Y.YYYY"`
  - Erro (classe `.err`, vermelho): `"Erro: <mensagem>"`

**Mapa**
- Tile: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Zoom inicial: 15
- Marcador de ônibus: `divIcon` circular azul (`#1e40af`) com ícone de ônibus, 32×32 px.
- Ao clicar: move o marcador imediatamente (feedback visual instantâneo) e chama `/send`.

**Log**
- Fundo escuro (`#0f172a`), texto cinza (`#94a3b8`), fonte monospace, 11px.
- Cada entrada: `[HH:MM:SS] OK — lat: X.XXXXX lng: Y.YYYYY parada: "..."` ou `[HH:MM:SS] ERRO — <mensagem>`.
- Novas entradas inseridas no topo (scroll automático não necessário — o mais recente fica visível).

---

## Fluxo de envio

```
Clique no mapa
  → move marker visualmente
  → POST /send  { lat, lng, current_stop }   (interno — Flask)
      └── requests.POST  BACKEND_URL/buses/{BUS_ID}/location
              { lat, lng, speed_kmh: 0, current_stop }
          → sucesso: atualiza status (.ok) + adiciona ao log
          → erro:    atualiza status (.err) + adiciona ao log
```

`speed_kmh` é sempre enviado como `0` pelo tracker (posição manual, sem sensor de velocidade). O backend substitui por 30 km/h no cálculo de ETA quando `speed_kmh < 1`.

---

## Rota Flask interna

### `GET /`

Renderiza o HTML com Jinja2, injetando `lat`, `lng` e `bus_id` do `state` atual.

### `POST /send`

**Body JSON recebido do browser**

```json
{ "lat": -21.3712, "lng": -46.5268, "current_stop": "Terminal Central" }
```

**Ação**

1. Faz `POST` ao backend Go com timeout de 5 s.
2. Em caso de sucesso (`2xx`): atualiza `state`, retorna `{ "ok": true }`.
3. Em caso de falha: salva erro em `state["error"]`, retorna `{ "ok": false, "error": "..." }`.

---

## Estado interno (`state`)

```python
state = {
    "lat":          float,   # última lat enviada com sucesso
    "lng":          float,   # última lng enviada com sucesso
    "current_stop": str,     # última parada informada
    "last_sent":    None,    # reservado para uso futuro
    "error":        str|None # último erro ocorrido
}
```

---

## Casos de borda

- Backend fora do ar: status mostra erro em vermelho; log registra a falha; marker já se moveu (feedback visual mantido).
- Cliques rápidos em sequência: cada clique dispara um `POST /send` independente; não há debounce.
- Campo "Parada atual" vazio: enviado como string vazia; backend aceita normalmente.
- Porta 5050 já em uso: Flask falha ao subir com erro no console; o browser não é aberto.
