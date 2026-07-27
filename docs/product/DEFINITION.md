# a11y-fixer — Definition

> **Estado:** Fase 0.1 (Definición)
> **Fecha:** 2026-07-27
> **Basado en:** BRIEF.md

---

## Propuesta de valor en una frase

> Una GitHub Action que audita accesibilidad en cada PR, explica qué viola qué regla WCAG, y guía al dev para arreglarlo — sin salir del flujo de trabajo.

## Público objetivo (personas)

### Pablo — Dev frontend en startup
- 28 años, React/TypeScript, 4 años de experiencia
- Sabe que la accesibilidad es importante pero nunca recibió training formal
- Usa Lighthouse de vez en cuando pero no sabe interpretar los reportes
- **Dolor:** "Sé que mi código debería ser accesible pero no sé por dónde empezar"
- **Valor:** Que el bot le diga exactamente qué línea tiene el problema y cómo arreglarla

### Martina — Mantenedora de OSS
- 35 años, mantiene 3 librerías open source con ~5k stars cada una
- Quiere que su proyecto sea accesible pero no tiene tiempo para auditorías manuales
- **Dolor:** "No puedo revisar cada PR manualmente por accesibilidad"
- **Valor:** Un estándar automático que mantenga la calidad sin esfuerzo manual

### Lucas — Accessibility Engineer
- 42 años, trabaja en una consultora, hace auditorías WCAG
- Busca herramientas que automaticen lo repetitivo para enfocarse en lo complejo
- **Dolor:** "Pierdo horas revisando cosas que una máquina podría detectar"
- **Valor:** Que el bot filtre lo obvio y le deje solo los casos que requieren juicio humano

## Features core (MVP)

### F1 — Auditoría automática en PRs
- Se activa con `pull_request` y `pull_request_target` events
- Corre axe-core contra las páginas afectadas por el diff
- Identifica qué elementos nuevos/modificados tienen violaciones
- Mapea cada violación a su regla WCAG (nivel A, AA, AAA)

### F2 — Comentario estructurado en el PR
- Resumen: "X violaciones nuevas, Y existentes, Z resueltas"
- Lista de issues con:
  - Elemento afectado (selector CSS)
  - Regla WCAG violada
  - Impacto (critical, serious, moderate, minor)
  - Cómo arreglarlo (texto explicativo + ejemplo de código)
- Badge de estado: ✅ passing / ⚠️ warning / ❌ failing

### F3 — Evolución vs rama base
- Compara el resultado de la auditoría contra la rama base (main)
- Muestra: violaciones nuevas, violaciones resueltas, violaciones que siguen igual
- Tendencia: "este PR mejora/empeora/neutral la accesibilidad"

### F4 — Umbral configurable
- El mantenedor define en un archivo de config (`.a11y-fixer.yml`):
  - Nivel WCAG mínimo (A, AA, AAA)
  - Impacto máximo permitido (critical, serious, moderate, minor)
  - Cantidad máxima de violaciones nuevas permitidas
- Si se excede el umbral, el check falla y bloquea el merge

### F5 — Explicaciones con IA (BYOK)
- Modo opcional: el dev configura su propia API key (OpenAI, Anthropic, etc.)
- La IA genera explicaciones más detalladas y ejemplos de código contextualizados
- Sin IA: explicaciones basadas en template + documentación de axe-core
- Con IA: explicaciones adaptadas al stack del proyecto (React, Vue, etc.)

## Features post-MVP

- **Suggest changes:** que el bot proponga el fix directamente como suggestion en el PR
- **Dashboard histórico:** gráfico de evolución de accesibilidad a través del tiempo
- **CLI standalone:** para correr localmente antes de hacer push
- **Soporte mobile:** auditoría de componentes React Native
- **Integración con sistemas de diseño:** detectar patrones de componentes y sugerir props accesibles

## Métricas de éxito

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Adopción | 100 repos usando la action en 6 meses | GitHub Marketplace installs |
| PRs analizados | 500 PRs/mes a los 6 meses | GitHub API |
| Tasa de resolución | 40% de los issues comentados se resuelven antes del merge | Seguimiento de PRs |
| Precisión | < 5% de falsos positivos reportados como issues | Feedback de usuarios |
| Tiempo de auditoría | < 2 minutos para proyectos medianos | GitHub Action runtime |

## Restricciones

- **Open source, licencia MIT** — nada de SaaS, nada de telemetría obligatoria
- **IA es BYOK** — el proyecto no corre con costos de API propios
- **Sin base de datos propia** — toda la configuración vive en el repo (`.a11y-fixer.yml`)
- **Sin dashboard web** — el feedback vive en los PRs de GitHub
- **TypeScript** — el stack de Gonzo
- **Dependencias mínimas** — que se pueda instalar rápido en CI

## Stack asumido

| Capa | Tecnología | Justificación |
|---|---|---|
| Runtime | Node.js 20+ | Estándar para GitHub Actions |
| Motor de auditoría | axe-core | Estándar de la industria, mantenido por Deque |
| Framework de Action | @actions/core | SDK oficial de GitHub Actions |
| Lenguaje | TypeScript 5.x | Stack de Gonzo |
| Testing | Vitest | Rápido, ESM nativo |
| Linting | Biome | Reemplaza ESLint + Prettier |
| IA (opcional) | OpenAI / Anthropic API | BYOK, el usuario trae su key |

## Preguntas abiertas (para resolver en Fase 0.2)

- [ ] ¿Cómo determinar qué páginas/rutas escanear dado un diff? (solo las páginas que cambiaron vs todas)
- [ ] ¿Cómo manejar SPAs que requieren navegación para llegar a ciertas páginas?
- [ ] ¿El análisis de "evolución" requiere cachear resultados entre ejecuciones? (artifacts de GitHub Actions)
- [ ] ¿Soporte para monorepos? (cada package puede tener su propia config)
- [ ] ¿Formato de `.a11y-fixer.yml`? (necesitamos un schema)
