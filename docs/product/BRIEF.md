# a11y-fixer — Brief

> **Estado:** Fase 0.1 (Brainstorming)
> **Fecha:** 2026-07-27

---

## El problema

La accesibilidad web en proyectos open source es sistemáticamente neglectada. No porque los devs no quieran hacerla bien, sino porque:

- Detectar issues de accesibilidad requiere herramientas externas (Lighthouse, axe DevTools, WAVE) que están fuera del flujo natural de desarrollo
- Saber *cómo* arreglar un issue requiere expertise en WCAG que no todo dev tiene
- No hay feedback temprano en el ciclo del PR — cuando el código se está revisando y está "caliente"
- Las herramientas existentes están diseñadas para auditores de accesibilidad, no para devs en su día a día
- No hay forma de trackear la *evolución* de la accesibilidad de un proyecto a lo largo del tiempo

## La visión

Una **GitHub Action / bot** que se engancha en los PRs, corre una auditoría automatizada de accesibilidad, y comenta con:

- **Qué** violaciones encontró (y contra qué regla WCAG)
- **Cómo** arreglarlo (con ejemplos de código concretos)
- **Evolución** vs la rama base: "este PR mejora/empeora la accesibilidad"
- **Meta**: ayudar al PR a pasar un umbral de calidad accesible

## Para quién

- **Devs open source** que quieren que sus proyectos sean accesibles pero no tienen expertise en a11y
- **Mantenedores** que quieren establecer un estándar de accesibilidad en sus repos
- **Organizaciones** que usan GitHub y necesitan garantizar cumplimiento WCAG sin depender de auditorías manuales

## Qué NO es

- No es un dashboard / SaaS / plataforma web
- No es un CLI para correr localmente (aunque podría tenerlo como extra)
- No es un reemplazo de auditoría humana experta
- No es una herramienta que pretenda "arreglar todo automágicamente"

## Diferenciación

| Herramienta | Enfoque | a11y-fixer |
|---|---|---|
| Lighthouse | Reporte estático | Feedback en PRs |
| axe DevTools | Auditoría manual | Automatizado en CI |
| Pa11y CI | Umbral de errores | Explicación + cómo arreglar |
| AccessLint | Comentarios en PRs | Evolución + ejemplos de código |
| Deque Axe | SaaS enterprise | Open source + BYOK |

## Stack asumido

- GitHub Actions + GitHub Apps (para engancharse en PRs)
- axe-core como motor de auditoría (estándar de la industria)
- TypeScript (el nicho de Gonzo)
- Open source, licencia MIT
- IA opcional con BYOK (para explicar cómo arreglar los issues)

## Preguntas abiertas

- ¿Soporte solo para web, o también para React Native / mobile?
- ¿Qué tan profundo debe ser el análisis de "evolución"? (diff de violaciones entre ramas)
- ¿Debe tener un modo "suggest changes" que proponga el fix directamente en el PR?
- ¿CLI standalone o solo GitHub Action?
