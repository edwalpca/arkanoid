# CLAUDE.md

Este archivo brinda orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Idioma

Todas las respuestas, explicaciones y comunicación con el usuario deben ser en español. Los
comentarios de código (cuando sean estrictamente necesarios), nombres de variables/funciones y
mensajes de commit pueden mantenerse en inglés siguiendo las convenciones habituales de
programación, salvo que el usuario indique lo contrario.

## Estado del proyecto

Este repositorio actualmente es una hoja en blanco: solo contiene `README.md` (la especificación) y
`assets.zip` (arte/audio del juego). No existe todavía código fuente, configuración de build ni manifiesto
de dependencias. La tarea es construir desde cero el juego descrito a continuación.

## Requisitos del proyecto (del README.md, en español)

Construir un juego estilo Arkanoid/Breakout en HTML, CSS y TypeScript, entregado como un **único
archivo `.html` principal** (se permiten archivos `.js`, `.css`, `.html` adicionales, pero debe haber
un único punto de entrada HTML principal). **No se pueden usar frameworks ni librerías** — la lógica
del juego, el renderizado y el manejo de input deben implementarse con TypeScript/JS vanilla y las
APIs de Canvas/DOM únicamente.

Funcionalidades de juego requeridas:
1. Una pelota que rebota contra las paredes y contra la paleta del jugador.
2. Una paleta que el jugador mueve con las teclas de flecha izquierda/derecha.
3. Bloques que se rompen al ser golpeados por la pelota.
4. Un sistema de puntuación.
5. Un sistema de vidas.
6. Un sistema de niveles (múltiples niveles/diseños).
7. Un estado de fin de juego (game over).

## Restricciones que esto implica

- Dado que se requiere TypeScript pero no se permite bundler/framework, se necesita un paso de
  compilación simple con `tsc` (TypeScript → JS) en lugar de un bundler como webpack/vite. Mantener
  el `tsconfig.json` minimalista y generar una salida que el único punto de entrada HTML pueda cargar
  mediante etiquetas `<script>` (o `type="module"` si se divide en varios archivos compilados).
- Nada de librerías npm de desarrollo de juegos (nada de Phaser, PixiJS, etc.) ni frameworks de UI —
  el bucle del juego, la detección de colisiones y el renderizado deben implementarse a mano contra
  `<canvas>`.

## Assets

`assets.zip` debe descomprimirse en la raíz del proyecto antes de que el juego pueda cargar su
arte/audio; se expande a un directorio `assets/` con esta estructura:

```
assets/
  spritesheet-breakout.png   # sprite sheet: paleta, pelota y bloques de colores
  spritesheet.js             # loader + funciones de dibujo para el sprite sheet (ver abajo)
  sounds/
    ball-bounce.mp3
    break-sound.mp3
```

`assets/spritesheet.js` es JS plano (no TypeScript) y está pensado para incluirse junto al código
compilado del juego. Codifica de forma fija la ruta del asset como `assets/spritesheet-breakout.png`,
por lo que espera ejecutarse desde un archivo HTML en la raíz del proyecto (u otro archivo que
preserve esa ruta relativa). Su API:

- `loadSpritesheet(cb)` — carga el PNG en un canvas fuera de pantalla una sola vez; encola callbacks
  hasta que esté listo.
- `drawSprite(ctx, name, x, y, w, h)` — dibuja un sprite con nombre (`'paddle'`, `'ball'`,
  `'block_<color>'` para `red`/`yellow`/`cyan`/`magenta`/`hotpink`/`green`/`gray`) escalado al
  rectángulo dado.
- `drawFrame(ctx, frame, x, y, w, h)` — dibuja un solo frame de la animación de explosión (de
  `EXPLOSION_FRAMES[color]`, 4 frames por color, `EXPLOSION_DURATION = 150`ms) para los efectos de
  rotura de bloques.
- Las coordenadas de sprites/frames (`sx, sy, sw, sh`) están definidas en las constantes `SPRITES` y
  `EXPLOSION_FRAMES` de ese archivo — consultarlo directamente en lugar de volver a deducir las
  coordenadas.

## Ejecución del juego durante el desarrollo

Dado que el juego carga imágenes y audio por ruta relativa, ábrelo mediante un servidor local de
archivos estáticos en lugar de una URL `file://` directa (algunos navegadores restringen la carga de
audio/canvas bajo `file://`). Por ejemplo, `python3 -m http.server` desde la raíz del proyecto, y
luego navegar al archivo HTML principal.
