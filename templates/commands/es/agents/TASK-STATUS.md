# Sincronización de estado de la tarea (helper compartido)

Cómo los comandos mueven la issue en el gestor de tareas a medida que el flujo avanza. Lee
esto siempre que un comando alcance un **disparador** de abajo.

## Pasos

1. Lee `ai.properties.md`. Si `task_management_system` es `none` (o ausente), **no hagas nada**.
2. Para el **disparador** actual, busca `status_<disparador>` en el bloque status-map.
   - Si está **en blanco/ausente**, salta el movimiento (el usuario eligió no mapearlo).
   - Lee también el `comment_<disparador>` opcional.
3. Mueve la issue vía el MCP apropiado del tracker (ver notas por tracker abajo). Dos
   formatos de valor:
   - **Valor sin prefijo** → el **estado/columna destino**. Mueve la issue allí.
   - **Valor con prefijo `transition:`** → un **nombre de transición**. Aplícala por nombre.
4. Si `comment_<disparador>` está definido, publícalo como comentario en la issue.
5. **Nunca falles el comando por esto.** Si la llamada al tracker da error (estado no
   encontrado, sin permiso, offline), registra un aviso de una línea y continúa — la
   sincronización es best-effort; lo que importa es el trabajo.

## Por tracker: cómo mover

- **Jira / Linear / GitHub**: el valor es un **estado de workflow** — transiciona la issue
  a ese estado (o aplica la transición nombrada).
- **Azure DevOps**: los boards de Azure mueven por **COLUMNA del board**
  (`System.BoardColumn`), y varias columnas suelen compartir el mismo `System.State` (ej.:
  "Doing" y "Code Review" son ambos `Active`). Así que trata el valor como el **nombre de
  la columna del board** y defínelo vía el campo `System.BoardColumn` (MCP de Azure DevOps
  / `az boards work-item update`), NO cambiando el estado. Usa el prefijo `transition:`
  solo si realmente quieres una transición de estado.

## Disparadores (claves fijas)

| Disparador      | Se dispara cuando…                                | Comando        |
|-----------------|---------------------------------------------------|----------------|
| `spec_ready`    | la spec/PRD es aprobada                           | `/spec`        |
| `work_started`  | la orquestación empieza a ejecutar agentes        | `/orchestrate` |
| `in_review`     | la pull request es abierta                        | `/pr`          |
| `reopened`      | una verificación/revisión reabre la sesión para corregir | `/pre-pr`, `/pr`, `/merge` |
| `blocked`       | un reviewer/tester bloquea (hallazgo bloqueante)  | `/orchestrate`, `/pre-pr` |
| `in_test`       | la branch fue mergeada y está en validación       | `/merge`       |
| `done`          | la tarea se concluye y aprueba                    | `/merge` (o `/orchestrate`) |

Ejemplo (Jira): en `work_started`, si `status_work_started: En Progreso`, transiciona la
issue a "En Progreso". Ejemplo (Azure): si `status_work_started: Doing`, define
`System.BoardColumn = "Doing"` en el work item. Si un valor está en blanco, no hagas nada.
