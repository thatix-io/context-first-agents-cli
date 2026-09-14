# Aquecimento — Carregamento de Contexto (índices para RAG)

Prepara o ambiente carregando os **índices das specs** para um mapa de contexto navegável.
O objetivo NÃO é despejar as specs no contexto, e sim carregar os **índices** para que
comandos seguintes saibam **onde buscar** cada informação sob demanda.

**Argumentos**: `#$ARGUMENTS`

---

## 1. Carregar configuração

Leia do orchestrator:
- **`context-manifest.json`** — `repositories[]` (id, role, hints), e o bloco
  `orchestration` (especialmente `indexes`).
- **`ai.properties.md`** — `base_path`, `task_management_system`.

Localize o repositório de specs: o de `role: "metaspecs"` (ou `"specs-provider"`).

## 2. Descobrir os índices (dinâmico — não exige nenhum arquivo fixo)

Monte a lista de índices a carregar, nesta ordem de prioridade, **pulando o que não existir**:

1. Todos os caminhos em `orchestration.indexes` do manifest (se definidos).
2. Se nenhum foi definido, ou para complementar, **descubra** os índices no repo de specs:
   - procure por `index.md` / `INDEX.md` em `{base_path}/{metaspecs-id}/specs/` e subpastas
     (ex.: `specs/index.md`, `specs/technical/index.md`, `specs/business/index.md`,
     `specs/business/features/index.md`).
3. Inclua também, **se existirem**, os arquivos de `context[]` de cada repositório do manifest.

> Degrade graciosamente: se um índice esperado não existir, **apenas registre e continue**.
> Nunca falhe o warm-up por falta de um arquivo específico.

## 3. Construir o Mapa de Contexto (o produto do warm-up)

Leia SOMENTE os índices descobertos (não os documentos que eles apontam). A partir deles,
monte e apresente um **mapa de RAG** — a "tabela de roteamento" do projeto:

```
## Mapa de Contexto (RAG)

### Índices carregados
- specs/index.md            → raiz da navegação
- specs/technical/index.md  → arquitetura, API, ADRs, convenções
- specs/business/index.md   → personas, jornada, estratégia
- ...(apenas os que existem)

### Onde buscar sob demanda
| Necessidade                     | Consultar (via índice)              |
|---------------------------------|-------------------------------------|
| Arquitetura / decisões          | technical/index.md → ARCHITECTURE / ADRs |
| Contrato de API                 | technical/index.md → API_SPECIFICATION   |
| Regras de negócio / feature     | business/index.md → features/...    |
| Convenções de código            | technical/index.md → guia de código |

### Repositórios (do manifest)
- <repo-id> [role] — hints: ...
```

Se um índice referenciar documentos que não existem em disco, marque como
`(referenciado, ausente)` — isso é sinal de spec incompleta, não um erro do warm-up.

## 4. Verificar repositórios e sessão

- Para cada repo do manifest, confirme existência em `{base_path}/{repo-id}/`
  (não leia README nem código agora — isso é sob demanda).
- Se um ISSUE-ID foi passado, verifique `.sessions/<ISSUE-ID>/`.

## 5. Como comandos seguintes usam isto

Comandos como `/spec`, `/orchestrate` e os agentes NÃO devem varrer o repo às cegas.
Eles devem: consultar o Mapa de Contexto → abrir o índice relevante → seguir o link para
o documento específico. É o índice que otimiza o RAG: carrega-se pouco, e navega-se com precisão.

## 6. Princípio Jidoka

Se detectar um problema estrutural (nenhum índice encontrado, specs-provider ausente):
**PARE**, descreva o que falta e sugira ao usuário como corrigir (ex.: criar
`specs/index.md` ou preencher `orchestration.indexes`). Não invente contexto.

---

**Status**: Índices carregados e Mapa de Contexto montado. Aguardando o próximo comando.
