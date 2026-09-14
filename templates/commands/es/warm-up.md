# Calentamiento — Carga de Contexto (índices para RAG)

Prepara el entorno cargando los **índices de las specs** en un mapa de contexto navegable.
El objetivo NO es volcar las specs en el contexto, sino cargar los **índices** para que los
comandos siguientes sepan **dónde buscar** cada información, bajo demanda.

**Argumentos**: `#$ARGUMENTS`

---

## 1. Cargar configuración

Lee del orquestador:
- **`context-manifest.json`** — `repositories[]` (id, role, hints), y el bloque
  `orchestration` (especialmente `indexes`).
- **`ai.properties.md`** — `base_path`, `task_management_system`.

Localiza el repo de specs: el de `role: "metaspecs"` (o `"specs-provider"`).

## 2. Descubrir los índices (dinámico — no exige ningún archivo fijo)

Arma la lista de índices a cargar, en este orden de prioridad, **saltando lo que no exista**:

1. Todas las rutas en `orchestration.indexes` del manifiesto (si están definidas).
2. Si no hay ninguna, o para complementar, **descubre** los índices en el repo de specs:
   - busca `index.md` / `INDEX.md` bajo `{base_path}/{metaspecs-id}/specs/` y subcarpetas
     (ej.: `specs/index.md`, `specs/technical/index.md`, `specs/business/index.md`,
     `specs/business/features/index.md`).
3. Incluye también, **si existen**, los archivos de `context[]` de cada repositorio del manifiesto.

> Degrada con gracia: si un índice esperado no existe, **sólo regístralo y continúa**.
> Nunca falles el calentamiento por la ausencia de un archivo específico.

## 3. Construir el Mapa de Contexto (el producto del calentamiento)

Lee SÓLO los índices descubiertos (no los documentos que apuntan). A partir de ellos,
arma y presenta un **mapa de RAG** — la "tabla de ruteo" del proyecto:

```
## Mapa de Contexto (RAG)

### Índices cargados
- specs/index.md            → raíz de navegación
- specs/technical/index.md  → arquitectura, API, ADRs, convenciones
- specs/business/index.md   → personas, journey, estrategia
- ...(sólo los que existen)

### Dónde buscar bajo demanda
| Necesidad                     | Consultar (vía índice)               |
|-------------------------------|--------------------------------------|
| Arquitectura / decisiones     | technical/index.md → ARCHITECTURE / ADRs |
| Contrato de API               | technical/index.md → API_SPECIFICATION   |
| Reglas de negocio / feature   | business/index.md → features/...     |
| Convenciones de código        | technical/index.md → guía de código  |

### Repositorios (del manifiesto)
- <repo-id> [role] — hints: ...
```

Si un índice referencia documentos que no existen en disco, márcalos como
`(referenciado, ausente)` — eso indica una spec incompleta, no un error del calentamiento.

## 4. Verificar repositorios y sesión

- Para cada repo del manifiesto, confirma que existe en `{base_path}/{repo-id}/`
  (no leas README ni código ahora — eso es bajo demanda).
- Si se pasó un ISSUE-ID, verifica `.sessions/<ISSUE-ID>/`.

## 5. Cómo los comandos siguientes usan esto

Comandos como `/spec`, `/orchestrate` y los agentes NO deben escanear el repo a ciegas.
Deben: consultar el Mapa de Contexto → abrir el índice relevante → seguir el link al
documento específico. El índice es lo que optimiza el RAG: cargar poco, navegar con precisión.

## 6. Principio Jidoka

Si detectas un problema estructural (ningún índice encontrado, specs-provider ausente):
**DETENTE**, describe qué falta y sugiere cómo corregirlo (ej.: crear `specs/index.md` o
completar `orchestration.indexes`). No inventes contexto.

---

**Estado**: Índices cargados y Mapa de Contexto armado. Esperando el próximo comando.
