# Spec 04 — Cadastro de Linhas e Paradas

## Objetivo

Permitir o cadastro de linhas de ônibus com suas paradas ordenadas, e a consulta dessas linhas pelo frontend e pelo tracker.

---

## Rotas

```
POST /lines          → cadastra uma nova linha
GET  /lines          → lista todas as linhas
GET  /lines/{lineID} → retorna uma linha pelo ID
```

---

## Entidades

### `Line`

| Campo   | Tipo     | Obrigatório | Descrição                            |
|---------|----------|-------------|--------------------------------------|
| `id`    | string   | sim         | Identificador único da linha         |
| `name`  | string   | sim         | Nome legível (ex: "Linha 10 — Centro") |
| `stops` | `[]Stop` | sim         | Lista de paradas, mín. 2             |

### `Stop`

| Campo      | Tipo    | Obrigatório | Descrição                          |
|------------|---------|-------------|------------------------------------|
| `id`       | string  | sim         | Identificador único da parada      |
| `name`     | string  | sim         | Nome da parada (ex: "Terminal Central") |
| `lat`      | float64 | sim         | Latitude da parada                 |
| `lng`      | float64 | sim         | Longitude da parada                |
| `sequence` | int     | sim         | Ordem da parada na linha (1-based) |

---

## POST /lines

### Entrada — Body JSON

```json
{
  "id": "linha-10",
  "name": "Linha 10 — Centro",
  "stops": [
    { "id": "stop-01", "name": "Terminal Central",   "lat": -21.3700, "lng": -46.5250, "sequence": 1 },
    { "id": "stop-02", "name": "Praça da Matriz",    "lat": -21.3730, "lng": -46.5280, "sequence": 2 },
    { "id": "stop-03", "name": "Hospital Municipal", "lat": -21.3760, "lng": -46.5310, "sequence": 3 }
  ]
}
```

### Regras de negócio

1. `line.id` não pode ser vazio.
2. `line.name` não pode ser vazio.
3. `line.stops` deve ter **ao menos 2 paradas**.
4. IDs de linha não são verificados por unicidade no backend atual (last-write-wins no Firebase).

### Saída de sucesso

**HTTP 201** — retorna o objeto `Line` recém-cadastrado.

```json
{
  "id": "linha-10",
  "name": "Linha 10 — Centro",
  "stops": [ ... ]
}
```

### Saídas de erro

| Situação                     | Status | Body                                         |
|------------------------------|--------|----------------------------------------------|
| Body JSON malformado         | 400    | `{ "error": "body inválido: ..." }`          |
| `id` vazio                   | 422    | `{ "error": "line.id é obrigatório" }`       |
| `name` vazio                 | 422    | `{ "error": "line.name é obrigatório" }`     |
| Menos de 2 paradas           | 422    | `{ "error": "uma linha precisa ter ao menos 2 paradas" }` |
| Falha no Firebase            | 500    | `{ "error": "..." }`                         |

---

## GET /lines

Retorna array com todas as linhas cadastradas.

**HTTP 200**

```json
[
  { "id": "linha-10", "name": "Linha 10 — Centro", "stops": [ ... ] }
]
```

- Retorna `[]` se não houver nenhuma linha.

---

## GET /lines/{lineID}

Retorna a linha com o ID informado.

**HTTP 200**

```json
{ "id": "linha-10", "name": "Linha 10 — Centro", "stops": [ ... ] }
```

**Saídas de erro**

| Situação              | Status | Body                                 |
|-----------------------|--------|--------------------------------------|
| Linha não encontrada  | 404    | `{ "error": "linha não encontrada" }` |
| Falha no Firebase     | 500    | `{ "error": "..." }`                 |

---

## Camadas envolvidas

```
BusHandler.RegisterLine / ListLines / GetLine
  └── BusService.RegisterLine / ListLines / GetLine   ← validação de negócio
        └── LineRepository.SaveLine / ListLines / GetLine  ← Firebase /lines/{lineID}
```

---

## Persistência no Firebase

- Caminho base: `/lines/{lineID}`
- As paradas são armazenadas como array JSON dentro do nó da linha.
- `ListLines` faz um único `GET /lines` no Firebase e retorna todos os nós filhos.

---

## Casos de borda

- `stops` com apenas 1 parada: rejeitado com 422.
- `sequence` não é validado pelo backend — a ordenação é responsabilidade do chamador.
- Recadastrar a mesma `lineID`: sobrescreve silenciosamente (comportamento Firebase).
