# ADR 003: Resolución híbrida de rutas

**Fecha:** 2026-07-27
**Contexto:** Necesitamos determinar qué páginas/rutas escanear en cada PR. Escanear todas las rutas del proyecto es lento e innecesario. Escanear solo las del diff puede omitir páginas críticas.

**Opciones consideradas:**
1. Solo rutas del diff — rápido pero incompleto
2. Todas las rutas del proyecto — completo pero lento
3. El usuario configura manualmente — flexible pero requiere mantenimiento
4. Híbrido: core routes (configurables) + detección automática desde el diff

**Decisión:** Híbrido.

**Justificación:**
- El usuario define rutas core que siempre se escanean (home, login, dashboard, etc.)
- El bot detecta rutas nuevas o modificadas analizando el git diff (archivos `page.tsx`, `route.tsx`, etc.)
- Se desduplican y se escanea cada ruta una sola vez
- Balance entre velocidad y cobertura

**Consecuencias:**
- El diff analyzer necesita entender la estructura del framework (Next.js App Router, etc.)
- Para frameworks no soportados, el usuario puede definir todas las rutas manualmente en core
- Las rutas detectadas automáticamente pueden tener falsos positivos (archivos que no son páginas)

**Estado:** Aceptada
