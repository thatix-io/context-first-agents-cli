# Sincronización de estado de la tarea (helper compartido)

Cómo los comandos mueven la issue en el gestor de tareas a medida que el flujo avanza. Lee
esto siempre que un comando alcance un **disparador** de abajo.

## Pasos

1. Lee `ai.properties.md`. Si `task_management_system` es `none` (o ausente), **no hagas nada**.
2. Para el **disparador** actual, busca `status_<disparador>` en el bloque status-map.
   - Si está **en blanco/ausente**, salta el movimiento (el usuario eligió no mapearlo).
   - Lee también el `comment_<disparador>` opcional.
3. Mueve la issue vía el MCP apropiado del tracker configurado:
   - **Valor sin prefijo** → es el **estado destino**. Transiciona la issue a ese estado
     (encuentra la transición cuyo destino coincide).
   - **Valor con prefijo `transition:`** → es el **nombre de la transición**. Aplícala por nombre.
4. Si `comment_<disparador>` está definido, publícalo como comentario en la issue.
5. **Nunca falles el comando por esto.** Si la llamada al tracker da error (estado no
   encontrado, sin permiso, offline), registra un aviso de una línea y continúa — la
   sincronización es best-effort; lo que importa es el trabajo.

## Disparadores (claves fijas)

| Disparador      | Se dispara cuando…                                | Comando        |
|-----------------|---------------------------------------------------|----------------|
| `spec_ready`    | la spec/PRD es aprobada                           | `/spec`        |
| `work_started`  | la orquestación empieza a ejecutar agentes        | `/orchestrate` |
| `in_review`     | la pull request es abierta                        | `/pr`          |
| `reopened`      | una verificación/revisión reabre la sesión para corregir | `/pre-pr`, `/pr` |
| `blocked`       | un reviewer/tester bloquea (hallazgo bloqueante)  | `/orchestrate`, `/pre-pr` |
| `done`          | la tarea se concluye y aprueba                    | `/orchestrate` (o `/pr` tras merge) |

Ejemplo: en `work_started`, si `status_work_started: En Progreso`, transiciona la issue a
"En Progreso". Si `status_work_started: transition:Iniciar Desarrollo`, aplica la
transición "Iniciar Desarrollo". Si está en blanco, no hagas nada.
