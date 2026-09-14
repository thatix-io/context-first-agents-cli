# Planificación Técnica

Este comando crea el plan técnico detallado para la implementación de la funcionalidad.

## 📋 Requisitos Previos

- PRD creado vía `/spec`
- Análisis inicial realizado vía `/start`
- Archivos `context.md` y `architecture.md` creados y aprobados

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

**🛑 NO continúe sin leer estos archivos!** Contienen información crítica para la correcta ejecución del comando.


## 📍 IMPORTANTE: Entienda la Estructura

**Workspace**:
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree (se usará en /work)
├── repo-2/          # worktree (se usará en /work)
├── context.md       # contexto (inmutable - LEER)
├── architecture.md  # arquitectura (inmutable - LEER)
└── plan.md          # plan (mutable - CREAR)
```

**Repositorios principales** (solo lectura):
```
{base_path}/repo-1/  # repo principal (branch main/master)
{base_path}/repo-2/  # repo principal (branch main/master)
```

**REGLA DE ORO**:
- ✅ Lea `context.md` y `architecture.md` (inmutables)
- ✅ Cree `plan.md` en `.sessions/<ISSUE-ID>/`
- ✅ Lea código de los repositorios principales (solo lectura)
- ❌ NUNCA haga checkout en los repositorios principales
- ❌ NUNCA modifique `context.md` o `architecture.md`

## ⚠️ IMPORTANTE: Archivos Inmutables

**Este comando debe LEER pero NO MODIFICAR:**
- ✅ **LEER** `.sessions/<ISSUE-ID>/context.md` (inmutable)
- ✅ **LEER** `.sessions/<ISSUE-ID>/architecture.md` (inmutable)
- ✅ **CREAR** `.sessions/<ISSUE-ID>/plan.md` (mutable - se actualizará durante `/work`)
- ❌ **NO modificar `context.md` o `architecture.md`**

## 📚 Cargar MetaSpecs

**Localizar MetaSpecs automáticamente**:
1. Lea `context-manifest.json` del orquestador
2. Encuentre el repositorio con `"role": "metaspecs"`
3. Lea `ai.properties.md` para obtener el `base_path`
4. El metaspecs está en: `{base_path}/{metaspecs-repo-id}/`
5. Lea los archivos `index.md` relevantes para asegurar conformidad con:
   - Arquitectura del sistema
   - Patrones de diseño y código
   - Estructura de carpetas y archivos
   - Convenciones de nomenclatura

## 🎯 Objetivo

Crear un plan técnico detallado que guiará la implementación, dividiendo el trabajo en unidades más pequeñas y secuenciales.

## 📝 Estructura del Plan

### 1. Visión General Técnica

```markdown
# Plan Técnico - [Título de la Funcionalidad]

## Resumen
[Breve descripción técnica de lo que se implementará]

## Repositorios Involucrados
- **<repo-1>**: [Rol en esta funcionalidad]
- **<repo-2>**: [Rol en esta funcionalidad]

## Enfoque Técnico
[Estrategia general de implementación]
```

### 2. Arquitectura de la Solución

```markdown
## Arquitectura

### Diagrama de Componentes
[Descripción textual o arte ASCII de los componentes y sus relaciones]

### Flujo de Datos
1. [Paso 1 del flujo]
2. [Paso 2 del flujo]
3. [Paso 3 del flujo]

### Integraciones
- **<repo-1> → <repo-2>**: [Cómo se comunican]
- **Sistema → API Externa**: [Si aplica]
```

### 3. Decisiones Técnicas

```markdown
## Decisiones Técnicas

### Decisión 1: [Título]
**Contexto**: [Por qué necesitamos decidir esto]
**Opciones consideradas**:
- Opción A: [Pros y contras]
- Opción B: [Pros y contras]
**Decisión**: [Opción elegida]
**Justificación**: [Por qué elegimos esta opción]

### Decisión 2: [Título]
[Mismo formato anterior]
```

### 4. Plan de Implementación

Divida el trabajo en unidades pequeñas y secuenciales:

```markdown
## Plan de Implementación

### Fase 1: [Nombre de la Fase]
**Objetivo**: [Qué se logrará en esta fase]
**Repositorios**: [repos afectados]

#### Tarea 1.1: [Descripción]
- **Repo**: <repo-1>
- **Archivos**: [archivos a crear/modificar]
- **Descripción**: [Qué hacer]
- **Pruebas**: [Pruebas a implementar]
- **Estimación**: [tiempo estimado]

#### Tarea 1.2: [Descripción]
- **Repo**: <repo-2>
- **Archivos**: [archivos a crear/modificar]
- **Descripción**: [Qué hacer]
- **Pruebas**: [Pruebas a implementar]
- **Estimación**: [tiempo estimado]

### Fase 2: [Nombre de la Fase]
[Mismo formato anterior]

### Fase 3: [Nombre de la Fase]
[Mismo formato anterior]
```

### 5. Estructura de Archivos

Para cada repositorio, defina la estructura:

```markdown
## Estructura de Archivos

### <repo-1>
```
src/
├── components/
│   ├── NewComponent.tsx (CREAR)
│   └── ExistingComponent.tsx (MODIFICAR)
├── services/
│   └── NewService.ts (CREAR)
└── tests/
    └── NewComponent.test.tsx (CREAR)
```

### <repo-2>
```
src/
├── controllers/
│   └── NewController.ts (CREAR)
└── tests/
    └── NewController.test.ts (CREAR)
```
```

### 6. APIs y Contratos

```markdown
## APIs y Contratos

### Endpoints Nuevos

#### POST /api/resource
**Request**:
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response**:
```json
{
  "id": "string",
  "status": "string"
}
```

### Endpoints Modificados

#### GET /api/resource/:id
**Cambios**: [Qué cambia]
**Breaking Change**: Sí / No
```

### 7. Estrategia de Pruebas

```markdown
## Estrategia de Pruebas

### Pruebas Unitarias
- **<repo-1>**: [Componentes/funciones a probar]
- **<repo-2>**: [Componentes/funciones a probar]

### Pruebas de Integración
- **Escenario 1**: [Descripción y repos involucrados]
- **Escenario 2**: [Descripción y repos involucrados]

### Pruebas E2E (si aplica)
- **Flujo 1**: [Descripción]
- **Flujo 2**: [Descripción]
```

### 8. Riesgos Técnicos

```markdown
## Riesgos Técnicos

### Riesgo 1: [Descripción]
- **Impacto**: Alto / Medio / Bajo
- **Probabilidad**: Alta / Media / Baja
- **Mitigación**: [Cómo mitigar]
- **Plan B**: [Alternativa si ocurre]

### Riesgo 2: [Descripción]
[Mismo formato anterior]
```

### 9. Checklist de Implementación

```markdown
## Checklist de Implementación

### Fase 1
- [ ] Tarea 1.1
- [ ] Tarea 1.2
- [ ] Pruebas de la Fase 1

### Fase 2
- [ ] Tarea 2.1
- [ ] Tarea 2.2
- [ ] Pruebas de la Fase 2

### Fase 3
- [ ] Tarea 3.1
- [ ] Tarea 3.2
- [ ] Pruebas de la Fase 3

### Finalización
- [ ] Documentación actualizada
- [ ] Code review
- [ ] Pruebas de integración
- [ ] PR creado
```

## 📄 Guardado del Plan

Guarde en `./.sessions/<ISSUE-ID>/plan.md`

## 🔍 Revisión

Revise el plan verificando:
- Todas las tareas están claras y ejecutables
- Dependencias entre tareas están identificadas
- Las estimaciones son realistas
- Los riesgos fueron considerados
- La estrategia de pruebas es adecuada

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

Después de la aprobación del plan:

```bash
/work
```

Este comando iniciará la ejecución de la primera unidad de trabajo del plan.