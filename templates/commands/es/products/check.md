# Validación contra MetaSpecs

Este comando valida requisitos, decisiones o implementaciones contra las metaspecs del proyecto.

## ⚠️ IMPORTANTE: Modo de Operación

**Este comando es para VALIDACIÓN:**
- ✅ Validar contra metaspecs
- ✅ **LEER** archivos de los repositorios (solo lectura)
- ✅ Generar informe de validación
- ❌ **NO hacer checkout de branches en los repositorios principales**
- ❌ **NO modificar código**
- ❌ **NO modificar `context.md` o `architecture.md`**

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


## 🎯 Objetivo

Garantizar alineación con:
- Estrategia de producto
- Arquitectura técnica
- Estándares y convenciones
- ADRs (Architecture Decision Records)

## 📋 Cuándo Usar

Ejecute este comando:
- Después de `/spec` - validar PRD
- Después de `/plan` - validar plan técnico
- Durante `/work` - validar decisiones de implementación
- Antes de `/pr` - validación final

## 📚 Cargar MetaSpecs

**Localizar MetaSpecs automáticamente**:
1. Lea `context-manifest.json` del orchestrator
2. Encuentre el repositorio con `"role": "metaspecs"`
3. Lea `ai.properties.md` para obtener el `base_path`
4. El metaspecs está en: `{base_path}/{metaspecs-repo-id}/`

## 🔍 Proceso de Validación

### 1. Identificar MetaSpecs Disponibles

Navegue hasta el directorio de metaspecs e identifique qué metaspecs existen:

```bash
ls -la {base_path}/{metaspecs-repo-id}/
```

### 2. Validación de Negocio

Si existen metaspecs de negocio (`repositorio de MetaSpecs (sección de negocio)`):

```markdown
## Validación de Negocio

### Estrategia de Producto
- **Archivo**: `repositorio de MetaSpecs (sección de negocio)PRODUCT_STRATEGY.md`
- **Validación**: [¿Esta feature está alineada con la estrategia?]
- **Estado**: ✅ Alineado / ⚠️ Parcialmente / ❌ Desalineado
- **Notas**: [Observaciones]

### Personas
- **Archivo**: `repositorio de MetaSpecs (sección de negocio)CUSTOMER_PERSONAS.md`
- **Validación**: [¿Atiende a la persona correcta?]
- **Estado**: ✅ Alineado / ⚠️ Parcialmente / ❌ Desalineado
- **Notas**: [Observaciones]

### Métricas
- **Archivo**: `repositorio de MetaSpecs (sección de negocio)PRODUCT_METRICS.md`
- **Validación**: [¿Métrica de éxito está documentada?]
- **Estado**: ✅ Alineado / ⚠️ Parcialmente / ❌ Desalineado
- **Notas**: [Observaciones]
```

### 3. Validación Técnica

Si existen metaspecs técnicas (`repositorio de MetaSpecs (sección técnica)`):

```markdown
## Validación Técnica

### Stack Tecnológica
- **Archivo**: `repositorio de MetaSpecs (sección técnica)meta/stack.md`
- **Validación**: [¿Usa solo tecnologías aprobadas?]
- **Estado**: ✅ Conforme / ⚠️ Excepción justificada / ❌ No conforme
- **Notas**: [Tecnologías usadas y justificaciones]

### Arquitectura
- **Archivo**: `repositorio de MetaSpecs (sección técnica)ARCHITECTURE.md`
- **Validación**: [¿Sigue patrones arquitectónicos?]
- **Estado**: ✅ Conforme / ⚠️ Parcialmente / ❌ No conforme
- **Notas**: [Observaciones]

### ADRs (Architecture Decision Records)
- **Directorio**: `repositorio de MetaSpecs (sección técnica)adr/`
- **Validación**: [¿Respeta decisiones arquitectónicas documentadas?]
- **ADRs Relevantes**: [Lista de ADRs verificados]
- **Estado**: ✅ Conforme / ⚠️ Conflicto menor / ❌ Conflicto crítico
- **Notas**: [Observaciones]

### Reglas de Negocio
- **Archivo**: `repositorio de MetaSpecs (sección técnica)BUSINESS_LOGIC.md`
- **Validación**: [¿Implementa reglas de negocio correctamente?]
- **Estado**: ✅ Conforme / ⚠️ Parcialmente / ❌ No conforme
- **Notas**: [Observaciones]
```

### 4. Validación de Estándares

```markdown
## Validación de Estándares

### Código
- **Archivo**: `repositorio de MetaSpecs (sección técnica)CODE_STANDARDS.md`
- **Validación**: [¿Sigue estándares de código?]
- **Estado**: ✅ Conforme / ⚠️ Pequeñas desviaciones / ❌ No conforme

### Pruebas
- **Archivo**: `repositorio de MetaSpecs (sección técnica)TEST_STANDARDS.md`
- **Validación**: [¿Estrategia de pruebas adecuada?]
- **Estado**: ✅ Conforme / ⚠️ Parcialmente / ❌ No conforme

### Documentación
- **Archivo**: `repositorio de MetaSpecs (sección técnica)DOC_STANDARDS.md`
- **Validación**: [¿Documentación adecuada?]
- **Estado**: ✅ Conforme / ⚠️ Parcialmente / ❌ No conforme
```

### 5. Identificación de Conflictos

Si hay conflictos o desalineamientos:

```markdown
## Conflictos Identificados

### Conflicto 1: [Descripción]
- **Severidad**: Crítico / Alto / Medio / Bajo
- **Metaspec**: [Archivo que está siendo violado]
- **Descripción**: [Detalle del conflicto]
- **Recomendación**: [Cómo resolver]

### Conflicto 2: [Descripción]
[Mismo formato arriba]
```

### 6. Excepciones Justificadas

Si hay desviaciones justificadas:

```markdown
## Excepciones Justificadas

### Excepción 1: [Descripción]
- **Metaspec**: [Archivo que está siendo desviado]
- **Desvío**: [Qué está diferente]
- **Justificación**: [Por qué es necesario]
- **Aprobación**: [Quién aprobó]
- **Documentación**: [Dónde fue documentado]
```

## 📄 Guardado del Informe de Validación

**PRIORIDAD 1: Usar MCP (Model Context Protocol)**

- Lea `ai.properties.md` del orchestrator para identificar el `task_management_system`
- Use el MCP apropiado para añadir el informe a la issue:
  - Añada como comentario en la issue
  - Actualice labels/tags según resultado (ej: "validated", "needs-adjustment", "blocked")
  - Si hay conflictos críticos, actualice el estado de la issue
- Informe al usuario: "✅ Informe de validación añadido a la issue [ID]"

**FALLBACK: Crear archivo .md solo si MCP falla**

Si el MCP no está disponible o falla, cree `./.sessions/<ISSUE-ID>/check-report.md`:

```markdown
# Informe de Validación - [ISSUE-ID]

**Fecha**: [fecha/hora]
**Fase**: [spec/plan/work/pre-pr]

## Estado General
✅ Validado / ⚠️ Validado con reservas / ❌ No validado

## Validaciones Realizadas
- Negocio: ✅ / ⚠️ / ❌
- Técnica: ✅ / ⚠️ / ❌
- Estándares: ✅ / ⚠️ / ❌

## Conflictos
[Lista de conflictos, si los hay]

## Excepciones
[Lista de excepciones justificadas, si las hay]

## Recomendaciones
1. [Recomendación 1]
2. [Recomendación 2]

## Aprobación
- [ ] Aprobado para continuar
- [ ] Requiere ajustes
- [ ] Bloqueado
```

Informe al usuario: "⚠️ Informe guardado localmente en .sessions/ (gestor de tareas no disponible)"

## 🚨 Acción en Caso de Conflictos

Si se encuentran conflictos críticos:
1. 🛑 **DETENGA** el proceso actual
2. 📝 **DOCUMENTE** todos los conflictos
3. 💬 **ALERTE** al usuario y stakeholders
4. **Vía MCP**: Actualice el estado de la issue a "Bloqueado" o "Requiere Ajustes"
5. 🔄 **AJUSTE** el plan/implementación según sea necesario
6. ✅ **REVALIDE** tras los ajustes

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Resultado

Después de la validación:
- Si ✅: Continúe a la siguiente fase
- Si ⚠️: Documente reservas y continúe con aprobación
- Si ❌: Corrija conflictos antes de continuar