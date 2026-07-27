# a11y-fixer — Architecture

> **Estado:** Fase 0.2 (Arquitectura)
> **Fecha:** 2026-07-27
> **Basado en:** BRIEF.md, DEFINITION.md

---

## Stack definitivo

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Runtime | Node.js | 20+ LTS | Estándar para GitHub Actions, ESM nativo |
| Lenguaje | TypeScript | 5.x | Stack de Gonzo, tipado estricto |
| Action SDK | @actions/core | latest | SDK oficial de GitHub Actions |
| Browser engine | Playwright | latest | Navegación SPA, más moderno que Puppeteer |
| Motor de auditoría | axe-core | 4.x | Estándar de la industria, mantenido por Deque |
| Testing | Vitest | latest | Rápido, ESM nativo, compatible con el stack |
| Linting | Biome | latest | Reemplaza ESLint + Prettier |
| IA (opcional) | OpenAI / Anthropic API | — | BYOK, el usuario trae su key |

## Patrones arquitectónicos

- **Pipeline architecture** — cada etapa del flujo es una función pura o un paso independiente
- **Config as code** — toda la configuración vive en `.a11y-fixer.yml` en el repo
- **Stateless** — no hay base de datos propia. El estado entre ejecuciones se cachea en artifacts de GitHub Actions
- **BYOK AI** — la integración con IA es un plugin opcional, no un requisito

## Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Action                         │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Config   │  │  Diff        │  │  Route            │  │
│  │  Loader   │→│  Analyzer    │→│  Resolver         │  │
│  └──────────┘  └──────────────┘  └────────┬─────────┘  │
│                                            │             │
│  ┌─────────────────────────────────────────▼──────────┐  │
│  │              Browser Engine (Playwright)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │  Launch   │  │  Navigate │  │  axe-core Run    │  │
│  │  │  Browser  │→│  to Route │→│  + Collect Results│  │
│  │  └──────────┘  └──────────┘  └────────┬─────────┘  │  │
│  └─────────────────────────────────────────▼──────────┘  │
│                                            │             │
│  ┌─────────────────────────────────────────▼──────────┐  │
│  │              Result Processor                       │  │
│  │  Raw violations → structured by WCAG rule,         │  │
│  │  impact, element selector, suggested fix            │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              Evolution Comparator                    │  │
│  │  Current results vs cached baseline from main       │  │
│  │  → new violations, resolved, persistent              │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              Comment Generator                      │  │
│  │  Markdown comment for the PR with summary,           │  │
│  │  violation list, evolution, suggestions              │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              AI Explainer (optional)                │  │
│  │  BYOK: enriquece comentarios con explicaciones      │  │
│  │  contextualizadas al stack del proyecto              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data flow (ejecución completa)

```
1. PR opened / synchronized
   │
2. GitHub Action se activa (pull_request / pull_request_target)
   │
3. Cargar .a11y-fixer.yml del repo base
   │   Validar con Zod schema
   │
4. Analizar git diff entre HEAD y base
   │   Extraer: archivos modificados, rutas de páginas afectadas
   │
5. Resolver rutas a escanear
   │   Core routes (de config) + detected routes (del diff)
   │   Desduplicar
   │
6. Para cada ruta:
   │   a. Launch Playwright browser (headless)
   │   b. Navigate a la ruta
   │   c. Inject axe-core
   │   d. Run audit
   │   e. Collect violations
   │   f. Close page (reusar browser)
   │
7. Procesar resultados
   │   Agrupar por: regla WCAG, impacto, elemento
   │   Generar suggested fix (template-based)
   │
8. Cargar baseline desde artifacts de main
   │   Si no existe → primera ejecución, no hay comparación
   │
9. Comparar: current vs baseline
   │   → violations_new (no estaban en baseline)
   │   → violations_resolved (estaban en baseline, ya no)
   │   → violations_persistent (están en ambos)
   │
10. Generar comentario de PR
    │   Resumen + tabla de violaciones + evolución + sugerencias
    │
11. (Opcional) Si hay API key configurada:
    │   Llamar a OpenAI/Anthropic para explicaciones detalladas
    │
12. Postear comentario en el PR (gh pr comment)
    │
13. Setear check status: ✅ / ⚠️ / ❌ según umbrales
    │
14. Guardar resultados como nuevo baseline (artifact)
```

## Schema de configuración (`.a11y-fixer.yml`)

```yaml
# a11y-fixer configuration
# Version: 1

# Nivel WCAG mínimo
level: AA # A | AA | AAA

# Impacto máximo permitido antes de fallar el check
max_impact: serious # minor | moderate | serious | critical

# Cantidad máxima de violaciones nuevas permitidas
max_new_violations: 5

# Rutas core del proyecto (siempre se escanean)
routes:
  core:
    - /
    - /login
    - /dashboard
    - /settings

# Rutas que requieren autenticación (se escanean con sesión)
routes:
  authenticated:
    - path: /dashboard
      auth:
        type: cookie # cookie | header | token
        value: "" # se inyecta desde secret de GitHub Actions

# Configuración de IA (opcional, BYOK)
ai:
  enabled: false
  provider: openai # openai | anthropic
  model: gpt-4o-mini
  # API key se pasa como secret de GitHub Actions, no en este archivo

# Reglas a ignorar (falsos positivos conocidos)
ignore:
  rules:
    - color-contrast # ejemplo: diseño intencional
  selectors:
    - ".editor-preview" # ejemplo: contenido generado por terceros
```

## Estructura del proyecto

```
a11y-fixer/
│
├── action.yml                 # GitHub Action metadata
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── .a11y-fixer.yml            # Ejemplo de configuración
├── .gitignore
│
├── src/
│   ├── action.ts              # Entry point del Action
│   ├── config.ts              # Loader + schema de .a11y-fixer.yml
│   ├── config.schema.ts       # Zod schema de configuración
│   ├── diff-analyzer.ts       # Git diff → archivos cambiados
│   ├── route-resolver.ts      # Core routes + detected routes
│   ├── browser.ts             # Playwright launcher + manager
│   ├── auditor.ts             # axe-core runner
│   ├── processor.ts           # Raw violations → structured
│   ├── comparator.ts          # Current vs baseline
│   ├── comment.ts             # PR comment generator (markdown)
│   ├── ai-explainer.ts        # BYOK AI integration
│   ├── cache.ts               # Artifact cache (subir/bajar)
│   ├── github.ts              # GitHub API wrappers (comentarios, checks)
│   └── types.ts               # Tipos compartidos
│
├── tests/
│   ├── config.test.ts
│   ├── diff-analyzer.test.ts
│   ├── route-resolver.test.ts
│   ├── auditor.test.ts
│   ├── processor.test.ts
│   ├── comparator.test.ts
│   ├── comment.test.ts
│   └── ai-explainer.test.ts
│
├── docs/
│   ├── product/
│   │   ├── BRIEF.md
│   │   └── DEFINITION.md
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── ADR/
│   │       ├── 001-playwright-over-puppeteer.md
│   │       ├── 002-artifact-cache-for-evolution.md
│   │       └── 003-hybrid-route-resolution.md
│   └── design/
│       └── DESIGN.md
│
├── CHANGELOG.md
└── README.md
```

## Riesgos técnicos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| axe-core no detecta issues en SPAs sin navegación completa | Medio | Playwright navega como usuario real, no solo HTML estático |
| Tiempo de ejecución largo (muchas rutas) | Alto | Paralelizar rutas con workers, timeout configurable por ruta |
| Falsos positivos de axe-core | Medio | Sistema de `ignore.rules` y `ignore.selectors` en config |
| Cache de artifacts se pierde (GitHub los purga) | Bajo | Si no hay baseline, se reportan solo violaciones actuales sin evolución |
| API de IA rate-limited o cara | Bajo | BYOK, el usuario controla su propio costo. Fallback a templates |
| Playwright no disponible en el runner de GitHub Actions | Bajo | Viene preinstalado en los runners ubuntu-latest |

## Preguntas resueltas (de Fase 0.1)

- ✅ **Rutas a escanear:** Híbrido — core routes de config + detección automática desde el diff
- ✅ **SPAs:** Playwright navega como usuario real (no solo HTML estático)
- ✅ **Evolución:** Cache en artifacts de GitHub Actions, comparando contra la última ejecución en main
- ✅ **Monorepos:** Cada package puede tener su propio `.a11y-fixer.yml`
- ✅ **Formato de config:** YAML con schema Zod, documentado arriba
