function createBall(): Ball {
  return {
    x: CANVAS_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS - 20,
    radius: BALL_RADIUS,
    dx: BALL_SPEED * ( Math.random() < 0.5 ? -1 : 1 ) * 0.6,
    dy: -BALL_SPEED,
  };
}

function resetBall( ball: Ball ): void {
  const fresh = createBall();
  ball.x = fresh.x;
  ball.y = fresh.y;
  ball.dx = fresh.dx;
  ball.dy = fresh.dy;
  resetBallTrail();
}

function bounceOffPaddle( ball: Ball, paddle: Paddle ): void {
  const hitPos = ( ball.x - paddle.x ) / paddle.width; // 0 (borde izq.) .. 1 (borde der.)
  const clampedHitPos = Math.max( 0, Math.min( 1, hitPos ) );
  const angle = ( clampedHitPos - 0.5 ) * 2 * PADDLE_MAX_BOUNCE_ANGLE;

  const speed = Math.hypot( ball.dx, ball.dy );
  ball.dx = speed * Math.sin( angle );
  ball.dy = -Math.abs( speed * Math.cos( angle ) );
  ball.y = paddle.y - ball.radius;

  playBounce();
  spawnSparks( ball.x, ball.y + ball.radius, '#00f0ff', 8 );
}

// Devuelve true cuando la pelota cruzó el borde inferior del canvas (vida perdida).
function updateBall( ball: Ball, paddle: Paddle ): boolean {
  ball.x += ball.dx;
  ball.y += ball.dy;

  updateBallTrail( ball );

  if ( ball.x - ball.radius <= WALL_THICKNESS ) {
    ball.x = WALL_THICKNESS + ball.radius;
    ball.dx *= -1;
    playBounce();
    spawnSparks( ball.x, ball.y, '#00f0ff', 6 );
  } else if ( ball.x + ball.radius >= CANVAS_WIDTH - WALL_THICKNESS ) {
    ball.x = CANVAS_WIDTH - WALL_THICKNESS - ball.radius;
    ball.dx *= -1;
    playBounce();
    spawnSparks( ball.x, ball.y, '#00f0ff', 6 );
  }

  if ( ball.y - ball.radius <= WALL_THICKNESS ) {
    ball.y = WALL_THICKNESS + ball.radius;
    ball.dy *= -1;
    playBounce();
    spawnSparks( ball.x, ball.y, '#00f0ff', 6 );
  }

  const hitsPaddle = ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y + ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width;

  if ( hitsPaddle ) {
    bounceOffPaddle( ball, paddle );
  }

  return ball.y - ball.radius > CANVAS_HEIGHT;
}

function drawBall( ctx: CanvasRenderingContext2D, ball: Ball ): void {
  drawBallTrail( ctx );
  ctx.save();
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
  ctx.restore();
}
