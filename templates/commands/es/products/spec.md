# Creación de Especificación (PRD)

Este comando crea la especificación completa (Product Requirements Document) de la funcionalidad.

## ⚠️ IMPORTANTE: Este Comando NO Implementa Código

**Este comando es SÓLO para documentación de requisitos:**
- ✅ Crear PRD (Product Requirements Document)
- ✅ Actualizar issue en el gestor de tareas vía MCP
- ✅ **LEER** archivos de los repositorios principales (solo lectura)
- ❌ **NO implementar código**
- ❌ **NO hacer ediciones en archivos de código**
- ❌ **NO hacer checkout de branches en los repositorios principales**
- ❌ **NO hacer commits**

**Próximo paso**: `/orchestrate <ISSUE-ID>` para derivar el grafo de agentes y ejecutar (recomendado). `/start` queda como escape hatch manual.

---

## Modo y estado de la sesión

**Uso**: `/spec <ISSUE-ID> [--headless] [--result <archivo>]` — protocolo en
`agents/HEADLESS.md` (`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>`;
prefijo de los ítems `spec-`). El PRD es parte de la etapa de producto, así que la fase sigue en `refine`.

- Al iniciar: `SS set '{"issueId":"<ISSUE-ID>"}'` y luego `SS status running refine`. Si `SS show`
  lista ítems `spec-*` pendientes, consume la respuesta primero (`SS apply-approval`, ver
  `agents/HEADLESS.md`) — las `notes` son las respuestas de la persona.
- Por defecto (interactivo): como siempre. Cuando el PRD esté guardado y aprobado: `SS status done refine`.
- **`--headless`** — no se hace ninguna pregunta y no hay revisión con stakeholders en la conversación:
  - Sin requisitos refinados (`refined.md` / issue refinada) →
    `SS need spec-refine-missing decision "<ISSUE-ID> no tiene requisitos refinados" "(a) ejecutar /refine <ISSUE-ID> antes (recomendado) (b) escribir el PRD a partir de la issue tal como está — <cómo responder>"` y termina.
  - Requisito, regla o elección técnica que el PRD no puede cerrar con los requisitos refinados y
    las metaspecs → escríbelo en `.sessions/<ISSUE-ID>/spec-questions.md` y
    `SS need spec-<slug> decision "<pregunta>" "(a) … (b) … — <cómo responder>" spec-questions.md`;
    termina tras registrarlos todos.
  - Nada abierto → guarda el PRD en `.sessions/<ISSUE-ID>/prd.md` (siempre, en este modo) y registra
    el gate de revisión: `SS need spec-approval approval "PRD listo para aprobación" "Lee prd.md; aprueba con approval.json (approved: true, ajustes en notes) y ejecuta /spec <ISSUE-ID> --headless — approved: false rechaza" prd.md`.
  - Nueva ejecución tras aprobarse `spec-approval`: aplica los ajustes de las `notes`, guarda en el
    gestor de tareas (sección "Guardado del PRD", incl. el disparador `spec_ready`) y `SS status done refine`.
- **`--result <archivo>`**: la última acción es `SS result <archivo> products:spec` (éxito,
  detención o falla).

---

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

## 📋 Pre-requisitos

- Issue refinada vía `/refine`
- Aprobación para continuar con la funcionalidad

## 📚 Cargar MetaSpecs

**Localizar MetaSpecs automáticamente**:
1. Lea `context-manifest.json` del orquestador
2. Encuentre el repositorio con `"role": "metaspecs"`
3. Lea `ai.properties.md` para obtener el `base_path`
4. El metaspecs está en: `{base_path}/{metaspecs-repo-id}/`
5. Lea los archivos `index.md` relevantes para asegurar conformidad con:
   - Arquitectura del sistema
   - Patrones de diseño
   - Restricciones técnicas
   - Convenciones del proyecto

## 🎯 Objetivo

Crear un PRD completo que servirá como fuente única de verdad para la implementación.

## 📝 Estructura del PRD

### 1. Visión General

```markdown
# [Título de la Funcionalidad]

## Contexto
[¿Por qué estamos construyendo esto? ¿Qué problema resuelve?]

## Objetivo
[¿Qué queremos lograr con esta funcionalidad?]

## Métricas de Éxito
- [Métrica 1]: [Cómo medir]
- [Métrica 2]: [Cómo medir]
```

### 2. Requisitos Funcionales

```markdown
## Requisitos Funcionales

### RF-01: [Nombre del Requisito]
**Descripción**: [Descripción detallada]
**Prioridad**: Must Have / Should Have / Could Have
**Repositorios**: [repos afectados]

### RF-02: [Nombre del Requisito]
**Descripción**: [Descripción detallada]
**Prioridad**: Must Have / Should Have / Could Have
**Repositorios**: [repos afectados]
```

### 3. Requisitos No Funcionales

```markdown
## Requisitos No Funcionales

### Performance
- [Requisito de performance]

### Seguridad
- [Requisito de seguridad]

### Accesibilidad
- [Requisito de accesibilidad]

### Escalabilidad
- [Requisito de escalabilidad]
```

### 4. Flujos de Usuario

```markdown
## Flujos de Usuario

### Flujo Principal
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Flujos Alternativos
**Escenario**: [Nombre del escenario]
1. [Paso 1]
2. [Paso 2]

### Manejo de Errores
**Error**: [Tipo de error]
**Comportamiento**: [Cómo debe reaccionar el sistema]
```

### 5. Especificación Técnica

```markdown
## Especificación Técnica

### Arquitectura

#### <repo-1>
- **Componentes nuevos**: [lista]
- **Componentes modificados**: [lista]
- **APIs**: [endpoints nuevos/modificados]

#### <repo-2>
- **Componentes nuevos**: [lista]
- **Componentes modificados**: [lista]
- **APIs**: [endpoints nuevos/modificados]

### Integraciones
- **Entre repos**: [cómo se comunican los repos]
- **Externas**: [APIs externas, si las hay]

### Modelo de Datos
[Describa cambios en el modelo de datos, si los hay]
```

### 6. Criterios de Aceptación

```markdown
## Criterios de Aceptación

### Funcional
- [ ] [Criterio específico y comprobable]
- [ ] [Criterio específico y comprobable]

### Técnico
- [ ] Pruebas unitarias con cobertura >= X%
- [ ] Pruebas de integración implementadas
- [ ] Performance dentro de los requisitos
- [ ] Documentación actualizada

### Calidad
- [ ] Code review aprobado
- [ ] Sin regresiones
- [ ] Accesibilidad validada
```

### 7. Fuera del Alcance

```markdown
## Fuera del Alcance

Funcionalidades que NO serán implementadas en esta versión:
- [Ítem 1]
- [Ítem 2]

Justificación: [Por qué quedan para después]
```

### 8. Riesgos y Mitigaciones

```markdown
## Riesgos y Mitigaciones

### Riesgo 1: [Descripción]
- **Probabilidad**: Alta / Media / Baja
- **Impacto**: Alto / Medio / Bajo
- **Mitigación**: [Cómo mitigar]

### Riesgo 2: [Descripción]
- **Probabilidad**: Alta / Media / Baja
- **Impacto**: Alto / Medio / Bajo
- **Mitigación**: [Cómo mitigar]
```

### 9. Dependencias

```markdown
## Dependencias

### Técnicas
- [Dependencia técnica 1]
- [Dependencia técnica 2]

### De Negocio
- [Dependencia de negocio 1]
- [Dependencia de negocio 2]

### Bloqueadores
- [Bloqueador 1 y plan para resolver]
```

### 10. Plan de Pruebas

```markdown
## Plan de Pruebas

### Pruebas Unitarias
- [Área 1 a probar]
- [Área 2 a probar]

### Pruebas de Integración
- [Escenario 1]
- [Escenario 2]

### Pruebas Manuales
- [Escenario 1]
- [Escenario 2]
```

## 📄 Guardado del PRD

**PRIORIDAD 1: Usar MCP (Model Context Protocol)**

- Lea `ai.properties.md` del orquestador para identificar el `task_management_system`
- Use el MCP apropiado para actualizar la issue con el PRD:
  - Añada el PRD completo como comentario en la issue
  - O adjunte como archivo (si el gestor de tareas lo soporta)
  - **Mueve la tarea** — disparador `spec_ready`: sigue `agents/TASK-STATUS.md` (usa el
    estado que TÚ mapeaste en `ai.properties.md`, no un nombre fijo; omite si no hay tracker).
- Informe al usuario: "✅ PRD añadido a la issue [ID]"

**FALLBACK: Crear archivo .md sólo si MCP falla**

Si MCP no está disponible o falla:
- Guarde en `./.sessions/<ISSUE-ID>/prd.md`
- Informe al usuario: "⚠️ PRD guardado localmente en .sessions/ (gestor de tareas no disponible)"

## 🔍 Revisión y Aprobación

Antes de finalizar:
1. Revise el PRD con stakeholders
2. Valide contra metaspecs (si están disponibles)
3. Obtenga aprobación para iniciar implementación
4. **Vía MCP**: Actualice la issue en el gestor de tareas con estado "Listo para Desarrollo"
5. **Fallback**: Documente la aprobación en `./.sessions/<ISSUE-ID>/prd.md`

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

Después de la aprobación del PRD, ejecuta:

```bash
/orchestrate <ISSUE-ID>
```

Esto deriva el grafo mínimo de agentes desde la spec y lo ejecuta. `/start` + `/plan` + `/work` quedan disponibles como escape hatches manuales.

Este comando iniciará el desarrollo de la funcionalidad.