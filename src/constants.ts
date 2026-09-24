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
const BLOCK_ROWS_TOP_MARGIN = 90;
const BLOCK_COLS = 12;

const LIVES_START = 3;
const TOTAL_LEVELS = 3;

// Estilo del box redondeado que envuelve el HUD (score, vidas, nivel).
const HUD_MARGIN = 12;
const HUD_PADDING_X = 16;
const HUD_PADDING_Y = 10;
const HUD_FIELD_GAP = 24;
const HUD_BOX_RADIUS = 10;
const HUD_BOX_FILL = 'rgba(0, 0, 0, 0.55)';
const HUD_BOX_BORDER = 'rgba(226, 232, 240, 0.35)';

const POINTS_BY_COLOR: Record<BlockColor, number> = {
  gray: 1,
  red: 2,
  yellow: 3,
  cyan: 4,
  magenta: 5,
  hotpink: 6,
  green: 7,
};
