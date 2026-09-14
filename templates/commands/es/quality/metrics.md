# Métricas de Calidad

Este comando recopila y analiza métricas de calidad del código y del proceso de desarrollo.

## 🎯 Objetivo

Medir y documentar la calidad de la implementación mediante métricas objetivas:
- Cobertura de pruebas
- Complejidad del código
- Deuda técnica
- Rendimiento
- Conformidad con estándares

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


## 📋 Requisitos Previos

- Implementación completada (después de `/work`)
- Pruebas implementadas
- Build funcionando

## 📊 Métricas a Recopilar

### 1. Cobertura de Pruebas

Para cada repositorio modificado:

```bash
cd <repositorio>

# Ejecutar pruebas con cobertura (ejemplos por stack):
# Node.js: npm run test:coverage / jest --coverage
# Python: pytest --cov=src tests/
# Java: mvn jacoco:report / gradle jacocoTestReport
# Go: go test -cover ./...
# Ruby: rspec --coverage
# Rust: cargo tarpaulin
# PHP: ./vendor/bin/phpunit --coverage-html coverage/
# C#: dotnet test /p:CollectCoverage=true

# Capturar resultados
```

Documente:
```markdown
## Cobertura de Pruebas

### <repo-1>
- **Cobertura Total**: X%
- **Statements**: X%
- **Branches**: X%
- **Functions**: X%
- **Lines**: X%
- **Archivos no cubiertos**: [lista]

### <repo-2>
[Mismo formato]
```

### 2. Complejidad del Código

Analice la complejidad ciclomática de los archivos modificados:

```markdown
## Complejidad del Código

### Archivos con Alta Complejidad
- **archivo1.ts**: Complejidad 15 (recomendado: < 10)
- **archivo2.ts**: Complejidad 12

### Recomendaciones
- [Sugerencia de refactorización 1]
- [Sugerencia de refactorización 2]
```

### 3. Calidad del Código

```bash
# Ejecutar linting (ejemplos por stack):
# Node.js: npm run lint / eslint .
# Python: flake8 . / pylint src/
# Java: mvn checkstyle:check
# Go: golangci-lint run
# Ruby: rubocop
# Rust: cargo clippy

# Verificar formato (ejemplos por stack):
# Node.js: prettier --check .
# Python: black --check .
# Java: mvn formatter:validate
# Go: gofmt -l .
# Ruby: rubocop --format-only
# Rust: cargo fmt --check

# Análisis estático (ejemplos por stack):
# Node.js: npm run analyze (si está configurado)
# Python: mypy src/ / bandit -r src/
# Java: mvn pmd:check / spotbugs:check
# Go: go vet ./...
# Ruby: brakeman (para Rails)
# Rust: cargo audit
```

Documente:
```markdown
## Calidad del Código

### Linting
- **Errores**: 0
- **Warnings**: X
- **Warnings Justificados**: [lista con justificaciones]

### Formato
- **Estado**: ✅ Conforme / ⚠️ Ajustes necesarios

### Análisis Estático
- **Problemas Críticos**: 0
- **Problemas Medios**: X
- **Problemas Bajos**: Y
```

### 4. Rendimiento

Si aplica, mida rendimiento:

```markdown
## Rendimiento

### Benchmarks
- **Operación X**: Yms (baseline: Zms)
- **Operación Y**: Yms (baseline: Zms)

### Optimizaciones Aplicadas
- [Optimización 1 e impacto]
- [Optimización 2 e impacto]

### Cuellos de Botella Identificados
- [Cuello de botella 1 y plan de mitigación]
```

### 5. Tamaño e Impacto

```markdown
## Tamaño e Impacto

### Líneas de Código
- **Agregadas**: +X líneas
- **Eliminadas**: -Y líneas
- **Modificadas**: Z líneas

### Archivos
- **Nuevos**: X archivos
- **Modificados**: Y archivos
- **Eliminados**: Z archivos

### Dependencias
- **Nuevas dependencias**: [lista]
- **Tamaño del bundle**: +X KB
```

### 6. Deuda Técnica

Identifique deuda técnica introducida o resuelta:

```markdown
## Deuda Técnica

### Deuda Introducida
- **Ítem 1**: [Descripción y justificación]
  - Severidad: Alta / Media / Baja
  - Plan de resolución: [cuándo y cómo resolver]

### Deuda Resuelta
- **Ítem 1**: [Qué fue resuelto]
  - Impacto: [mejora obtenida]
```

## 📄 Informe de Métricas

Cree `./.sessions/<ISSUE-ID>/metrics.md`:

```markdown
# Informe de Métricas - [ISSUE-ID]

**Fecha**: [fecha/hora]
**Repositorios**: [lista]

## Resumen Ejecutivo

- **Cobertura de Pruebas**: X% (meta: Y%)
- **Calidad del Código**: ✅ / ⚠️ / ❌
- **Rendimiento**: ✅ / ⚠️ / ❌
- **Deuda Técnica**: Baja / Media / Alta

## Métricas Detalladas

[Incluir todas las secciones anteriores]

## Comparación con Baseline

| Métrica | Antes | Después | Variación |
|---------|-------|---------|-----------|
| Cobertura | X% | Y% | +Z% |
| Complejidad Media | X | Y | +Z |
| Tamaño del Bundle | X KB | Y KB | +Z KB |

## Acciones Recomendadas

1. [Acción 1 - prioridad alta]
2. [Acción 2 - prioridad media]
3. [Acción 3 - prioridad baja]

## Aprobación para Merge

- [ ] Cobertura de pruebas >= meta
- [ ] Sin problemas críticos de calidad
- [ ] Rendimiento dentro de los requisitos
- [ ] Deuda técnica documentada y aprobada
```

## 🎯 Metas de Calidad

Si el proyecto tiene metas definidas en las metaspecs, valide:

```markdown
## Validación contra Metas

### Metas del Proyecto
- **Cobertura mínima**: 80%
- **Complejidad máxima**: 10
- **Rendimiento**: < 100ms

### Estado
- Cobertura: ✅ 85% (meta: 80%)
- Complejidad: ⚠️ 12 (meta: 10) - Justificado
- Rendimiento: ✅ 85ms (meta: 100ms)
```

## 🚨 Alertas

Si alguna métrica está fuera de lo aceptable:
1. 🛑 **DOCUMENTE** el problema
2. 💬 **ALERTE** al usuario
3. 🔧 **PROPONGA** acciones correctivas
4. ⏸️ **CONSIDERE** bloquear el merge hasta resolución

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Resultado

Después de ejecutar este comando, tendrás:
- Informe completo de métricas
- Comparación con baseline y metas
- Identificación de problemas de calidad
- Recomendaciones de acciones
- Base objetiva para aprobación de merge