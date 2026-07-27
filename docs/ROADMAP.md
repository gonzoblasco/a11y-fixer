# a11y-fixer — Roadmap

> **Estado:** Fase 0.2 (Planificación)
> **Fecha:** 2026-07-27
> **Versión objetivo:** 1.0.0

---

## 🟢 Fase 1: Core Engine (MVP)

**Objetivo:** El bot puede escanear un PR, detectar violaciones de accesibilidad, y comentar en el PR con resultados.

### Epic 1.1 — Config & Bootstrap
- [ ] **1.1.1** Inicializar proyecto Node.js + TypeScript + Biome + Vitest
- [ ] **1.1.2** Crear `action.yml` con metadata de GitHub Action
- [ ] **1.1.3** Implementar `config.ts`: loader + Zod schema de `.a11y-fixer.yml`
- [ ] **1.1.4** Tests de validación de config (casos válidos, inválidos, defaults)

### Epic 1.2 — Diff Analyzer & Route Resolver
- [ ] **1.2.1** Implementar `diff-analyzer.ts`: extraer archivos modificados del git diff
- [ ] **1.2.2** Implementar `route-resolver.ts`: combinar core routes + detected routes del diff
- [ ] **1.2.3** Soporte inicial para Next.js App Router (detectar `page.tsx` en el diff)
- [ ] **1.2.4** Tests de resolución de rutas (varios escenarios de diff)

### Epic 1.3 — Browser & Auditor
- [ ] **1.3.1** Implementar `browser.ts`: Playwright launcher con pool de páginas
- [ ] **1.3.2** Implementar `auditor.ts`: inyectar axe-core, correr auditoría, recolectar resultados
- [ ] **1.3.3** Manejo de rutas autenticadas (inyectar cookie/header desde secrets)
- [ ] **1.3.4** Timeout configurable por ruta + error handling
- [ ] **1.3.5** Tests de auditoría con fixtures HTML

### Epic 1.4 — Result Processor
- [ ] **1.4.1** Implementar `processor.ts`: raw violations → estructura por regla WCAG, impacto, selector
- [ ] **1.4.2** Generar suggested fix template-based para violaciones comunes
- [ ] **1.4.3** Tests de procesamiento con datos de axe-core reales

### Epic 1.5 — PR Comment & Check
- [ ] **1.5.1** Implementar `github.ts`: wrappers para gh CLI (comentar, setear check status)
- [ ] **1.5.2** Implementar `comment.ts`: generador de markdown estructurado
- [ ] **1.5.3** Implementar `comparator.ts`: current vs baseline (violaciones nuevas, resueltas, persistentes)
- [ ] **1.5.4** Implementar `cache.ts`: subir/bajar artifacts de GitHub Actions
- [ ] **1.5.5** Tests de generación de comentarios y comparación

### Epic 1.6 — Integration Test (end-to-end)
- [ ] **1.6.1** Crear workflow de GitHub Actions de prueba
- [ ] **1.6.2** Probar contra un repo de prueba con violaciones conocidas
- [ ] **1.6.3** Verificar comentario en PR, check status, evolución

---

## ⚪ Fase 2: Thresholds & Quality

**Objetivo:** El mantenedor puede definir umbrales de calidad y el bot bloquea PRs que no los cumplen.

### Epic 2.1 — Threshold Engine
- [ ] **2.1.1** Implementar evaluación de umbrales (nivel WCAG, impacto, cantidad)
- [ ] **2.1.2** Check status dinámico: ✅ passing / ⚠️ warning / ❌ failing
- [ ] **2.1.3** Tests de threshold con casos límite

### Epic 2.2 — Ignore Rules
- [ ] **2.2.1** Implementar `ignore.rules` y `ignore.selectors` en config
- [ ] **2.2.2** Tests de filtrado de falsos positivos

---

## ⚪ Fase 3: AI Explainer (BYOK)

**Objetivo:** Modo opcional con IA que genera explicaciones detalladas y ejemplos de código contextualizados.

### Epic 3.1 — AI Integration
- [ ] **3.1.1** Implementar `ai-explainer.ts`: provider abstraction (OpenAI, Anthropic)
- [ ] **3.1.2** Prompt engineering para explicaciones de accesibilidad
- [ ] **3.1.3** Fallback a templates si no hay API key o falla la llamada
- [ ] **3.1.4** Tests con mocks de API

---

## ⚪ Fase 4: Distribution & Docs

**Objetivo:** Publicar en GitHub Marketplace, documentación completa, ejemplos.

### Epic 4.1 — GitHub Marketplace
- [ ] **4.1.1** Crear README.md con badges, ejemplos, configuración
- [ ] **4.1.2** Publicar action en GitHub Marketplace
- [ ] **4.1.3** Crear template de `.a11y-fixer.yml` para quickstart

### Epic 4.2 — Documentation
- [ ] **4.2.1** Documentación de todas las opciones de configuración
- [ ] **4.2.2** Guía de contribución
- [ ] **4.2.3** Ejemplos para frameworks populares (Next.js, React, Vue, Angular)

---

## ⚪ Fase 5: Post-MVP

**Objetivo:** Features adicionales que expanden el alcance.

- [ ] **5.1** Suggest changes: propuesta de fix como suggestion en el PR
- [ ] **5.2** CLI standalone para correr localmente
- [ ] **5.3** Dashboard histórico (GitHub Pages con los artifacts)
- [ ] **5.4** Soporte para React Native (mobile)
- [ ] **5.5** Integración con sistemas de diseño (detectar patrones de componentes)
- [ ] **5.6** Soporte para más frameworks en route resolver

---

## Hitos

| Hito | Fecha estimada | Entregable |
|---|---|---|
| MVP funcional | — | Action que escanea y comenta en PRs |
| Thresholds | — | Umbrales configurables, check status |
| AI Explainer | — | Explicaciones con IA (BYOK) |
| v1.0.0 | — | Publicado en GitHub Marketplace |
