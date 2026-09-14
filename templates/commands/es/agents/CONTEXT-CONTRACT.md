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
