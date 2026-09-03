const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

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
const BLOCK_ROWS_TOP_MARGIN = 60;
const BLOCK_COLS = 12;

const LIVES_START = 3;
const TOTAL_LEVELS = 3;

const POINTS_BY_COLOR: Record<BlockColor, number> = {
  gray: 1,
  red: 2,
  yellow: 3,
  cyan: 4,
  magenta: 5,
  hotpink: 6,
  green: 7,
};
