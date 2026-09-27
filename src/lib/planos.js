/* ─────────────────────────────────────────────────────────────────────
   GEOMETRÍA DE LAS SALAS

   Medidas tomadas del plano acotado de la arquitecta (AutoCAD, 2016).
   Aquí no se dibuja nada: solo están los números. El dibujo vive en
   components/PlanoSala.

   Está separado del componente porque Fast Refresh solo funciona si un
   fichero exporta únicamente componentes. Teniendo `tienePlano` junto
   al JSX, cada cambio en el componente recargaba la página entera.

   LAS TRES SALAS SON DOS. Viena (34 m²) y Capellanes (27 m²) comparten
   una huella de 9,98 × 6,27 m separada por un panel móvil; al retirarlo
   queda la combinada de 61 m². Por eso todas las posiciones se miden
   desde la misma esquina, la superior izquierda de la huella.

   SI SE CORRIGE UNA MEDIDA, se corrige aquí y en ningún otro sitio.
   ───────────────────────────────────────────────────────────────────── */

/* Escala del dibujo: píxeles por metro. La huella completa son
   9,98 × 6,27 m, o sea 519 × 326 px a esta escala. */
export const PX = 52

/* Márgenes del lienzo. El izquierdo es más ancho porque la cota del
   fondo va alineada a la derecha y crece hacia fuera: con menos de 70
   se sale del viewBox. */
export const X0 = 70
export const Y0 = 44

export const FONDO = 6.27
export const ANCHO_TOTAL = 9.98
export const ALTURA = '2,30'

/* Posición de cada sala dentro de la huella, en metros desde la esquina
   superior izquierda. `pantalla` dice en qué pared está la pantalla
   fija: 'sur' es la pared del fondo, 'este' la de la derecha. */
export const SALAS = {
  'viena': {
    u0: 0, ancho: 5.70, m2: 34,
    ventanas: true, armario: true, pantalla: 'sur',
  },
  'capellanes': {
    u0: 5.70, ancho: 4.28, m2: 27,
    ventanas: false, armario: false, pantalla: 'este',
  },
  'viena-capellanes': {
    u0: 0, ancho: 9.98, m2: 61,
    ventanas: true, armario: true, pantalla: 'ambas', unida: true,
  },
}

/* Las dos ventanas de la fachada, en metros desde el borde superior.
   Salen de la cadena de cotas del plano: 2,10 · 0,73 · 2,10 · 1,20.
   Solo las tiene la pared de Viena: Capellanes es interior. */
export const VENTANAS = [
  { v: 0, alto: 2.10 },
  { v: 2.83, alto: 2.10 },
]

/* Para que PaginaSala pueda decidir si pinta el bloque "Cómo es la
   sala" cuando la sala no tiene descripción, sin duplicar la lista de
   slugs. */
export const tienePlano = (slug) => Boolean(SALAS[slug])

export const metros = (n) => n.toFixed(2).replace('.', ',')