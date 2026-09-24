El objetivo de este proyecto es la construccion de un Videojuego de tipo "Arkanoid". El proyecto debe estar construido en HTML, CSS y TypeScript.(en un solo archivo .html) se puede realizar uso de archivos .js, .css, .html, pero el archivo principal debe ser un .html.

Requerimientos:
1. El juego debe tener una pelota que rebote en las paredes y en la pala del jugador.
2. El juego debe tener una pala que el jugador pueda mover con las teclas de flecha izquierda y derecha.
3. El juego debe tener bloques que el jugador pueda romper al golpear con la pelota.
4. El juego debe tener un sistema de puntuación.
5. El juego debe tener un sistema de vidas.
6. El juego debe tener un sistema de niveles.
7. El juego debe tener un sistema de game over.
8. El juego debe tener un sistema de niveles.

No se debe usar ningun framework o libreria para el desarrollo del juego.

---

## Estado actual

Todos los requerimientos de arriba están implementados. El detalle de qué se construyó, en qué orden
y con qué decisiones queda documentado en `specs/`:

- `specs/01-arkanoid-mvp.md` — MVP jugable: pala, pelota con rebote de ángulo variable, bloques con
  animación de explosión, puntuación por color, vidas, 3 niveles, pantallas start/pausa/game over/win
  y sonido de rebote/rotura.
- `specs/02-hud-rounded-box.md` — HUD (score, vidas, nivel) en una fila dentro de un box con fondo
  oscuro semitransparente y esquinas redondeadas, en la esquina superior izquierda del canvas.

### Cómo ejecutar

El juego carga imágenes y audio por ruta relativa, así que hay que servirlo con un servidor local en
vez de abrir el `.html` directo (`file://`):

```
python3 -m http.server
```

y luego abrir `http://localhost:8000/index.html`.

### Cómo compilar

El código fuente está en `src/*.ts` y se compila con `tsc` (sin bundler) a un único `dist/game.js`,
que es el que carga `index.html`:

```
npx tsc
```