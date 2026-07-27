# ADR 002: Cache en artifacts de GitHub Actions para evolución

**Fecha:** 2026-07-27
**Contexto:** Para mostrar la evolución de accesibilidad entre PRs (violaciones nuevas, resueltas, persistentes), necesitamos comparar contra un baseline. Este baseline debe persistir entre ejecuciones de la Action.

**Opciones consideradas:**
1. Base de datos externa (Supabase, Neon, etc.) — viola la restricción de "sin DB propia"
2. Cache en artifacts de GitHub Actions — efímero pero suficiente
3. Archivo en el repo (`.a11y-baseline.json`) — contamina el historial de git
4. Sin cache, solo reporte del PR sin evolución — pierde la feature F3

**Decisión:** Usar artifacts de GitHub Actions con `actions/upload-artifact` y `actions/download-artifact`.

**Justificación:**
- No requiere infraestructura externa
- Los artifacts persisten mientras GitHub los conserve (90 días por defecto)
- El baseline se asocia al commit de main, no al PR
- Si el artifact se pierde, simplemente no hay comparación de evolución — no es blocking

**Consecuencias:**
- La primera ejecución en un repo nuevo no tendrá baseline (solo reporta violaciones actuales)
- Si GitHub purga los artifacts, se pierde el historial de evolución
- Necesitamos un sistema de cache key basado en el SHA del commit de main

**Estado:** Aceptada
