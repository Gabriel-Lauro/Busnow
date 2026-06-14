# 🚌 BusNow

Rastreamento de ônibus em tempo real — posição ao vivo, ETA dinâmico e mapa interativo para passageiros.

![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat&logo=go)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat&logo=python)
![Firebase](https://img.shields.io/badge/Firebase-RTDB-FFCA28?style=flat&logo=firebase&logoColor=black)
![AI](https://img.shields.io/badge/AI-Cursor+Claude-8B5CF6?style=flat&logo=anthropic)

> Trabalho do semestre — **Linguagem de Programação XII** · Prof. Leonardo Ferreira
> Desenvolvido do zero com **Spec Driven Design** e **Cursor + Claude**

---

## Como funciona

- Motorista abre o **Tracker** e clica no mapa para registrar a posição do ônibus
- O **Backend** persiste a localização no Firebase e calcula ETA via fórmula de Haversine
- O **Frontend** exibe um mapa ao vivo com polling a cada 3 s e mostra o tempo estimado de chegada

```
Tracker (Python) ──POST /location──▶ Backend (Go) ──Firebase RTDB──▶ Frontend (Next.js)
```

---

## Como a IA foi utilizada

Todo o projeto foi construído com **Cursor + Claude**, seguindo o fluxo de **Spec Driven Design** apresentado em aula:

1. **Spec** — antes de escrever qualquer código, escrevemos em Markdown o que cada feature deveria fazer: entradas, saídas, regras de negócio e casos de borda
2. **Geração** — o Cursor + Claude gerou o código a partir das specs, já respeitando a arquitetura definida
3. **Revisão** — revisamos e ajustamos o código gerado, entendendo cada decisão tomada pela IA
4. **Iteração** — bugs e melhorias foram resolvidos em par com a IA, sempre partindo de uma descrição clara do problema

---

## API REST

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/buses/{busID}/location` | Atualiza a posição do ônibus |
| `GET` | `/buses/{busID}/location` | Retorna a última posição conhecida |
| `GET` | `/buses/{busID}/eta?lat=X&lng=Y` | Calcula ETA até as coordenadas |
| `GET` | `/buses` | Lista todos os ônibus |
| `POST` | `/lines` | Cadastra uma linha com paradas |
| `GET` | `/lines` | Lista todas as linhas |
| `GET` | `/lines/{lineID}` | Retorna uma linha pelo ID |

---

## Stack

- **[Go 1.22](https://go.dev)** — backend com Clean Architecture (domain / service / handler / repository)
- **[Firebase RTDB](https://firebase.google.com)** — persistência em tempo real sem servidor dedicado
- **[Next.js 15](https://nextjs.org)** — frontend com App Router e proxy server-side anti-CORS
- **[MapLibre GL](https://maplibre.org)** — mapa vetorial open-source
- **[Tailwind CSS](https://tailwindcss.com)** — estilização utilitária
- **[Python + Flask](https://flask.palletsprojects.com)** — tracker desktop com mapa Leaflet

---

## Requisitos

- Go 1.22+
- Node.js 18+
- Python 3.10+
- Projeto no [Firebase Console](https://console.firebase.google.com) com Realtime Database habilitado

---

## Instalação

### 1 · Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o **Realtime Database**
3. Em **Project Settings → Service accounts**, gere uma chave privada e salve como `backend/serviceAccountKey.json`
4. Copie a URL do banco (ex: `https://busnow-xyz-default-rtdb.firebaseio.com`)

### 2 · Backend

```bash
cd backend
cp config.example.yaml config.yaml
# Preencha database_url no config.yaml

go mod download
go run ./cmd/server
```

Sobe em `http://localhost:8080`.

### 3 · Tracker

```bash
cd tracker
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python tracker.py
```

Abre automaticamente em `http://localhost:5050`. Clique no mapa para mover o ônibus.

### 4 · Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

---

## Estrutura

```
busnow/
├── ai/                             # 🤖 Docs de IA (Spec Driven Design)
│   ├── spec-01-update-location.md  # Spec: atualização de localização
│   ├── spec-02-eta.md              # Spec: cálculo de ETA (Haversine)
│   ├── spec-03-realtime-map.md     # Spec: mapa em tempo real
│   ├── spec-04-lines.md            # Spec: cadastro de linhas e paradas
│   ├── spec-05-tracker.md          # Spec: tracker desktop do motorista
│   └── ai-process.md              # Registro do processo com Cursor + Claude
│
├── backend/                        # API Go
│   ├── cmd/server/main.go          # Entry point e wiring
│   ├── internal/
│   │   ├── domain/                 # Entidades (Bus, Location, Line, Stop) e interfaces
│   │   ├── handler/                # Handlers HTTP
│   │   ├── service/                # Regras de negócio e cálculo de ETA
│   │   └── repository/firebase/   # Implementação Firebase
│   └── config.example.yaml
│
├── frontend/                       # App Next.js
│   ├── app/                        # App Router (layout + page)
│   ├── components/                 # BusMap, BusMarker, ETAPanel, UserMarker
│   ├── hooks/                      # useBuses (polling 15 s), useGeolocation
│   └── lib/api.ts                  # Fetch helpers com proxy
│
└── tracker/                        # Interface do motorista
    ├── tracker.py                  # Flask + mapa Leaflet
    └── requirements.txt
```

---

## Principais aprendizados

- **Spec Driven Design funciona** — escrever a spec antes do código forçou pensar nos casos de borda cedo, e a IA gerou um resultado muito mais alinhado com o esperado
- **IA como par de programação** — o Cursor + Claude acelerou partes repetitivas (boilerplate Go, tipos TypeScript, config do MapLibre), liberando tempo para focar na lógica do negócio
- **Revisão é insubstituível** — o código gerado precisou de revisão constante, especialmente nas integrações entre as três camadas
- **Arquitetura em camadas paga dividendos** — a separação domain / service / repository facilitou muito trocar detalhes de implementação sem quebrar o resto