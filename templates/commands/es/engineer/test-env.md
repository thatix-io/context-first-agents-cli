# /test-env — Levantar el entorno de prueba local de una sesión

Levanta (o detiene) el entorno local de una sesión para que la feature se pueda probar a mano o
con tests: los worktrees de la sesión corriendo juntos, con puertos que no chocan con otras sesiones.

> **Comando propio del proyecto.** Este es un punto de partida genérico: adáptalo a tu stack
> (archivos compose, scripts, puertos, datos de seed). `context-agents update:commands` solo lo
> instala cuando el proyecto no tiene un comando `test-env` y **nunca lo sobrescribe**.

**Argumento**: `#$ARGUMENTS` — `<ISSUE-ID> [down] [--headless] [--result <archivo>]`.
- `down` (o `stop`) — detiene el entorno de la sesión en lugar de levantarlo.
- `--headless` / `--result <archivo>` — protocolo en `agents/HEADLESS.md` (prefijo de los ítems `testenv-`).

## Configuración

Lee `context-manifest.json` (repositorios, `role`, `testCommand`) y `ai.properties.md`
(`base_path` y, si el proyecto la documenta, una sección de **entorno de prueba**: puertos base,
archivo compose, script de arranque, URLs de health, comando de seed).

## Estado de la sesión

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (formato en `SESSION-STATE.md`;
si el helper no existe, edita `state.json` a mano). Este comando **no cambia la fase**.
- Antes de registrar el primer ítem, guarda el status actual (`SS show`) en
  `SS set '{"testEnv":{"previousStatus":"<status>"}}'` — registrar un ítem lleva la sesión a
  `blocked`; cuando los ítems se resuelvan, vuelve: `SS status <previousStatus>`.
- Entorno arriba: `SS set '{"testEnv":{"status":"up","urls":{"<servicio>":"<url>"},"stop":"<comando>","at":"<ahora>"}}'`.
- Entorno detenido: `SS set '{"testEnv":{"status":"down","at":"<ahora>"}}'`.

## Pasos

### 1. Identificar la sesión
- ISSUE-ID informado → `.sessions/<ISSUE-ID>/` debe existir.
- Ausente o no encontrado → interactivo: lista `.sessions/` y pregunta. `--headless`: no hay dónde
  registrar (sin sesión) — termina con
  `node .claude/bin/session-state.mjs result <archivo> engineer:test-env --need testenv-session decision "¿Qué sesión?" "(a) <ID-1> (b) <ID-2> … — vuelve a ejecutar /test-env <ID> --headless"`.
- Si `SS show` lista ítems `testenv-*` pendientes, consume la respuesta primero
  (`SS apply-approval`, ver `agents/HEADLESS.md`).

### 2. Descubrir cómo este proyecto levanta el entorno
En este orden, usando la primera que aplique:
1. La receta del propio proyecto: la sección de entorno de prueba de `ai.properties.md`, o scripts /
   archivos compose en el orquestador (ej.: `infra/`).
2. En cada worktree de la sesión (`.sessions/<ISSUE-ID>/<repo>/`; usa `{base_path}/<repo>` solo
   para los repositorios que la sesión no cambió): `docker-compose.yml` / `compose.yaml`, un target
   del `Makefile` (`up`, `dev`), scripts de `package.json` (`dev`, `start`), el README.
- Varios candidatos sin una elección clara →
  `SS need testenv-recipe decision "¿Cómo debe levantarse el entorno de <ISSUE-ID>?" "(a) <candidato 1> (b) <candidato 2> — <cómo responder>"`.
- Nada encontrado → `SS need testenv-recipe decision "No se encontró una forma de levantar el entorno" "(a) documentarla en ai.properties.md (sección de entorno de prueba) (b) adaptar .claude/commands/engineer/test-env.md — luego vuelve a ejecutar"`.
- Interactivo: pregunta en lugar de registrar; `--headless`: registra y termina.

### 3. Puertos y configuración (sin choques entre sesiones)
- Deriva los puertos de los puertos base del proyecto + el número de la issue (ej.: `3000 + 42`), o
  mantén los por defecto cuando solo corre una sesión a la vez.
- Puerto ocupado (`lsof -i :<puerto>`) → `SS need testenv-ports decision "El puerto <puerto> está en uso por <proceso>" "(a) detener <proceso> (b) usar el puerto <alternativo> — <cómo responder>"`.
- Faltan secretos / valores de `.env` / credenciales → `SS need testenv-access access "<qué falta>" "<dónde ponerlo>"`
  (nunca inventes un secreto). Copia `.env.example` → `.env` solo para valores por defecto no secretos.

### 4. Levantar (o detener) y verificar la salud
- Levanta con la receta del paso 2 (en segundo plano) y verifica: contenedores/procesos corriendo,
  la URL de health (si existe) respondiendo, los logs sin errores de arranque.
- Falla tras un intento razonable de corrección (ej.: rebuild) →
  `SS need testenv-failed failure "<servicio> no levantó: <causa en una línea>" "<qué verificar/corregir>"`, con las
  últimas líneas de log en `.sessions/<ISSUE-ID>/test-env.log`.
- `down` → detenlo con la misma receta y registra `testEnv.status: "down"`.
- Arriba y saludable → registra `testEnv` (arriba); si en esta ejecución se resolvieron ítems
  `testenv-*`, `SS status <previousStatus>`.

### 5. Reporte
URLs por servicio, de dónde viene el código de cada repositorio (worktree o base), cómo ver los
logs, detener, reconstruir y correr el seed. `--result <archivo>` → última acción: `SS result <archivo> engineer:test-env`.
