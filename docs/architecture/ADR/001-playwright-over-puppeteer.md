# ADR 001: Playwright como browser engine

**Fecha:** 2026-07-27
**Contexto:** Necesitamos un browser headless para navegar SPAs, ejecutar axe-core, y recolectar violaciones de accesibilidad. Las opciones son Puppeteer (Chrome) y Playwright (multi-browser).

**Decisión:** Usar Playwright.

**Justificación:**
- Playwright soporta Chromium, Firefox y WebKit — permite auditar en múltiples motores
- API más moderna y predecible que Puppeteer
- Viene preinstalado en los runners de GitHub Actions (ubuntu-latest)
- Mejor manejo de SPAs con `waitForNavigation`, `waitForSelector`, etc.
- La comunidad se está moviendo de Puppeteer a Playwright

**Consecuencias:**
- Dependencia adicional (~30MB en node_modules)
- Los tests de auditoría necesitan un browser instalado
- En CI de GitHub Actions no requiere instalación extra

**Estado:** Aceptada
