function buildBlocks( layout: LevelLayout ): Block[] {
  const blocks: Block[] = [];
  const leftMargin = ( CANVAS_WIDTH - BLOCK_COLS * BLOCK_WIDTH ) / 2;

  layout.forEach( ( row, rowIndex ) => {
    row.forEach( ( color, colIndex ) => {
      if ( !color ) return;

      blocks.push( {
        x: leftMargin + colIndex * BLOCK_WIDTH,
        y: BLOCK_ROWS_TOP_MARGIN + rowIndex * BLOCK_HEIGHT,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        points: POINTS_BY_COLOR[ color ],
        alive: true,
        exploding: false,
        explosionStart: 0,
      } );
    } );
  } );

  return blocks;
}

function breakBlock( block: Block, now: number ): void {
  block.alive = false;
  block.exploding = true;
  block.explosionStart = now;
  playBreak();

  const neonColor = NEON_COLORS[ block.color ] || '#00f0ff';
  const centerX = block.x + block.width / 2;
  const centerY = block.y + block.height / 2;
  spawnSparks( centerX, centerY, neonColor, 12 );
  spawnScorePopup( centerX, block.y, block.points, neonColor, now );
}

// Apaga la animación de explosión una vez transcurrida EXPLOSION_DURATION.
function updateExplosions( blocks: Block[], now: number ): void {
  for ( const block of blocks ) {
    if ( block.exploding && now - block.explosionStart >= EXPLOSION_DURATION ) {
      block.exploding = false;
    }
  }
}

function drawBlocks( ctx: CanvasRenderingContext2D, blocks: Block[], now: number ): void {
  for ( const block of blocks ) {
    if ( block.alive ) {
      drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
      continue;
    }

    if ( block.exploding ) {
      const frames = EXPLOSION_FRAMES[ block.color ];
      const elapsed = now - block.explosionStart;
      const frameIndex = Math.min(
        frames.length - 1,
        Math.floor( elapsed / ( EXPLOSION_DURATION / frames.length ) )
      );
      drawFrame( ctx, frames[ frameIndex ], block.x, block.y, block.width, block.height );
    }
  }
}

// Colisión círculo-AABB simplificada (suficiente para bloques de 32x16).
// Devuelve el primer bloque vivo golpeado, o null si ninguno.
function findHitBlock( ball: Ball, blocks: Block[] ): Block | null {
  for ( const block of blocks ) {
    if ( !block.alive ) continue;

    const closestX = Math.max( block.x, Math.min( ball.x, block.x + block.width ) );
    const closestY = Math.max( block.y, Math.min( ball.y, block.y + block.height ) );
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    if ( dx * dx + dy * dy <= ball.radius * ball.radius ) {
      return block;
    }
  }

  return null;
}

// Decide si el rebote invierte dx o dy según el lado de menor solapamiento.
function resolveBlockCollision( ball: Ball, block: Block ): void {
  const overlapLeft = ball.x + ball.radius - block.x;
  const overlapRight = block.x + block.width - ( ball.x - ball.radius );
  const overlapTop = ball.y + ball.radius - block.y;
  const overlapBottom = block.y + block.height - ( ball.y - ball.radius );

  const minOverlap = Math.min( overlapLeft, overlapRight, overlapTop, overlapBottom );

  if ( minOverlap === overlapTop || minOverlap === overlapBottom ) {
    ball.dy *= -1;
  } else {
    ball.dx *= -1;
  }
}
