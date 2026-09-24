const canvas = document.getElementById( 'game' ) as HTMLCanvasElement;
const ctx = canvas.getContext( '2d' ) as CanvasRenderingContext2D;

const state: GameState = {
  screen: 'start',
  level: 1,
  score: 0,
  lives: LIVES_START,
};

let paddle: Paddle = createPaddle();
let ball: Ball = createBall();
let blocks: Block[] = buildBlocks( LEVELS[ 0 ] );

function resetLevel( levelIndex: number ): void {
  paddle = createPaddle();
  ball = createBall();
  blocks = buildBlocks( LEVELS[ levelIndex ] );
}

// Se considera "despejado" cuando ya no quedan bloques vivos ni animando su
// explosión, para dejar terminar la animación del último bloque roto.
function isLevelCleared(): boolean {
  return blocks.every( ( b ) => !b.alive && !b.exploding );
}

function advanceLevel(): void {
  if ( state.level >= TOTAL_LEVELS ) {
    state.screen = 'win';
    return;
  }
  state.level += 1;
  resetLevel( state.level - 1 );
}

function restartGame(): void {
  state.screen = 'start';
  state.level = 1;
  state.score = 0;
  state.lives = LIVES_START;
  resetLevel( 0 );
}

function handleConfirmAction(): void {
  if ( state.screen === 'start' ) {
    state.screen = 'playing';
  } else if ( state.screen === 'gameover' || state.screen === 'win' ) {
    restartGame();
  }
}

function handlePauseAction(): void {
  if ( state.screen === 'playing' ) {
    state.screen = 'paused';
  } else if ( state.screen === 'paused' ) {
    state.screen = 'playing';
  }
}

function initGameInput(): void {
  window.addEventListener( 'keydown', ( e ) => {
    if ( e.key === 'p' || e.key === 'P' ) {
      handlePauseAction();
    } else if ( e.key === 'Enter' || e.key === ' ' ) {
      handleConfirmAction();
    }
  } );
  canvas.addEventListener( 'click', handleConfirmAction );
}

function updateGame( now: number ): void {
  if ( state.screen !== 'playing' ) return;

  updatePaddle( paddle );

  const ballLost = updateBall( ball, paddle );
  if ( ballLost ) {
    state.lives -= 1;
    if ( state.lives <= 0 ) {
      state.screen = 'gameover';
      return;
    }
    ball = createBall();
  }

  const hitBlock = findHitBlock( ball, blocks );
  if ( hitBlock ) {
    resolveBlockCollision( ball, hitBlock );
    state.score += hitBlock.points;
    breakBlock( hitBlock, now );
  }
  updateExplosions( blocks, now );

  if ( isLevelCleared() ) {
    advanceLevel();
  }
}

// Dibuja el subpath de un rectángulo de esquinas redondeadas, a mano con
// arcos, para no depender de ctx.roundRect() nativo (soporte de navegador).
function drawRoundedRect( x: number, y: number, w: number, h: number, radius: number ): void {
  ctx.beginPath();
  ctx.moveTo( x + radius, y );
  ctx.arcTo( x + w, y, x + w, y + h, radius );
  ctx.arcTo( x + w, y + h, x, y + h, radius );
  ctx.arcTo( x, y + h, x, y, radius );
  ctx.arcTo( x, y, x + w, y, radius );
  ctx.closePath();
}

function drawHUD(): void {
  ctx.font = '16px sans-serif';

  const fields = [
    `Score: ${ state.score }`,
    `Vidas: ${ state.lives }`,
    `Nivel: ${ state.level }`,
  ];
  const fieldWidths = fields.map( ( text ) => ctx.measureText( text ).width );
  const fieldsWidth = fieldWidths.reduce( ( sum, w ) => sum + w, 0 ) + HUD_FIELD_GAP * ( fields.length - 1 );
  const lineHeight = 20; // acorde a font size 16px

  const boxX = HUD_MARGIN;
  const boxY = HUD_MARGIN;
  const boxWidth = fieldsWidth + HUD_PADDING_X * 2;
  const boxHeight = lineHeight + HUD_PADDING_Y * 2;

  drawRoundedRect( boxX, boxY, boxWidth, boxHeight, HUD_BOX_RADIUS );
  ctx.fillStyle = HUD_BOX_FILL;
  ctx.fill();
  ctx.strokeStyle = HUD_BOX_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let textX = boxX + HUD_PADDING_X;
  const textY = boxY + boxHeight / 2;
  fields.forEach( ( text, i ) => {
    ctx.fillText( text, textX, textY );
    textX += fieldWidths[ i ] + HUD_FIELD_GAP;
  } );
}

function drawOverlay(): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
}

function drawMessageScreen( title: string, subtitles: string[] ): void {
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 32px sans-serif';
  ctx.fillText( title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20 );

  ctx.font = '16px sans-serif';
  subtitles.forEach( ( line, i ) => {
    ctx.fillText( line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 + i * 24 );
  } );
}

function renderGame( now: number ): void {
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  if ( state.screen === 'playing' || state.screen === 'paused' ) {
    drawBlocks( ctx, blocks, now );
    drawPaddle( ctx, paddle );
    drawBall( ctx, ball );
    drawHUD();
  }

  if ( state.screen === 'start' ) {
    drawMessageScreen( 'ARKANOID', [ 'Flechas: mover la pala', 'ENTER o click: empezar' ] );
  } else if ( state.screen === 'paused' ) {
    drawOverlay();
    drawMessageScreen( 'PAUSA', [ 'Presiona P para continuar' ] );
  } else if ( state.screen === 'gameover' ) {
    drawOverlay();
    drawMessageScreen( 'GAME OVER', [ `Score final: ${ state.score }`, 'ENTER o click: reiniciar' ] );
  } else if ( state.screen === 'win' ) {
    drawOverlay();
    drawMessageScreen( '¡GANASTE!', [ `Score final: ${ state.score }`, 'ENTER o click: reiniciar' ] );
  }
}

function gameLoop( now: number ): void {
  updateGame( now );
  renderGame( now );
  requestAnimationFrame( gameLoop );
}
