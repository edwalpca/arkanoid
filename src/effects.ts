const ballTrail: BallTrailPoint[] = [];
let particles: Particle[] = [];
let scorePopups: ScorePopup[] = [];

function resetBallTrail(): void {
  ballTrail.length = 0;
}

function updateBallTrail( ball: Ball ): void {
  ballTrail.push( { x: ball.x, y: ball.y } );
  if ( ballTrail.length > BALL_TRAIL_LENGTH ) {
    ballTrail.shift();
  }
}

function drawBallTrail( ctx: CanvasRenderingContext2D ): void {
  for ( let i = 0; i < ballTrail.length; i++ ) {
    const pt = ballTrail[ i ];
    const progress = ( i + 1 ) / ( ballTrail.length + 1 );
    const alpha = progress * 0.45;
    const radius = BALL_RADIUS * ( 0.3 + 0.65 * progress );

    ctx.save();
    ctx.beginPath();
    ctx.arc( pt.x, pt.y, radius, 0, Math.PI * 2 );
    ctx.fillStyle = `rgba(0, 240, 255, ${ alpha })`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

function spawnSparks( x: number, y: number, color: string, count: number = SPARK_PARTICLE_COUNT ): void {
  for ( let i = 0; i < count; i++ ) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    particles.push( {
      x,
      y,
      vx: Math.cos( angle ) * speed,
      vy: Math.sin( angle ) * speed,
      radius: 1.5 + Math.random() * 2,
      color,
      alpha: 1,
      life: 0,
      maxLife: SPARK_DURATION * ( 0.7 + Math.random() * 0.6 ),
    } );
  }
}

function updateParticles( deltaMs: number ): void {
  for ( let i = particles.length - 1; i >= 0; i-- ) {
    const p = particles[ i ];
    p.life += deltaMs;
    if ( p.life >= p.maxLife ) {
      particles.splice( i, 1 );
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.alpha = Math.max( 0, 1 - p.life / p.maxLife );
  }
}

function drawParticles( ctx: CanvasRenderingContext2D ): void {
  ctx.save();
  for ( const p of particles ) {
    ctx.beginPath();
    ctx.arc( p.x, p.y, p.radius, 0, Math.PI * 2 );
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fill();
  }
  ctx.restore();
}

function spawnScorePopup( x: number, y: number, points: number, color: string, now: number ): void {
  scorePopups.push( {
    x,
    y,
    text: `+${ points }`,
    color,
    alpha: 1,
    created: now,
    duration: SCORE_POPUP_DURATION,
  } );
}

function updateScorePopups( now: number ): void {
  for ( let i = scorePopups.length - 1; i >= 0; i-- ) {
    const sp = scorePopups[ i ];
    const elapsed = now - sp.created;
    if ( elapsed >= sp.duration ) {
      scorePopups.splice( i, 1 );
      continue;
    }
    sp.alpha = Math.max( 0, 1 - elapsed / sp.duration );
  }
}

function drawScorePopups( ctx: CanvasRenderingContext2D, now: number ): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px Orbitron, sans-serif';

  for ( const sp of scorePopups ) {
    const elapsed = now - sp.created;
    const progress = Math.min( 1, elapsed / sp.duration );
    const floatY = sp.y - progress * 24;

    ctx.globalAlpha = sp.alpha;
    ctx.fillStyle = sp.color;
    ctx.shadowColor = sp.color;
    ctx.shadowBlur = 8;
    ctx.fillText( sp.text, sp.x, floatY );
  }
  ctx.restore();
}
