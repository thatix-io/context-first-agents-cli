# /merge — Integrar la feature en main (tras /pr)

Cierra el ciclo tras `/pr`: actualiza la base, resuelve conflictos con agentes, confirma
contigo y hace el merge — **agnóstico al proveedor**.

**Argumento**: `#$ARGUMENTS` (un ISSUE-ID; usa el `mainBranch` del manifiesto, por defecto `main`).

## Reglas de oro
- ✅ El merge es **irreversible** → **SIEMPRE** pide confirmación primero (Paso 4).
- ✅ Nunca hagas merge con tests rojos o un conflicto sin resolver.
- ❌ Nunca marques la sesión `done` antes de que el merge termine.

---

## Paso 0 — Cargar contexto
Lee `context-manifest.json` (repos impactados + `mainBranch`) y `ai.properties.md`
(`base_path`, task manager, proveedor de PR). Los repos impactados son los de la sesión
(`.sessions/<ISSUE-ID>/<repo>/`, cada uno un worktree en la branch `feature/<ISSUE-ID>`).

## Paso 1 — Actualizar la base en los worktrees (evitar código viejo)
Para cada repo impactado, trae la `main` más reciente **antes** de cualquier merge para no
integrar sobre una base vieja:

```bash
git -C "<ruta-del-worktree>" fetch origin "<mainBranch>" --quiet
git -C "<ruta-del-worktree>" rebase "origin/<mainBranch>"
```

Si el `rebase` aplica limpio → sigue. Si reporta conflicto → Paso 2.

## Paso 2 — Conflictos → agentes de análisis y corrección
Si algún repo entra en conflicto al traer la base, **NO** resuelvas ad-hoc. Compórtate como
`/orchestrate`:

1. 🔴 Reabre la sesión como ACTIVA: en `.sessions/<ISSUE-ID>/state.json` define
   `status:"running"`, actualiza `updatedAt`. **Mueve la tarea** — disparador `reopened`
   (sigue `agents/TASK-STATUS.md`).
2. 🤖 Para cada repo en conflicto, **spawnea un agente `conflict-resolver`** (arquetipo en
   `agents/conflict-resolver.md`) con el worktree y la spec. Rebasa sobre
   `origin/<mainBranch>`, resuelve guiado por la spec, corre los tests y retorna
   `RESOLVED` / `NEEDS-HUMAN` / `CLEAN`. Registra el estado en `workers/<id>.json`
   (`name` ej.: `merge-fix:<repo>`), actualizando `currentStep`/`steps[]`.
3. Si alguno retorna `NEEDS-HUMAN`, **DETÉN** el merge y muestra los conflictos al usuario.

## Paso 3 — Revalidar
Con la base integrada, corre el `testCommand` de cada repo impactado (del manifiesto) dentro
del worktree. Si algo queda rojo, **NO** sigas — reporta y trata como en el Paso 2.

## Paso 4 — Confirmar (obligatorio)
**DETENTE y presenta el plan de merge** antes de ejecutar:
- repos a mergear y la branch (`feature/<ISSUE-ID>` → `<mainBranch>`);
- orden de merge (respeta dependencias entre repos, ej.: back antes del front);
- resultado de los tests; conflictos resueltos por agentes.
Solo procede al Paso 5 **tras aprobación explícita** del usuario.

## Paso 5 — Hacer el merge (agnóstico al proveedor)
Detecta el proveedor por el remote de cada repo y usa el camino correspondiente. **Prefiere
la plataforma de PR**; si no hay PR/CLI, cae a merge local.

- **GitHub** (`gh` disponible): mergea la PR abierta por `/pr`:
  ```bash
  gh pr merge <PR|branch> --repo <owner/repo> --squash --delete-branch
  ```
  (usa `--merge`/`--rebase` según la política del proyecto). Respeta checks/aprobaciones de GitHub.
- **Otro proveedor (GitLab, Bitbucket, Azure…)**: usa el **MCP/CLI correspondiente** para
  mergear el merge/pull request equivalente (ej.: `glab mr merge`, el MCP del proveedor).
- **Sin PR/proveedor**: merge local en el repo principal y push:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  git -C "{base_path}/<repo>" merge --no-ff "feature/<ISSUE-ID>"
  git -C "{base_path}/<repo>" push origin "<mainBranch>"
  ```

## Paso 6 — Actualizar el base_repo y concluir
- Actualiza el checkout main de cada repo mergeado:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  ```
- Elimina los worktrees de la sesión ya integrados
  (`git -C "{base_path}/<repo>" worktree remove ".../.sessions/<ISSUE-ID>/<repo>"`), si el
  flujo del proyecto lo requiere.
- En `.sessions/<ISSUE-ID>/state.json`, define `status:"done"`.
- **Mueve la tarea** — disparador `done` (sigue `agents/TASK-STATUS.md`).
- Reporta: repos mergeados, orden, PRs/commits, y lo que resolvieron los agentes.

## Escalación
Cualquier ambigüedad (política de merge indefinida, dependencia de deploy, conflicto no
resoluble) → **DETENTE** y pregunta al usuario. Nunca fuerces un merge.
