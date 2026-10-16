# Refinamiento de Requisitos

Usted es un especialista en producto encargado de ayudar a refinar requisitos para el proyecto.

## ⚠️ IMPORTANTE: Este Comando NO Implementa Código

**Este comando es SÓLO para planificación y documentación:**
- ✅ Validar requisitos contra metaspecs
- ✅ Crear especificación refinada
- ✅ Guardar documentación en `.sessions/`
- ✅ Actualizar issue en el gestor de tareas
- ❌ **NO implementar código**
- ❌ **NO hacer ediciones en archivos de código**
- ❌ **NO ejecutar pruebas o deploy**

**Próximo paso**: `/spec [ISSUE-ID]` para crear PRD completo basado en los requisitos refinados.

---

## Modo y estado de la sesión

**Uso**: `/refine <ISSUE-ID> [--headless] [--result <archivo>]` — protocolo en
`agents/HEADLESS.md` (`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>`;
prefijo de los ítems `refine-`).

- Al iniciar: `SS set '{"issueId":"<ISSUE-ID>"}'` y luego `SS status running refine`. Si `SS show`
  lista ítems `refine-*` / `collect-*` pendientes, consume la respuesta primero (`SS apply-approval`,
  ver `agents/HEADLESS.md`) — las `notes` son las respuestas de la persona.
- Por defecto (interactivo): como siempre — toda pregunta se hace en la conversación. Cuando los
  requisitos refinados estén guardados: `SS status done refine`.
- **`--headless`** — no se hace ninguna pregunta. Responde lo que puedas con la issue, las
  metaspecs y el código (solo lectura); escribe lo que siga abierto en
  `.sessions/<ISSUE-ID>/refine-questions.md`, registra cada ítem y termina:
  - Aclaración (objetivo, valor, alcance, interacciones) que no puedes cerrar →
    `SS need refine-<slug> decision "<pregunta>" "(a) … (b) … (c) … — <cómo responder>" refine-questions.md`.
  - Conflicto con las metaspecs (Jidoka, paso 2) →
    `SS need refine-conflict decision "<qué conflictúa con qué spec/ADR>" "(a) ajustar el requisito a … (b) mantenerlo y registrar excepción/ADR (c) quitar … — <cómo responder>" refine-questions.md`.
  - División sugerida (> 5 días, paso 3) →
    `SS need refine-split decision "¿Dividir <ISSUE-ID>?" "(a) mantener una issue (b) dividir en: <lista> — <cómo responder>" refined.md`.
  - Nada abierto → escribe `refined.md` (marcado *borrador — esperando aprobación*) y registra el
    gate de aprobación en lugar de preguntar: `SS need refine-approval approval "Requisitos refinados listos para revisión" "Lee refined.md; aprueba con approval.json (approved: true, ajustes en notes) y ejecuta /refine <ISSUE-ID> --headless — approved: false rechaza" refined.md`.
  - Nueva ejecución tras aprobarse `refine-approval`: aplica los ajustes de las `notes` en
    `refined.md`, actualiza el gestor de tareas (paso 4) y `SS status done refine`.
- **`--result <archivo>`**: la última acción es `SS result <archivo> products:refine` (éxito,
  detención o falla).

---

## 📋 Configuración del Proyecto

**⚠️ IMPORTANTE: ¡Siempre lea los archivos de configuración del proyecto ANTES de ejecutar este comando!**

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

Después de leer los archivos, usted tendrá:
- ✅ Lista completa de repositorios del proyecto
- ✅ Ubicación del repositorio de metaspecs
- ✅ Base path para localizar repositorios
- ✅ Sistema de gestión de tareas configurado
- ✅ Configuraciones específicas del proyecto

**🛑 NO continúe sin leer estos archivos!** Contienen información crítica para la correcta ejecución del comando.


## Objetivo

Transformar un requisito inicial en especificación refinada y validada, lista para convertirse en un PRD completo.

## Proceso

### 1. Fase de Aclaración

Lea el requisito inicial y haga preguntas para alcanzar claridad total sobre:
- **Objetivo**: ¿Por qué construir esto?
- **Valor de Negocio**: ¿Qué métrica/persona impacta?
- **Alcance**: ¿Qué incluye y qué NO incluye?
- **Interacciones**: ¿Qué funcionalidades/componentes existentes se ven afectados?

Continúe haciendo preguntas hasta tener entendimiento completo.

### 2. Validación Contra Metaspecs

**IMPORTANTE**: Primero lea `ai.properties.md` para obtener el `base_path`. Los índices YA deben estar en contexto (usted ejecutó `/warm-up`). Consulte los índices y lea SÓLO los documentos relevantes para validar el requisito.

**Proceso de Validación**:

1. **Consulte los índices cargados** por `/warm-up`:
   - Lea `context-manifest.json` para encontrar el repositorio con `role: "metaspecs"`
   - Obtenga el `id` de ese repositorio (ej: "my-project-metaspecs")
   - Lea `ai.properties.md` para obtener el `base_path`
   - El repositorio de metaspecs está en: `{base_path}/{metaspecs-id}/`
   - Consulte `{base_path}/{metaspecs-id}/index.md` - Visión general del proyecto
   - Consulte índices específicos (ej: `specs/business/index.md`, `specs/technical/index.md`)

2. **Identifique documentos relevantes** para este requisito específico:
   - En `specs/business/`: ¿Qué documentos de negocio son relevantes?
   - En `specs/technical/`: ¿Qué documentos técnicos son relevantes?

3. **Lea SÓLO los documentos relevantes** identificados (¡no lea todo!)

4. **Valide el requisito** contra las metaspecs leídas:
   - ✅ Alineación con estrategia y visión de producto
   - ✅ Atiende necesidades de las personas correctas
   - ✅ Compatible con stack tecnológico aprobado
   - ✅ Respeta decisiones arquitectónicas (ADRs)
   - ✅ Sigue reglas de negocio existentes
   - ⚠️ Identifique conflictos o violaciones

**Si identifica violaciones**: 🛑 **PARE** y pida aclaración al usuario antes de continuar (Principio Jidoka).

### 3. Fase de Resumen y Aprobación

Una vez que haya recopilado información suficiente y validado contra metaspecs, presente un resumen estructurado con:
- **Feature**: Nombre de la funcionalidad
- **Objetivo**: Por qué construir (1-2 frases)
- **Valor de Negocio**: Métrica, persona, fase del roadmap (consulte metaspecs)
- **Alcance**: Qué INCLUYE y qué NO INCLUYE
- **Componentes Afectados**: Lista basada en la arquitectura actual (consulte metaspecs técnicas)
- **Validación contra Metaspecs**: ✅ Aprobado / ⚠️ Atención necesaria
- **Estimación de Esfuerzo**: Pequeño (< 1 día) / Medio (1-3 días) / Grande (3-5 días) / Muy Grande (> 5 días)

**Evaluación de Complejidad y Sugerencia de División**:

**Si la implementación parece grande** (> 5 días de esfuerzo estimado):
- 🚨 **Sugiera dividir en múltiples issues más pequeñas**
- Explique el razonamiento de la división (ej: "Esta feature involucra 3 áreas distintas que pueden implementarse independientemente")
- Proponga una división **lógica** basada en:
  - Funcionalidades independientes
  - Repositorios diferentes
  - Capas de la aplicación (backend, frontend, infra)
  - Fases de implementación (MVP, mejoras, optimizaciones)
- Ejemplo de división:
  ```
  Issue Original: "Sistema de notificaciones multicanal"
  
  División Sugerida:
  - FIN-201: Infraestructura de colas y workers (backend)
  - FIN-202: Notificaciones por email (backend + templates)
  - FIN-203: Notificaciones push (backend + mobile)
  - FIN-204: Preferencias de notificación (frontend + backend)
  ```
- **Importante**: La decisión final es del usuario - puede aceptar la división o mantener como issue única

**Si el usuario acepta la división**:
- Documente cada issue por separado
- Añada referencias cruzadas entre las issues relacionadas
- Sugiera orden de implementación si hay dependencias
- Cada issue dividida debe pasar por el mismo proceso de refinamiento

Solicite aprobación del usuario e incorpore feedback si es necesario.

**Consejo**: Puede investigar en el código base o internet antes de finalizar, si es necesario.

### 4. Guardado de los Requisitos Refinados

Una vez que el usuario apruebe, guarde los requisitos:

**IMPORTANTE**: Siempre cree backup local Y actualice el gestor de tareas (si está configurado).

**Proceso de Guardado**:

1. **SIEMPRE crear backup local primero**:
   - Cree archivo completo en `./.sessions/<ISSUE-ID>/refined.md` (ej: `./.sessions/FIN-5/refined.md`)
   - Donde `<ISSUE-ID>` es el ID de la issue (ej: FIN-5, FIN-123)
   - Incluya TODOS los detalles del refinamiento (backup completo)

2. **Si el gestor de tareas está configurado** (lea `ai.properties.md` para identificar `task_management_system`):
   - Identifique la herramienta MCP del gestor de tareas
   - **Actualice el BODY (descripción) de la issue** con versión CONCISA de los requisitos refinados
     - Para Jira: Use MCP de Jira con campo `description`
     - Para Linear: Use MCP de Linear con campo `description`
     - Para GitHub: Use MCP de GitHub con campo `body`
     - Para Azure Boards: Use MCP de Azure Boards con campo `description`
     - Incluya todo el contenido refinado en el campo description/body de la issue
     - Si el contenido es muy extenso y hay error de API, considere crear versión resumida
   - **SIEMPRE sobrescriba** el body existente (no añadir al final)

**Observación**:
- El backup local SIEMPRE está guardado y completo
- Si hay error de API, verifique manualmente si la issue fue actualizada en el gestor de tareas

**Plantilla de Salida**:

**IMPORTANTE**: La plantilla estándar para requisitos refinados puede estar documentada en el repositorio de metaspecs. Consulte `{base_path}/{metaspecs-id}/specs/refined/` o similar.

**Plantilla COMPLETA** (para backup local `.sessions/<ISSUE-ID>/refined.md`):
- **Metadatos**: Issue, ID, Task Manager, Proyecto, Fecha, Sprint, Prioridad
- **🎯 POR QUÉ**: Razones, valor de negocio, métrica, persona, alineamiento estratégico
- **📦 QUÉ**: Funcionalidades detalladas, componentes afectados, integraciones, alcance negativo completo
- **🔧 CÓMO**: Stack, patrones de código, estructura de archivos, dependencias, orden de implementación, modos de fallo, consideraciones de performance/costo/UX
- **✅ Validación contra Metaspecs**: Documentos consultados (business y technical), ADRs verificados, resultado de la validación
- **📊 Métricas de Éxito**: Técnicas, producto/UX, criterios de aceptación
- **🔄 Impacto en el Producto**: Alineamiento con objetivos, habilitadores, riesgos mitigados
- **⚠️ Limitaciones Conocidas**: Limitaciones del MVP
- **📝 Checklist de Implementación**: Tareas por área (backend, frontend, pruebas, seguridad, etc.)

**Plantilla para Gestor de Tareas**:
```markdown
# [Nombre Feature] - Requisitos Refinados

**Sprint X** | **Y días** | **Prioridad**

## Objetivo
[1-2 párrafos: qué es y por qué hacerlo]

## Alcance

### Principales Funcionalidades
- Funcionalidad 1: [resumen]
- Funcionalidad 2: [resumen]
- Validaciones/Guards: [resumen]

### Componentes Afectados
- Componente 1: [tipo de cambio]
- Componente 2: [tipo de cambio]

### Seguridad
✅ [item 1] ✅ [item 2] ✅ [item 3]

## Alcance Negativo
❌ [item 1] ❌ [item 2] ❌ [item 3]

## Stack
[Tech stack resumida por área]

## Estructura
[Árbol de archivos RESUMIDO - módulos principales solamente]

## Modos de Fallo (Evitar)
🔴 [crítico 1] 🔴 [crítico 2]
🟡 [medio 1] 🟡 [medio 2]

## Criterios de Aceptación
- [ ] [item 1]
- [ ] [item 2]
- [ ] [item 3]

## Validación
**ADRs**: [lista]
**Specs**: [principales]
**Estado**: ✅ Aprobado

**Impacto**: [resumen]
**Limitaciones**: [resumen]

---
📄 **Documento completo**: `.sessions/<ISSUE-ID>/refined.md`
```

**Audiencia**: Desarrollador IA con capacidades similares a las suyas. Sea conciso pero completo.

---

**Requisito para Refinar**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

**Tras la aprobación del usuario y el guardado de los requisitos refinados**, el flujo natural es:

```bash
/spec [ISSUE-ID]
```

**Ejemplo**: `/spec FIN-3`

Este comando creará un PRD (Product Requirements Document) completo basado en los requisitos refinados, detallando funcionalidades, user stories, criterios de aceptación y validaciones finales.