# Observabilidad de Decisiones

Este comando registra decisiones importantes tomadas durante el desarrollo, creando un registro auditable para explicabilidad y trazabilidad.

## 🎯 Objetivo

Crear un registro estructurado de decisiones técnicas y de producto, garantizando:
- **Explicabilidad**: Por qué se tomó cada decisión
- **Trazabilidad**: Qué fuentes (PRD, metaspecs, ADRs) fundamentaron la decisión
- **Auditoría**: Historial completo de elecciones para revisión futura
- **Aprendizaje**: Documentación de trade-offs y alternativas consideradas

**IMPORTANTE**: Este comando NO genera decisiones nuevas. Solo REGISTRA decisiones que ya fueron tomadas en el proceso de desarrollo.

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

Después de leer los archivos, tendrás:
- ✅ Lista completa de repositorios del proyecto
- ✅ Ubicación del repositorio de metaspecs
- ✅ Base path para localizar repositorios
- ✅ Sistema de gestión de tareas configurado
- ✅ Configuraciones específicas del proyecto

**🛑 NO continúe sin leer estos archivos!** Contienen información crítica para la correcta ejecución del comando.

## 📋 Pre-requisitos

- Haber ejecutado al menos uno de los comandos que generan decisiones:
  - `/spec` - genera PRD con decisiones de producto
  - `/plan` - genera plan.md con decisiones técnicas
  - `/work` - implementación genera decisiones durante el desarrollo

## 🔍 Proceso de Observación

### 1. Identificar Decisiones Relevantes

Analice los archivos de la sesión (`./.sessions/<ISSUE-ID>/`) para identificar decisiones:

**Después de `/spec`** - Decisiones de Producto:
- Lea `./.sessions/<ISSUE-ID>/prd.md`
- Identifique decisiones en:
  - Alcance (qué entra/no entra en la funcionalidad)
  - Personas atendidas (quién es el público objetivo)
  - Métricas de éxito (cómo medir resultados)
  - Requisitos no funcionales (performance, accesibilidad)
  - Restricciones y trade-offs

**Después de `/plan`** - Decisiones Técnicas:
- Lea `./.sessions/<ISSUE-ID>/plan.md`
- Identifique decisiones en:
  - Arquitectura de componentes/módulos
  - Elección de bibliotecas o herramientas
  - Patrones de implementación
  - Estructura de datos
  - Estrategia de pruebas

**Durante `/work`** - Decisiones de Implementación:
- Lea `./.sessions/<ISSUE-ID>/work.md`
- Identifique decisiones en:
  - Refactorizaciones realizadas
  - Cambios de enfoque
  - Optimizaciones aplicadas
  - Tratamiento de edge cases

### 2. Documentar Cada Decisión

Para cada decisión identificada, documente:

```markdown
## Decisión: [Título Claro]

**Contexto**: [¿Por qué necesitamos decidir esto? ¿Cuál es el problema o necesidad?]

**Opciones Consideradas**:
1. **Opción A**: [Descripción]
   - Pros: [ventajas]
   - Contras: [desventajas]
2. **Opción B**: [Descripción]
   - Pros: [ventajas]
   - Contras: [desventajas]

**Decisión**: [Opción elegida]

**Justificación**: [¿Por qué elegimos esta opción? ¿Qué criterios fueron más importantes?]

**Fuentes**:
- [PRD sección X]
- [Metaspec Y]
- [ADR-00Z]

**Trade-offs Aceptados**: [¿Qué desventajas aceptamos conscientemente?]

**Reversibilidad**: Fácil / Media / Difícil

**Fecha**: [fecha de la decisión]
```

### 3. Crear Registro de Decisiones

Guarde en `./.sessions/<ISSUE-ID>/decisions.md`:

```markdown
# Registro de Decisiones - [ISSUE-ID]

## Resumen
[Breve resumen de las principales decisiones tomadas en esta funcionalidad]

## Decisiones de Producto

### [Decisión 1]
[Según plantilla arriba]

### [Decisión 2]
[Según plantilla arriba]

## Decisiones Técnicas

### [Decisión 3]
[Según plantilla arriba]

### [Decisión 4]
[Según plantilla arriba]

## Decisiones de Implementación

### [Decisión 5]
[Según plantilla arriba]

## Lecciones Aprendidas
- [Lección 1]
- [Lección 2]

## Decisiones Pendientes
- [Decisión que aún necesita ser tomada]
```

## 📊 Análisis de Impacto

Para decisiones críticas, documente el impacto:

```markdown
## Análisis de Impacto

**Repositorios Afectados**: [lista]

**Componentes Impactados**: [lista]

**Dependencias Creadas**: [lista]

**Riesgos Introducidos**: [lista]

**Mitigaciones Aplicadas**: [lista]
```

## 🔄 Revisión de Decisiones

Periódicamente, revise las decisiones tomadas:
- ¿Siguen teniendo sentido?
- ¿Los trade-offs se demostraron correctos?
- ¿Hay aprendizajes para documentar?
- ¿Alguna decisión necesita ser revertida?

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Resultado

Después de ejecutar este comando, tendrás:
- Registro completo de decisiones en `./.sessions/<ISSUE-ID>/decisions.md`
- Trazabilidad de cada elección realizada
- Documentación para futuras referencias
- Base para ADRs (si las decisiones son de arquitectura)