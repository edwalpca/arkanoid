// Estado de teclado compartido: paddle.ts es el primer módulo que lo necesita,
// pero se reutiliza más adelante (p. ej. la tecla de pausa en game.ts).
const keysDown = new Set<string>();

function initKeyboardInput(): void {
  window.addEventListener( 'keydown', ( e ) => keysDown.add( e.key ) );
  window.addEventListener( 'keyup', ( e ) => keysDown.delete( e.key ) );
}

function createPaddle(): Paddle {
  return {
    x: ( CANVAS_WIDTH - PADDLE_WIDTH ) / 2,
    y: PADDLE_Y,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
  };
}

function updatePaddle( paddle: Paddle ): void {
  if ( keysDown.has( 'ArrowLeft' ) ) paddle.x -= paddle.speed;
  if ( keysDown.has( 'ArrowRight' ) ) paddle.x += paddle.speed;

  paddle.x = Math.max( WALL_THICKNESS, Math.min( CANVAS_WIDTH - WALL_THICKNESS - paddle.width, paddle.x ) );
}

function drawPaddle( ctx: CanvasRenderingContext2D, paddle: Paddle ): void {
  ctx.save();
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  ctx.restore();
}
