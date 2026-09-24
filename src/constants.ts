const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

// Grosor de los muros físicos delimitadores en superior, izquierda y derecha
const WALL_THICKNESS = 12;

// 162x14 = dimensiones nativas del sprite 'paddle' en el spritesheet;
// se mantienen para no distorsionar la imagen al dibujarla con drawSprite.
const PADDLE_WIDTH = 162;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 7;
const PADDLE_Y = CANVAS_HEIGHT - 40;

const BALL_RADIUS = 8;
const BALL_SPEED = 5;

// Ángulo máximo de rebote contra la pala (respecto a la vertical), en radianes.
// Golpear en el centro de la pala rebota casi vertical; golpear en el borde
// rebota a este ángulo.
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°

const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ROWS_TOP_MARGIN = 90;
const BLOCK_COLS = 12;

const LIVES_START = 3;
const TOTAL_LEVELS = 3;

// Estilo del box redondeado que envuelve el HUD (score, vidas, nivel)
const HUD_MARGIN = 16;
const HUD_BOX_FILL = 'rgba(6, 8, 20, 0.75)';
const HUD_BOX_BORDER = 'rgba(0, 240, 255, 0.4)';
const HUD_BOX_RADIUS = 8;

const POINTS_BY_COLOR: Record<BlockColor, number> = {
  gray: 1,
  red: 2,
  yellow: 3,
  cyan: 4,
  magenta: 5,
  hotpink: 6,
  green: 7,
};

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

// Configuración de efectos dinámicos
const BALL_TRAIL_LENGTH = 8;
const SPARK_PARTICLE_COUNT = 10;
const SPARK_DURATION = 350;
const SCORE_POPUP_DURATION = 700;

// Configuración de controles táctiles
const TOUCH_PADDLE_SMOOTHING = false;
