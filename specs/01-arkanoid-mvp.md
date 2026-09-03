# SPEC 01 — MVP de Arkanoid jugable en el navegador, portable en un solo archivo

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-09-02
> **Objective:** Construir un MVP jugable de Arkanoid en TypeScript vanilla (sin frameworks), compilado a un único `dist/game.js` y cargado desde un `index.html` centrado en un canvas fijo de 480x640, con pala, pelota, bloques, puntuación, vidas, 3 niveles y game over/victoria.

---

## Scope

**In:**

- Canvas fijo de 480x640px, centrado en la página (no responsive).
- Pala controlada con las teclas de flecha izquierda/derecha, dibujada con `drawSprite('paddle', ...)`.
- Pelota que rebota en paredes laterales y superior, y en la pala con ángulo de salida variable según el punto de impacto.
- Bloques dibujados con `drawSprite('block_<color>', ...)` que se rompen al ser golpeados, con animación de explosión vía `drawFrame` usando `EXPLOSION_FRAMES`/`EXPLOSION_DURATION` de `assets/spritesheet.js`.
- Sistema de puntuación: cada color de bloque otorga puntos distintos.
- Sistema de vidas: el jugador inicia con 3 vidas; pierde una si la pelota cae debajo de la pala.
- 3 niveles con layouts de bloques distintos, hardcodeados en `src/levels.ts`. Al romper todos los bloques de un nivel se pasa al siguiente.
- Sonido: `ball-bounce.mp3` al rebotar en paredes/pala, `break-sound.mp3` al romper un bloque.
- Pantallas: Start (inicio), Playing (jugando), Paused (pausa con tecla `P`), Game Over (con reinicio a nivel 1), Win (al completar el nivel 3 sin quedarse sin vidas).
- Compilación con `tsc` (sin bundler) desde `src/*.ts` a un único `dist/game.js`, cargado por `index.html` junto a `assets/spritesheet.js`.

**Out of scope (for future specs):**

- Persistencia de puntuaciones altas (localStorage) entre sesiones.
- Power-ups (multibola, pala extendida, etc.).
- Editor de niveles o niveles generados proceduralmente.
- Canvas responsive / soporte táctil o móvil.
- Dificultad progresiva ajustable por el usuario (menú de opciones).
- Animaciones de transición entre pantallas más allá de mostrar/ocultar texto.

---

## Data model

```ts
// src/types.ts

type Screen = 'start' | 'playing' | 'paused' | 'gameover' | 'win';

type BlockColor = 'red' | 'yellow' | 'cyan' | 'magenta' | 'hotpink' | 'green' | 'gray';

interface GameState {
  screen: Screen;
  level: number;      // 1..3
  score: number;
  lives: number;       // inicia en 3
}

interface Paddle {
  x: number; y: number;
  width: number; height: number;
  speed: number;        // px/frame
}

interface Ball {
  x: number; y: number;
  radius: number;
  dx: number; dy: number; // velocidad por eje, px/frame
}

interface Block {
  x: number; y: number;
  width: number; height: number;
  color: BlockColor;
  points: number;
  alive: boolean;
  exploding: boolean;
  explosionStart: number; // timestamp, para animar con EXPLOSION_DURATION
}

// src/levels.ts
// Cada nivel es una grilla de colores (o null = sin bloque) que se traduce a Block[]
type LevelLayout = (BlockColor | null)[][];
const LEVELS: LevelLayout[] = [ /* level 1 */ [], /* level 2 */ [], /* level 3 */ [] ];
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas.
- Puntos por color (ascendente por dificultad de derribo): `gray: 1, red: 2, yellow: 3, cyan: 4, magenta: 5, hotpink: 6, green: 7`.
- El estado global (`GameState`, `paddle`, `ball`, `blocks`) vive en `src/game.ts` como variables de módulo; no hay clases, solo funciones y objetos planos.

---

## Implementation plan

1. Crear `tsconfig.json` (compilación sin módulos ES: `"module": "none"`, `"outFile": "dist/game.js"`, `"target": "es2017"`, lista de archivos en `src/` en orden de dependencia) y `index.html` mínimo con un `<canvas id="game" width="480" height="640">` centrado por CSS, que carga `assets/spritesheet.js` y `dist/game.js`. Prueba manual: abrir con `python3 -m http.server` y ver el canvas vacío sin errores en consola.
2. Crear `src/constants.ts` (dimensiones de canvas, velocidad inicial de pelota, velocidad de pala, puntos por color) y `src/types.ts` con las interfaces de la sección anterior.
3. Implementar `src/paddle.ts`: dibujo de la pala con `drawSprite('paddle', ...)` y movimiento con flechas izquierda/derecha, con clamp a los bordes del canvas. Prueba manual: la pala se mueve y no sale del canvas.
4. Implementar `src/ball.ts`: dibujo de la pelota con `drawSprite('ball', ...)`, movimiento por frame, rebote en pared izquierda/derecha/superior, y pérdida de vida al cruzar el borde inferior. Prueba manual: la pelota rebota en paredes y cae si no hay pala debajo.
5. Implementar el rebote pelota-pala con ángulo de salida variable según el punto de impacto (más cerca del borde de la pala → ángulo más cerrado). Prueba manual: golpear con distintas zonas de la pala cambia visiblemente la trayectoria.
6. Implementar `src/levels.ts` con los 3 layouts de bloques hardcodeados y `src/blocks.ts` con la construcción de `Block[]` a partir de un layout, su dibujo (`drawSprite('block_<color>', ...)`) y la detección de colisión pelota-bloque. Prueba manual: los bloques del nivel 1 se ven en pantalla.
7. Implementar la rotura de bloques: al colisionar, marcar `alive: false`, sumar `points` al score, y reproducir la animación de explosión con `drawFrame` durante `EXPLOSION_DURATION`. Prueba manual: romper un bloque muestra la animación y suma puntos.
8. Implementar `src/audio.ts` con dos funciones (`playBounce()`, `playBreak()`) que reproducen `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3` vía `Audio()` nativo; conectarlas a los eventos de rebote y rotura. Prueba manual: se escuchan ambos sonidos jugando.
9. Implementar el HUD: texto dibujado en el canvas con score, vidas y nivel actual, actualizado cada frame. Prueba manual: el HUD refleja los cambios en tiempo real.
10. Implementar la máquina de estados de pantallas en `src/game.ts` (`start` → `playing` ⇄ `paused` con tecla `P`, → `gameover` si `lives === 0`, → `win` si se limpia el nivel 3), cada pantalla con su propio texto/overlay sobre el canvas y su input (tecla o click para continuar). Prueba manual: se puede recorrer el flujo completo start → playing → pause → resume → gameover, y reiniciar desde game over vuelve a `start`/nivel 1.
11. Implementar la transición entre niveles: al quedar sin bloques vivos, cargar el siguiente layout de `LEVELS`, reposicionar pelota y pala, y mantener score/vidas. Prueba manual: limpiar el nivel 1 carga el nivel 2 sin perder el puntaje.
12. Crear `src/main.ts` como punto de entrada que arranca el bucle principal (`requestAnimationFrame`) e inicializa el `GameState` en `start`; compilar con `tsc` a `dist/game.js` y verificar el juego completo end-to-end en el navegador. Prueba manual: partida completa desde `start` hasta `win` o `gameover` sin errores en consola.

---

## Acceptance criteria

- [x] `index.html` abierto vía servidor local (`python3 -m http.server`) carga el juego sin errores en la consola.
- [x] La pala se mueve con las flechas izquierda/derecha y no sale del canvas.
- [x] La pelota rebota correctamente en las paredes laterales, la pared superior y la pala.
- [x] El ángulo de rebote contra la pala cambia según el punto de impacto.
- [x] Golpear un bloque lo destruye, muestra la animación de explosión y suma sus puntos al score.
- [x] El score y las vidas se muestran en pantalla y se actualizan en tiempo real.
- [x] Perder una vida ocurre exactamente cuando la pelota cruza el borde inferior del canvas sin tocar la pala.
- [x] Al llegar a 0 vidas se muestra la pantalla de Game Over con el score final y una opción para reiniciar desde el nivel 1.
- [x] Al romper todos los bloques de un nivel se carga el siguiente nivel conservando score y vidas.
- [x] Al completar el nivel 3 se muestra la pantalla de victoria (Win), distinta de Game Over.
- [x] La tecla `P` pausa y reanuda el juego durante la partida.
- [x] Se reproduce `ball-bounce.mp3` en cada rebote y `break-sound.mp3` en cada rotura de bloque.
- [x] El proyecto compila con `tsc` sin errores y genera un único `dist/game.js`.
- [x] No se usa ningún framework, librería externa ni bundler.

---

## Decisions

- **Sí:** compilar con `tsc` puro (sin bundler) usando `"module": "none"` y `"outFile": "dist/game.js"`, con los `.ts` en `src/` escritos como scripts globales (sin `import`/`export`) ordenados vía la lista `files` en `tsconfig.json`. Cumple el requisito de "un solo archivo `.html` principal" sin introducir webpack/vite.
- **No:** cargar cada `.ts` compilado como `<script>` individual en `index.html`. Rompería la portabilidad de mover el juego copiando solo `index.html` + `dist/game.js` + `assets/`.
- **Sí:** 3 niveles con layouts fijos hardcodeados en `src/levels.ts`. Cumple el requisito explícito de "sistema de niveles" del README sin la complejidad de un editor o generación procedural.
- **Sí:** puntos distintos por color de bloque (escala ascendente 1–7). Da más profundidad al sistema de puntuación que un valor fijo.
- **Sí:** ángulo de rebote variable en la pala según punto de impacto. Es el comportamiento estándar de Arkanoid y da control real al jugador.
- **Sí:** usar los sonidos de `assets/sounds/` aunque el README no los pida explícitamente, ya que están incluidos en los assets del proyecto.
- **Sí:** canvas fijo 480x640, no responsive. Simplifica cálculos de colisión y encaja con las dimensiones del sprite sheet (pala 162px, bloques 32px).
- **No:** persistencia de puntuaciones (localStorage). Fuera del scope del MVP; candidato a spec futuro.
- **No:** power-ups. Fuera del scope del MVP; candidato a spec futuro.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Los navegadores bloquean el autoplay de audio hasta la primera interacción del usuario | El primer sonido solo se dispara después del click/tecla que sale de la pantalla `start`, que ya cuenta como interacción del usuario. |
| El orden de los archivos en `tsconfig.json` (`files`) es incorrecto y `tsc` referencia símbolos antes de definirlos | Definir el orden explícito: `constants.ts`, `types.ts`, `audio.ts`, `paddle.ts`, `ball.ts`, `blocks.ts`, `levels.ts`, `game.ts`, `main.ts` — de más básico a más dependiente. |
| Colisión pelota-bloque con salto de frames (pelota rápida atraviesa un bloque delgado) | Los bloques miden 32x16px y la velocidad de la pelota se mantiene moderada; si se detecta el problema durante la prueba manual del paso 6, se ajusta la velocidad máxima antes de continuar. |

---

## What is **not** in this spec

- Persistencia de high scores entre sesiones (localStorage).
- Power-ups o modificadores de gameplay.
- Editor de niveles o generación procedural de layouts.
- Canvas responsive o soporte táctil/móvil.
- Menú de opciones o ajuste de dificultad.

Cada uno de estos, si se implementa, va en su propio spec.
