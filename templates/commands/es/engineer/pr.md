# Creación de Pull Request

Este comando crea Pull Requests para todos los repositorios modificados en el workspace.

## 📋 Requisitos Previos

Antes de crear PRs, asegúrate de que:
- Ejecutaste `/pre-pr` y todas las validaciones pasaron
- Todos los commits fueron realizados
- Todas las pruebas están pasando
- La documentación está actualizada

## 📋 Configuración del Proyecto

**⚠️ IMPORTANTE: ¡Siempre lee los archivos de configuración del proyecto ANTES de ejecutar este comando!**

### Archivos Obligatorios

1. **`context-manifest.json`** (raíz del orchestrator)
   - Lista de repositorios del proyecto
   - Roles de cada repositorio (metaspecs, application, etc.)
   - URLs y dependencias entre repositorios

2. **`ai.properties.md`** (raíz del orchestrator)
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

**🛑 NO continúes sin leer estos archivos!** ¡Contienen información crítica para la correcta ejecución del comando!


## 🛑 CRÍTICO: DÓNDE TRABAJAR

**⚠️ ATENCIÓN: Si necesitas hacer ajustes de última hora, TODO EL CÓDIGO DEBE SER CREADO DENTRO DEL WORKTREE!**

**✅ CORRECTO** - Trabajar dentro del worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/README.md  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/CHANGELOG.md  ✅
```

**❌ INCORRECTO** - NUNCA crear código fuera del worktree:
```
<orchestrator>/.sessions/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/file.ts  ❌
{base_path}/<repo-name>/file.ts  ❌ (¡repositorio principal!)
```

**REGLA ABSOLUTA**:
- 🛑 **Cualquier ajuste de código** (docs, changelog, fixes) **DEBE estar en** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NUNCA modifiques** el repositorio principal en `{base_path}/<repo-name>/`
- ✅ **Trabaja SÓLO** dentro del worktree del repositorio específico

## 🎯 Proceso de Creación de PRs

### 1. Identificar Repositorios Modificados

Para cada repositorio en el workspace, verifica:
```bash
cd <repositorio>
git status
git log origin/main..HEAD  # Ver commits no pusheados
```

### 2. Push de las Branches

Para cada repositorio modificado:
```bash
cd <repositorio>
git push origin <branch-name>
```

### 3. Crear Pull Requests

Para cada repositorio, crea un PR usando GitHub CLI o interfaz web:

**Usando GitHub CLI**:
```bash
cd <repositorio>
gh pr create --title "[ISSUE-ID] Título de la Feature" \
  --body "$(cat ../.sessions/<ISSUE-ID>/pr-description.md)" \
  --base main
```

**Plantilla de Descripción del PR**:

```markdown
## 🎯 Objetivo

[Breve descripción de lo que hace este PR]

## 📝 Cambios

### Repositorio: <nombre-del-repo>

- [Cambio 1]
- [Cambio 2]
- [Cambio 3]

## 🔗 Relaciones

- **Issue**: <ISSUE-ID>
- **PRs Relacionados**: 
  - <repo-1>#<PR-number>
  - <repo-2>#<PR-number>

## ✅ Checklist

- [ ] Código implementado y probado
- [ ] Pruebas unitarias añadidas/actualizadas
- [ ] Pruebas de integración pasando
- [ ] Documentación actualizada
- [ ] Sin breaking changes (o documentados)
- [ ] Revisado por pares (después de crear el PR)

## 🧪 Cómo Probar

1. [Paso 1]
2. [Paso 2]
3. [Resultado esperado]

## 📸 Screenshots/Demos

[Si aplica, añade capturas de pantalla o enlaces a demos]

## 🔍 Notas para Revisores

- [Punto de atención 1]
- [Punto de atención 2]
```

### 4. Vincular PRs

Si hay múltiples PRs (uno por repositorio):
- Añade enlaces cruzados entre los PRs
- Documenta el orden de merge recomendado
- Indica dependencias entre PRs

### 5. Actualizar Issue en el Task Manager

Si el task manager está configurado:
- Mueve la issue a "En Revisión" o "PR Abierto"
- Añade enlaces de los PRs en la issue
- Añade comentario con resumen de los cambios

### 6. Documentación de la Sesión

Actualiza `./.sessions/<ISSUE-ID>/pr.md`:

```markdown
# [Título de la Feature] - Pull Requests

## PRs Creados

### <repo-1>
- **Link**: <URL del PR>
- **Estado**: Abierto
- **Commits**: X commits

### <repo-2>
- **Link**: <URL del PR>
- **Estado**: Abierto
- **Commits**: Y commits

## Orden de Merge Recomendado

1. <repo-1> - [Justificación]
2. <repo-2> - [Justificación]

## Notas para Merge

- [Nota importante 1]
- [Nota importante 2]
```

## 🔍 Checklist Final

Antes de solicitar revisión:
- [ ] Todos los PRs creados
- [ ] Descripciones completas y claras
- [ ] PRs vinculados entre sí
- [ ] Issue actualizada en el task manager
- [ ] Pruebas pasando en CI/CD
- [ ] Documentación de la sesión completa

## 📢 Comunicación

Notifica al equipo sobre los PRs:
- Menciona revisores relevantes
- Destaca cambios críticos o breaking changes
- Indica urgencia si aplica

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximos Pasos

1. Esperar revisión de los PRs
2. Responder comentarios y hacer ajustes
3. Tras aprobación, hacer merge en el orden recomendado
4. Ejecutar `context-cli feature:end <ISSUE-ID>` para limpiar el workspace