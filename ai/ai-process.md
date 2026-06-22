# Processo de Desenvolvimento com Cursor + Claude

## Visão geral

Este documento registra como o BusNow foi construído usando **Spec Driven Design** em par com **Cursor + Claude**. Cada feature começou como uma spec em Markdown antes de qualquer linha de código ser escrita.

---

## O fluxo que seguimos

```
Spec em Markdown → Geração com IA → Revisão humana → Integração → Iteração
```

Esse ciclo se repetiu para cada uma das cinco features do projeto. A IA nunca escreveu código sem uma spec clara na frente — essa foi a regra principal que adotamos.

---

## Feature por feature

### Spec 01 — Atualização de localização

**Ponto de partida:** precisávamos que o tracker enviasse posição ao backend. Antes de escrever qualquer handler Go, escrevemos a spec com as regras de validação (`lat` entre −90 e 90, `lng` entre −180 e 180, `bus_id` obrigatório) e os casos de erro esperados.

**O que a IA gerou bem:** o handler HTTP com decodificação de JSON, o service com as validações e a chamada ao repository. A estrutura `domain / service / handler / repository` foi respeitada sem precisar corrigir.

**O que precisou de ajuste:** o campo `updated_at` estava sendo aceito do body do request na primeira versão. Corrigimos explicitando na spec que ele deve ser gerado pelo servidor.

---

### Spec 02 — Cálculo de ETA (Haversine)

**Ponto de partida:** a spec descreveu a fórmula matemática passo a passo, o fallback de velocidade (30 km/h quando `speed_kmh < 1`) e os três formatos de `eta_human`.

**O que a IA gerou bem:** a função `haversineKm` saiu correta na primeira tentativa. A lógica de `formatETA` também, incluindo o caso especial de "menos de 1 minuto".

**O que precisou de ajuste:** na primeira versão, a divisão por velocidade zero não tinha proteção. Adicionamos o fallback após identificar o caso de borda durante a revisão — e a IA incorporou a correção sem reescrever o restante.

---

### Spec 03 — Mapa em tempo real

**Ponto de partida:** a spec definiu o ciclo de polling (3 s), o uso de `Promise.allSettled` para não bloquear em falhas parciais, e a hierarquia de componentes (`BusMap → MapCore → BusMarker / UserMarker / ETAPanel`).

**O que a IA gerou bem:** o hook `useBuses` com `useCallback` e `useEffect` para o intervalo, incluindo o cleanup correto do `clearInterval`. O proxy anti-CORS no Next.js também foi gerado a partir de uma linha na spec.

**O que precisou de ajuste:** o componente `FlyTo` inicialmente disparava a animação a cada re-render. A spec foi atualizada para deixar claro que `flyTarget` deve mudar de referência apenas quando o usuário seleciona um ônibus diferente.

---

### Spec 04 — Cadastro de linhas e paradas

**Ponto de partida:** a spec definiu as três rotas (`POST /lines`, `GET /lines`, `GET /lines/{lineID}`), as entidades `Line` e `Stop`, e as validações (mínimo de 2 paradas, campos obrigatórios).

**O que a IA gerou bem:** o handler registrou as rotas corretamente no `http.ServeMux` do Go 1.22 com a nova sintaxe de path params. O service gerou os erros descritivos conforme especificado.

**O que precisou de ajuste:** o repository retornava `nil, nil` para linha não encontrada, mas o handler precisava distinguir "não encontrada" de "erro". Ajustamos o contrato da interface no `domain/repository.go` para deixar isso explícito.

---

### Spec 05 — Tracker desktop

**Ponto de partida:** a spec descreveu o layout completo (header, barra de controles, mapa Leaflet, log), o fluxo de clique, e os estados do indicador de status (`.ok` / `.err`).

**O que a IA gerou bem:** o HTML inline com Jinja2 e o JavaScript do Leaflet saíram funcionais na primeira geração. A rota `/send` do Flask, incluindo o timeout de 5 s no `requests.post`, também.

**O que precisou de ajuste:** o marcador de ônibus inicialmente usava o ícone padrão do Leaflet. A spec foi atualizada com a especificação exata do `divIcon` (circular azul, 32×32 px) e a IA gerou o CSS correto.

---

## Aprendizados sobre trabalhar com IA

**Especificidade importa mais do que comprimento.** Uma spec de 20 linhas com regras claras gerou código melhor do que uma de 2 linhas vaga. A IA não adivinhou intenções — ela seguiu o que estava escrito.

**Casos de borda na spec = menos revisão no código.** Toda vez que um caso de borda estava explícito na spec (ex: `speed_kmh < 1` → usar 30 km/h), a IA o implementou. Quando não estava, invariavelmente ficava faltando.

**A IA é boa em boilerplate, fraca em julgamento de arquitetura.** Handlers, tipos Go, configuração do MapLibre — geração rápida e correta. Decisões como "esse contrato de interface faz sentido para o resto do sistema" ainda exigiram raciocínio humano.

**Iteração rápida tem custo.** Em alguns momentos pedimos para a IA "só corrigir esse bug" sem atualizar a spec. O resultado às vezes resolvia o bug imediato mas introduzia inconsistência com o resto. Aprendemos a atualizar a spec junto com o código.

---

## Estrutura dos arquivos de spec

Cada spec segue o mesmo padrão:

1. **Objetivo** — uma frase descrevendo o que a feature entrega
2. **Rota / Interface** — contrato externo (HTTP ou UI)
3. **Entradas** — campos, tipos, obrigatoriedade
4. **Regras de negócio** — lógica e validações numeradas
5. **Saídas** — sucesso e erros com status codes
6. **Camadas envolvidas** — diagrama de chamada entre componentes
7. **Casos de borda** — situações limite e como tratá-las

Esse padrão foi definido na primeira spec e mantido nas demais. A consistência ajudou a IA a gerar código mais previsível.
