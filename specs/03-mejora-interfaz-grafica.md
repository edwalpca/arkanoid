# SPEC 03 — Rediseño visual e interfaz gráfica estilo Cyberpunk / Neón

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-23
> **Objective:** Transformar la interfaz y presentación gráfica del juego a una estética Cyberpunk / Neón de alta fidelidad, incorporando marcos físicos arcade en el canvas, tipografía retro/arcade, HUD visual con vidas gráficas, estela luminosa para la pelota, partículas y números flotantes de puntuación al romper bloques, pantallas estilizadas con animaciones de pulso y un marco contenedor web estilo gabinete arcade con guía de controles.

---

## Scope

**In:**

1. **Marco contenedor web y entorno arcade (HTML/CSS):**
   - Importación de Google Fonts (`Press Start 2P` y `Orbitron`) para tipografía retro/arcade auténtica.
   - Fondo de página con degradado espacial oscuro y resplandor ambiental neón (cian y magenta).
   - Contenedor central tipo gabinete/pantalla arcade con bisel, borde brillante neón (`box-shadow` multicapa) y cabecera iluminada con título "ARKANOID // NEON EDITION".
   - Barra inferior externa con guía visual de controles (`[←] [→] Mover`, `[P] Pausa`, `[ENTER / ESPACIO] Jugar`).

2. **Bordes físicos arcade en el canvas:**
   - Adición de muros delimitadores físicos de 12px de grosor en la parte superior, izquierda y derecha del canvas.
   - Renderizado de muros con estilo ciberpunk (borde metálico oscuro con líneas de neón cian y acentos en las esquinas).
   - Ajuste de colisiones de la pelota y límites de movimiento de la pala para respetar el grosor del muro (`WALL_THICKNESS = 12`).

3. **Efectos dinámicos en juego (Canvas 2D vanilla):**
   - **Estela luminosa en la pelota:** buffer de posiciones previas (6-8 puntos) dibujadas con radio decreciente y opacidad atenuada cian/blanco brillante.
   - **Chispas/partículas de impacto:** al golpear bloques o pala, generación de ráfagas de 8 a 12 micro-partículas con velocidad angular, dispersión y fade-out (duración ~300ms).
   - **Números flotantes de puntuación (Score Popups):** al destruir un bloque, el puntaje obtenido (`+2`, `+5`, etc.) flota hacia arriba con desvanecimiento alfa durante 600ms, heredando el color neón del bloque impactado.

4. **HUD visual mejorado:**
   - Integración en la parte superior respetando el margen de los muros.
   - Tipografía arcade de alta legibilidad (`Orbitron` / `Press Start 2P` con fallback `monospace`).
   - Puntuación formateada con ceros a la izquierda (ej. `SCORE: 00420`).
   - Insignia estilizada de nivel actual (`LEVEL 01`).
   - Indicador visual de vidas mediante mini-iconos gráficos (palas miniatura estilizadas o gemas de vida) además del contador numérico.

5. **Rediseño completo de pantallas del juego:**
   - **Pantalla Start:** Título principal "ARKANOID" con resplandor neón dual (cian y magenta), subtítulo ciberpunk, texto parpadeante "PRESIONA ENTER O CLICK PARA COMENZAR" mediante interpolación de tiempo (`Math.sin`), y tarjeta de controles.
   - **Pantalla Pausa:** Fondo oscurecido con rejilla/filtro sutil, cartel central iluminado "PAUSA", y mensaje de reanudación con tecla `P`.
   - **Pantalla Game Over:** Ambiente rojo/carmesí neón, título "GAME OVER", panel de estadísticas con puntaje final y nivel alcanzado, e instrucción de reinicio.
   - **Pantalla Win:** Ambiente dorado/esmeralda neón, título "¡MISIÓN CUMPLIDA!", estrellas o partículas festivas, resumen de récord e instrucción para jugar de nuevo.

6. **Fondo ambiental dinámico del canvas:**
   - Degradado de fondo ciberpunk `#060814` a `#0e1326` con rejilla digital sutil o matriz de puntos retro iluminada en el fondo del área de juego.

**Out of scope (for future specs):**

- Power-ups que caen de los bloques (láser, pala ancha, multibola, pegamento).
- Música de fondo sintetizada (chiptune/synthwave) en bucle; se conservan los efectos de sonido de rebote y rotura actuales.
- Guardado de High Scores persistente en `localStorage`.
- Soporte táctil / controles virtuales en pantalla para smartphones.

---

## Data model

### Estructuras nuevas en `src/types.ts`:

```ts
// Representación de una partícula de chispa generada por impacto
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;     // Tiempo transcurrido (ms)
  maxLife: number;  // Duración máxima (ms)
}

// Representación de un texto flotante de puntuación
interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  created: number;  // Timestamp de inicio
  duration: number; // Duración total (ms)
}

// Punto histórico para la estela de la pelota
interface BallTrailPoint {
  x: number;
  y: number;
}
```

### Constantes nuevas / actualizadas en `src/constants.ts`:

```ts
// Dimensiones de muros físicos
const WALL_THICKNESS = 12;

// Colores Neón Ciberpunk asociados a los bloques y efectos
const NEON_COLORS: Record<BlockColor, string> = {
  red: '#ff0055',
  yellow: '#ffe600',
  cyan: '#00f0ff',
  magenta: '#ff00ea',
  hotpink: '#ff4db8',
  green: '#00ff66',
  gray: '#94a3b8',
};

// Configuración de estela de la pelota
const BALL_TRAIL_LENGTH = 7;

// Configuración de partículas
const SPARK_PARTICLE_COUNT = 10;
const SPARK_DURATION = 350; // ms

// Configuración de popups de puntuación
const SCORE_POPUP_DURATION = 700; // ms
```

---

## Implementation plan

1. **Estructura y diseño web (`index.html`):**
   - Enlazar fuentes Google Fonts (`Orbitron:wght@600;800;900` y `Press Start 2P`).
   - Crear el marco del arcade en el DOM: contenedor `#arcade-cabinet`, marquesina superior con logo neón, canvas `#game` con bordes de luz neón, y barra inferior con botones/teclas de instrucciones estilizadas (`kbd`).
   - Aplicar estilos CSS modernos en `index.html` para centrado responsive, resplandor de sombras (`box-shadow`), gradiente de fondo y detalles de interfaz.

2. **Nuevos tipos y constantes (`src/types.ts` y `src/constants.ts`):**
   - Agregar `Particle`, `ScorePopup`, `BallTrailPoint` y campos necesarios en `src/types.ts`.
   - Modificar y agregar constantes en `src/constants.ts`: `WALL_THICKNESS`, `NEON_COLORS`, `BALL_TRAIL_LENGTH`, `SPARK_PARTICLE_COUNT`, etc.

3. **Muros físicos y límites de juego (`src/paddle.ts`, `src/ball.ts`, `src/blocks.ts`):**
   - Actualizar `updatePaddle` para limitar la posición entre `WALL_THICKNESS` y `CANVAS_WIDTH - WALL_THICKNESS - paddle.width`.
   - Actualizar `updateBall` para rebotar en `x - ball.radius <= WALL_THICKNESS`, `x + ball.radius >= CANVAS_WIDTH - WALL_THICKNESS`, y `y - ball.radius <= WALL_THICKNESS`.
   - Ajustar el margen de los bloques en `src/blocks.ts` para mantenerse perfectamente centrados entre los muros laterales.

4. **Sistemas de partículas, estela y números flotantes (`src/effects.ts` o integración en módulos):**
   - Implementar el registro y renderizado de la estela de la pelota en cada cuadro.
   - Implementar generador de chispas en colisiones con pelota-bloque y pelota-pala.
   - Implementar lista de `scorePopups` que flotan hacia arriba y se eliminan al expirar.

5. **Muros y fondo del Canvas (`src/game.ts`):**
   - Función `drawNeonBackground(ctx)`: fondo con degradado ciberpunk y sutil cuadrícula digital.
   - Función `drawNeonWalls(ctx)`: dibujo de los muros superior, izquierdo y derecho con línea de acento luminosa cian/azul y conectores en las esquinas.

6. **HUD Neón con vidas gráficas (`src/game.ts`):**
   - Rediseñar `drawHUD(ctx)` para mostrar:
     - Score formateado con tipografía arcade y ceros iniciales (`00000`).
     - Badge de nivel (`NIVEL 01`) con marco brillante.
     - Indicador gráfico de vidas usando mini-palas iluminadas (o corazones neón) + número de vidas.

7. **Rediseño de pantallas (`src/game.ts`):**
   - Rediseñar pantalla `start`: título Neón con sombra multicapa, animación de pulso con `Math.sin(now)`, indicaciones claras.
   - Rediseñar pantalla `paused`: overlay oscuro con marco estilizado ciberpunk y texto parpadeante.
   - Rediseñar pantallas `gameover` y `win`: carteles de victoria/derrota con resumen de puntos y diseño temático.

8. **Compilación y verificación:**
   - Compilar con `tsc` (`npm run build`).
   - Verificar en navegador que todos los elementos visuales funcionen de manera fluida a 60fps sin degradación de rendimiento.

---

## Acceptance criteria

- [x] La página web incluye un diseño exterior estilo gabinete arcade con título neón, marco con resplandor y guía de teclas.
- [x] Las fuentes tipográficas arcade/ciberpunk cargan y se visualizan en canvas y en la interfaz HTML.
- [x] El canvas cuenta con muros físicos visibles en los laterales y la parte superior, y la pelota y pala respetan estos límites de colisión.
- [x] La pelota dibuja una estela luminosa suave durante su movimiento.
- [x] Al impactar bloques y pala se desprenden partículas de chispas luminosas.
- [x] Al destruir un bloque aparece el puntaje flotante (`+X`) con animación hacia arriba y desvanecimiento.
- [x] El HUD muestra el puntaje con formato retro, insignia de nivel y vidas representadas visualmente.
- [x] Las pantallas de inicio, pausa, game over y victoria cuentan con títulos neón, animaciones de pulso y diseño arcade.
- [x] La lógica central de juego (velocidad, vidas, avance de niveles, sonidos de rebote y rotura) sigue intacta.
- [x] El proyecto compila limpiamente con `tsc` sin librerías externas de JS/game engines.

---

## Decisions

- **Sí:** Estilo Cyberpunk / Neón con acentos cian, magenta y amarillo neón sobre fondo oscuro espacial, acordado con el usuario.
- **Sí:** Muros físicos en el canvas (`WALL_THICKNESS = 12`) para dar sensación de área arcade cerrada y auténtica.
- **Sí:** Efectos visuales livianos calculados en Canvas 2D (partículas y estela) sin librerías pesadas para garantizar máxima velocidad y portabilidad.
- **Sí:** Vidas mostradas mediante iconos visuales de mini-pala junto al texto en el HUD.
- **Sí:** Google Fonts (`Orbitron` y `Press Start 2P`) cargadas vía `<link>` en `index.html` para dar un look 100% arcade retro-futurista.
- **No:** Agregar librerías externas de renderizado o físicas (Three.js, Pixi, Phaser); todo el arte se dibuja sobre el Canvas 2D vanilla existente.

---

## What is **not** in this spec

- Modificación a las geometrías de los bloques de los 3 niveles existentes.
- Inclusión de power-ups con caída física.
- Música de fondo o efectos de sonido adicionales.
- Modificación del sistema de almacenamiento de puntajes.
