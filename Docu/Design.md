# Sistema de diseño — guía para refactorizar un panel de administración

Este documento describe **exactamente** el lenguaje visual de un proyecto React existente
para poder reproducirlo en otro proyecto. No es una inspiración vaga: son los valores
literales que usa el código original.

Léelo entero antes de tocar nada. Cuando dudes entre inventar algo y copiar un patrón de
aquí, copia el patrón de aquí.

---

## 0. Resumen del carácter visual

- **Claro, plano y silencioso.** Fondo gris muy claro, tarjetas blancas, borde de 1px gris.
  Nada de gradientes decorativos ni glassmorphism salvo en la barra de navegación.
- **Un solo acento: granate `#922B21`.** Es lo único con color fuerte en toda la interfaz.
  Todo lo demás es gris. El color se usa para *señalar*, nunca para decorar.
- **Radios generosos** (12–22px) y **sombras dobles muy suaves**, tipo iOS.
- **Tipografía grande.** La base del documento es `18px`, no 16px. Todo respira más de lo
  habitual en un panel de administración.
- **Movimiento con muelle.** Las transiciones usan dos curvas: una suave iOS y otra con
  rebote. Los botones se hunden al pulsarlos (`scale(0.97)`).

---

## 1. Stack y convenciones de código

| Aspecto | Decisión |
|---|---|
| Framework | React (function components, hooks) |
| Estilos | **CSS Modules** — un `Nombre.module.css` junto a cada `Nombre.jsx`. Sin Tailwind, sin styled-components, sin CSS-in-JS |
| Tokens | Un único `src/styles/variables.css` con custom properties en `:root` |
| Global | `src/styles/global.css` importa las variables y la fuente, y hace el reset |
| Iconos | [`@tabler/icons-react`](https://tabler.io/icons) — **no** lucide, **no** heroicons |
| Nombres de clase | camelCase (`.statCard`, `.btnGuardar`, `.emptyState`) |
| Idioma del código | Clases y componentes en español (`.btnCancelar`, `Paginacion`, `abierto`, `onCerrar`) |

**Convención de iconos:** `<IconAlgo size={16} stroke={1.75} />` es el uso por defecto.
Tamaños habituales: `14–16` en línea con texto, `18–20` en cabeceras y botones de acción,
`36` en estados vacíos. El grosor `1.75` es el de la interfaz general; `2` para iconos
pequeños que necesitan peso.

---

## 2. Tokens — copia este archivo tal cual

`src/styles/variables.css`

```css
:root {
  --white: #FFFFFF;
  --bg-page: #F9F9F9;
  --bg-surface: #FFFFFF;
  --bg-subtle: #F4F4F4;

  --border: #E5E5E5;
  --border-strong: #D0D0D0;

  --text-primary: #111111;
  --text-secondary: #6B6B6B;
  --text-hint: #ABABAB;

  --accent: #922B21;
  --accent-hover: #7B241C;
  --accent-light: #FDF2F2;
  --accent-border: #F5C6C6;

  --success: #166534;
  --success-bg: #F0FDF4;
  --warning: #92400E;
  --warning-bg: #FFFBEB;
  --danger: #922B21;
  --danger-bg: #FDF2F2;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 22px;
  --radius-full: 999px;

  --font: 'Inter', system-ui, sans-serif;

  /* Escala tipográfica — base 18px */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-md:   18px;
  --text-lg:   22px;
  --text-xl:   26px;
  --text-2xl:  32px;

  /* Pesos */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;

  /* Line heights */
  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-loose:  1.7;

  --ease-ios:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Colores que aparecen en el código pero no están tokenizados** (se usan literales; si
quieres, tokenízalos al refactorizar, pero mantén los valores):

| Uso | Texto | Fondo | Borde |
|---|---|---|---|
| Verde / éxito / "dentro" | `#166534` | `#F0FDF4` (hover `#DCFCE7`, icono `#DCFCE7`) | `#86EFAC` (hover `#4ADE80`) |
| Ámbar / advertencia | `#92400E` | `#FFFBEB` / `#FEF3C7` | `#FCD34D` |
| Azul / informativo | `#1E40AF` | `#EFF6FF` | `#BFDBFE` |
| Violeta (origen QR) | `#6D28D9` | `#F5F3FF` | — |
| Punto "en vivo" | `#22c55e` | — | — |

---

## 3. Global

`src/styles/global.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
@import './variables.css';

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 18px;          /* ← OJO: la base es 18px, no 16px */
  scrollbar-gutter: stable;
}

html, body {
  height: 100%;
  font-family: var(--font);
  color: var(--text-primary);
  background-color: var(--bg-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root { height: 100%; }

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: var(--font); }
input, select, textarea { font-family: var(--font); }

/* Los inputs de fecha/hora tienen un ancho intrínseco nativo en Safari iOS
   que no se encoge y desborda los modales. Esto va aquí, una sola vez. */
input[type="date"],
input[type="time"],
input[type="datetime-local"],
input[type="month"] {
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;
  max-width: 100%;
}
```

> **Importante:** `font-size: 18px` en `html` significa que cada `rem` vale 18px. Los
> paddings escritos en `rem` (`1.25rem` = 22.5px) son mayores de lo que parecen. Si el
> proyecto antiguo asume 16px, o cambias la base o conviertes los `rem` a px.

---

## 4. Layout

```css
.layout {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding: 2rem 1.5rem 120px;   /* el padding inferior deja hueco a la navbar flotante */
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main { padding: 5rem 1rem 110px; }
}

/* Transición al cambiar de página. SOLO opacity. */
.pageTransition { animation: pageIn 280ms var(--ease-ios) backwards; }

@keyframes pageIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Dos reglas aprendidas a base de bugs, respétalas:**

1. `pageIn` **solo anima `opacity`, nunca `transform`**. Un `transform` crea un contexto de
   apilado y los modales `position: fixed` dejan de poder salir de él.
2. El `animation-fill-mode` es **`backwards`, no `both`**. Con `forwards`/`both` la
   animación de opacity queda activa para siempre, crea contexto de apilado igualmente y
   los modales quedan por debajo de la navbar.

El contenedor de la transición lleva `key={location.pathname}` para que se re-monte y la
animación dispare en cada navegación:

```jsx
<main className={styles.main}>
  <div key={location.pathname} className={styles.pageTransition}>
    <Outlet />
  </div>
</main>
<Navbar />
```

**Escala de z-index:** navbar `100`, overlay de modal `1000`, dropdowns `50`.

---

## 5. Cabecera de página

Todas las pantallas del panel abren igual:

```jsx
<div className={styles.header}>
  <div>
    <h1 className={styles.title}>Empleados</h1>
    <p className={styles.subtitle}>24 activos · 3 inactivos</p>
  </div>
  <button className={styles.btnNuevo}>
    <IconPlus size={18} stroke={2} /> Nuevo empleado
  </button>
</div>
```

```css
.page { padding-bottom: 2rem; }

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: var(--leading-tight);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-hint);
  margin-top: 3px;
}
```

El `letter-spacing: -0.03em` en títulos grandes y `-0.02em` en medianos es parte del
carácter: sin él la tipografía se ve suelta y "por defecto".

---

## 6. Componentes

### 6.1 Botones

Hay exactamente cuatro. No inventes más variantes.

```css
/* PRIMARIO — la acción principal de la pantalla */
.btnPrimario {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 42px;                    /* 40px en barras de filtros, 44px en formularios grandes */
  padding: 0 18px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: var(--font);
  cursor: pointer;
  transition: background 150ms, transform 120ms var(--ease-ios);
  white-space: nowrap;
}
.btnPrimario:hover    { background: var(--accent-hover); }
.btnPrimario:active   { transform: scale(0.97); }
.btnPrimario:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* SECUNDARIO — cancelar, cerrar, acciones neutras */
.btnSecundario {
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: var(--font);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 150ms;
}
.btnSecundario:hover { background: var(--bg-subtle); }

/* ICONO CUADRADO — editar, ver, alternar; en tarjetas y filas de tabla */
.btnIcono {
  width: 36px;                     /* 32px dentro de tablas densas */
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 150ms, color 150ms, background 150ms;
}
.btnIcono:hover {
  border-color: var(--accent-border);
  color: var(--accent);
  background: var(--accent-light);
}

/* ICONO FANTASMA — sin borde, para acciones terciarias */
.btnFantasma {
  width: 36px; height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 150ms;
}
.btnFantasma:hover { background: var(--bg-subtle); }
```

**Aprobar / rechazar** (par de acciones semánticas, siempre juntas, altura 36px):

```css
.btnAprobar {
  display: flex; align-items: center; gap: 5px;
  height: 36px; padding: 0 14px;
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  border-radius: var(--radius-md);
  color: #166534;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background 150ms;
}
.btnAprobar:hover { background: #DCFCE7; }

.btnRechazar {
  /* idéntico pero */
  background: var(--accent-light);
  border-color: var(--accent-border);
  color: var(--accent);
}
.btnRechazar:hover { background: #FAE0E0; }
```

### 6.2 Tarjeta

La sombra doble es la firma del sistema. Siempre las dos capas, nunca una sola.

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.04);
}

/* Solo si la tarjeta es interactiva */
.card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.06);
}
.card:active { transform: scale(0.98); }
```

Transición de tarjeta interactiva:
`transition: border-color 150ms, transform 120ms var(--ease-ios), box-shadow 150ms;`

**Variantes de tarjeta por estado.** El patrón es siempre el mismo: borde tintado + fondo
tintado + sombra tintada con el color en `rgba` a 0.06–0.10.

```css
.cardUrgente { border-color: var(--accent-border); background: var(--accent-light);
               box-shadow: 0 1px 4px rgba(146,43,33,0.08), 0 2px 16px rgba(146,43,33,0.08); }
.cardBien    { border-color: #86EFAC; background: #F0FDF4;
               box-shadow: 0 1px 4px rgba(22,101,52,0.08), 0 2px 16px rgba(22,101,52,0.08); }
.cardAviso   { border-color: #FCD34D; background: #FFFBEB;
               box-shadow: 0 1px 4px rgba(146,64,14,0.08), 0 2px 16px rgba(146,64,14,0.08); }
.cardInfo    { border-color: #BFDBFE; background: #EFF6FF;
               box-shadow: 0 1px 4px rgba(30,64,175,0.06), 0 2px 16px rgba(30,64,175,0.06); }
.cardInactivo { opacity: 0.55; }
```

Cabecera interna de tarjeta:

```css
.cardHeader {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem;
}
.cardTitle {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
```

### 6.3 Tarjeta de estadística

```css
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 768px) { .statsGrid { grid-template-columns: repeat(2, 1fr); } }

.statCard { /* = .card, con padding: 1.1rem 1rem */ }

.statIcon {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.statIcon.green { background: #F0FDF4;          color: #166534; }
.statIcon.amber { background: #FFFBEB;          color: #92400E; }
.statIcon.red   { background: var(--accent-light); color: var(--accent); }
.statIcon.blue  { background: #EFF6FF;          color: #1E40AF; }
.statIcon.gray  { background: var(--bg-subtle); color: var(--text-hint); }

.statValue {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 4px;
  display: flex; align-items: center;
}

.statLabel {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}
```

Estructura: icono arriba → cifra grande → etiqueta pequeña. En ese orden.

### 6.4 Tabla

```css
.tableWrap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.04);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-base);
}

.table thead th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: var(--font-semibold);
  color: var(--text-hint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border);
}

.tableRow td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.tableRow:last-child td { border-bottom: none; }
.tableRow:hover td { background: var(--bg-subtle); }

.emptyRow { text-align: center; padding: 3rem !important; color: var(--text-hint); }

/* En móvil la tabla NO se apila en tarjetas: se arrastra de lado.
   Es una pantalla de trabajo y se usa en escritorio. */
@media (max-width: 768px) {
  .tableWrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .table     { min-width: 760px; }
}
```

Las cabeceras en mayúsculas con `letter-spacing` son deliberadas **solo en tablas y en
títulos de sección de ajustes**. No las uses en otros sitios.

### 6.5 Píldoras / badges

```css
/* Badge estándar */
.badge {
  font-size: 11px;                  /* 12px si va suelto en una fila */
  font-weight: var(--font-semibold);
  padding: 2px 8px;                 /* 3px 10px en la versión de 12px */
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Badge de conteo sobre acento */
.tabBadge {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}
```

Paletas de badge (fondo / texto):

| Semántica | Fondo | Texto |
|---|---|---|
| Éxito, activo, entrada | `#F0FDF4` | `#166534` |
| Advertencia, pendiente | `#FEF3C7` | `#92400E` |
| Info | `#EFF6FF` | `#1E40AF` |
| Especial / secundario | `#F5F3FF` | `#6D28D9` |
| Acento / admin | `var(--accent-light)` | `var(--accent)` |
| Neutro, inactivo | `var(--bg-subtle)` | `var(--text-hint)` |

Cuando una categoría necesita también borde (badges de rol/puesto), se define en JS con
`{ label, color, bg, border }` y se aplica inline. Ejemplo del proyecto:

```js
export const PUESTOS = {
  direccion:      { label: 'Dirección',      color: '#4F46E5', bg: '#EEEDFE', border: '#C7C3F9' },
  administracion: { label: 'Administración', color: '#0D9488', bg: '#E1F5EE', border: '#99E2CC' },
  recepcion:      { label: 'Recepción',      color: '#922B21', bg: '#FDF2F2', border: '#F5C6C6' },
  gobernanta:     { label: 'Gobernanta',     color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  pisos:          { label: 'Pisos',          color: '#16653A', bg: '#F0FDF4', border: '#86EFAC' },
  mantenimiento:  { label: 'Mantenimiento',  color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
}
// Fallback: { color: '#6B6B6B', bg: '#F4F4F4', border: '#E5E5E5' }
```

Y la clase solo pone la forma: `padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid;`

### 6.6 Avatar

Iniciales sobre fondo del acento, siempre círculo:

```css
.avatar {
  width: 34px; height: 34px;        /* 42px en listados, 56px en perfil */
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;                  /* 14px a 42px, --text-lg a 56px */
  font-weight: var(--font-semibold);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatarInactivo { background: var(--bg-subtle); color: var(--text-hint); }
/* El grande lleva además: border: 2px solid var(--accent-border); */
```

### 6.7 Formularios

```css
.formGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 480px) { .formGrid { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: 6px; }

.fieldLabel {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}
.req { color: var(--accent); }      /* el asterisco de campo obligatorio */

.input {
  height: 44px;                      /* 40px en barras de filtros */
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);      /* ← gris en reposo */
  padding: 0 14px;
  font-size: var(--text-sm);
  font-family: var(--font);
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms;
  width: 100%;
}
.input:focus {
  border-color: var(--accent);
  background: var(--bg-surface);     /* ← blanco al enfocar */
}

.textarea { height: auto; min-height: 80px; padding: 10px 14px; resize: vertical; }

.select { /* = .input, más cursor: pointer; min-width: 140px; */ }
```

**Detalle característico:** el input está gris (`--bg-subtle`) en reposo y se vuelve blanco
al enfocarse, mientras el borde pasa a granate. No hay ring de focus, solo el borde.

Excepción: los inputs que viven directamente sobre el fondo de la página (buscador, filtros
de fecha) van al revés — fondo blanco `--bg-surface` desde el principio, porque el fondo de
la página ya es gris.

### 6.8 Buscador

```css
.searchWrap { position: relative; margin-bottom: 1rem; }

.searchIcon {
  position: absolute;
  left: 14px;                       /* 12px en la versión de 40px */
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-hint);
}

.searchInput {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 40px;           /* hueco para el icono */
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  font-size: var(--text-base);
  font-family: var(--font);
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.searchInput:focus { border-color: var(--accent); }
```

### 6.9 Filtros: dos formas distintas

**a) Píldoras segmentadas con indicador deslizante** — para filtros excluyentes (período,
estado). El indicador es un `div` absoluto cuya `left` y `width` se calculan por JS midiendo
el botón activo con un `ref`, y se anima con CSS.

```css
.filtroTabs {
  display: flex;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 2px;
  position: relative;
}

.filtroIndicator {
  position: absolute;
  top: 4px;
  height: 34px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(146,43,33,0.3);
  pointer-events: none;
  opacity: 0;                        /* 1 cuando JS ya lo ha medido */
  transition: left 280ms var(--ease-ios),
              width 280ms var(--ease-ios),
              opacity 150ms ease;
}

.filtroTab {
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  z-index: 1;                        /* por encima del indicador */
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap;
  transition: color 200ms var(--ease-ios);
  -webkit-tap-highlight-color: transparent;
}
.filtroTab:hover  { color: var(--text-primary); }
.filtroActive     { color: #fff !important; }

/* En móvil se arrastran de lado, NO se parten en dos filas:
   el indicador se posiciona midiendo y al partirse queda descolocado. */
@media (max-width: 768px) {
  .filtroTabs { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
  .filtroTabs::-webkit-scrollbar { display: none; }
}
```

**b) Pestañas subrayadas** — para cambiar de vista dentro de una pantalla.

```css
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}

.tab {
  display: flex; align-items: center; gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: none;
  background: transparent;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;               /* solapa el borde del contenedor */
  transition: color 150ms, border-color 150ms;
}
.tab:hover  { color: var(--text-primary); }
.tabActive  { color: var(--accent) !important; border-bottom-color: var(--accent) !important; }
```

### 6.10 Modal

**Un único componente compartido, montado por portal a `document.body`.** No repitas el
overlay en cada pantalla: ese fue el mayor problema del proyecto original (21 modales
copiados en 11 hojas, y un solo bug obligó a tocar 8 archivos).

API del componente:

```jsx
<Modal
  abierto={boolean}
  onCerrar={fn}
  titulo={'Texto' | <ReactNode>}   // admite nodo para llevar icono delante
  pie={<><button type="button">Cancelar</button><button>Guardar</button></>}
  ancho={520}                       // px, se aplica como max-width
  variante={'panel' | 'centrado'}   // panel = formulario; centrado = confirmación
  bloqueado={false}                 // oculta el aspa y desactiva Escape / clic fuera
  onEnviar={fn}                     // si se pasa, el contenedor es un <form>
>
  {children}
</Modal>
```

Comportamiento obligatorio:
- Cierra con `Escape` y con clic en el overlay (salvo `bloqueado`).
- Bloquea el scroll del `body` mientras está abierta y **restaura el valor anterior** al
  cerrar, no lo pone a `''`.
- Va por `createPortal(…, document.body)`. Así ningún contexto de apilado la puede encerrar.
- Con `onEnviar`, envuelve en `<form onSubmit>` para que funcione Enter y el gestor de
  contraseñas. **Cuidado:** dentro de un `<form>`, un `<button>` sin `type` es `submit`.
  Los botones de cancelar necesitan `type="button"` explícito.
- Con `bloqueado`, el aspa **no se pinta**. Un botón visible que no responde parece roto.

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
  animation: modalFadeIn 150ms ease;
}
@keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-height: calc(100dvh - 3rem);   /* dvh, NO vh: en móvil 100vh es el viewport grande
                                        y el pie se sale de la pantalla */
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  animation: modalScaleIn 200ms var(--ease-spring);
}
@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.titulo {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.cerrar {
  width: 32px; height: 32px;
  border: none;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 150ms;
  flex-shrink: 0;
}
.cerrar:hover { background: var(--border); }

.body {
  overflow-y: auto;
  flex: 1;
  overflow-wrap: anywhere;           /* nombres de archivo largos sin espacios */
  min-width: 0;
}
.panel .body { padding: 1.25rem 1.5rem; }

.pie {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* Variante centrada: confirmaciones. Sin cabecera ni pie;
   el icono, el título, el texto y las acciones los pone la pantalla. */
.centrado .body {
  padding: 2rem 1.75rem 1.5rem;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
}
```

### 6.11 Mensajes en línea

```css
/* Error */
.errorMsg {
  display: flex; align-items: center; gap: 8px;
  background: var(--danger-bg);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: var(--text-sm);
  color: var(--danger);
  margin-bottom: 1rem;
}

/* Advertencia — informa, no impide */
.aviso {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--warning-bg);
  border: 1px solid #FCD34D;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 1rem;
  font-size: var(--text-sm);
  color: var(--warning);
  line-height: var(--leading-normal);
}

/* Bloque de datos de solo lectura dentro de un modal */
.modalInfo {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: var(--text-sm);
}
.modalLabel { color: var(--text-hint); font-weight: var(--font-medium); }
.modalValor { color: var(--text-primary); }
```

### 6.12 Estado vacío y carga

```css
.emptyState {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px;
  padding: 4rem;
  color: var(--text-hint);
  font-size: var(--text-sm);
}
/* Dentro: <IconAlgo size={36} stroke={1.25} /> + una frase. */

.loading {
  display: flex; align-items: center; justify-content: center;
  height: 60vh;
  color: var(--text-hint);
  font-size: var(--text-base);
}
```

Pantalla de carga a página completa — tres puntos que laten, nunca un spinner:

```css
.puntos { display: flex; gap: 6px; }
.puntos span {
  width: 7px; height: 7px;
  border-radius: var(--radius-full);
  background: var(--text-hint);
  animation: latido 1.2s var(--ease-ios) infinite;
}
.puntos span:nth-child(2) { animation-delay: 0.15s; }
.puntos span:nth-child(3) { animation-delay: 0.3s; }

@keyframes latido {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50%      { opacity: 1;    transform: scale(1); }
}
```

Punto "en vivo" para datos en tiempo real:

```css
.realtimeDot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
  50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
}
```

### 6.13 Paginación

Deliberadamente discreta: es una ayuda de navegación, no un elemento protagonista.

```css
.wrap {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  padding: 12px 4px 2px;
}

.info {
  font-size: var(--text-xs);
  color: var(--text-hint);
  font-variant-numeric: tabular-nums;
}

.controles { display: flex; align-items: center; gap: 4px; margin-left: auto; }

.numero, .flecha {
  display: flex; align-items: center; justify-content: center;
  min-width: 32px; height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  font-family: var(--font);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 150ms, background 150ms, color 150ms;
}
.numero:hover:not(.activo), .flecha:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
  color: var(--text-primary);
}
.activo {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: var(--font-medium);
  cursor: default;
}
.flecha:disabled { opacity: 0.4; cursor: not-allowed; }
.hueco { padding: 0 4px; color: var(--text-hint); font-size: var(--text-sm); user-select: none; }

@media (max-width: 600px) {
  .wrap      { justify-content: center; }
  .controles { margin-left: 0; }
  .info      { width: 100%; text-align: center; }
}
```

`font-variant-numeric: tabular-nums` en todo lo que sean cifras: paginación, horas,
totales. Evita que los números "bailen" al actualizarse.

### 6.14 Zona de subida de archivos

```css
.dropzone {
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: var(--bg-subtle);
  transition: border-color 150ms, background 150ms;
}
.dropzone:hover     { border-color: var(--accent); background: var(--accent-light); }
.dropzoneReady      { border-style: solid; border-color: var(--accent); background: var(--accent-light); }
.dropzoneTexto      { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-primary); }
.dropzoneNombre     { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--accent); }
.dropzoneHint       { font-size: var(--text-xs); color: var(--text-hint); }
```

### 6.15 Menú desplegable

```css
.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 50;
  min-width: 150px;
}
.dropdownItem {
  padding: 11px 16px;
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 120ms;
}
.dropdownItem:hover { background: var(--bg-subtle); }
```

### 6.16 Sección tipo ajustes (lista de campos)

```css
.section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.sectionTitle {
  font-size: 12px;
  font-weight: var(--font-semibold);
  color: var(--text-hint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
}

.fieldRow {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.fieldRow:last-child { border-bottom: none; }
```

---

## 7. Navegación

**No hay barra lateral.** La navegación es una **píldora flotante centrada abajo**, fija,
con un indicador granate que se desliza bajo el elemento activo. En móvil es una barra de
iconos con un botón "+" que despliega el resto en una rejilla de dos columnas.

```css
.desktopWrap {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.desktopNav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 999px;
  padding: 6px;
  display: flex; align-items: center; gap: 3px;
  border: 0.5px solid rgba(146, 43, 33, 0.18);
  box-shadow:
    0 0 0 1px rgba(146, 43, 33, 0.06),
    0 0 32px rgba(146, 43, 33, 0.2),     /* halo granate: la firma de la navbar */
    0 4px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  min-width: 680px;
}

.desktopIndicator {
  position: absolute;
  top: 6px;
  height: 46px;
  background: var(--accent);
  border-radius: 999px;
  pointer-events: none;
  transition: left 320ms var(--ease-ios), width 320ms var(--ease-ios);
}

.desktopItem {
  flex: 1;
  height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 999px;
  padding: 0 22px;
  color: var(--text-hint);
  font-size: 14px;
  font-weight: var(--font-medium);
  white-space: nowrap;
  position: relative;
  z-index: 1;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: color 200ms var(--ease-ios);
}
.desktopItem:hover        { color: var(--text-secondary); }
.desktopItem:hover svg    { transform: scale(1.1); }
.desktopItem.active       { color: #fff; }
.desktopItem svg          { transition: transform 220ms var(--ease-spring); flex-shrink: 0; }
.desktopItem.active svg   { transform: scale(1.18); }
```

Móvil: `.mobileNav` con `border-radius: 22px`, ítems de 56px en columna (icono + etiqueta
de 12px), indicador de `border-radius: 16px`, y el panel expandido con
`transform: scaleY(0 → 1)` y `transform-origin: bottom center` sobre `--ease-spring`.

El halo granate de la sombra (`0 0 32px rgba(146,43,33,0.2)`) es lo más característico de
toda la interfaz. Si copias una sola cosa del proyecto, que sea esto.

---

## 8. Movimiento — resumen de duraciones

| Qué | Duración | Curva |
|---|---|---|
| Color de fondo, borde, texto (hover) | `120–150ms` | por defecto |
| Hundido al pulsar (`scale(0.97/0.98)`) | `120ms` | `--ease-ios` |
| Cambio de color en pestañas | `200ms` | `--ease-ios` |
| Indicador deslizante (`left`, `width`) | `280–320ms` | `--ease-ios` |
| Escala de iconos | `220ms` | `--ease-spring` |
| Entrada de modal | `200ms` | `--ease-spring` |
| Fundido de overlay | `150ms` | `ease` |
| Transición de página | `280ms` | `--ease-ios` + `backwards` |

Nunca uses `transition: all`. Lista siempre las propiedades.

Toda superficie táctil lleva `-webkit-tap-highlight-color: transparent` y los elementos de
navegación `user-select: none`.

---

## 9. Responsive

Solo tres breakpoints, y solo `max-width`:

- **`768px`** — el principal. Grids de 4 → 2 columnas, grids de 2 → 1, tablas a scroll
  horizontal, navbar a modo móvil, padding del main a `5rem 1rem 110px`.
- **`600px`** — paginación centrada.
- **`480px`** — `formGrid` de 2 → 1 columna.

Móvil primero **no**: el proyecto está escrito escritorio-primero con overrides
`max-width`. Mantén esa dirección si refactorizas sobre el código existente.

---

## 10. Reglas duras (no negociables)

1. **Un solo color de acento.** Si algo necesita destacar y no es la acción principal, usa
   peso tipográfico o un badge tintado, no un color nuevo.
2. **Sombras siempre dobles.** `0 1px 4px rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.04)` en
   reposo. Una sola sombra se ve barata al lado del resto.
3. **`dvh`, nunca `vh`,** en cualquier cosa que deba caber en una pantalla de móvil.
4. **Los modales van por portal a `document.body`.** Siempre.
5. **Las animaciones de página solo animan `opacity`,** con `fill-mode: backwards`.
6. **Los inputs no llevan ring de focus.** Solo cambia el borde a granate y el fondo a blanco.
7. **Un componente compartido antes que la undécima copia.** Modal, Paginación y ToggleSwitch
   ya lo son. Si escribes el mismo bloque por tercera vez, extráelo.
8. **Los botones de cancelar dentro de un `<form>` llevan `type="button"`.**
9. **`font-variant-numeric: tabular-nums` en toda cifra** que se actualice.
10. **Nada de `transition: all`** ni de `!important` salvo en las dos clases de estado
    activo de pestañas, donde ya está.

---

## 11. Lo que NO se hace en este sistema

- Modo oscuro (no existe).
- Barra lateral de navegación.
- Spinners circulares.
- Iconos rellenos (todo Tabler con `stroke`).
- Bordes de más de 1px, salvo el `1.5px dashed` de la dropzone y el `2px` del avatar grande.
- Mayúsculas fuera de cabeceras de tabla y títulos de sección de ajustes.
- Toasts (los errores van en línea, dentro del formulario o encima de la lista).
- Emojis en la interfaz.

---

## 12. Cómo aplicar esto a un panel existente

Orden recomendado, de menor a mayor riesgo:

1. **Tokens y global.** Copia `variables.css` y `global.css`. Ya cambia el 60% del aspecto.
   Ojo con el `font-size: 18px`: revisa qué se rompe antes de seguir.
2. **Layout y cabeceras de página.** `.main` con `max-width: 1200px` centrado, y el patrón
   título + subtítulo + acción principal en todas las pantallas.
3. **Botones.** Sustituye todas las variantes existentes por las cuatro de la sección 6.1.
4. **Tarjetas, tablas y badges.** Es donde se nota más el sistema.
5. **Extrae el Modal a un componente compartido** antes de restilizar los modales uno a uno.
6. **Formularios.**
7. **Navegación.** Lo último, porque es lo que más código toca.

Si el panel antiguo usa una librería de componentes (MUI, Ant, Bootstrap), decide primero si
la quitas o la re-tematizas. Este sistema está pensado para HTML plano con CSS Modules; con
MUI encima vas a pelear contra los estilos por defecto en cada componente.