# Inicio del Desarrollo

Este comando inicia el desarrollo de una funcionalidad en el workspace actual.

## 📍 IMPORTANTE: Entienda la Estructura

**Workspace** (donde trabajará):
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree con branch feature/<ISSUE-ID>
├── repo-2/          # worktree con branch feature/<ISSUE-ID>
├── context.md       # contexto (inmutable - creado por este comando)
├── architecture.md  # arquitectura (inmutable - creado por este comando)
└── plan.md          # plan (mutable - creado por /plan)
```

**Repositorios principales** (solo lectura):
```
{base_path}/repo-1/  # repo principal (branch main/master)
{base_path}/repo-2/  # repo principal (branch main/master)
```

**REGLA DE ORO**:
- ✅ Lea metaspecs y código de los repositorios principales (read-only)
- ✅ Cree `context.md` y `architecture.md` en `.sessions/<ISSUE-ID>/`
- ❌ NUNCA haga checkout en los repositorios principales
- ❌ NUNCA modifique código en este comando (use `/work` después)

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

Después de leer los archivos, tendrá:
- ✅ Lista completa de repositorios del proyecto
- ✅ Ubicación del repositorio de metaspecs
- ✅ Base path para localizar repositorios
- ✅ Sistema de gestión de tareas configurado
- ✅ Configuraciones específicas del proyecto

**🛑 NO continúe sin leer estos archivos!** Contienen información crítica para la correcta ejecución del comando.

## 📚 Cargar MetaSpecs

**Localizar MetaSpecs automáticamente**:
1. Lea `context-manifest.json` del orchestrator
2. Encuentre el repositorio con `"role": "metaspecs"`
3. Lea `ai.properties.md` para obtener el `base_path`
4. El metaspecs está en: `{base_path}/{metaspecs-repo-id}/`
5. Lea los archivos `index.md` relevantes:
   - Contexto de negocio
   - Stack, arquitectura y patrones técnicos
   - Convenciones del proyecto
   - ADRs (Architecture Decision Records)

## 🎯 Contexto del Proyecto

Antes de iniciar, cargue el contexto consultando:
- `context-manifest.json` - Estructura de repositorios
- MetaSpecs (ubicado arriba) - Arquitectura y patrones
- `directorio del workspace` - Información del workspace actual

## ⚙️ Configuración Inicial

1. **Verificar Workspace**:
   - Confirme que está en el workspace correcto (verifique `directorio del workspace`)
   - Liste los repositorios disponibles en el workspace

2. **Verificar Branches**:
   - Para cada repositorio en el workspace, verifique la branch actual
   - Confirme que todas las branches están sincronizadas

3. **Cargar Especificación**:
   - **Si el task manager está configurado**: Lea la issue usando el MCP apropiado
   - **Si no**: Pida al usuario el archivo de especificación o descripción de la feature

4. **Actualizar Estado** (si el task manager está configurado):
   - Mueva la issue a "En Progreso"

## 📋 Análisis y Entendimiento

Analice la especificación y construya un entendimiento completo respondiendo:

### Negocio
- **¿Por qué** se está construyendo esto?
- **¿Quién** se beneficia?
- **¿Qué** métrica queremos impactar?

### Funcional
- **¿Cuál es el resultado esperado**? (comportamiento del usuario, output del sistema)
- **¿Qué componentes** serán creados/modificados en cada repositorio?
- **¿Qué integraciones** entre repositorios son necesarias?

### Técnico
- **¿Stack aprobada**? Verificar contra especificaciones técnicas
- **¿Patrones arquitectónicos**? Verificar ADRs (si están disponibles)
- **¿Dependencias nuevas**? Justificar y documentar
- **¿Cómo probar**? (según patrones del proyecto)

### Validación contra MetaSpecs

Si metaspecs están disponibles, validar:
- ¿Está alineado con estrategia y roadmap?
- ¿Usa stack tecnológica aprobada?
- ¿Respeta Architecture Decision Records?
- ¿Sigue reglas de negocio documentadas?

## 🤔 Preguntas de Aclaración

Después del análisis inicial, formule **3-5 aclaraciones más importantes**:

**Ejemplos de preguntas relevantes**:
- ¿Qué repositorio debe contener la lógica principal?
- ¿Cómo deben comunicarse los repositorios?
- ¿Hay dependencias entre los cambios en los diferentes repos?
- ¿Cuál es el orden de implementación recomendado?
- ¿Hay impacto en APIs o contratos entre servicios?

## 💾 Creación del Context.md

**IMPORTANTE**: Este archivo es **INMUTABLE** tras la aprobación. No debe ser modificado por comandos subsecuentes.

Cree el archivo `./.sessions/<ISSUE-ID>/context.md` con:

```markdown
# Context: [Nombre de la Feature]

## Por Qué
[Valor de negocio, persona atendida, métrica impactada]

## Qué
[Funcionalidades principales, comportamiento esperado]

## Cómo
[Enfoque técnico, componentes, repositorios afectados]

## Validación contra MetaSpecs
- [x] Alineado con estrategia de producto
- [x] Atiende a la persona correcta
- [x] Métrica impactada documentada
- [x] Usa stack aprobada
- [x] Respeta ADRs
- [x] Sin conflictos con limitaciones conocidas

## Dependencias
[Bibliotecas, APIs, componentes existentes]

## Restricciones
[Limitaciones técnicas, objetivos de performance, presupuesto]

## Pruebas
[E2E críticos, pruebas unitarias necesarias, cobertura esperada]
```

**Después de crear `context.md`, solicite revisión y aprobación del usuario antes de continuar.**

---

## 🏗️ Creación del Architecture.md

**IMPORTANTE**: Este archivo es **INMUTABLE** tras la aprobación. No debe ser modificado por comandos subsecuentes.

### Principios Arquitectónicos (OBLIGATORIO)

**ANTES de crear la arquitectura, DEBE:**

1. **Leer ADRs (Architecture Decision Records)**:
   - Liste ADRs en metaspecs
   - Lea TODOS los ADRs relevantes para la feature
   - Identifique restricciones y patrones obligatorios

2. **Consultar patrones arquitectónicos**:
   - Lea guías de estructura del proyecto en metaspecs
   - Lea patrones de código en metaspecs
   - Identifique patrones existentes en el código (use Glob/Grep para encontrar ejemplos similares)

3. **Validar cumplimiento con ADRs**:
   - Para cada ADR relevante, verifique si la solución propuesta respeta las decisiones
   - Documente el cumplimiento en architecture.md
   - Si hay violación, justifique o proponga corrección

4. **Analizar código existente**:
   - Use Glob/Grep para encontrar componentes/módulos similares
   - Entienda patrones y estructuras existentes
   - Alinee nueva implementación con patrones del proyecto

### Estructura del Documento de Arquitectura

Cree el archivo `./.sessions/<ISSUE-ID>/architecture.md` con:

```markdown
# Architecture: [Nombre de la Feature]

## Visión General
[Visión de alto nivel del sistema antes y después del cambio]

## Componentes Afectados
[Lista de componentes y sus relaciones, dependencias]

### Diagrama de Componentes
[Descripción textual o diagrama Mermaid de los componentes]

### Flujo de Datos
1. [Paso 1 del flujo]
2. [Paso 2 del flujo]
3. [Paso 3 del flujo]

## Estructura de Directorios Propuesta
[Basada en patrones del proyecto]

```
repo-1/
├── src/
│   ├── components/
│   │   └── NewComponent.tsx (CREAR)
│   └── services/
│       └── NewService.ts (CREAR)
```

## Patrones y Mejores Prácticas
[Patrones que serán mantenidos o introducidos]

## Validación de ADRs
[Lista de ADRs consultados y cumplimiento]

- [x] ADR-001: [Nombre] - Cumple
- [x] ADR-002: [Nombre] - Cumple

## Dependencias Externas
[Bibliotecas que serán usadas o añadidas]

## Decisiones Técnicas

### Decisión 1: [Título]
**Contexto**: [Por qué necesitamos decidir esto]
**Opciones consideradas**:
- Opción A: [Pros y contras]
- Opción B: [Pros y contras]
**Decisión**: [Opción elegida]
**Justificación**: [Por qué elegimos esta opción]

## Restricciones y Suposiciones
[Limitaciones técnicas y premisas]

## Trade-offs
[Alternativas consideradas y por qué no fueron elegidas]

## Consecuencias
**Positivas**:
- [Beneficio 1]
- [Beneficio 2]

**Negativas**:
- [Costo/limitación 1]
- [Costo/limitación 2]

## Archivos Principales
[Lista de los principales archivos a editar/crear]

- `repo-1/src/components/NewComponent.tsx` (CREAR)
- `repo-1/src/services/NewService.ts` (CREAR)
- `repo-2/src/controllers/NewController.ts` (CREAR)
```

**Después de crear `architecture.md`, solicite revisión y aprobación del usuario antes de continuar.**

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

**Después de la aprobación del usuario de los archivos `context.md` y `architecture.md`**:

```bash
/plan
```

Este comando creará la planificación técnica detallada de la implementación.

---

## ⚠️ IMPORTANTE: Archivos Inmutables

**`context.md` y `architecture.md` son INMUTABLES tras la aprobación.**

- ✅ Pueden ser LEÍDOS por comandos subsecuentes (`/plan`, `/work`)
- ❌ NO deben ser MODIFICADOS por ningún comando
- ❌ Si hay necesidad de cambio, discútalo con el usuario y cree nuevos archivos o actualice la issue en el task manager