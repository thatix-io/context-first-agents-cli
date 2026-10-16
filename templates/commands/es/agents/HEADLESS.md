# Ejecuciones headless y archivo de resultado (protocolo compartido)

Cómo se comporta un comando con `--headless` y `--result <archivo>`. Todo comando que lista esas
flags sigue este archivo; un **comando propio del proyecto** (ej.: tu `test-env`) puede adherirse
agregando una sección "Modo" que apunte aquí. Contrato de los archivos: `SESSION-STATE.md`.

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (ejecutado en el directorio del
orquestador). Si el helper no existe, edita `state.json` / escribe los archivos a mano con los
mismos campos.

## Flags

Quita las flags de los argumentos antes de leerlos — el resto es el ISSUE-ID / texto.

- **`--headless`** — nunca hagas preguntas. Toda pregunta o gate humano se convierte en un ítem
  `needsHuman` (abajo), se define el status y **el comando termina**. Nunca adivines una respuesta
  ni elijas una opción en lugar de la persona.
- **`--result <archivo>`** — cuando el comando termina — éxito, detenido en un gate o falla — su
  **última acción** escribe el archivo de resultado (abajo). La ruta es absoluta o relativa al
  directorio actual. Funciona con o sin `--headless`.
- Sin flags el comando es interactivo, exactamente como antes.

## Convertir una pregunta en `needsHuman`

```bash
SS need <prefijo>-<slug> decision "<la pregunta, una línea>" "<opciones + cómo responder>" <ref>
```

- **id**: `<prefijo>-<slug>`, estable entre ejecuciones (`refine-scope`, `spec-auth-model`,
  `testenv-ports`). El prefijo es el del comando (cada comando dice cuál).
- **kind**: `decision` para una pregunta o elección · `approval` para un sí/no sobre un artefacto
  (plan, requisitos refinados, PRD) · `access` para credenciales, permisos o entorno ·
  `failure` cuando algo se rompió y solo una persona puede arreglarlo.
- **howToResolve**: las **opciones concretas** (`(a) … (b) … (c) …`, marcando la que
  recomendarías) **y cómo responder**: *"Responde en `.sessions/<ISSUE-ID>/approval.json`
  (`approved: true`, tu elección en `notes`) y vuelve a ejecutar `/<comando> <ISSUE-ID> --headless` —
  o ejecuta `/<comando> <ISSUE-ID>` y responde en la conversación."*
- **ref**: un archivo de la sesión con el detalle (ej.: `refine-questions.md`): el contexto, cada
  pregunta y sus opciones — para que la persona responda sin leer esta conversación.
- Varias preguntas → un ítem por pregunta (el mismo archivo como `ref`).

## Continuar después de la respuesta

En una nueva ejecución, si `SS show` lista ítems pendientes con el prefijo de este comando,
consume la respuesta primero — `SS apply-approval` — y actúa según su `result`:
- `approved` → los ítems se resolvieron; `notes` trae las respuestas de la persona (una elección
  por ítem, o ajustes). Continúa desde donde el comando se detuvo, aplicándolas.
- `rejected` → el helper definió `status: done` + `rejected: true`. Informa las notes y detente.
- `missing` / `stale` / `invalid` → interactivo: haz las preguntas pendientes en la conversación
  (luego `SS resolve <id>`); `--headless`: no cambies nada y termina (escribiendo el resultado).

## Escribir el archivo de resultado (`--result <archivo>`)

```bash
SS result <archivo> <comando>                 # la sesión existe: lee state.json
node .claude/bin/session-state.mjs result <archivo> <comando> \
  --need <id> decision "<motivo>" "<opciones + cómo responder>"   # no se creó ninguna sesión
```

- `<comando>`: el id del comando, su ruta en `.claude/commands/` con `:` —
  `orchestrate`, `engineer:pre-pr`, `engineer:pr`, `engineer:merge`, `products:collect`,
  `products:refine`, `products:spec`, `engineer:test-env`.
- Formato escrito (un objeto JSON; `needsHuman` es la lista de la sesión):
  ```json
  { "command": "products:refine", "issueId": "ISSUE-42", "status": "awaiting_approval", "phase": "refine",
    "needsHuman": [{ "id": "refine-approval", "kind": "approval", "reason": "…", "since": "…", "howToResolve": "…", "ref": "refined.md" }],
    "at": "2026-10-16T12:00:00Z" }
  ```
- Opciones: `--issue <id>`, `--status <status>`, `--phase <fase>` sobrescriben lo leído;
  `--need …` / `--need-json '<json>'` agregan ítems solo al resultado. Sin sesión, `issueId` y
  `phase` son `null` si no se informan.
- **Una ejecución terminada nunca informa `running`.** Si el comando falla de forma inesperada,
  regístralo antes — `SS need <prefijo>-failed failure "<qué falló>" "<cómo reintentar>"` — y
  luego escribe el resultado. Una ejecución que terminó bien deja el status al que llegó (`done`,
  `planned`, `pr_open`…).
- Sin helper, o anterior a 0.16 (`unknown command "result"`): escribe el mismo JSON a mano en `<archivo>`.
