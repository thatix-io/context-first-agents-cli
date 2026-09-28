# Contrato de Contexto (forma)

Todo agente efímero se spawnea con un contrato. Este es exactamente el objeto que el
Orquestador compila por nodo y pega en el prompt del subagente. Es lo que mantiene el
contexto de cada agente **pequeño, acotado y auditable** — el núcleo de la arquitectura.

```json
{
  "agentId": "agent-w001",
  "archetype": "implementer",
  "objective": "<objetivo específico y acotado de este worker>",
  "repository": "<repo-id o null para workers de sesión>",
  "read": [
    { "type": "index", "path": "../metaspecs/specs/index.md", "reason": "router de contexto" },
    { "type": "hint",  "path": "../metaspecs/specs/technical/API_SPECIFICATION.md", "reason": "hint del repo" }
  ],
  "mayDiscover": [
    "referencias alcanzables desde los índices de arriba",
    "archivos de este repositorio necesarios para el objetivo"
  ],
  "mustNotAssume": [
    "reglas de negocio no dichas",
    "contratos externos no indexados",
    "requisitos ausentes en la spec aprobada"
  ],
  "writeBoundary": ["worktree asignado del <repo-id>"],
  "limits": { "policy": "select-do-not-dump", "maxFiles": 20 },
  "return": ["summary", "changes", "evidence", "tests", "unresolved", "confidence"]
}
```

## Reglas que el Orquestador debe garantizar al compilar un contrato

- `read` incluye TODOS los `orchestration.indexes` más el `context[]` del repo — pero sólo
  rutas que realmente existen en disco. Descarta el resto silenciosamente.
- Workers de sesión (integrator, tester, reviewer) tienen `repository: null` y
  `writeBoundary: ["sólo artefactos de la sesión"]`.
- Nunca expandas `read` a "el repo entero". El descubrimiento está permitido
  (`mayDiscover`), pero parte de los índices, no de un volcado ciego de directorio.
- El contrato es el ÚNICO contexto de proyecto que recibe un subagente además del objetivo.
  No pegues la conversación entera en los subagentes.

## La forma de retorno que todo agente debe producir

```markdown
### summary
<un párrafo: qué se hizo>

### changes
<archivos creados/modificados, por repo>

### evidence
<comandos corridos, salidas, links>

### tests
<tests agregados/corridos y su resultado>

### unresolved
<preguntas, conflictos de spec, stops Jidoka — o "ninguno">

### confidence
<low | medium | high> + una línea de por qué
```

## Modo workflow (Motor B — `orchestrate-execute`)

Dentro del workflow `orchestrate-execute` estas reglas vienen **en tu prompt** (no necesitas abrir
este archivo); quedan registradas aquí como referencia y para el Motor A.

### 1. Estado — un comando corto por hito
Tu prompt trae tres comandos listos para tu `workers/<id>.json` (el dashboard lo lee en vivo):
`… start '<meta>' "<primer paso>"`, `… step "<qué ahora>"`, `… finish done|blocked [VEREDICTO]`.
Úsalos en **3–5 hitos**, no en cada acción. Nunca escribas `state.json` ni el archivo de otro
worker — el orquestador es su único escritor.

### 2. Reporte en disco, retorno estructurado corto
- Antes de retornar, escribe tu **reporte completo** (summary / changes / evidence / tests /
  unresolved / confidence, más findings) en la ruta de reporte de tu prompt (`workers/<id>.md`).
- Luego devuelve el objeto estructurado (la llamada de herramienta impone el schema) con un
  **summary corto (≤ 3 líneas)** — el contexto del orquestador es el más caro; el detalle queda en el reporte.
- `status`: `done` | `blocked` — **ante la duda, `blocked`, nunca un `done` inventado**.
- `verdict` (gates): `PASS`/`BLOCKED` (reviewer), `GREEN`/`RED` (tester), `CONSISTENT`/`MISMATCH` (integrator).
- `findings[]` (gates): `severity` (`blocking` | `should-fix` | `nit`), **`repository` (el id del
  repo dueño de la corrección — obligatorio en hallazgos bloqueantes; así el loop de corrección lo enruta)**,
  `file`, `line`, `description`, `fix`.
- `commits[]` (implementers): los SHAs que creaste — las re-verificaciones revisan sólo esos.
- `spawn[]` (workers no-gate, opcional): `name`, `archetype`, `repository`, `dependsOn`, `brief`,
  flags `inScope` / `newRisk` honestas, `reason`. Las propuestas dentro del alcance y sin riesgo
  corren solas, el resto va al usuario. Propón en vez de hacer trabajo fuera de alcance tú mismo.

### 3. Salida de comandos concisa (en ambos motores)
Corre tests/builds con reporters silenciosos o de resumen; manda la salida completa a un log en
`<sessionDir>/logs/` y trae a tu contexto sólo el resumen y los fallos
(ej.: `tail -n 40`, `grep -E "FAIL|Error"`). Los fallos vienen completos — sólo se corta el ruido.
