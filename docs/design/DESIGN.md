# a11y-fixer — Design (Voice & Tone)

> **Estado:** Fase 0.3 (Diseño)
> **Fecha:** 2026-07-27
> **Basado en:** BRIEF.md, DEFINITION.md, ARCHITECTURE.md

---

## 1. Personalidad del bot

**Nombre:** a11y-fixer (sin apodos, sin mascota, sin emojis de robot)

**Voz:** Técnica, directa, pedagógica. Como un colega senior que sabe de accesibilidad y te explica sin hacerte sentir mal por no saber.

**Tono:**
- ✅ **Informativo** — "Se encontraron 3 violaciones de contraste de color"
- ✅ **Pedagógico** — "Los botones necesitan un ratio de contraste de al menos 4.5:1 contra el fondo"
- ✅ **Constructivo** — "Agregar un label al input resuelve este issue"
- ❌ **Condescendiente** — "Esto es un error básico que deberías conocer"
- ❌ **Burocrático** — "Se ha detectado una no-conformidad con el estándar WCAG 2.2"
- ❌ **Falso amigable** — "¡Hola! ¡Qué bueno verte por acá! Vamos a revisar tu PR juntos :)"

**Regla de oro:** Si un dev lee el comentario y sabe exactamente qué tiene que hacer para arreglarlo, el tono funcionó.

---

## 2. Estructura del comentario

El comentario se divide en 4 secciones claras, en este orden:

```
┌─────────────────────────────────────────────────────────┐
│  [BADGE] Accessibility Check — PASSING / WARNING / FAIL  │
│                                                         │
│  ## Resumen                                             │
│  Una línea con el resultado general.                    │
│                                                         │
│  ## Violaciones                                         │
│  Lista de issues encontrados, cada uno con:             │
│  - Regla WCAG violada                                   │
│  - Elemento afectado                                    │
│  - Impacto                                              │
│  - Cómo arreglarlo                                      │
│                                                         │
│  ## Evolución                                           │
│  Cómo cambió la accesibilidad vs la rama base.          │
│                                                         │
│  ## Configuración                                       │
│  Umbral actual y enlace a la documentación.             │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Badge

El badge es el primer elemento visible. Usa etiquetas de GitHub (no imágenes externas):

```
✅ **Accessibility Check: PASSING** — 0 violaciones nuevas
⚠️ **Accessibility Check: WARNING** — 2 violaciones nuevas (umbral: 5)
❌ **Accessibility Check: FAILING** — 8 violaciones nuevas (umbral: 5)
```

### 2.2 Resumen

Una línea, sin vueltas:

```
No se encontraron violaciones nuevas de accesibilidad en este PR.
```

```
Se encontraron 3 violaciones nuevas de accesibilidad. 2 están por debajo del umbral configurado, 1 excede el máximo permitido.
```

```
Este PR introduce 8 violaciones nuevas de accesibilidad, superando el umbral de 5 configurado en .a11y-fixer.yml.
```

### 2.3 Violaciones

Cada violación se muestra como un item de lista con estructura consistente:

```
**{impacto}** `{regla WCAG}` — {descripción corta}

- **Elemento:** `{selector CSS}`
- **Impacto:** {critical / serious / moderate / minor}
- **WCAG:** {criterio} — {nivel}
- **Cómo arreglarlo:**
  > {explicación clara de qué hacer}
  >
  > ```{lenguaje}
  > {ejemplo de código}
  > ```
```

Ejemplo real:

```
**🔴 CRITICAL** `color-contrast` — El texto no tiene suficiente contraste con el fondo

- **Elemento:** `.btn-primary`
- **Impacto:** critical
- **WCAG:** 1.4.3 — AA
- **Cómo arreglarlo:**
  > El texto necesita un ratio de contraste de al menos 4.5:1 contra el fondo.
  > Probá estos colores:
  >
  > ```css
  > .btn-primary {
  >   background-color: #1a73e8;
  >   color: #ffffff; /* ratio 6.3:1 sobre #1a73e8 */
  > }
  > ```
```

Los impactos se muestran con un prefijo visual:

| Impacto | Prefijo | Color semántico |
|---|---|---|
| critical | 🔴 CRITICAL | Rojo |
| serious | 🟠 SERIOUS | Naranja |
| moderate | 🟡 MODERATE | Amarillo |
| minor | 🔵 MINOR | Azul |

### 2.4 Evolución

Sección que muestra cómo cambió la accesibilidad respecto a la rama base:

```
**Evolución vs main:**

- 🆕 **3 nuevas** — violaciones introducidas en este PR
- ✅ **1 resuelta** — violación que existía en main y ya no está
- 🔄 **2 persistentes** — violaciones que ya estaban en main y siguen

**Tendencia:** ⬆️ Este PR empeora la accesibilidad (3 nuevas, 1 resuelta)
```

Posibles tendencias:

| Tendencia | Indicador | Condición |
|---|---|---|
| Mejora | ⬆️ Mejora | nuevas < resueltas |
| Empeora | ⬇️ Empeora | nuevas > resueltas |
| Neutral | ➡️ Neutral | nuevas = resueltas |
| Primera vez | 🆕 Primera auditoría | No hay baseline |

### 2.5 Configuración

Al pie, información sobre los umbrales actuales:

```
**Configuración actual:** WCAG nivel `AA`, impacto máximo `serious`, máximo `5` violaciones nuevas.
[Ver documentación de configuración →](link)
```

Si el check falló, se agrega:

```
Para ajustar estos umbrales, editá `.a11y-fixer.yml` en la raíz del proyecto.
```

---

## 3. Estados del check

El bot setea un check status en el PR que refleja el resultado:

| Estado | Check | Condición |
|---|---|---|
| ✅ Passing | `success` | 0 violaciones nuevas, o todas por debajo del umbral |
| ⚠️ Warning | `neutral` | Violaciones nuevas pero dentro del umbral configurado |
| ❌ Failing | `failure` | Violaciones nuevas superan el umbral configurado |
| 🔄 Skipped | `skipped` | No se detectaron páginas para escanear (PR de solo docs, por ej.) |
| 💥 Error | `error` | Error interno del action (no se pudo correr la auditoría) |

---

## 4. Comentarios para casos especiales

### Sin violaciones

```
✅ **Accessibility Check: PASSING**

No se encontraron violaciones nuevas de accesibilidad en este PR.

**Evolución vs main:** sin cambios. Se mantiene el estado anterior.
```

### Solo cambios de configuración / docs

```
🔄 **Accessibility Check: SKIPPED**

Este PR no modifica páginas ni componentes. Solo se auditan PRs que afectan rutas del proyecto.

Si este PR debería haber sido escaneado, verificá las rutas configuradas en `.a11y-fixer.yml`.
```

### Error en la auditoría

```
💥 **Accessibility Check: ERROR**

No se pudo completar la auditoría de accesibilidad.

**Motivo:** {mensaje de error}
**Ruta fallida:** {ruta que causó el error}

Esto no bloquea el merge, pero las violaciones de accesibilidad no fueron evaluadas.
```

### Primera auditoría (sin baseline)

```
✅ **Accessibility Check: PASSING**

Se encontraron 2 violaciones de accesibilidad en este PR.

**Nota:** Esta es la primera auditoría en este proyecto. No hay historial previo para comparar evolución. Las violaciones reportadas son el nuevo baseline.
```

---

## 5. Reglas de escritura

1. **Nunca usar em dash (—).** Usar guión común (-). El em dash no está en el teclado de un dev.
2. **Nunca usar "por favor" o "gracias".** El bot no está pidiendo favores, está reportando facts.
3. **Los selectores CSS van en backticks.** Siempre.
4. **Los ejemplos de código van en blocks con lenguaje.** Siempre.
5. **Una violación = un item de lista.** No agrupar múltiples issues en un mismo párrafo.
6. **El "cómo arreglarlo" debe ser accionable.** No "mejorar el contraste", sino "cambiá el color del texto a #ffffff".
7. **No repetir información.** Si la regla WCAG ya dice "1.4.3", no hace falta escribir "Contraste Mínimo" al lado.
8. **Los números van en dígitos.** "3 violaciones", no "tres violaciones".

---

## 6. Ejemplos completos

### Escenario: PR con violaciones nuevas que superan el umbral

```
❌ **Accessibility Check: FAILING** — 8 violaciones nuevas (umbral: 5)

Se encontraron 8 violaciones nuevas de accesibilidad. Este PR supera el umbral de 5 configurado en .a11y-fixer.yml.

**🔴 CRITICAL** `color-contrast` — El texto no tiene suficiente contraste con el fondo

- **Elemento:** `.btn-primary`
- **Impacto:** critical
- **WCAG:** 1.4.3 — AA
- **Cómo arreglarlo:**
  > El texto necesita un ratio de contraste de al menos 4.5:1 contra el fondo.
  >
  > ```css
  > .btn-primary {
  >   background-color: #1a73e8;
  >   color: #ffffff;
  > }
  > ```

**🟠 SERIOUS** `aria-valid-attr` — El atributo ARIA `aria-labeledby` no es válido

- **Elemento:** `#search-input`
- **Impacto:** serious
- **WCAG:** 4.1.1 — A
- **Cómo arreglarlo:**
  > El atributo correcto es `aria-labelledby` (con doble "l").
  >
  > ```html
  > <input id="search-input" aria-labelledby="search-label" />
  > ```

**Evolución vs main:**

- 🆕 **8 nuevas** — violaciones introducidas en este PR
- ✅ **0 resueltas**
- 🔄 **3 persistentes** — violaciones que ya estaban en main y siguen

**Tendencia:** ⬇️ Este PR empeora la accesibilidad (8 nuevas, 0 resueltas)

**Configuración actual:** WCAG nivel `AA`, impacto máximo `serious`, máximo `5` violaciones nuevas.
Para ajustar estos umbrales, editá `.a11y-fixer.yml` en la raíz del proyecto.
```

### Escenario: PR que mejora la accesibilidad

```
✅ **Accessibility Check: PASSING** — 1 violación nueva (umbral: 5)

Se encontró 1 violación nueva de accesibilidad, dentro del umbral configurado.

**🔵 MINOR** `landmark-one-main` — La página no tiene un elemento `<main>`

- **Elemento:** `body`
- **Impacto:** minor
- **WCAG:** 1.3.1 — A
- **Cómo arreglarlo:**
  > Envolvé el contenido principal en un elemento `<main>`.
  >
  > ```html
  > <main>
  >   <!-- contenido principal -->
  > </main>
  > ```

**Evolución vs main:**

- 🆕 **1 nueva**
- ✅ **3 resueltas** — violaciones que existían en main y ya no están
- 🔄 **2 persistentes**

**Tendencia:** ⬆️ Este PR mejora la accesibilidad (1 nueva, 3 resueltas)

**Configuración actual:** WCAG nivel `AA`, impacto máximo `serious`, máximo `5` violaciones nuevas.
```

### Escenario: PR limpio

```
✅ **Accessibility Check: PASSING**

No se encontraron violaciones nuevas de accesibilidad en este PR.

**Evolución vs main:** sin cambios. Se mantiene el estado anterior.
```

---

## 7. Nota sobre IA (BYOK)

Cuando el modo IA está activo, SOLO cambia la sección "Cómo arreglarlo". El resto del comentario (resumen, evolución, configuración) se mantiene igual.

Con IA, el "cómo arreglarlo" puede incluir:
- Explicación más detallada del *por qué* técnico
- Ejemplos adaptados al stack del proyecto (React, Vue, Angular)
- Múltiples alternativas de solución
- Referencia a la documentación oficial de WCAG

Sin IA, el "cómo arreglarlo" usa templates curados por el equipo de a11y-fixer.
