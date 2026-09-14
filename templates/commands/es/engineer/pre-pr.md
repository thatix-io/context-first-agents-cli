# Preparación para Pull Request

Este comando valida que todo está listo para crear Pull Requests.

## 📋 Requisitos Previos

- Implementación completa (todas las tareas del `/plan` ejecutadas)
- Todos los commits realizados
- Workspace limpio y organizado

## 📋 Configuración del Proyecto

**⚠️ IMPORTANTE: ¡Siempre lea los archivos de configuración del proyecto ANTES de ejecutar este comando!**

### Archivos Obligatorios

1. **`context-manifest.json`** (raíz del orquestador)
   - Lista de repositorios del proyecto
   - Roles de cada repositorio (metaspecs, application, etc.)
   - URLs y dependencias entre repositorios

2. **`ai.properties.md`** (raíz del orquestador)
   - Configuraciones del proyecto (`project_name`, `base_path`)
   - Sistema de gestión de tareas (`task_management_system`)
   - Credenciales y configuraciones específicas

### Cómo Leer

```bash
# 1. Leer context-manifest.json
cat context-manifest.json

# 2. Leer ai.properties.md
cat ai.properties.md
```

### Información Esencial

Después de leer los archivos, tendrás:
- ✅ Lista completa de repositorios del proyecto
- ✅ Ubicación del repositorio de metaspecs
- ✅ Base path para localizar repositorios
- ✅ Sistema de gestión de tareas configurado
- ✅ Configuraciones específicas del proyecto

**🛑 NO continúe sin leer estos archivos!** ¡Contienen información crítica para la correcta ejecución del comando!


## 🎯 Objetivo

Garantizar que la implementación está completa, probada y lista para revisión antes de crear los PRs.

## 🛑 CRÍTICO: DÓNDE TRABAJAR

**⚠️ ATENCIÓN: TODO CÓDIGO (tests, fixes, ajustes) DEBE SER CREADO DENTRO DEL WORKTREE!**

**✅ CORRECTO** - Trabajar dentro del worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/tests/test.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/.eslintrc.js  ✅
```

**❌ INCORRECTO** - NUNCA crear código fuera del worktree:
```
<orchestrator>/.sessions/test.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/test.ts  ❌
{base_path}/<repo-name>/test.ts  ❌ (¡repositorio principal!)
```

**REGLA ABSOLUTA**:
- 🛑 **TODO código** (tests, fixes, configuraciones) **DEBE estar en** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NUNCA modifique** el repositorio principal en `{base_path}/<repo-name>/`
- ✅ **Trabaje SOLO** dentro del worktree del repositorio específico

## ✅ Checklist de Validación

### 1. Completitud de la Implementación

```markdown
## Verificación de Completitud

- [ ] Todas las tareas del plan fueron ejecutadas
- [ ] Todos los requisitos funcionales del PRD fueron implementados
- [ ] Todos los criterios de aceptación fueron cumplidos
- [ ] Ninguna funcionalidad quedó incompleta
```

### 2. Calidad del Código

Para cada repositorio modificado:

```bash
cd <repositorio>

# Verificar estado
git status

# Verificar linting (ejemplos por stack):
# Node.js: npm run lint / yarn lint / pnpm lint
# Python: flake8 . / pylint src/ / black --check .
# Java: mvn checkstyle:check / gradle check
# Go: golangci-lint run / go vet ./...
# Ruby: rubocop
# Rust: cargo clippy
# PHP: ./vendor/bin/phpcs
# C#: dotnet format --verify-no-changes

# Verificar formateo (ejemplos por stack):
# Node.js: npm run format:check / prettier --check .
# Python: black --check . / autopep8 --diff .
# Java: mvn formatter:validate
# Go: gofmt -l . / go fmt ./...
# Ruby: rubocop --format-only
# Rust: cargo fmt --check

# Verificar build (ejemplos por stack):
# Node.js: npm run build / yarn build
# Python: python setup.py build
# Java: mvn compile / gradle build
# Go: go build ./...
# Ruby: rake build
# Rust: cargo build
```

Checklist:
```markdown
## Calidad del Código

### <repo-1>
- [ ] Linting sin errores
- [ ] Formateo correcto
- [ ] Build sin errores
- [ ] Sin warnings críticos

### <repo-2>
- [ ] Linting sin errores
- [ ] Formateo correcto
- [ ] Build sin errores
- [ ] Sin warnings críticos
```

### 3. Tests

Para cada repositorio:

```bash
cd <repositorio>

# Ejecutar tests unitarios (ejemplos por stack):
# Node.js: npm run test:unit / jest / vitest
# Python: pytest tests/unit / python -m unittest
# Java: mvn test / gradle test
# Go: go test ./... -short
# Ruby: rspec spec/unit / rake test:unit
# Rust: cargo test --lib
# PHP: ./vendor/bin/phpunit --testsuite=unit
# C#: dotnet test --filter Category=Unit

# Ejecutar tests de integración (ejemplos por stack):
# Node.js: npm run test:integration
# Python: pytest tests/integration
# Java: mvn verify / gradle integrationTest
# Go: go test ./... -run Integration
# Ruby: rspec spec/integration
# Rust: cargo test --test '*'
# PHP: ./vendor/bin/phpunit --testsuite=integration

# Verificar cobertura (ejemplos por stack):
# Node.js: npm run test:coverage / jest --coverage
# Python: pytest --cov=src tests/
# Java: mvn jacoco:report / gradle jacocoTestReport
# Go: go test -cover ./...
# Ruby: rspec --coverage
# Rust: cargo tarpaulin
# PHP: ./vendor/bin/phpunit --coverage-html coverage/
```

Checklist:
```markdown
## Tests

### <repo-1>
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan
- [ ] Cobertura de tests adecuada (>= X%)
- [ ] Nuevos tests añadidos para nuevas funcionalidades

### <repo-2>
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan
- [ ] Cobertura de tests adecuada (>= X%)
- [ ] Nuevos tests añadidos para nuevas funcionalidades
```

### 4. Documentación

```markdown
## Documentación

- [ ] README actualizado (si es necesario)
- [ ] Comentarios de código adecuados
- [ ] Documentación de APIs actualizada (si hubo cambios)
- [ ] Changelog actualizado
- [ ] Documentación técnica actualizada en las metaspecs (si aplica)
```

### 5. Commits

```markdown
## Commits

- [ ] Todos los commits tienen mensajes claros y descriptivos
- [ ] Los commits siguen el estándar del proyecto (conventional commits, etc.)
- [ ] No hay commits con mensajes genéricos ("fix", "update", etc.)
- [ ] Los commits están organizados lógicamente
- [ ] No hay commits de debug o temporales
```

### 6. Sincronización

```markdown
## Sincronización

- [ ] Las ramas están actualizadas con la rama base (main/develop)
- [ ] No hay conflictos de merge
- [ ] Cambios entre repositorios están sincronizados
- [ ] Dependencias entre repos fueron probadas
```

### 7. Seguridad

```markdown
## Seguridad

- [ ] No hay credenciales o secretos en el código
- [ ] No hay datos sensibles en logs
- [ ] Dependencias de seguridad fueron verificadas
- [ ] No se introdujeron vulnerabilidades conocidas
```

### 8. Performance

```markdown
## Performance

- [ ] No hay regresiones de performance evidentes
- [ ] Queries/operaciones costosas fueron optimizadas
- [ ] No se introdujeron memory leaks
- [ ] Requisitos de performance del PRD fueron cumplidos
```

## 🔍 Validación Cruzada

Si se modificaron múltiples repositorios:

```markdown
## Validación Cruzada

- [ ] Probé la integración entre los repositorios localmente
- [ ] APIs/contratos entre repos están consistentes
- [ ] No hay breaking changes no documentados
- [ ] El orden de deploy/merge está claro
```

## 📄 Preparación de la Descripción del PR

Cree `./.sessions/<ISSUE-ID>/pr-description.md`:

```markdown
## 🎯 Objetivo
[Breve descripción de lo que hace esta feature]

## 📝 Cambios Principales
- [Cambio 1]
- [Cambio 2]
- [Cambio 3]

## 🔗 Links
- **Issue**: [ISSUE-ID]
- **PRD**: [link o ruta]
- **Plan Técnico**: [link o ruta]

## ✅ Checklist
- [x] Código implementado y probado
- [x] Tests unitarios añadidos/actualizados
- [x] Tests de integración pasando
- [x] Documentación actualizada
- [x] Linting y formateo OK
- [x] Build sin errores

## 🧪 Cómo Probar
1. [Paso 1]
2. [Paso 2]
3. [Resultado esperado]

## 🔍 Notas para Revisores
- [Punto de atención 1]
- [Punto de atención 2]
```

## 🚨 Problemas Encontrados → corrección vía agentes (mini-orquestación)

Si alguna validación falla (tests rojos, conflicto, lint, ruptura de contrato, hallazgo de
seguridad), **NO** marques la tarea como concluida ni sigas al PR. En vez de corregir de
forma ad-hoc, compórtate como `/orchestrate`: **reabre la sesión y spawnea agentes correctivos**.

1. 🔴 **Reabre la sesión como ACTIVA** (para que el dashboard muestre trabajo en curso):
   - En `.sessions/<ISSUE-ID>/state.json`, define `status:"running"` y actualiza `updatedAt`.
     (Si no existe — sesión del flujo antiguo — crea uno mínimo:
     `{ issueId, title, status:"running", createdAt, updatedAt, waves:[] }`.)
2. 🧩 **Arma un mini-grafo de corrección** — un worker por problema/repo impactado, con el
   mismo formato de `/orchestrate` (arquetipo `implementer` para corregir,
   `conflict-resolver` para conflictos de merge, `tester` para revalidar). Para cada uno crea
   `.sessions/<ISSUE-ID>/workers/<id>.json` con un `name` descriptivo (ej.: `fix:back-tests`,
   `fix:front-contract`), `status:"pending"`, `steps:[]`.
3. 🤖 **Spawnea los agentes (Task tool)** en olas, igual que `/orchestrate`: actualiza
   `status`/`currentStep`/`steps[]` de cada worker mientras trabajan, dentro del worktree de
   la sesión (nunca el repo principal). Cada agente corrige su ámbito y corre los tests.
4. ✅ **Solo entonces revalida** (corre `/pre-pr` de nuevo): si pasa, marca los workers
   `done`, define `state.json.status:"done"` y ahora sí sigue al PR. Si aún falla, mantén
   `running` y repite — la tarea sigue ACTIVA en el dashboard hasta estar realmente resuelta.

> Regla de oro: **mientras haya una corrección pendiente, `status` NUNCA es `done`.** La
> tarea sale del estado "activo" solo cuando todo pasa.

## 📊 Reporte de Validación

Cree `./.sessions/<ISSUE-ID>/pre-pr-report.md`:

```markdown
# Reporte de Validación Pre-PR

**Fecha**: [fecha/hora]
**Issue**: [ISSUE-ID]

## Estado General
✅ Listo para PR / ⚠️ Pendientes / ❌ Bloqueado

## Repositorios Validados
- **<repo-1>**: ✅ OK
- **<repo-2>**: ✅ OK

## Resumen de Tests
- **Tests Unitarios**: X/X pasando
- **Tests de Integración**: Y/Y pasando
- **Cobertura**: Z%

## Pendientes (si hay)
- [Pendiente 1]
- [Pendiente 2]

## Próximos Pasos
- [x] Todas las validaciones pasaron
- [ ] Ejecutar `/pr` para crear Pull Requests
```

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

Si todas las validaciones pasaron:

```bash
/pr
```

Este comando creará los Pull Requests para todos los repositorios modificados.