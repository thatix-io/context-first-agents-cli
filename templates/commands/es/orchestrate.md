# /orchestrate — Orquestación de Agentes Efímeros Dinámicos

Eres el **Orquestador**. Tu tarea es convertir una spec aprobada en el **grafo mínimo de
agentes efímeros y especializados** y coordinar su ejecución — en vez de correr un único
agente monolítico sobre un contexto gigante compartido.

Este comando REEMPLAZA el flujo lineal `start → plan → work` por un grafo que el runtime
deriva automáticamente. `/plan` y `/work` pueden seguir existiendo como escape hatches manuales.

**Argumento**: `#$ARGUMENTS` (un ISSUE-ID y/o la ruta a un archivo de spec/task, más flags opcionales).

**Flags** (opcionales — sin ellas el comando es interactivo, como siempre):
- `--plan-only` — planifica, registra el plan como esperando aprobación y se detiene (nada se ejecuta).
- `--resume` — continúa una sesión detenida en un gate: lee `.sessions/<ISSUE-ID>/approval.json`
  (`{ approved, by, at, notes }`) y ejecuta, o se detiene si fue rechazada / no existe.
- `--headless` — ningún gate hace preguntas: cada gate humano registra un ítem `needsHuman` en
  `state.json`, define el status y **termina el comando**. Para ejecuciones no interactivas, ej.:
  `claude -p "/orchestrate <ISSUE-ID> --plan-only --headless"` en el directorio del orquestador.
- `--result <archivo>` — cuando el comando termina (completado, detenido en un gate o con falla), su
  última acción escribe `{ command, issueId, status, phase, needsHuman, at }` en `<archivo>`
  (protocolo en `agents/HEADLESS.md`).

`--plan-only`, `--resume` y `--result` también funcionan sin `--headless`.

---

## Reglas de oro

- ✅ Lee `context-manifest.json` + `ai.properties.md` del orquestador.
- ✅ El contexto del propio Orquestador se mantiene LIGERO: coordinas, no implementas.
- ✅ Cada unidad de trabajo la hace un **subagente** con un **contrato de contexto aislado**.
- ✅ **La ejecución corre en el Motor B — la herramienta `Workflow`** (script `orchestrate-execute`):
  el DAG, los loops de corrección, el grafo vivo y los límites los garantiza el código, no tu memoria.
  **Invocar `/orchestrate` YA ES el opt-in explícito del usuario para correr este workflow — no
  vuelvas a preguntar.** El Motor A (Task/Agent tool, ola por ola) es sólo el fallback cuando la
  herramienta `Workflow` no existe en este entorno (ver Paso 6).
- ✅ Las decisiones quedan con el usuario, en este loop principal: aprobación del plan, bloqueos,
  spawns fuera del patrón. El workflow nunca adivina — termina y te devuelve los bloqueos.
- ✅ **Cada gate humano también se escribe en disco** (`state.json` → `needsHuman[]`, vía
  `.claude/bin/session-state.mjs`), para que el dashboard y otras herramientas vean "esperándote"
  sin leer esta conversación. Interactivo: regístralo y luego pregunta. `--headless`: regístralo y detente.
- ✅ Nunca crees un catálogo de agentes de dominio (nada de `frontend-agent`, `payments-agent`).
  Un worker se compila al vuelo: `arquetipo + objetivo + repositorio + contrato de contexto + herramientas`.
- ❌ Nunca vuelques repositorios enteros en un subagente. Selecciona, no vuelques.
- ❌ Nunca dejes que un subagente modifique specs normativas.

---

## Paso 0 — Modo y estado de la sesión

1. Separa las flags de los argumentos (`--plan-only`, `--resume`, `--headless`,
   `--result <archivo>`); el resto es el ISSUE-ID / ruta de la spec. Ten presente el modo en cada
   gate de abajo. Con `--result <archivo>`, **toda** forma de terminar este comando — cualquier
   "detente" de abajo, éxito o una falla inesperada (regístrala antes: `SS need orchestrate-failed
   failure "<qué falló>" "<cómo reintentar>"`) — termina con `SS result <archivo> orchestrate`.
2. **Helper de estado.** Todo el estado a nivel de sesión pasa por
   `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID> <comando>` (abreviado `SS` abajo —
   formato en `SESSION-STATE.md`): `set '<json>'`, `status <status> [phase]`, `need <id> <kind>
   "<reason>" "<howToResolve>" <ref>`, `need-json -` (stdin), `resolve <id>|--all`,
   `apply-approval`, `show`. Escribe `state.json` de forma atómica y agrega a `events.jsonl`. Si el
   archivo del helper no existe, edita `state.json` a mano con los mismos campos (y agrega las
   líneas de evento a `events.jsonl`).
3. **`--resume`** — salta aquí en vez de planificar de nuevo:
   - Ejecuta `SS show`. Si no hay nada pendiente y la sesión no está `blocked`/`awaiting_approval`,
     infórmalo y detente.
   - Ejecuta `SS apply-approval` y actúa según su `result`:
     - `missing` / `stale` / `invalid` → no cambies nada; avisa al usuario (qué está pendiente y que
       `approval.json` debe escribirse después de eso) y **detente**.
     - `rejected` → el helper ya definió `status: done` + `rejected: true` + `notes`. Reporta las
       notas y **detente** (nada se ejecuta).
     - `approved` → los ítems pendientes quedaron resueltos. Carga la configuración (Paso 1) y
       continúa desde el gate que estaba pendiente:
       `plan-approval` → `SS status running execute`, recarga el plan aprobado
       (`execution-plan.md`) y ve al **Paso 5**;
       workers bloqueados / propuestas de spawn → **Paso 6, "Reanudar tras la decisión del usuario"**,
       usando `notes` como la decisión humana; `conflict-<repo>` → **Paso 7**.
4. En caso contrario (ejecución nueva): `SS set '{"issueId":"<ISSUE-ID>"}'` y luego `SS status planned plan` —
   la sesión aparece como en planificación (replanificar una sesión existente también la devuelve a `plan`).

## Paso 1 — Cargar configuración

1. Lee `context-manifest.json`. Extrae `repositories[]` (cada uno con `id`, `role`,
   `hints`, opcionalmente `context`, `testCommand`, `mainBranch`) y el bloque
   `orchestration` (`archetypes`, `riskSignals`, `parallelism`, `contextPolicy`,
   `maxFilesPerWorker`, `indexes`).
2. Lee `ai.properties.md` para `base_path` y la config del task manager (si existe):
   `task_management_system` + los campos del tracker (jira: `jira_site`/`jira_project`;
   linear: `linear_team`; github: `github_org`/`github_repo`). Úsalos para localizar el
   issue vía MCP.
3. Localiza el repo de specs: el repositorio con `role: metaspecs` (o `specs-provider`).

## Paso 2 — Cargar la spec

- Si hay task manager y el argumento es un ISSUE-ID, lee el issue vía el MCP apropiado.
  Si no, lee el archivo de spec pasado como argumento, o pídeselo al usuario
  (`--headless`: `SS need spec-missing decision "No se encontró spec/issue para <ISSUE-ID>" "Proporciona la spec (archivo o issue del tracker) y vuelve a ejecutar"` y detente;
  tracker inaccesible → kind `access`).
- Lee los `orchestration.indexes` relevantes (los routers de contexto) para ubicarte.
  NO leas todo el codebase — aquí sólo clasificas y ruteas.

## Paso 3 — Clasificar complejidad (reglas determinísticas)

Calcula sobre el texto de la spec:

- **repoHits** = nº de repositorios cuyo `id` O algún `hint` aparece en la spec.
- **risks** = nº de `orchestration.riskSignals` que aparecen en la spec.
- Si el frontmatter de la spec define `complexity: simple|medium|complex`, úsalo tal cual.

En caso contrario:

| Condición | Nivel |
|---|---|
| `repoHits ≥ 3` O `risks ≥ 2` O spec muy grande | **complex** |
| `repoHits ≥ 2` O `risks ≥ 1` O spec moderadamente grande | **medium** |
| en caso contrario | **simple** |

Declara la clasificación y el motivo explícitamente antes de continuar.

## Paso 3b — Destilar el Perfil Técnico de las metaspecs (obligatorio para código)

Antes de construir el grafo, **consulta los índices técnicos** (el Mapa de Contexto del
`/warm-up` + `orchestration.indexes` + el `context[]` de los repos impactados) y destila un
**Perfil Técnico** de lo que las metaspecs exigen. No inventes nada — solo lo que la spec
dice. Extrae, cuando exista:

- **Stack + idioms**: lenguajes/frameworks y convenciones obligatorias (ej.: "Vue3/Nuxt
  composition API", "NestJS + Mongoose", "ESM con imports `.js`", "pnpm/Jest").
- **Arquitectura**: el patrón exigido y sus reglas de dependencia (ej.: "Clean Architecture:
  `domain` puro sin framework; `application` vía ports; `infrastructure` implementa ports").
- **Anti-patterns detectables**: prohibiciones concretas y cómo detectarlas (ej.: "`domain`
  no importa `mongoose`/`@nestjs/*`", "sin valores hardcodeados donde hay design token").
- **Design system / tokens**: si la metaspec define un DS (ej.: `DESIGN_TOKENS_CONTRACT.md`),
  registra las reglas de conformidad visual/tokens a seguir y validar.
- **Reglas de calidad/seguridad**: LGPD/PII, contratos de API, tests obligatorios.

Este Perfil Técnico alimenta **todo lo que sigue**: la forma del grafo (Paso 4), las
orientaciones de cada worker (Paso 5) y qué reviewers crear. Cita las specs consultadas
(nombre + versión/sección) — esa es la traza de auditoría.

## Paso 4 — Construir el grafo de ejecución (DAG) — consciente de la arquitectura

Instancia workers desde `orchestration.archetypes`. Cada nodo tiene:
`{ id, name, archetype, objective, repository, dependsOn[], contextHints[] }`.

Además del `id` corto (`W1`, `W2`…), dale a cada worker un **`name` descriptivo =
rol + objetivo**, derivado del arquetipo + repo/objetivo. Prefijos sugeridos:
`impl:`, `integrate:`, `review:`, `test:`, `research:`, `plan:`. Ejemplos:
`impl:front-audio`, `impl:back-domain`, `review:arch`, `review:design-system`, `test:front`.
Es ese `name` el que aparece en el dashboard (el `id` queda interno).

### Base por complejidad
- **simple**: `implementer` en el único repo impactado → `reviewer` (dependsOn) vs. la spec.
- **medium**: un `implementer` por repo impactado (paralelos) → `integrator` → `tester`.
- **complex** = medium + `reviewer` adversarial (dependsOn integrator).

### Descomposición arquitectural (opcional — tú decides si vale la pena)
Usando el **Perfil Técnico**, juzga si conviene **partir un repo en varios workers**
siguiendo la arquitectura de las metaspecs, en vez de un implementer monolítico:
- ej. Clean Architecture: `impl:domain` → `impl:application` → (`impl:infra` ∥
  `impl:presentation`), respetando "las dependencias apuntan hacia adentro".
- ej. por módulo/bounded-context/feature cuando la spec se organiza así.

**Juicio, no regla fija**: solo descompón si la task es grande/riesgosa lo suficiente para
que el paralelismo y el aislamiento valgan la pena. Task pequeña → un implementer por repo
(la descomposición por capa ocurre dentro del worker). Declara por qué descompusiste (o no).

### Reviewers derivados de las metaspecs
Crea los reviewers/validadores que el **Perfil Técnico** justifique — cada uno con las
reglas concretas extraídas de la spec (no genéricos):
- Perfil tiene arquitectura/anti-patterns → `review:arch` (verifica capas, dependencias, los
  anti-patterns detectables).
- Perfil tiene design system/tokens y el front fue tocado → `review:design-system` (valida
  conformidad de tokens/componentes).
- Perfil tiene LGPD/seguridad/contratos → `review:security` / `review:contract`.
Con pocas reglas puedes consolidar en un único reviewer con varias lentes — pero cada lente
debe cargar las reglas reales de la metaspec.

Respeta `parallelism.maxWorkers` y `maxPerRepository` (la descomposición por capa cuenta
para `maxPerRepository`). Si excedes, hazlo por lotes y avísalo — nunca descartes un
repo/capa silenciosamente.

La tabla del grafo (id, archetype, repo, dependsOn) es el **punto de partida**, no la lista
final: en la orquestación viva (Paso 4b) el grafo crece a medida que el trabajo lo revela.

## Paso 4b — Planificación detallada primero (agente planner) + grafo VIVO

NO pre-computes todos los workers de una vez con objetivos de una línea (eso deja al agente
"crudo", replanificando todo). En cambio, `/orchestrate` es una **semilla**:

1. **Spawnea un agente `planner`** (arquetipo en `agents/planner.md`) — dependsOn ninguno.
   Escribe el **plan técnico detallado**, alimentado por el Perfil Técnico (Paso 3b), en
   `.sessions/<ISSUE-ID>/execution-plan.md`, en el espíritu del viejo `plan.md`:
   - **Enfoque técnico** y decisiones (según la arquitectura de las metaspecs).
   - **Contratos/APIs** — endpoints, tipos, eventos, campos (nombres reales; productor/consumidor).
   - **Estructura de archivos por repo** — archivos a crear/modificar (ruta + qué cambia).
   - **Estrategia de tests** por repo, mapeada a los criterios de aceptación.
   - **Riesgos** y **orden de ejecución**.
   - Y clave: **qué workers crear** (rol, repo/capa, brief detallado, deps).
2. **Presenta el plan del planner y pide aprobación** — este es tu punto de control (como
   aprobar el viejo `plan.md`). Nada se ejecuta antes. Primero registra el gate en disco:
   `SS set '{"title":"<título de la tarea>","complexity":"<nivel>"}'` y
   `SS need plan-approval approval "Plan listo para aprobación" "Aprueba en la conversación, o escribe .sessions/<ISSUE-ID>/approval.json y ejecuta /orchestrate <ISSUE-ID> --resume" execution-plan.md`
   (el status pasa a `awaiting_approval`). Luego, según el modo:
   - **interactivo** (por defecto): muestra el plan y pregunta. Aprobado → `SS resolve plan-approval`,
     `SS status running execute` y continúa. Rechazado → `SS set '{"rejected":true,"notes":"<por qué>"}'`, `SS resolve plan-approval`,
     `SS status done` y detente. Cambios pedidos → ajusta el plan y pregunta de nuevo.
   - **`--plan-only`** o **`--headless`**: no preguntes. Muestra/resume el plan y **detente aquí** —
     la sesión queda en `awaiting_approval`; la aprobación llega vía `approval.json` + `--resume`.
3. Entrega el grafo aprobado al motor de ejecución (Paso 6).

### Grafo vivo (totalmente dinámico, garantizado por el workflow)
El grafo está **vivo**: cualquier worker puede **proponer nuevos workers** cuando el trabajo
revela la necesidad (un implementer descubre un servicio faltante, un módulo auxiliar, un paso
de migración). Los workers no spawnean agentes ellos mismos — devuelven propuestas en `spawn[]`
con las flags `inScope` / `newRisk`, y el workflow aplica el **control dinámico**:
- **dentro del patrón** (dentro del alcance del plan aprobado, dentro de `maxWorkers`, sin riesgo
  nuevo) → el workflow crea el worker (`D1`, `D2`…), lo conecta antes de todo lo que depende de
  quien lo propuso, y lo ejecuta — el dashboard muestra el worker **apareciendo en vivo**;
- **fuera del patrón** (fuera del alcance del plan, riesgo alto/nuevo como migración, seguridad o
  breaking change no previsto, `maxWorkers` alcanzado) → la propuesta **no** se ejecuta; vuelve
  en `needsHuman[]` y tú **te DETIENES y preguntas al usuario** (Paso 6, "Tratar el resultado").

Los gates nunca proponen workers: reviewer/tester/integrator reportan `findings[]`, y el **loop
de corrección** del workflow crea los implementers correctivos (Paso 6).

## Paso 5 — Compilar un Contrato de Contexto por nodo (con brief detallado)

Cada worker (definido por el planner o generado en vivo) recibe, además del contrato, un
**brief recortado del plan** — su porción, densa, **no una frase**. Eso hace que el agente
nazca sabiendo qué hacer. El `objective` de cada worker debe contener:

- **Qué hacer** — el cambio concreto (no "implementa el audio", sino "agregar
  `resolveIofAmount` en X; cambiar ruta Y→Z en W; parsear el nuevo envelope").
- **Archivos objetivo** — los archivos de ese worker (ruta + qué cambia).
- **Contratos que produce/consume** — la porción de API/tipo que conecta con otros workers.
- **Tests esperados** — los casos concretos que debe cubrir.
- **Depende de / entrega a** — qué espera de otro worker y qué entrega.

Mantén el brief **acotado** (solo la parte del worker) — no pegues el plan entero en todos
(rompería `select-do-not-dump`). Se planifica hondo una vez; cada agente recibe su porción rica.

### Formato del contrato

Para cada worker, arma el contrato que se pegará en el prompt del subagente.
Ver `agents/CONTEXT-CONTRACT.md` para el formato exacto. En resumen:

- **read**: `orchestration.indexes` + el `context[]` de ese repo (sólo archivos que existen)
- **mayDiscover**: referencias alcanzables desde los índices; archivos del repo que la task exige
- **techProfile**: las **orientaciones técnicas específicas** de este worker, extraídas del
  Perfil Técnico (Paso 3b) y acotadas a su alcance. Esto es lo que especializa al agente:
  - implementer → stack/idioms + la regla de arquitectura de SU capa/repo (ej.: el worker de
    `domain` recibe "puro, sin framework, sin importar mongoose/@nestjs"; el worker de front
    recibe "usar tokens del design system, sin valores hardcodeados"). Apunta los índices
    exactos a consultar (ej.: `technical/ARCHITECTURE.md`, `DESIGN_TOKENS_CONTRACT.md`).
  - reviewer/validador → la **checklist concreta** derivada de la spec (anti-patterns a
    detectar, tokens a verificar, reglas de seguridad) — no "revisa bien", sino "verifica X, Y, Z".
- **mustNotAssume**: reglas de negocio no dichas; contratos externos no indexados; nada fuera de la spec
- **writeBoundary**: sólo el worktree de ese repo (o artefactos de la sesión para integrator/tester)
- **limits**: `contextPolicy` (por defecto `select-do-not-dump`), `maxFilesPerWorker`
- **return**: summary, changes, evidence, tests, unresolved, confidence

> El `techProfile` es lo que hace que un `implementer` produzca código **idiomático y
> conforme** a la arquitectura, y que un `reviewer` revise **en el lenguaje de la tecnología
> real** — todo derivado de las metaspecs, sin que el paquete conozca el stack de antemano.

## Paso 5b — Preparar los worktrees de la sesión (vía git, no Node)

Antes de spawnear cualquier agente, crea un **git worktree aislado por repositorio
impactado** (sólo los del grafo), para que cada implementer tenga dónde escribir sin tocar
el repo principal. Usa `base_path` (de `ai.properties.md`) y el `<ISSUE-ID>`.

Para cada repositorio impactado `<repo>` (usa el `mainBranch` del manifiesto, por defecto `main`):

1. Si `.sessions/<ISSUE-ID>/<repo>/` ya existe, **sáltalo** (worktree listo).
2. **Actualiza la base**: trae el estado más reciente del remoto para que el worktree
   nazca de código actualizado (no de la main local, que puede estar vieja):
   ```bash
   git -C "{base_path}/<repo>" fetch origin "<mainBranch>" --quiet
   ```
3. Chequea si la branch `feature/<ISSUE-ID>` ya existe en el repo:
   ```bash
   git -C "{base_path}/<repo>" rev-parse --verify --quiet "feature/<ISSUE-ID>"
   ```
4. Crea el worktree:
   - si la branch **no** existe — créala **desde `origin/<mainBranch>` actualizada**:
     ```bash
     git -C "{base_path}/<repo>" worktree add -b "feature/<ISSUE-ID>" \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "origin/<mainBranch>"
     ```
   - si la branch **ya** existe (reutilízala):
     ```bash
     git -C "{base_path}/<repo>" worktree add \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "feature/<ISSUE-ID>"
     ```
   Si el `fetch` falla (sin remoto/offline), avisa y cae al estado local
   (`worktree add -b feature/<ISSUE-ID> <path>` sin `origin/<mainBranch>`).

Reglas:
- **Nunca** hagas `checkout` en el repo principal (`{base_path}/<repo>`) — el worktree aísla todo.
- Si `git worktree add` falla con "already exists", trátalo como listo y continúa.
- Sólo prepara worktrees de los repos **impactados** del grafo, no de todos los del manifiesto.
- Registra en `execution-plan.md` qué worktrees se crearon (path + branch).

Tras esto, el `writeBoundary` de cada agente (`.sessions/<ISSUE-ID>/<repo>/`) existe de verdad.

## Paso 5c — Escribir el estado inicial (para el dashboard)

Escribe el estado legible por máquina en `.sessions/<ISSUE-ID>/` (formato en el
`SESSION-STATE.md` del orquestador). Esto alimenta `context-agents dashboard`. **Eres el único
escritor de `state.json`**; cada worker escribe sólo su propio `workers/<id>.json`.

1. `state.json` (vía el helper — mantiene `status`, `phase`, `needsHuman`, `updatedAt`
   consistentes): `SS set '{"issueId","title","complexity","engine","repos","waves"}'` con los
   valores reales (`engine` = `"workflow"` o `"task"` según el Paso 6; `waves` = las olas del Paso 4;
   `title` = el título humano de la tarea desde la spec, para que el dashboard muestre "ISSUE-ID · título").
2. `workers/<id>.json` para cada nodo planificado: `{ id, name, archetype, repository, objective,
   dependsOn, status:"pending", currentStep:null, steps:[], startedAt:null,
   finishedAt:null, verdict:null }` (incluye el `name` descriptivo del Paso 4) — el grafo entero
   aparece en el dashboard antes de que algo corra.
3. **Mueve la tarea en el tracker** — disparador `work_started`: sigue `agents/TASK-STATUS.md`
   (best-effort; omite si no hay task manager).

## Paso 6 — Ejecutar el grafo

### Elegir el motor
- **Motor B — Workflow (por defecto).** Si la herramienta `Workflow` está disponible en este
  entorno, úsala SIEMPRE, en cualquier nivel de complejidad. No es una propuesta al usuario:
  correr `/orchestrate` ya es el opt-in.
- **Motor A — Task/Agent tool (fallback).** Sólo cuando la herramienta `Workflow` no exista (ej.:
  otra herramienta de IA). Registra `engine:"task"` en `state.json` y sigue "Motor A" abajo.

Si el runtime del workflow avisa que el grafo excede su tamaño recomendado, dile al usuario que
puede aumentarlo en `/config` ("Dynamic workflow size") — nunca achiques el plan aprobado para que quepa.

### Motor B — correr el workflow `orchestrate-execute`

1. **Compila los args** (objeto JSON — pásalo como objeto real, no como string):
   ```json
   {
     "issueId": "<ISSUE-ID>",
     "sessionDir": "<ruta absoluta de .sessions/<ISSUE-ID>>",
     "commandsDir": "<ruta absoluta de .claude/commands>",
     "stateHelper": "<ruta absoluta de .claude/bin/worker-state.mjs>",
     "maxWorkers": <orchestration.parallelism.maxWorkers>,
     "maxFixRounds": 2,
     "effort": <orchestration.agentEffort, si está definido>,
     "model": <orchestration.agentModel, si está definido>,
     "repos": [{ "id": "<repo>", "worktree": "<ruta absoluta del worktree>", "testCommand": "<cmd>" }],
     "workers": [{
       "id": "W1", "name": "impl:service-a", "archetype": "implementer",
       "repository": "service-a", "dependsOn": [],
       "brief": "<el brief denso del Paso 5>",
       "contract": { "<el contrato de contexto compilado en el Paso 5>": "..." }
     }, {
       "id": "W5", "name": "test:service-a", "archetype": "tester",
       "repository": null, "scope": ["service-a"], "dependsOn": ["W3"], "brief": "...", "contract": {}
     }]
   }
   ```
   `repos` lista sólo los repos impactados (los worktrees del Paso 5b). **`scope`** (gates) = los
   repos que cubre un gate de sesión — defínelo siempre que el gate cubra sólo una parte (ej.:
   `test:front`, `review:design-system`): tras un fix, sólo vuelven a correr los gates cuyo alcance
   tocó el fix. Omitido → el gate cubre todos los repos impactados. Omite `effort`/`model` si el
   manifest no los define: por defecto el trabajo de juicio hereda la sesión y sólo se reduce el tester.
2. **`SS status running execute`** y llama a la herramienta:
   `Workflow({ name: "orchestrate-execute", args: <el objeto de arriba> })`.
   Si el nombre no resuelve, usa
   `Workflow({ scriptPath: "<ruta absoluta de .claude/workflows/orchestrate-execute.js>", args })`.
   Registra el `runId` devuelto en `state.json.runs[]` (`SS set '{"runs":[…]}'`). El workflow corre en background — se te
   notifica al terminar; no hagas polling.
3. **Lo que el workflow garantiza** (no reimplementas nada de esto):
   - **DAG sin barreras**: cada worker empieza en cuanto SUS dependencias terminan; un worker
     bloqueado sólo salta a sus dependientes, las ramas independientes siguen.
   - **Loops de corrección en cada gate** (reviewer / tester / integrator): un veredicto fallido
     (`BLOCKED` / `RED` / `MISMATCH`) → implementers correctivos por repo dueño → el gate corre de
     nuevo, hasta `maxFixRounds`; después se detiene como bloqueado.
   - **Verificación adversarial** de los hallazgos bloqueantes de reviewer antes de que alguien
     los corrija (los refutados se descartan; un hallazgo sobrevive salvo que se refute con evidencia).
   - **Regresión con alcance**: un gate que pasó antes de que un fix posterior tocara un repo de
     su alcance corre de nuevo — limitado a los cambios del fix y a los tests de los repos tocados.
   - **Grafo vivo** con el control dinámico del Paso 4b.
   - **Instrumentación + reportes en disco**: cada agente escribe su propio `workers/<id>.json`
     (vía el state helper) y su reporte completo `workers/<id>.md` (los agentes extra reciben ids
     como `W4.v1` verificación, `W4.fix1.<repo>` corrección, `W4.r2` re-ejecución, `W5.reg1`
     regresión, `D1` generado en vivo).
4. **Tratar el resultado** — es **compacto a propósito** (`{ status, workers[], extraAgents[],
   acceptedSpawns[], fixRounds[], needsHuman[] }`, cada worker con un resumen de hasta 3 líneas);
   los reportes completos son los archivos `workers/<id>.md`. Abre un reporte sólo cuando necesites
   el detalle (un bloqueo, un resumen que no se explica) — nunca los cargues todos en tu contexto.
   - Reconcilia cada `workers/<id>.json` con el status/veredicto devuelto (corrige cualquier
     archivo que un agente dejó inconsistente).
   - `status: "done"` → `SS status done execute` → Paso 6b.
   - `status: "blocked"` → **registra en disco cada ítem de `needsHuman[]`, tal como vino** (ya
     tienen la forma del contrato `{ id, kind, reason, howToResolve, ref }`; el helper ignora los
     campos extra):
     ```bash
     node .claude/bin/session-state.mjs .sessions/<ISSUE-ID> need-json - <<'JSON'
     <el array needsHuman del workflow>
     JSON
     ```
     (el status pasa a `blocked`, o a `awaiting_approval` si todos los ítems son aprobaciones). Si el
     workflow devolvió `blocked` con `needsHuman` vacío, registra un ítem por worker bloqueado
     (`<id>-blocked`, kind `decision`, reason = su resumen, ref `workers/<id>.md`). Disparador
     `blocked` (TASK-STATUS). Luego, según el modo:
     - **interactivo**: **DETENTE y muestra al usuario cada ítem** (workers bloqueados + sus
       `unresolved`, hallazgos no verificables, propuestas de spawn escaladas). Nunca decidas por él.
       Cuando decida → `SS resolve <ids>` y ve al punto 5.
     - **`--headless`**: no preguntes — resume los ítems y **termina el comando**. La decisión
       vuelve vía `approval.json` (`notes` = la decisión) + `/orchestrate <ID> --resume`.
5. **Reanudar tras la decisión del usuario** (idempotente): `SS status running execute`, luego llama
   al workflow de nuevo con los mismos args más `"completed": { "<id>": <resultado devuelto> }` para
   cada worker que terminó `done`, con los briefs de los bloqueados actualizados según la decisión
   del usuario (en `--resume`: las `notes` de `approval.json`), y cualquier propuesta de spawn
   aprobada añadida como worker nuevo. Sólo lo pendiente/bloqueado corre de nuevo. (Tras un
   `--resume`, reconstruye `completed` a partir de los `workers/<id>.json` que están `done` y sus
   reportes `workers/<id>.md`.)
   Si una ejecución fue **interrumpida** (matada, crash) y nada cambió, relánzala con
   `Workflow({ scriptPath, resumeFromRunId: "<runId>" })` — los agentes terminados vuelven de caché.

### Motor A — Task/Agent tool (sólo fallback)

Ejecuta el DAG respetando `dependsOn`. **En cada transición, actualiza los archivos de estado**:

1. **Al iniciar una ola**: para cada nodo de la ola, marca `workers/<id>.json` con
   `status:"running"`, `startedAt`, y un `currentStep` corto; `SS status running execute`.
   **En cada cambio de paso** durante la ejecución, actualiza `currentStep` Y agrega
   `{ step, at }` al array `steps[]` (el dashboard muestra este historial como pipeline).
2. **Ola paralela**: spawnea todos los nodos de la ola **en un único mensaje con múltiples
   llamadas Task**, para que corran concurrentemente. Dale a cada subagente SÓLO su
   contrato compilado + objetivo — nunca la conversación entera.
3. **Al retornar**: marca cada `workers/<id>.json` con `status:"done"` (o `"blocked"`),
   `finishedAt`, y `verdict` si hay (reviewer/tester/integrator).
4. **Gates**: si un gate falla, spawnea un implementer correctivo para el repo dueño y corre el
   gate de nuevo (máx. 2 rondas), replicando lo que el Motor B hace automáticamente.
5. **Siguiente ola**: spawnea los nodos cuyas dependencias ya están satisfechas. Repite.
6. **Al final**: `SS status done execute`; o, si algún worker quedó bloqueado, un
   `SS need <id>-blocked decision "<por qué>" "<cómo resolverlo>" workers/<id>.md` por worker bloqueado
   (`failure` cuando un gate sigue fallando tras las rondas de corrección) y trátalo como el punto 4 del Motor B.

En ambos motores, las plantillas de arquetipo en `agents/` (implementer, reviewer, integrator,
tester…) son el marco de cada subagente, rellenadas con brief, repositorio y contrato. Cada
subagente es **efímero**: hace su trabajo acotado, retorna el reporte, y su contexto se
descarta. El Orquestador sólo guarda los reportes.

## Paso 6b — Reconciliar con la base (conflictos) antes del PR

Mientras los agentes trabajaban, `origin/<mainBranch>` pudo avanzar. Para cada repo
impactado, verifica si el worktree divergió de la base:

```bash
git -C "<ruta-del-worktree>" fetch origin "<mainBranch>" --quiet
git -C "<ruta-del-worktree>" rev-list --count "HEAD..origin/<mainBranch>"
```

- Si el resultado es `0` (la base no avanzó), **sáltalo** — no hay nada que reconciliar.
- Si es `> 0`, **spawnea un agente `conflict-resolver`** (arquetipo en
  `agents/conflict-resolver.md`) para ese repo. Rebasa sobre `origin/<mainBranch>`,
  resuelve conflictos guiado por la spec, corre los tests y **SE DETIENE para tu aprobación**.
  Registra su estado en `workers/` como los demás.
- `RESOLVED` → gate de aprobación: `SS need conflict-<repo> approval "Conflictos con <mainBranch> resueltos en <repo> — revisa la resolución" "<cómo aprobar>" workers/<id>.md`.
  Interactivo: muestra la resolución y pregunta (aprobado → `SS resolve conflict-<repo>`, continúa).
  `--headless`: detente aquí (aprobación vía `approval.json` + `--resume`).
- Si retorna `NEEDS-HUMAN`, **no** sigas a PR —
  `SS need conflict-<repo> decision "<el conflicto que exige una decisión>" "<cómo resolverlo>" workers/<id>.md`;
  interactivo: muestra los conflictos y pregunta; `--headless`: detente.

## Paso 7 — Integrar y reportar

- Artefactos en `.sessions/<ISSUE-ID>/`: `execution-plan.md` (el DAG) y `workers/<agent-id>.md`
  (el reporte completo de cada agente — en el Motor B los propios agentes lo escriben, incluidos
  los agentes extra del workflow; en el Motor A lo escribes tú a partir de cada retorno).
- Resume: qué cambió por repo, evidencias, tests corridos, **rondas de corrección por gate** (qué
  atrapó cada gate y cómo se corrigió), hallazgos refutados en la verificación, workers generados
  en vivo, preguntas abiertas y cualquier repo que quedó en lote/diferido.
- Si algún gate o `conflict-resolver` sigue bloqueado, NO sigas a PR —
  asegúrate de que esté en `needsHuman` (`SS show`), luego muestra los hallazgos y pregunta al
  usuario cómo proceder (`--headless`: termina el comando).
- Si no, `SS status done execute` (nada pendiente) — siguiente paso: `/pre-pr`.
- **Mueve la tarea en el tracker** (sigue `agents/TASK-STATUS.md`):
  - disparador `blocked` si hay hallazgos bloqueantes;
  - disparador `done` cuando todo pasó y la sesión está completa.

## Escalación

Si un subagente llega a un stop Jidoka (ambigüedad, conflicto de spec, contrato faltante),
debe retornar `unresolved` en vez de adivinar. Súbelo al usuario en vez de empujar:
regístralo con `SS need <id> decision|access|failure "<motivo>" "<cómo resolverlo>" <ref>`
(`access` para credenciales/permisos/entorno faltantes), luego pregunta (interactivo) o termina el
comando (`--headless`). En `--headless` **nunca** hagas una pregunta ni adivines una respuesta.
