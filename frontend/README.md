# BusNow — Frontend

Interface do passageiro para rastreamento de ônibus em tempo real. Design minimalista inspirado no Uber, com cores branco/preto/vermelho.

## Stack

- **Next.js 15** (App Router)
- **MapLibre GL** — mapas vetoriais (mesma engine do mapcn)
- **TypeScript**
- **Tailwind CSS**

## Funcionalidades

- 🗺️ Mapa escuro em tela cheia com todos os ônibus em tempo real
- 📍 Localização do usuário com GPS (marcador branco pulsante)
- 🚌 Marcadores de ônibus animados com badge de ETA
- ⏱️ Painel de ETA — ordenado pelo ônibus mais próximo de você
- 🔄 Atualização automática a cada 15 segundos
- 📱 Design mobile-first, funciona como PWA

## Setup

```bash
# 1. Clone o repositório
cd busnow-frontend

# 2. Instale as dependências
npm install

# 3. Configure o backend
cp .env.local.example .env.local
# Edite .env.local com a URL do seu backend Go

# 4. Rode em desenvolvimento
npm run dev
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL do backend Go |

## Estrutura

```
busnow-frontend/
├── app/
│   ├── layout.tsx          # Layout raiz + metadados PWA
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globais + overrides MapLibre
├── components/
│   ├── map/
│   │   └── MapCore.tsx     # Wrapper MapLibre GL (Map, MapMarker, MapControls)
│   ├── BusMap.tsx          # Componente principal — orquestra tudo
│   ├── BusMarker.tsx       # Marcador de ônibus com popup
│   ├── UserMarker.tsx      # Marcador do usuário (pulsante)
│   └── ETAPanel.tsx        # Painel inferior com lista de ETAs
├── hooks/
│   ├── useGeolocation.ts   # GPS do usuário com watch
│   └── useBuses.ts         # Polling de ônibus + ETAs
├── lib/
│   ├── api.ts              # Chamadas ao backend Go
│   └── utils.ts            # Helpers (cn, formatSpeed, etc.)
└── types/
    └── index.ts            # Tipos TypeScript (Bus, Location, ETA...)
```

## API consumida

| Endpoint | Uso |
|----------|-----|
| `GET /buses` | Lista todos os ônibus |
| `GET /buses/{id}/location` | Posição atual de cada ônibus |
| `GET /buses/{id}/eta?lat=X&lng=Y` | ETA até a posição do usuário |

## Produção

```bash
npm run build
npm start
```

Para deploy com variável de ambiente:

```bash
NEXT_PUBLIC_API_URL=https://api.seudominio.com npm run build
```
