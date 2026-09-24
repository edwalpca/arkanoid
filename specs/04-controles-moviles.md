# SPEC 04 — Soporte para dispositivos móviles y controles táctiles

> **Status:** aprobados
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-09-23
> **Objective:** Añadir soporte responsivo completo y controles táctiles intuitivos para dispositivos móviles, permitiendo mover la paleta mediante deslizamiento táctil continuo (touch drag), pausar el juego mediante un botón táctil flotante y adaptar el gabinete arcade a pantallas pequeñas sin desplazamiento ni zoom accidental.

---

## Scope

**In:**

1. **Adaptación responsiva del contenedor y canvas (HTML/CSS):**
   - Reglas de escalado fluido en CSS para `.cabinet-container` y `#game` que permitan adaptarse a anchos de pantalla estrechos (móviles desde 320px hasta tablets y pantallas de escritorio).
   - Preservación estricta de la relación de aspecto del canvas (480x640) usando `width: 100%`, `max-width: 480px` y `height: auto` o `aspect-ratio: 480 / 640`.
   - Prevención de gestos indeseados del navegador mediante `touch-action: none` en el canvas y contenedor, desactivación de selección de texto (`user-select: none`) y anulación de zoom accidental o scroll vertical/horizontal durante la partida.
   - Media queries para compactar márgenes, paddings y encabezados en pantallas móviles (`@media (max-width: 768px)`), asegurando que el juego completo sea visible sin scroll vertical en orientación portrait.

2. **Control táctil por deslizamiento (Touch Drag):**
   - Captura de eventos `touchstart`, `touchmove`, `touchend` y `touchcancel` vinculados al área de juego.
   - Algoritmo de traslación de coordenadas: cálculo de la posición horizontal X del toque en píxeles del viewport a la coordenada interna del canvas de 480px, utilizando `canvas.getBoundingClientRect()` y la relación de escala `(touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)`.
   - Movimiento directo y continuo de la pala centrada en la coordenada X calculada, respetando los límites de los muros arcade (`WALL_THICKNESS` y `CANVAS_WIDTH - WALL_THICKNESS - paddle.width`).
   - Invocación de `e.preventDefault()` en los manejadores táctiles para evitar que el navegador genere eventos sintéticos de scroll o ratón no deseados.

3. **Botón táctil de Pausa Neón:**
   - Incorporación de un botón táctil flotante estilizado con estética Cyberpunk/Neón (`⏸` / `PAUSA`) visible en la parte superior o esquina del canvas/gabinete.
   - Detección táctil directa (`pointerdown` o `touchstart`) que invoca `handlePauseAction()`.
   - Estado visual activo al pulsar (cambio de brillo/resplandor neón) y visibilidad optimizada para que no estorbe la visibilidad de los bloques ni el HUD.

4. **Navegación e interacción táctil de pantallas:**
   - Toque simple en la pantalla para iniciar la partida desde la pantalla de inicio (`start` → `playing`).
   - Toque simple en la pantalla para reiniciar tras perder o ganar (`gameover` / `win` → `start`).
   - Detección de toques para reanudar cuando el juego se encuentra pausado.

5. **Adaptación contextual de la guía de controles:**
   - Actualización dinámica o responsive de las instrucciones en el pie de página (`.cabinet-footer`): mostrar guía táctil (`Deslizar para mover • Toque para jugar • ⏸ Pausa`) en dispositivos táctiles / pantallas móviles, y guía de teclado (`[←][→] Mover • [P] Pausa • [ENTER] Jugar`) en computadoras de escritorio.

**Out of scope (for future specs):**
- Soporte para acelerómetro / giroscopio (control por inclinación del dispositivo).
- Botones virtuales D-Pad (flechas izquierda/derecha fijas en pantalla).
- Vibración háptica (Vibration API) al rebotar o destruir bloques.
- Orientación horizontal forzada (landscape lock); el juego mantendrá su diseño natural vertical (portrait).

---

## Data model

Esta funcionalidad no introduce entidades persistentes ni altera los modelos de datos existentes (`Ball`, `Block`, `GameState`).

Para el control táctil en tiempo de ejecución, se utiliza una estructura ligera de estado de entrada táctil en memoria:

```ts
// Estado del puntero táctil para el arrastre de la pala
interface TouchInputState {
  isActive: boolean;
  touchId: number | null;
  targetCanvasX: number;
}
```

### Constantes nuevas en `src/constants.ts`:

```ts
// Configuración de controles táctiles
const TOUCH_PADDLE_SMOOTHING = false; // true si se requiere interpolación lineal, false para respuesta 1:1 directa
```

---

## Implementation plan

1. **Estilos responsivos y prevención de gestos en `index.html`:**
   - Configurar viewport meta tag con `viewport-fit=cover`.
   - Modificar las reglas CSS de `.cabinet-container`, `.canvas-wrapper` y `#game`:
     - Establecer `touch-action: none` en `#game` y `.canvas-wrapper`.
     - Permitir que el canvas escale fluidamente con `max-width: 100%`, `height: auto` manteniendo relación de aspecto `aspect-ratio: 480 / 640`.
     - Añadir media queries para `@media (max-width: 768px)` y `@media (max-width: 480px)` ajustando padding y reduciendo tamaños tipográficos si es necesario.

2. **Creación del botón táctil de Pausa en `index.html`:**
   - Agregar el elemento de botón neón `#touch-pause-btn` dentro del contenedor del juego.
   - Diseñar estilos acordes a la estética ciberpunk: borde cian neón, fondo oscuro semitransparente, icono `⏸` con resplandor neón.
   - Ajustar visibilidad mediante CSS para que se muestre prominentemente en dispositivos móviles y táctiles (`@media (pointer: coarse)` o `@media (max-width: 768px)`).

3. **Lógica de entrada táctil en `src/paddle.ts` / `src/game.ts`:**
   - Crear función `initTouchInput(canvas: HTMLCanvasElement, paddle: Paddle): void`:
     - Registrar listeners de eventos `touchstart`, `touchmove`, `touchend`, `touchcancel` con `{ passive: false }`.
     - En `touchmove` y `touchstart`: extraer el toque primario, calcular la coordenada X relativa escalada al canvas:
       ```ts
       const rect = canvas.getBoundingClientRect();
       const scaleX = CANVAS_WIDTH / rect.width;
       const touchX = (touch.clientX - rect.left) * scaleX;
       paddle.x = touchX - paddle.width / 2;
       // Limitar a los muros físicos arcade
       paddle.x = Math.max(WALL_THICKNESS, Math.min(CANVAS_WIDTH - WALL_THICKNESS - paddle.width, paddle.x));
       ```
     - Llamar `e.preventDefault()` en cada evento táctil sobre el canvas para bloquear scrolling, zoom o gestos del sistema.

4. **Integración de acciones táctiles y botón de pausa en `src/game.ts`:**
   - Vincular eventos `pointerdown` / `click` del botón `#touch-pause-btn` a la función `handlePauseAction()`.
   - Asegurar que al pulsar el botón de pausa se use `e.stopPropagation()` para no disparar simultáneamente toques sobre el canvas.
   - Garantizar que los toques en cualquier parte del canvas durante las pantallas `start`, `paused`, `gameover` y `win` ejecuten las transiciones de estado correctas (`handleConfirmAction()` o reanudar).

5. **Instrucciones táctiles contextuales en el DOM (`index.html` / `src/game.ts`):**
   - Agregar en el pie de página la sección de ayuda táctil con selector CSS o detección táctil (`'ontouchstart' in window || navigator.maxTouchPoints > 0`).
   - Adaptar los textos de las pantallas del juego (ej. pantalla `start`: "PRESIONA ENTER O TOCA PARA JUGAR").

6. **Compilación y verificación:**
   - Compilar el proyecto con TypeScript (`npm run build`).
   - Probar en navegador de escritorio y mediante emulación de dispositivos móviles (DevTools con pantalla táctil simulada) verificando:
     - Movimiento 1:1 de la paleta al arrastrar el dedo.
     - Botón de pausa accesible y funcional.
     - Dimensionamiento correcto en diferentes resoluciones móviles sin overflow horizontal ni scroll accidental.
     - Preservación total de los controles por teclado en escritorio.

---

## Acceptance criteria

- [ ] El juego se adapta responsivamente a pantallas móviles (desde 320px de ancho) sin generar desbordamiento horizontal ni requerir scroll vertical.
- [ ] La relación de aspecto del canvas (480x640) se mantiene intacta en cualquier tamaño de pantalla.
- [ ] Al deslizar el dedo horizontalmente sobre el canvas en un dispositivo móvil, la paleta sigue con precisión la posición del dedo sin lag perceptible.
- [ ] La paleta respeta estrictamente los límites de los muros laterales durante el control táctil.
- [ ] Deslizar el dedo sobre la pantalla no produce zoom accidental, scroll de la página ni selecciones de texto (`touch-action: none` / `preventDefault`).
- [ ] Existe un botón táctil visible con estilo Neón para pausar y reanudar el juego en dispositivos móviles.
- [ ] Tocar la pantalla en el estado `start`, `gameover` o `win` inicia o reinicia la partida sin requerir teclado.
- [ ] Los controles tradicionales de teclado (`ArrowLeft`, `ArrowRight`, `P`, `Enter`, `Espacio`) continúan funcionando sin cambios en computadoras de escritorio.
- [ ] El código compila limpiamente con TypeScript sin librerías externas.

---

## Decisions

- **Sí:** Control mediante deslizamiento táctil directo (Touch Drag) continuo en lugar de botones virtuales izquierda/derecha, ya que ofrece un control mucho más intuitivo, rápido y preciso para un juego tipo Breakout/Arkanoid.
- **Sí:** Botón táctil flotante estilizado Neón para Pausa, garantizando que los usuarios móviles puedan pausar el juego sin depender de una tecla física `P`.
- **Sí:** Escalado proporcional en CSS preservando la resolución lógica de 480x640 en el canvas, evitando tener que reprogramar las dimensiones de los niveles o las físicas de colisión.
- **Sí:** Aplicación de `touch-action: none` y `preventDefault` en eventos táctiles para anular completamente comportamientos nativos de navegadores móviles (pull-to-refresh, zoom de doble toque, scroll).
- **No:** Botones virtuales D-Pad (flechas táctiles en pantalla), descartados por restar visibilidad y ofrecer una respuesta menos dinámica que el deslizamiento directo.
- **No:** Modificar las velocidades o mecánicas centrales del juego; la adaptación es exclusivamente a nivel de interfaz y capa de entrada (input).

---

## Identified risks

- **Interferencia de gestos del sistema (swipe-to-back en iOS / Android):** Deslizar muy cerca del borde de la pantalla podría activar el gesto de retroceso del navegador en dispositivos móviles.  
  *Mitigación:* Se implementa `touch-action: none` a nivel de CSS y `e.preventDefault()` en los listeners táctiles con `{ passive: false }`.
- **Diferencia de escala entre píxeles de pantalla y coordenadas del canvas:** Al escalar el canvas en pantallas móviles, el valor de `clientX` no coincide con las coordenadas 0-480 del canvas.  
  *Mitigación:* Se computa la posición exacta relativa multiplicando la posición del toque por el ratio `CANVAS_WIDTH / rect.width`.
- **Solapamiento del botón de pausa con el HUD o bloques:** En pantallas reducidas, un botón mal posicionado podría tapar las vidas o los bloques superiores.  
  *Mitigación:* Se ubica el botón de pausa en una zona despejada del header o margen superior con z-index adecuado y tamaño accesible de al menos 44x44px conforme a las guías de accesibilidad táctil.
