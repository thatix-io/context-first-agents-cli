# Arquitetura: orquestração de artefatos (além de código) + gerador de domínios

> Status: **proposta para aprovação** — nenhum código escrito ainda.
> Objetivo: estender a orquestração de agentes (DAG + paralelismo + dashboard) para
> fluxos que produzem **artefatos** (relatórios, apresentações, landing pages, análises),
> com um **meta-agente que gera novos domínios** de agentes.

---

## 1. O que a investigação revelou

Dois workspaces reais já orquestram artefatos, no MESMO padrão Context-First do pacote:

**`demarco/techlead`** (workspace de tech lead)
- Artefatos por tipo: `analises, report-mensal, report-anual, roadmap, sprints, nps, metas, pentest, planejamentos, epics`.
- Comandos: `planejar` (planejamento de sprint com **delegação e paralelismo explícitos**), `checkpoint-metas`.
- Ferramentas: MCP **Azure DevOps, M365, Gamma, Canva, Figma, Google Docs**.
- Já usa `System.BoardColumn` como fonte de verdade — a mesma abordagem que acabamos de
  colocar no pacote (validação da direção).

**`designer-apresentacoes-e-landingpages`**
- `design.properties.md` (= ai.properties), `.sessions/<trabalho>/` com artefatos por etapa
  (`brief.md → plan.md → derived-components.md → review-report.md`).
- Fluxo: `brief → plan → build → capture → extract → review → present → publish`.
- Agente `design-reviewer`; **skills `source-command-*`** (uma por comando — embrião de um gerador).

**Conclusão central:** o *motor* de orquestração é **agnóstico ao output**. Um agente que
gera um slide, um relatório ou um endpoint é sempre `arquétipo + objetivo + contrato de
contexto + ferramentas`. O que muda entre domínios são as **bordas**:

| Dimensão | Código | Artefato |
|---|---|---|
| Unidade de trabalho | worktree git + branch | pasta de sessão + arquivos |
| Isolamento | `git worktree` | subpastas/arquivos |
| Validação | `testCommand` (testes) | review (consistência, fontes citadas, qualidade visual) |
| Ferramentas | Read/Edit/Bash/git | MCP (Azure, Gamma, Canva, Docs) + Read/Write |
| "Entrega" | PR → merge → main | publicar (Gamma/Canva/Docs) ou entregar arquivo |
| Fonte da verdade | specs + repos | Azure Boards, CSVs, dados, references |

O motor é o mesmo; **executor + arquétipos + validação + entrega** é que trocam por domínio.

---

## 2. O reframe: Plataforma + Domínios + Gerador

Não é "code vs artifact". São **três camadas**:

```
┌─────────────────────────────────────────────────────────┐
│  ENGINE (agnóstico)  — já existe no context-first-agents │
│  complexidade → DAG → agentes efêmeros paralelos →        │
│  estado (.sessions) → dashboard (multi-projeto)           │
└─────────────────────────────────────────────────────────┘
        ▲ consome                         ▲ consome
┌───────────────────┐            ┌───────────────────┐
│  DOMÍNIO: code     │            │  DOMÍNIO: report   │  … presentation, landing …
│  archetypes,       │            │  archetypes,       │
│  comandos, tools,  │            │  comandos, tools,  │
│  executor(worktree)│            │  executor(files)   │
└───────────────────┘            └───────────────────┘
        ▲ gerado por
┌─────────────────────────────────────────────────────────┐
│  DOMAIN GENERATOR (meta-agente)                          │
│  entrevista você → gera archetypes + comandos + fluxo    │
│  de um domínio novo                                       │
└─────────────────────────────────────────────────────────┘
```

- **Engine**: o que já construímos. Não sabe nem se importa com o tipo de output.
- **Domínio**: um "pacote de conhecimento" — quais arquétipos existem, quais etapas/comandos,
  quais ferramentas (MCP), como valida, como entrega. `code` é só o primeiro domínio.
- **Gerador (o "gerador de agents" que você intuiu)**: um meta-agente que, dado um domínio
  novo ("gerador de landing pages"), **entrevista você** e produz os arquétipos + comandos +
  fluxo. Agentes que geram agentes.

---

## 3. As opções de implementação (com prós e contras)

### Opção A — Generalizar o pacote atual (1 pacote, domínios plugáveis)

O `context-first-agents-cli` ganha o conceito de **domínio** e um executor plugável.

**Fortes**
- Um motor só pra manter — toda melhoria de DAG/dashboard/paralelismo/estado vale pra todos.
- **Dashboard unificado** (o multi-projeto já existe): techlead, designer, DMPeople no mesmo lugar.
- Reaproveita ~90% (orchestrate, complexidade, contratos, TASK-STATUS/board columns).
- Coerência conceitual — mesma definição de agente efêmero pra tudo.

**Fracos**
- Risco de inchar o core com condicionais por domínio.
- Catálogo de arquétipos misturado (implementer/tester vs researcher/writer/designer).
- Mensagem do npm dilui ("orquestrar código" vira "orquestrar tudo").
- Release acoplado (bug de artefato força versão que afeta quem só usa código).

### Opção B — Pacote irmão dedicado, compartilhando o core

Extrair o **core** (engine + dashboard) num pacote base; `context-first-agents-cli` (código)
e `context-first-artifacts-cli` (artefatos) dependem dele.

**Fortes**
- Separação limpa; cada `.md` fala a língua do seu domínio (sem `if kind`).
- Evolui independente; mensagem clara de dois produtos.
- Ainda unifica o que importa (core + dashboard compartilhados).

**Fracos**
- Precisa **refatorar o core pra fora** primeiro (trabalho de base, sem feature visível).
- Três pacotes pra versionar/publicar (core, code, artifacts).
- Dashboard multi-projeto precisa reconhecer projetos de tipos diferentes.

### Opção C — Um pacote, domínios como **plugins de dados** (sem código por domínio) ⭐

O insight mais forte da investigação: os domínios que você tem **já são 100% `.md` + config**
(o designer não tem código Node — é `design.properties.md` + comandos `.md` + skills). Então
um domínio pode ser **puro conteúdo**: uma pasta `domains/<nome>/` com arquétipos e comandos
`.md` + um `domain.json` (executor: files|worktree; tools; validação). O engine Node não
cresce; ele só **lê qual domínio** o projeto declarou e instala os `.md` daquele domínio.

**Fortes**
- **Zero código novo no core por domínio** — coerente com o princípio "orquestração é `.md`".
- Novos domínios = novas pastas de `.md`, geradas pelo meta-agente. Escala sem tocar Node.
- Um pacote, um dashboard, um release.
- O executor (worktree vs files) vira uma flag no `domain.json` lida pelo `.md` de orquestração.

**Fracos**
- O `orchestrate.md` precisa ser generalizado pra ler o domínio e adaptar (worktree só se
  `executor: worktree`; validação via `validateCommand` ou "review" conforme o domínio).
- Requer uma boa "spec de domínio" (o contrato do `domain.json`) bem desenhada desde já.

---

## 4. Recomendação

**Opção C (domínios como pacotes de `.md` + `domain.json`), com o gerador por IA.**

Porque:
1. **Respeita o princípio do projeto** — orquestração vive em `.md`; o Node só scaffolda.
   Um domínio novo não é código, é conteúdo. Isso é exatamente o que o designer já prova.
2. **O gerador vira natural** — se domínio = pasta de `.md` + `domain.json`, o meta-agente
   só precisa **escrever `.md` e um JSON**, algo que um agente faz muito bem.
3. **Um motor, um dashboard, um release** — sem a refatoração pesada da Opção B, sem o
   inchaço da Opção A.
4. **Migração incremental** — o domínio `code` atual continua funcionando; adicionamos
   `report` e `landing` como novos domínios sem risco ao que já roda.

O que muda no engine (pequeno e pontual):
- `orchestrate.md` lê `domain` do manifest → escolhe executor (worktree|files) e o modo de
  validação (testes|review). Já é quase isso hoje.
- `create:orchestrator --domain <nome>` instala os `.md` daquele domínio.
- Dashboard: nenhum — ele já é agnóstico (lê `.sessions/*/state.json` + workers). Um relatório
  com 4 agentes paralelos aparece igual a um feature com 4 implementers.

---

## 5. O Domain Generator (meta-agente) — como funciona

Um comando `/create-domain <nome>` (um `.md`, claro) que:

1. **Entrevista** você: o que o domínio produz? Quais etapas (ex: brief→pesquisa→redação→review→publish)?
   Quais fontes/MCP (Azure? Google Docs? Canva?)? O que é "qualidade/validação" aqui? Como entrega?
2. **Deriva os arquétipos** do domínio (ex: para relatórios: `researcher`, `data-analyst`,
   `writer`, `reviewer`, `publisher`) — reaproveitando a biblioteca base quando couber.
3. **Gera** `domains/<nome>/`: os comandos `.md` (o fluxo), os arquétipos `.md`, e o
   `domain.json` (executor, tools, validação, entrega).
4. **Valida** com um dry-run (monta um DAG de exemplo) e pede sua aprovação.

Isso é meta-orquestração: você usa agentes para **fabricar** os agentes de um novo tipo de
trabalho. O designer já tem o embrião disso (skills `source-command-*`).

---

## 6. Caso de uso piloto (para validar)

**Relatório do techlead** (prioritário) + **landing page** (designer):

- **Report techlead** — DAG típico: `research:azure-board` ∥ `research:nps` ∥
  `analyze:sprint-metrics` → `writer:consolidate` → `reviewer:consistency` → `publisher:docs`.
  Paralelismo real: N agentes lendo fontes diferentes (Azure columns, CSVs, NPS) ao mesmo tempo.
- **Landing** — `brief` → (`build:hero` ∥ `build:features` ∥ `build:cta`) → `review:design`
  → `publish`. Um agente por seção, em paralelo, como o designer já quer.

Ambos aparecem no **mesmo dashboard**, com o mesmo modelo de estado (running/done, steps,
pipeline stepper) — sem nada novo no dashboard.

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| `domain.json` mal desenhado trava tudo | Começar com 2 domínios reais (report, landing) e extrair o schema deles, não inventar no vácuo |
| `orchestrate.md` fica complexo com muitos domínios | Manter a parte específica-de-domínio nos `.md` do domínio, não no orchestrate central |
| Gerador produz domínios inconsistentes | Um domínio "de referência" + checklist de qualidade que o gerador segue |
| Público npm confuso | README posiciona: "orquestração de agentes para qualquer trabalho baseado em spec — código E artefatos" |

---

## 8. Próximo passo proposto (após sua aprovação)

1. Desenhar o **schema `domain.json`** a partir dos 2 domínios reais (report, landing).
2. Generalizar o `orchestrate.md` para ler `domain` (executor + validação).
3. Criar o domínio **`report`** (piloto techlead) como pasta de `.md`.
4. Rodar um caso real (report de sprint) e ver no dashboard.
5. Só então: o **Domain Generator** (`/create-domain`).

Nada disso começa sem seu "ok" na direção.
