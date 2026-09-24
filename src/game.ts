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
let lastFrameTime: number = performance.now();

function resetLevel( levelIndex: number ): void {
  paddle = createPaddle();
  ball = createBall();
  blocks = buildBlocks( LEVELS[ levelIndex ] );
  resetBallTrail();
  particles.length = 0;
  scorePopups.length = 0;
}

// Se considera "despejado" cuando ya no quedan bloques vivos ni animando su
// explosión, para dejar terminar la animación del último bloque roto.
function isLevelCleared(): boolean {
  return blocks.every( ( b ) => !b.alive && !b.exploding );
}

function advanceLevel(): void {
  if ( state.level >= TOTAL_LEVELS ) {
    state.screen = 'win';
    spawnSparks( CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#00ff66', 30 );
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

let lastConfirmTime = 0;

function handleConfirmAction(): void {
  const now = performance.now();
  if ( now - lastConfirmTime < 250 ) return;
  lastConfirmTime = now;

  if ( state.screen === 'start' ) {
    state.screen = 'playing';
  } else if ( state.screen === 'paused' ) {
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

function initTouchInput(): void {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  const getCanvasX = ( clientX: number ): number => {
    const rect = canvas.getBoundingClientRect();
    if ( rect.width === 0 ) return CANVAS_WIDTH / 2;
    const scaleX = CANVAS_WIDTH / rect.width;
    return ( clientX - rect.left ) * scaleX;
  };

  // Eventos táctiles sobre el canvas
  canvas.addEventListener( 'touchstart', ( e: TouchEvent ) => {
    if ( e.touches.length === 0 ) return;
    e.preventDefault();
    const touch = e.touches[ 0 ];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchMoved = false;

    if ( state.screen === 'playing' ) {
      movePaddleTo( paddle, getCanvasX( touch.clientX ) );
    }
  }, { passive: false } );

  canvas.addEventListener( 'touchmove', ( e: TouchEvent ) => {
    if ( e.touches.length === 0 ) return;
    e.preventDefault();
    const touch = e.touches[ 0 ];
    if ( Math.hypot( touch.clientX - touchStartX, touch.clientY - touchStartY ) > 8 ) {
      touchMoved = true;
    }
    if ( state.screen === 'playing' ) {
      movePaddleTo( paddle, getCanvasX( touch.clientX ) );
    }
  }, { passive: false } );

  canvas.addEventListener( 'touchend', ( e: TouchEvent ) => {
    e.preventDefault();
    // Si fue un toque rápido sin desplazamiento o si estamos en pantallas de transición/pausa
    if ( !touchMoved || state.screen !== 'playing' ) {
      handleConfirmAction();
    }
  }, { passive: false } );

  canvas.addEventListener( 'touchcancel', ( e: TouchEvent ) => {
    e.preventDefault();
  }, { passive: false } );

  // Soporte para arrastre con puntero/ratón (facilita pruebas en emuladores y navegadores de escritorio)
  let isPointerDown = false;
  canvas.addEventListener( 'pointerdown', ( e: PointerEvent ) => {
    if ( e.pointerType === 'mouse' ) {
      isPointerDown = true;
      if ( state.screen === 'playing' ) {
        movePaddleTo( paddle, getCanvasX( e.clientX ) );
      }
    }
  } );

  window.addEventListener( 'pointermove', ( e: PointerEvent ) => {
    if ( isPointerDown && e.pointerType === 'mouse' && state.screen === 'playing' ) {
      movePaddleTo( paddle, getCanvasX( e.clientX ) );
    }
  } );

  window.addEventListener( 'pointerup', ( e: PointerEvent ) => {
    if ( e.pointerType === 'mouse' ) {
      isPointerDown = false;
    }
  } );

  // Botón flotante de pausa neón
  const pauseBtn = document.getElementById( 'touch-pause-btn' );
  if ( pauseBtn ) {
    const triggerPause = ( e: Event ) => {
      e.preventDefault();
      e.stopPropagation();
      handlePauseAction();
    };
    pauseBtn.addEventListener( 'click', triggerPause );
    pauseBtn.addEventListener( 'touchend', triggerPause );
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
  initTouchInput();
}

function updateGame( now: number, deltaMs: number ): void {
  updateParticles( deltaMs );
  updateScorePopups( now );

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
    resetBallTrail();
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

// Dibuja el subpath de un rectángulo de esquinas redondeadas
function drawRoundedRect( x: number, y: number, w: number, h: number, radius: number ): void {
  ctx.beginPath();
  ctx.moveTo( x + radius, y );
  ctx.arcTo( x + w, y, x + w, y + h, radius );
  ctx.arcTo( x + w, y + h, x, y + h, radius );
  ctx.arcTo( x, y + h, x, y, radius );
  ctx.arcTo( x, y, x + w, y, radius );
  ctx.closePath();
}

function drawNeonBackground( ctx: CanvasRenderingContext2D ): void {
  // Gradiente ciberpunk oscuro
  const bgGrad = ctx.createLinearGradient( 0, 0, 0, CANVAS_HEIGHT );
  bgGrad.addColorStop( 0, '#050713' );
  bgGrad.addColorStop( 0.5, '#080c1e' );
  bgGrad.addColorStop( 1, '#0e1227' );
  ctx.fillStyle = bgGrad;
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  // Rejilla digital sutil
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
  ctx.lineWidth = 1;
  const step = 32;
  for ( let x = WALL_THICKNESS; x < CANVAS_WIDTH - WALL_THICKNESS; x += step ) {
    ctx.beginPath();
    ctx.moveTo( x, WALL_THICKNESS );
    ctx.lineTo( x, CANVAS_HEIGHT );
    ctx.stroke();
  }
  for ( let y = WALL_THICKNESS; y < CANVAS_HEIGHT; y += step ) {
    ctx.beginPath();
    ctx.moveTo( WALL_THICKNESS, y );
    ctx.lineTo( CANVAS_WIDTH - WALL_THICKNESS, y );
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeonWalls( ctx: CanvasRenderingContext2D ): void {
  ctx.save();

  // Muros metálicos
  ctx.fillStyle = '#0f172a';
  ctx.fillRect( 0, 0, WALL_THICKNESS, CANVAS_HEIGHT );
  ctx.fillRect( CANVAS_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_HEIGHT );
  ctx.fillRect( 0, 0, CANVAS_WIDTH, WALL_THICKNESS );

  // Resplandor neón interno cian
  ctx.strokeStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo( WALL_THICKNESS, CANVAS_HEIGHT );
  ctx.lineTo( WALL_THICKNESS, WALL_THICKNESS );
  ctx.lineTo( CANVAS_WIDTH - WALL_THICKNESS, WALL_THICKNESS );
  ctx.lineTo( CANVAS_WIDTH - WALL_THICKNESS, CANVAS_HEIGHT );
  ctx.stroke();

  // Acentos angulares de esquina
  ctx.strokeStyle = '#ff00ea';
  ctx.shadowColor = '#ff00ea';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2;
  ctx.strokeRect( 2, 2, WALL_THICKNESS - 4, WALL_THICKNESS - 4 );
  ctx.strokeRect( CANVAS_WIDTH - WALL_THICKNESS + 2, 2, WALL_THICKNESS - 4, WALL_THICKNESS - 4 );

  ctx.restore();
}

function drawHUD( now: number ): void {
  ctx.save();
  ctx.font = 'bold 11px Orbitron, monospace, sans-serif';

  const scoreText = `SCORE ${ String( state.score ).padStart( 5, '0' ) }`;
  const levelText = `NIVEL ${ state.level }`;
  const livesLabel = 'VIDAS:';

  const scoreWidth = ctx.measureText( scoreText ).width;
  const levelWidth = ctx.measureText( levelText ).width;
  const livesLabelWidth = ctx.measureText( livesLabel ).width;

  const miniPaddleWidth = 14;
  const miniPaddleHeight = 5;
  const miniPaddleGap = 4;
  const livesIconsWidth = state.lives * ( miniPaddleWidth + miniPaddleGap );

  const sectionGap = 20;
  const totalContentWidth = scoreWidth + sectionGap + levelWidth + sectionGap + livesLabelWidth + 6 + livesIconsWidth;

  const boxX = HUD_MARGIN;
  const boxY = WALL_THICKNESS + 6;
  const paddingX = 14;
  const boxWidth = totalContentWidth + paddingX * 2;
  const boxHeight = 28;

  // Fondo del HUD con esquinas redondeadas
  drawRoundedRect( boxX, boxY, boxWidth, boxHeight, HUD_BOX_RADIUS );
  ctx.fillStyle = HUD_BOX_FILL;
  ctx.fill();
  ctx.strokeStyle = HUD_BOX_BORDER;
  ctx.lineWidth = 1;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 6;
  ctx.stroke();

  // Reset shadow para texto nítido
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const centerY = boxY + boxHeight / 2;

  let currentX = boxX + paddingX;

  // Score
  ctx.fillStyle = '#00f0ff';
  ctx.fillText( scoreText, currentX, centerY );
  currentX += scoreWidth + sectionGap;

  // Nivel
  ctx.fillStyle = '#ffe600';
  ctx.fillText( levelText, currentX, centerY );
  currentX += levelWidth + sectionGap;

  // Vidas texto
  ctx.fillStyle = '#94a3b8';
  ctx.fillText( livesLabel, currentX, centerY );
  currentX += livesLabelWidth + 6;

  // Mini-palas de vida
  ctx.fillStyle = '#ff00ea';
  ctx.shadowColor = '#ff00ea';
  ctx.shadowBlur = 5;
  for ( let i = 0; i < state.lives; i++ ) {
    drawRoundedRect( currentX, centerY - miniPaddleHeight / 2, miniPaddleWidth, miniPaddleHeight, 2 );
    ctx.fill();
    currentX += miniPaddleWidth + miniPaddleGap;
  }

  ctx.restore();
}

function drawOverlay( color: string = 'rgba(5, 7, 18, 0.78)' ): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
  ctx.restore();
}

function drawStartScreen( now: number ): void {
  drawOverlay( 'rgba(5, 7, 18, 0.85)' );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Título Neón
  ctx.font = '900 36px Orbitron, sans-serif';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.fillText( 'ARKANOID', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 110 );

  ctx.font = 'bold 10px Orbitron, monospace, sans-serif';
  ctx.shadowColor = '#ff00ea';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff00ea';
  ctx.fillText( '— CYBERPUNK NEON EDITION —', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 75 );

  // Contenedor de instrucciones
  const cardW = 340;
  const cardH = 170;
  const cardX = ( CANVAS_WIDTH - cardW ) / 2;
  const cardY = CANVAS_HEIGHT / 2 - 40;

  drawRoundedRect( cardX, cardY, cardW, cardH, 12 );
  ctx.fillStyle = 'rgba(10, 15, 32, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Texto parpadeante "Press Enter o Toca"
  const pulse = 0.5 + 0.5 * Math.sin( now / 200 );
  ctx.shadowBlur = 8;
  ctx.shadowColor = `rgba(0, 240, 255, ${ pulse })`;
  ctx.fillStyle = `rgba(0, 240, 255, ${ pulse })`;
  ctx.font = 'bold 13px Orbitron, monospace, sans-serif';
  ctx.fillText( '▶ ENTER O TOCA PARA JUGAR ◀', CANVAS_WIDTH / 2, cardY + 40 );

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Orbitron, sans-serif';
  ctx.fillText( '( click o toque en la pantalla )', CANVAS_WIDTH / 2, cardY + 68 );

  // Separador sutil
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.beginPath();
  ctx.moveTo( cardX + 30, cardY + 95 );
  ctx.lineTo( cardX + cardW - 30, cardY + 95 );
  ctx.stroke();

  // Guía de controles
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '11px Orbitron, sans-serif';
  ctx.fillText( '[ ← / → ] o deslizar : Mover la pala', CANVAS_WIDTH / 2, cardY + 120 );
  ctx.fillText( 'Tecla [ P ] o botón ⏸ : Pausa', CANVAS_WIDTH / 2, cardY + 144 );

  ctx.restore();
}

function drawPauseScreen(): void {
  drawOverlay( 'rgba(5, 7, 20, 0.8)' );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cardW = 280;
  const cardH = 130;
  const cardX = ( CANVAS_WIDTH - cardW ) / 2;
  const cardY = ( CANVAS_HEIGHT - cardH ) / 2;

  drawRoundedRect( cardX, cardY, cardW, cardH, 12 );
  ctx.fillStyle = 'rgba(12, 17, 36, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 230, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 12;
  ctx.stroke();

  ctx.font = '900 28px Orbitron, sans-serif';
  ctx.fillStyle = '#ffe600';
  ctx.fillText( 'PAUSA', CANVAS_WIDTH / 2, cardY + 45 );

  ctx.shadowBlur = 0;
  ctx.font = '12px Orbitron, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText( 'Presiona P o toca para continuar', CANVAS_WIDTH / 2, cardY + 90 );

  ctx.restore();
}

function drawGameOverScreen( now: number ): void {
  drawOverlay( 'rgba(20, 4, 12, 0.85)' );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 34px Orbitron, sans-serif';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ff0055';
  ctx.fillText( 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90 );

  const cardW = 300;
  const cardH = 150;
  const cardX = ( CANVAS_WIDTH - cardW ) / 2;
  const cardY = CANVAS_HEIGHT / 2 - 40;

  drawRoundedRect( cardX, cardY, cardW, cardH, 12 );
  ctx.fillStyle = 'rgba(20, 10, 20, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = '13px Orbitron, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText( `Puntaje final: ${ state.score }`, CANVAS_WIDTH / 2, cardY + 40 );
  ctx.fillText( `Nivel alcanzado: ${ state.level }`, CANVAS_WIDTH / 2, cardY + 70 );

  const pulse = 0.5 + 0.5 * Math.sin( now / 200 );
  ctx.fillStyle = `rgba(255, 0, 85, ${ pulse })`;
  ctx.font = 'bold 12px Orbitron, monospace, sans-serif';
  ctx.fillText( '▶ ENTER O TOCA PARA REINICIAR', CANVAS_WIDTH / 2, cardY + 115 );

  ctx.restore();
}

function drawWinScreen( now: number ): void {
  drawOverlay( 'rgba(4, 20, 14, 0.85)' );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 34px Orbitron, sans-serif';
  ctx.shadowColor = '#00ff66';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#00ff66';
  ctx.fillText( '¡VICTORIA!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90 );

  const cardW = 320;
  const cardH = 160;
  const cardX = ( CANVAS_WIDTH - cardW ) / 2;
  const cardY = CANVAS_HEIGHT / 2 - 40;

  drawRoundedRect( cardX, cardY, cardW, cardH, 12 );
  ctx.fillStyle = 'rgba(8, 24, 18, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 255, 102, 0.45)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.fillStyle = '#ffe600';
  ctx.fillText( '¡MISIÓN CUMPLIDA!', CANVAS_WIDTH / 2, cardY + 38 );

  ctx.font = '13px Orbitron, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText( `Puntaje final: ${ state.score }`, CANVAS_WIDTH / 2, cardY + 74 );

  const pulse = 0.5 + 0.5 * Math.sin( now / 200 );
  ctx.fillStyle = `rgba(0, 255, 102, ${ pulse })`;
  ctx.font = 'bold 12px Orbitron, monospace, sans-serif';
  ctx.fillText( '▶ ENTER O TOCA PARA REINICIAR', CANVAS_WIDTH / 2, cardY + 120 );

  ctx.restore();
}

function renderGame( now: number ): void {
  drawNeonBackground( ctx );
  drawNeonWalls( ctx );

  if ( state.screen === 'playing' || state.screen === 'paused' ) {
    drawBlocks( ctx, blocks, now );
    drawParticles( ctx );
    drawScorePopups( ctx, now );
    drawPaddle( ctx, paddle );
    drawBall( ctx, ball );
    drawHUD( now );
  }

  if ( state.screen === 'start' ) {
    drawStartScreen( now );
  } else if ( state.screen === 'paused' ) {
    drawPauseScreen();
  } else if ( state.screen === 'gameover' ) {
    drawParticles( ctx );
    drawGameOverScreen( now );
  } else if ( state.screen === 'win' ) {
    drawParticles( ctx );
    drawWinScreen( now );
  }
}

function gameLoop( now: number ): void {
  const deltaMs = Math.min( 32, now - lastFrameTime );
  lastFrameTime = now;

  updateGame( now, deltaMs );
  renderGame( now );
  requestAnimationFrame( gameLoop );
}
