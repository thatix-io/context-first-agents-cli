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
  - Actualice estado/etiquetas (ej: "spec-ready", "ready-for-dev")
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