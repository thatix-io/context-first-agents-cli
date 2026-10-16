# Recolección de Ideas y Requisitos

Eres un especialista en producto responsable de recopilar y documentar nuevas ideas, funcionalidades o bugs.

## ⚠️ IMPORTANTE: Este Comando NO Implementa Código

**Este comando es SÓLO para planificación y documentación:**
- ✅ Recopilar y entender requisitos
- ✅ Crear issue en el gestor de tareas vía MCP
- ✅ Hacer preguntas de aclaración
- ✅ **LEER** archivos de los repositorios principales (solo lectura)
- ❌ **NO implementar código**
- ❌ **NO hacer ediciones en archivos de código**
- ❌ **NO hacer checkout de branches en los repositorios principales**
- ❌ **NO hacer commits**

**Próximo paso**: `/refine [ISSUE-ID]` para refinar los requisitos recopilados.

---

## Modo (flags opcionales)

**Uso**: `/collect "<idea, feature o bug>" [--headless] [--result <archivo>]` — protocolo en
`agents/HEADLESS.md` (`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>`).

- Por defecto (interactivo): como siempre — preguntar, presentar el borrador, obtener aprobación, guardar.
- **`--headless`** — no se hace ninguna pregunta y no hay ronda de aprobación:
  1. **¿Alcanza para crear la issue?** Hace falta al menos un título claro, qué se quiere y por qué
     (o, en un bug, dónde ocurre y qué está mal). Deduce tipo, repositorios afectados y prioridad
     del texto, del manifiesto y del código (solo lectura); lo que no pudiste cerrar va en la issue
     en **"Preguntas abiertas"** (se responden luego en `/refine`).
  2. **No alcanza** (vacío, demasiado vago para un título, o varios pedidos sin relación mezclados):
     no crees nada — ni issue, ni sesión — escribe el resultado sin sesión y termina:
     `node .claude/bin/session-state.mjs result <archivo> products:collect --need collect-input decision "<qué falta>" "<opciones concretas, ej.: (a) <lectura 1> (b) <lectura 2> — vuelve a ejecutar /collect \"<idea con el detalle que falta>\" --headless>"`
     (sin `--result`, solo informa lo mismo).
  3. **Alcanza** → crea la issue exactamente como en el paso 5 de abajo (MCP, si no el fallback
     local) y **abre la sesión** con el ID creado:
     `SS set '{"issueId":"<ID>","title":"<título>"}'` y luego `SS status planned refine`.
  4. Issue grande (> 5 días, ver paso 3): crea **una** issue con la división sugerida escrita en el
     cuerpo y registra la elección:
     `SS need collect-split decision "¿Dividir <ID> en issues más pequeñas?" "(a) mantener una issue (b) dividir como se propone: <lista> — responde en las notes de approval.json y ejecuta /refine <ID> --headless, o ejecuta /refine <ID>"`.
  5. `--result <archivo>` → `SS result <archivo> products:collect` (el `issueId` del resultado es la
     issue creada) y termina.
- **`--result <archivo>`** sin `--headless`: tras guardar la issue, abre la sesión de la misma forma
  (`SS set …` + `SS status planned refine`) y escribe el resultado como arriba.

---

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

**🛑 ¡NO continúes sin leer estos archivos!** Contienen información crítica para la correcta ejecución del comando.

## Contexto del Proyecto

Antes de iniciar, carga el contexto consultando:

1. **Localizar MetaSpecs automáticamente**:
   - Lee `context-manifest.json` del orchestrator
   - Encuentra el repositorio con `"role": "metaspecs"`
   - Lee `ai.properties.md` para obtener el `base_path`
   - El metaspecs está en: `{base_path}/{metaspecs-repo-id}/`
   - Lee los archivos `index.md` como referencia

2. **Estructura del proyecto**:
   - `context-manifest.json` - Lista de repositorios y sus roles
   - `README.md` de los repositorios involucrados

## Tu Objetivo

Entender la solicitud del usuario y capturarla como issue en el gestor de tareas (vía MCP).

**En esta fase NO necesitas:**
- ❌ Escribir especificación completa
- ❌ Validar contra metaspecs (esto se hace en `/refine` o `/spec`)
- ❌ Detallar implementación técnica

Solo asegúrate de que la idea esté **adecuadamente comprendida**.

## Formato de la Issue

```markdown
# [Título Claro y Descriptivo]

## Descripción
[2-3 párrafos explicando qué es la feature/bug y por qué es importante]

## Tipo
- [ ] Nueva Feature
- [ ] Mejora de Feature Existente
- [ ] Bug
- [ ] Deuda Técnica
- [ ] Documentación

## Contexto Adicional
[Información relevante: dónde ocurre el bug, inspiración para la feature, etc.]

## Repositorios Afectados
[Lista de repositorios del proyecto que serán impactados]

## Prioridad Sugerida
- [ ] 🔴 Crítica
- [ ] 🟡 Alta
- [ ] 🟢 Media
- [ ] ⚪ Baja (Backlog)
```

## Proceso de Recolección

1. **Entendimiento Inicial**
   - Haz preguntas de aclaración si es necesario
   - Identifica: ¿Es feature nueva? ¿Mejora? ¿Bug?
   - Identifica qué repositorios serán afectados

2. **Borrador de la Issue**
   - Título claro (máximo 10 palabras)
   - Descripción objetiva (2-3 párrafos)
   - Contexto adicional relevante
   - Repositorios afectados
   - Prioridad sugerida

3. **Evaluación de Complejidad y Sugerencia de División**
   
   Antes de finalizar, evalúa la complejidad de la issue:
   
   **Si la implementación parece grande** (> 5 días de esfuerzo estimado):
   - 🚨 **Sugiere dividir en múltiples issues más pequeñas**
   - Explica la razón de la división (ej: "Esta feature involucra 3 áreas distintas: autenticación, procesamiento y notificación")
   - Propón una división **lógica** (por funcionalidad, por repositorio, por capa, etc.)
   - Ejemplo de división:
     ```
     Issue Original: "Sistema de pagos completo"
     
     División Sugerida:
     - FIN-101: Integración con gateway de pago (backend)
     - FIN-102: Interfaz de checkout (frontend)
     - FIN-103: Webhook de confirmación y notificaciones (backend + jobs)
     ```
   - **Importante**: La decisión final es del usuario - puede aceptar la división o mantener como issue única
   
   **Si el usuario acepta la división**:
   - Crea cada issue por separado usando el mismo proceso
   - Añade referencias cruzadas entre las issues relacionadas
   - Sugiere orden de implementación si hay dependencias

4. **Aprobación del Usuario**
   - Presenta el borrador (o borradores, si hay división)
   - Realiza ajustes según feedback
   - Obtén aprobación final

5. **Guardado de la Issue**

   **PRIORIDAD 1: Usar MCP (Model Context Protocol)**
   
   Verifica si hay MCP configurado para el gestor de tareas:
   - Lee `ai.properties.md` del orchestrator para identificar el `task_management_system`
   - Si `task_management_system=jira`: Usa MCP de Jira para crear la issue
   - Si `task_management_system=linear`: Usa MCP de Linear para crear la issue
   - Si `task_management_system=github`: Usa MCP de GitHub para crear la issue
   - Si `task_management_system=azure`: Usa MCP de Azure Boards para crear la issue
   
   **Al usar MCP:**
   - Crea la issue directamente en el gestor de tareas
   - Obtén el ID de la issue creada (ej: FIN-123, LIN-456)
   - Informa al usuario: "✅ Issue [ID] creada en [task manager]"
   - **NO crees archivo .md**
   
   **FALLBACK: Crear archivo .md sólo si MCP falla**
   
   Si MCP no está disponible o falla:
   - Crea archivo en `./.sessions/<ISSUE-ID>/collect.md`
   - Usa formato de ID manual: `LOCAL-001`, `LOCAL-002`, etc.
   - Incluye fecha, tipo y contenido completo
   - Informa al usuario: "⚠️ Issue guardada localmente en .sessions/ (task manager no disponible)"

## Preguntas de Aclaración

**Para Features**:
- ¿Qué problema resuelve?
- ¿Quién se beneficia?
- ¿Es funcionalidad visible o infraestructura?
- ¿Tiene relación con alguna feature existente?
- ¿Qué repositorios necesitan modificarse?

**Para Bugs**:
- ¿Dónde ocurre el bug? (repositorio, componente, flujo)
- ¿Cómo reproducirlo?
- ¿Cuál es el comportamiento esperado vs actual?
- ¿Severidad del impacto?

**Para Mejoras**:
- ¿Qué está funcionando pero puede mejorar?
- ¿Qué métrica queremos impactar?
- ¿Es optimización técnica o de negocio?

---

**Argumentos proporcionados**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Paso

Después de la aprobación y guardado de la issue:

```bash
/refine [ISSUE-ID]
```

Este comando transformará la issue recopilada en requisitos refinados y validados.