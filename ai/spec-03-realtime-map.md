# Spec 03 — Mapa em Tempo Real

## Objetivo

Exibir no frontend a posição atualizada de todos os ônibus em operação sobre um mapa vetorial interativo, com polling automático e painel de ETA para o usuário.

---

## Comportamento geral

1. Ao abrir o app, o frontend solicita a geolocalização do dispositivo.
2. Inicia polling a cada **3 segundos** (configurável via `NEXT_PUBLIC_POLL_INTERVAL`).
3. Cada ciclo de polling:
   - `GET /buses` → lista de ônibus
   - `GET /buses/{id}/location` → posição de cada ônibus (paralelo via `Promise.allSettled`)
   - `GET /buses/{id}/eta?lat=X&lng=Y` → ETA até a posição do usuário (paralelo, só se geolocalização disponível)
4. Somente ônibus com localização conhecida são renderizados no mapa.
5. O mapa centraliza inicialmente na posição do usuário; fallback para Muzambinho/MG (`[-46.525, -21.37]`).

---

## Componentes

### `BusMap`

Componente raiz. Orquestra mapa, markers e painel.

**Estado interno**

| Estado       | Tipo                  | Descrição                              |
|--------------|-----------------------|----------------------------------------|
| `focusedBus` | `BusWithLocation\|null` | Ônibus selecionado pelo usuário       |
| `flyTarget`  | `[lng, lat]\|null`    | Coordenada para animação de câmera    |

**Comportamento ao focar um ônibus**

- Salva o ônibus em `focusedBus`.
- Define `flyTarget` com as coordenadas do ônibus.
- O componente `FlyTo` de `MapCore` executa a animação suave (`flyTo` do MapLibre).

---

### `MapCore`

Wrapper sobre MapLibre GL. Expõe três subcomponentes:

| Componente    | Descrição                                               |
|---------------|---------------------------------------------------------|
| `Map`         | Inicializa o mapa com estilo, centro e zoom             |
| `MapControls` | Adiciona controles de navegação (zoom +/−, bússola)     |
| `FlyTo`       | Ao receber novas coordenadas, executa `flyTo` animado   |

**Estilo de mapa**: tile OpenStreetMap via MapLibre (open-source, sem chave de API).

---

### `BusMarker`

Marker do ônibus no mapa.

| Prop            | Tipo              | Descrição                              |
|-----------------|-------------------|----------------------------------------|
| `bus`           | `BusWithLocation` | Dados do ônibus com localização e ETA  |
| `isHighlighted` | `boolean`         | Se verdadeiro, aplica estilo destacado |

- Exibe ícone de ônibus com a cor da linha (padrão: azul `#1e40af`).
- Popup ao clicar: nome da linha, parada atual, ETA humanizado.

---

### `UserMarker`

Marker da posição do usuário.

| Prop  | Tipo   | Descrição        |
|-------|--------|------------------|
| `lat` | number | Latitude do GPS  |
| `lng` | number | Longitude do GPS |

- Estilo distinto do `BusMarker` (ponto de posição do usuário).

---

### `ETAPanel`

Painel inferior deslizável com lista de ônibus e seus ETAs.

| Prop          | Tipo                  | Descrição                                    |
|---------------|-----------------------|----------------------------------------------|
| `buses`       | `BusWithLocation[]`   | Lista de ônibus com localização e ETA        |
| `loading`     | `boolean`             | Exibe skeleton enquanto carrega              |
| `lastUpdated` | `Date\|null`          | Timestamp do último polling bem-sucedido     |
| `onRefresh`   | `() => void`          | Callback para forçar atualização manual      |
| `onBusFocus`  | `(bus) => void`       | Callback ao selecionar um ônibus na lista    |

---

## Hook `useBuses`

```
useBuses(userLat, userLng) → { buses, loading, error, lastUpdated, refresh }
```

- Dispara `fetchAll` imediatamente e depois a cada `POLL_INTERVAL` ms.
- Usa `Promise.allSettled` para localização e ETA de cada ônibus — falha parcial não cancela os demais.
- Filtra do resultado final os ônibus cujo `location == null`.

---

## Hook `useGeolocation`

```
useGeolocation() → { lat, lng, loading, error }
```

- Chama `navigator.geolocation.getCurrentPosition` uma vez ao montar.
- Atualiza `lat` e `lng` apenas em caso de sucesso.
- Em caso de erro ou permissão negada, retorna `lat = null`, `lng = null`.

---

## Proxy anti-CORS

O Next.js expõe a rota `/proxy/*` que redireciona ao backend Go. Isso elimina a necessidade de `Access-Control-Allow-Origin` no backend durante desenvolvimento.

Configuração via env:

| Variável                    | Padrão  | Descrição                               |
|-----------------------------|---------|-----------------------------------------|
| `NEXT_PUBLIC_USE_PROXY`     | `true`  | Usar proxy (`/proxy/*`) ou URL direta   |
| `NEXT_PUBLIC_API_URL`       | `http://localhost:8080` | URL do backend (sem proxy) |
| `NEXT_PUBLIC_POLL_INTERVAL` | `3`     | Intervalo de polling em segundos        |

---

## Casos de borda

- Geolocalização negada: mapa abre no fallback; ETA não é calculado; indicador "GPS ativo" não aparece.
- Backend fora do ar: exibe banner de erro; mantém dados da última busca bem-sucedida em tela.
- Ônibus sem localização: excluído silenciosamente da lista e do mapa.
- `flyTarget` inalterado entre ciclos: `FlyTo` não dispara animação redundante.
