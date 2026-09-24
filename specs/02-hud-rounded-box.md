# SPEC 02 — Box con bordes redondeados para el HUD y margen ajustado de bloques

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-09-23
> **Objective:** Envolver el HUD de score, vidas y nivel en un box con fondo oscuro semitransparente y bordes redondeados, anclado en la esquina superior izquierda del canvas, y bajar el margen superior de los bloques (`BLOCK_ROWS_TOP_MARGIN`) para que no se superpongan visualmente con ese box.

---

## Scope

**In:**

- Un box con fondo oscuro semitransparente, borde sutil y esquinas redondeadas, dibujado detrás de los tres datos del HUD (Score, Vidas, Nivel).
- Los tres datos se muestran en una sola fila horizontal dentro del box (`Score: X   Vidas: Y   Nivel: Z`), en lugar de las tres líneas apiladas actuales.
- El box queda anclado en la esquina superior izquierda del canvas, en la misma zona donde hoy se dibuja el HUD (cerca de `x=12, y=12`).
- El ancho del box se calcula dinámicamente a partir del ancho real del texto (vía `ctx.measureText`) más un padding fijo, para que nunca corte el contenido sin importar cuántos dígitos tenga el score.
- Se sube `BLOCK_ROWS_TOP_MARGIN` de `60` a `90` en `src/constants.ts`, para que la primera fila de bloques quede debajo del box del HUD en los 3 niveles existentes.
- Un helper propio de dibujo (`drawRoundedRect`) implementado con `moveTo`/`arcTo` o `lineTo`/`arc` sobre el `CanvasRenderingContext2D`, sin depender de `ctx.roundRect` nativo, para máxima compatibilidad de navegador.

**Out of scope (for future specs):**

- Cambiar el HUD a una barra de ancho completo o reposicionarlo en otra esquina.
- Animaciones de aparición/transición del box (fade in, etc.).
- Iconos o sprites junto a los datos del HUD (por ahora sigue siendo texto plano).
- Hacer el HUD responsive o reubicable por el usuario.
- Cualquier cambio a la lógica de puntuación, vidas o niveles — este spec es puramente visual.

---

## Data model

Este spec no introduce estructuras de datos nuevas. Solo agrega constantes de estilo en `src/constants.ts` y modifica la función de dibujo `drawHUD()` en `src/game.ts`.

Constantes nuevas en `src/constants.ts`:

```ts
const HUD_MARGIN = 12;              // distancia del box a la esquina superior izquierda del canvas
const HUD_PADDING_X = 16;           // padding horizontal interno del box
const HUD_PADDING_Y = 10;           // padding vertical interno del box
const HUD_FIELD_GAP = 24;           // separación horizontal entre "Score", "Vidas" y "Nivel"
const HUD_BOX_RADIUS = 10;          // radio de esquina del box
const HUD_BOX_FILL = 'rgba(0, 0, 0, 0.55)';
const HUD_BOX_BORDER = 'rgba(226, 232, 240, 0.35)';
```

`BLOCK_ROWS_TOP_MARGIN` cambia de `60` a `90`.

---

## Implementation plan

1. En `src/constants.ts`: cambiar `BLOCK_ROWS_TOP_MARGIN` de `60` a `90`, y agregar las constantes de estilo del HUD listadas en Data model. Prueba manual: `tsc` compila sin errores (el valor aún no se usa en otro lado nuevo).
2. En `src/game.ts`: agregar una función `drawRoundedRect(ctx, x, y, w, h, radius)` que dibuje (sin rellenar ni trazar) un rectángulo de esquinas redondeadas como `Path2D`/subpath reutilizable para relleno y borde. Prueba manual: no hay cambio visible todavía (función sin usar).
3. Reescribir `drawHUD()` en `src/game.ts` para: (a) construir los tres textos (`Score: ${state.score}`, `Vidas: ${state.lives}`, `Nivel: ${state.level}`), (b) medir su ancho total con `ctx.measureText` sumando `HUD_FIELD_GAP` entre cada uno, (c) calcular ancho/alto del box a partir de esas medidas más `HUD_PADDING_X`/`HUD_PADDING_Y`, (d) dibujar el box en `(HUD_MARGIN, HUD_MARGIN)` usando `drawRoundedRect` con `HUD_BOX_FILL` de relleno y `HUD_BOX_BORDER` de borde, y (e) dibujar los tres textos en una sola fila horizontal centrados verticalmente dentro del box. Prueba manual: en pantalla `playing`, se ve un box redondeado en la esquina superior izquierda con `Score / Vidas / Nivel` en una fila, y el box no corta el texto.
4. Compilar con `tsc` a `dist/game.js` y verificar visualmente en el navegador (servidor local) que: el box se ve correctamente en los 3 niveles, los bloques ya no se superponen con el box tras subir `BLOCK_ROWS_TOP_MARGIN` a `90`, y el HUD sigue ocultándose en las pantallas `start`, `gameover` y `win` igual que antes. Prueba manual: partida completa start → playing → pausa → gameover, revisando el HUD y el margen de bloques en cada nivel.

---

## Acceptance criteria

- [ ] En las pantallas `playing` y `paused` se ve un box con fondo oscuro semitransparente y esquinas redondeadas detrás del HUD.
- [ ] Score, Vidas y Nivel se muestran en una sola fila horizontal dentro del box, no apilados.
- [ ] El box está anclado en la esquina superior izquierda del canvas (mismo lugar aproximado donde estaba el HUD antes de este cambio).
- [ ] El ancho del box se ajusta al contenido real del texto (probar con score de 1 dígito y con uno de varios dígitos) sin cortar ni desbordar el texto.
- [ ] `BLOCK_ROWS_TOP_MARGIN` vale `90` en `src/constants.ts`.
- [ ] En los 3 niveles definidos en `src/levels.ts`, la primera fila de bloques no se superpone visualmente con el box del HUD.
- [ ] El HUD (box incluido) no se dibuja en las pantallas `start`, `gameover` ni `win`, igual que el comportamiento previo.
- [ ] El resto del juego (movimiento, colisiones, score, vidas, niveles, sonido) sigue funcionando exactamente igual que antes de este cambio.
- [ ] El proyecto compila con `tsc` sin errores y sin introducir ninguna librería o framework nuevo.

---

## Decisions

- **Sí:** fila horizontal (`Score | Vidas | Nivel`) en vez de las tres líneas apiladas actuales. Elegido por el usuario para un HUD más compacto tipo barra.
- **Sí:** box anclado en la esquina superior izquierda, en el mismo lugar donde ya vivía el HUD. Minimiza el cambio de layout y es lo que pidió el usuario frente a la alternativa de una barra de ancho completo.
- **Sí:** fondo oscuro semitransparente (`rgba(0,0,0,0.55)`) con borde sutil claro, consistente con el `drawOverlay()` ya usado en pausa/game over.
- **Sí:** calcular el ancho del box dinámicamente con `ctx.measureText` en cada frame, en vez de un ancho fijo. Evita que el box corte el texto si el score crece a varios dígitos.
- **Sí:** implementar `drawRoundedRect` a mano con las APIs base de `CanvasRenderingContext2D` en vez de depender de `ctx.roundRect()` nativo. Mantiene el código funcionando en navegadores donde `roundRect` todavía no está disponible, sin agregar ninguna librería.
- **No:** mover el HUD a una barra de ancho completo arriba del canvas. Se descarta porque el usuario prefirió mantenerlo en la esquina superior izquierda.
- **No:** agregar iconos o sprites junto a los textos del HUD. Fuera de foco de este spec, que es puramente sobre el box y el margen de bloques.

---

## What is **not** in this spec

- Reposicionar el HUD fuera de la esquina superior izquierda.
- Animaciones de entrada/salida del box del HUD.
- Iconos o elementos gráficos adicionales dentro del HUD.
- Cambios a la lógica de puntuación, vidas, niveles o colisiones.

Cada uno de estos, si se implementa, va en su propio spec.
