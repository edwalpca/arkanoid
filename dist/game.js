"use strict";
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const WALL_THICKNESS = 12;
const PADDLE_WIDTH = 162;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 7;
const PADDLE_Y = CANVAS_HEIGHT - 40;
const BALL_RADIUS = 8;
const BALL_SPEED = 5;
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ROWS_TOP_MARGIN = 90;
const BLOCK_COLS = 12;
const LIVES_START = 3;
const TOTAL_LEVELS = 3;
const HUD_MARGIN = 16;
const HUD_BOX_FILL = 'rgba(6, 8, 20, 0.75)';
const HUD_BOX_BORDER = 'rgba(0, 240, 255, 0.4)';
const HUD_BOX_RADIUS = 8;
const POINTS_BY_COLOR = {
    gray: 1,
    red: 2,
    yellow: 3,
    cyan: 4,
    magenta: 5,
    hotpink: 6,
    green: 7,
};
const NEON_COLORS = {
    red: '#ff0055',
    yellow: '#ffe600',
    cyan: '#00f0ff',
    magenta: '#ff00ea',
    hotpink: '#ff4db8',
    green: '#00ff66',
    gray: '#94a3b8',
};
const BALL_TRAIL_LENGTH = 8;
const SPARK_PARTICLE_COUNT = 10;
const SPARK_DURATION = 350;
const SCORE_POPUP_DURATION = 700;
const TOUCH_PADDLE_SMOOTHING = false;
const bounceSound = new Audio('assets/sounds/ball-bounce.mp3');
const breakSound = new Audio('assets/sounds/break-sound.mp3');
function playBounce() {
    bounceSound.currentTime = 0;
    bounceSound.play().catch(() => { });
}
function playBreak() {
    breakSound.currentTime = 0;
    breakSound.play().catch(() => { });
}
const ballTrail = [];
let particles = [];
let scorePopups = [];
function resetBallTrail() {
    ballTrail.length = 0;
}
function updateBallTrail(ball) {
    ballTrail.push({ x: ball.x, y: ball.y });
    if (ballTrail.length > BALL_TRAIL_LENGTH) {
        ballTrail.shift();
    }
}
function drawBallTrail(ctx) {
    for (let i = 0; i < ballTrail.length; i++) {
        const pt = ballTrail[i];
        const progress = (i + 1) / (ballTrail.length + 1);
        const alpha = progress * 0.45;
        const radius = BALL_RADIUS * (0.3 + 0.65 * progress);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}
function spawnSparks(x, y, color, count = SPARK_PARTICLE_COUNT) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 3.5;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.5 + Math.random() * 2,
            color,
            alpha: 1,
            life: 0,
            maxLife: SPARK_DURATION * (0.7 + Math.random() * 0.6),
        });
    }
}
function updateParticles(deltaMs) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += deltaMs;
        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
}
function drawParticles(ctx) {
    ctx.save();
    for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
    }
    ctx.restore();
}
function spawnScorePopup(x, y, points, color, now) {
    scorePopups.push({
        x,
        y,
        text: `+${points}`,
        color,
        alpha: 1,
        created: now,
        duration: SCORE_POPUP_DURATION,
    });
}
function updateScorePopups(now) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const sp = scorePopups[i];
        const elapsed = now - sp.created;
        if (elapsed >= sp.duration) {
            scorePopups.splice(i, 1);
            continue;
        }
        sp.alpha = Math.max(0, 1 - elapsed / sp.duration);
    }
}
function drawScorePopups(ctx, now) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px Orbitron, sans-serif';
    for (const sp of scorePopups) {
        const elapsed = now - sp.created;
        const progress = Math.min(1, elapsed / sp.duration);
        const floatY = sp.y - progress * 24;
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 8;
        ctx.fillText(sp.text, sp.x, floatY);
    }
    ctx.restore();
}
const keysDown = new Set();
function initKeyboardInput() {
    window.addEventListener('keydown', (e) => keysDown.add(e.key));
    window.addEventListener('keyup', (e) => keysDown.delete(e.key));
}
function createPaddle() {
    return {
        x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
        y: PADDLE_Y,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: PADDLE_SPEED,
    };
}
function updatePaddle(paddle) {
    if (keysDown.has('ArrowLeft'))
        paddle.x -= paddle.speed;
    if (keysDown.has('ArrowRight'))
        paddle.x += paddle.speed;
    paddle.x = Math.max(WALL_THICKNESS, Math.min(CANVAS_WIDTH - WALL_THICKNESS - paddle.width, paddle.x));
}
function movePaddleTo(paddle, targetCanvasX) {
    paddle.x = targetCanvasX - paddle.width / 2;
    paddle.x = Math.max(WALL_THICKNESS, Math.min(CANVAS_WIDTH - WALL_THICKNESS - paddle.width, paddle.x));
}
function drawPaddle(ctx, paddle) {
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.restore();
}
function createBall() {
    return {
        x: CANVAS_WIDTH / 2,
        y: PADDLE_Y - BALL_RADIUS - 20,
        radius: BALL_RADIUS,
        dx: BALL_SPEED * (Math.random() < 0.5 ? -1 : 1) * 0.6,
        dy: -BALL_SPEED,
    };
}
function resetBall(ball) {
    const fresh = createBall();
    ball.x = fresh.x;
    ball.y = fresh.y;
    ball.dx = fresh.dx;
    ball.dy = fresh.dy;
    resetBallTrail();
}
function bounceOffPaddle(ball, paddle) {
    const hitPos = (ball.x - paddle.x) / paddle.width;
    const clampedHitPos = Math.max(0, Math.min(1, hitPos));
    const angle = (clampedHitPos - 0.5) * 2 * PADDLE_MAX_BOUNCE_ANGLE;
    const speed = Math.hypot(ball.dx, ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
    ball.y = paddle.y - ball.radius;
    playBounce();
    spawnSparks(ball.x, ball.y + ball.radius, '#00f0ff', 8);
}
function updateBall(ball, paddle) {
    ball.x += ball.dx;
    ball.y += ball.dy;
    updateBallTrail(ball);
    if (ball.x - ball.radius <= WALL_THICKNESS) {
        ball.x = WALL_THICKNESS + ball.radius;
        ball.dx *= -1;
        playBounce();
        spawnSparks(ball.x, ball.y, '#00f0ff', 6);
    }
    else if (ball.x + ball.radius >= CANVAS_WIDTH - WALL_THICKNESS) {
        ball.x = CANVAS_WIDTH - WALL_THICKNESS - ball.radius;
        ball.dx *= -1;
        playBounce();
        spawnSparks(ball.x, ball.y, '#00f0ff', 6);
    }
    if (ball.y - ball.radius <= WALL_THICKNESS) {
        ball.y = WALL_THICKNESS + ball.radius;
        ball.dy *= -1;
        playBounce();
        spawnSparks(ball.x, ball.y, '#00f0ff', 6);
    }
    const hitsPaddle = ball.dy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y + ball.radius <= paddle.y + paddle.height &&
        ball.x + ball.radius >= paddle.x &&
        ball.x - ball.radius <= paddle.x + paddle.width;
    if (hitsPaddle) {
        bounceOffPaddle(ball, paddle);
    }
    return ball.y - ball.radius > CANVAS_HEIGHT;
}
function drawBall(ctx, ball) {
    drawBallTrail(ctx);
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    drawSprite(ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
    ctx.restore();
}
function buildBlocks(layout) {
    const blocks = [];
    const leftMargin = (CANVAS_WIDTH - BLOCK_COLS * BLOCK_WIDTH) / 2;
    layout.forEach((row, rowIndex) => {
        row.forEach((color, colIndex) => {
            if (!color)
                return;
            blocks.push({
                x: leftMargin + colIndex * BLOCK_WIDTH,
                y: BLOCK_ROWS_TOP_MARGIN + rowIndex * BLOCK_HEIGHT,
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                color,
                points: POINTS_BY_COLOR[color],
                alive: true,
                exploding: false,
                explosionStart: 0,
            });
        });
    });
    return blocks;
}
function breakBlock(block, now) {
    block.alive = false;
    block.exploding = true;
    block.explosionStart = now;
    playBreak();
    const neonColor = NEON_COLORS[block.color] || '#00f0ff';
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    spawnSparks(centerX, centerY, neonColor, 12);
    spawnScorePopup(centerX, block.y, block.points, neonColor, now);
}
function updateExplosions(blocks, now) {
    for (const block of blocks) {
        if (block.exploding && now - block.explosionStart >= EXPLOSION_DURATION) {
            block.exploding = false;
        }
    }
}
function drawBlocks(ctx, blocks, now) {
    for (const block of blocks) {
        if (block.alive) {
            drawSprite(ctx, `block_${block.color}`, block.x, block.y, block.width, block.height);
            continue;
        }
        if (block.exploding) {
            const frames = EXPLOSION_FRAMES[block.color];
            const elapsed = now - block.explosionStart;
            const frameIndex = Math.min(frames.length - 1, Math.floor(elapsed / (EXPLOSION_DURATION / frames.length)));
            drawFrame(ctx, frames[frameIndex], block.x, block.y, block.width, block.height);
        }
    }
}
function findHitBlock(ball, blocks) {
    for (const block of blocks) {
        if (!block.alive)
            continue;
        const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
        const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.height));
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        if (dx * dx + dy * dy <= ball.radius * ball.radius) {
            return block;
        }
    }
    return null;
}
function resolveBlockCollision(ball, block) {
    const overlapLeft = ball.x + ball.radius - block.x;
    const overlapRight = block.x + block.width - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - block.y;
    const overlapBottom = block.y + block.height - (ball.y - ball.radius);
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    if (minOverlap === overlapTop || minOverlap === overlapBottom) {
        ball.dy *= -1;
    }
    else {
        ball.dx *= -1;
    }
}
function solidRow(color) {
    return new Array(BLOCK_COLS).fill(color);
}
const LEVEL_1 = [
    solidRow('red'),
    solidRow('yellow'),
    solidRow('green'),
    solidRow('cyan'),
    solidRow('magenta'),
];
const LEVEL_2 = [
    ['gray', null, 'gray', null, 'gray', null, 'gray', null, 'gray', null, 'gray', null],
    [null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink'],
    solidRow('cyan'),
    [null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta'],
    solidRow('yellow'),
    ['red', null, 'red', null, 'red', null, 'red', null, 'red', null, 'red', null],
];
const LEVEL_3 = [
    solidRow('gray'),
    solidRow('red'),
    solidRow('hotpink'),
    solidRow('magenta'),
    solidRow('cyan'),
    solidRow('green'),
    solidRow('yellow'),
];
const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = {
    screen: 'start',
    level: 1,
    score: 0,
    lives: LIVES_START,
};
let paddle = createPaddle();
let ball = createBall();
let blocks = buildBlocks(LEVELS[0]);
let lastFrameTime = performance.now();
function resetLevel(levelIndex) {
    paddle = createPaddle();
    ball = createBall();
    blocks = buildBlocks(LEVELS[levelIndex]);
    resetBallTrail();
    particles.length = 0;
    scorePopups.length = 0;
}
function isLevelCleared() {
    return blocks.every((b) => !b.alive && !b.exploding);
}
function advanceLevel() {
    if (state.level >= TOTAL_LEVELS) {
        state.screen = 'win';
        spawnSparks(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#00ff66', 30);
        return;
    }
    state.level += 1;
    resetLevel(state.level - 1);
}
function restartGame() {
    state.screen = 'start';
    state.level = 1;
    state.score = 0;
    state.lives = LIVES_START;
    resetLevel(0);
}
let lastConfirmTime = 0;
function handleConfirmAction() {
    const now = performance.now();
    if (now - lastConfirmTime < 250)
        return;
    lastConfirmTime = now;
    if (state.screen === 'start') {
        state.screen = 'playing';
    }
    else if (state.screen === 'paused') {
        state.screen = 'playing';
    }
    else if (state.screen === 'gameover' || state.screen === 'win') {
        restartGame();
    }
}
function handlePauseAction() {
    if (state.screen === 'playing') {
        state.screen = 'paused';
    }
    else if (state.screen === 'paused') {
        state.screen = 'playing';
    }
}
function initTouchInput() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    const getCanvasX = (clientX) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0)
            return CANVAS_WIDTH / 2;
        const scaleX = CANVAS_WIDTH / rect.width;
        return (clientX - rect.left) * scaleX;
    };
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 0)
            return;
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchMoved = false;
        if (state.screen === 'playing') {
            movePaddleTo(paddle, getCanvasX(touch.clientX));
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 0)
            return;
        e.preventDefault();
        const touch = e.touches[0];
        if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > 8) {
            touchMoved = true;
        }
        if (state.screen === 'playing') {
            movePaddleTo(paddle, getCanvasX(touch.clientX));
        }
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!touchMoved || state.screen !== 'playing') {
            handleConfirmAction();
        }
    }, { passive: false });
    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
    }, { passive: false });
    let isPointerDown = false;
    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') {
            isPointerDown = true;
            if (state.screen === 'playing') {
                movePaddleTo(paddle, getCanvasX(e.clientX));
            }
        }
    });
    window.addEventListener('pointermove', (e) => {
        if (isPointerDown && e.pointerType === 'mouse' && state.screen === 'playing') {
            movePaddleTo(paddle, getCanvasX(e.clientX));
        }
    });
    window.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse') {
            isPointerDown = false;
        }
    });
    const pauseBtn = document.getElementById('touch-pause-btn');
    if (pauseBtn) {
        const triggerPause = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePauseAction();
        };
        pauseBtn.addEventListener('click', triggerPause);
        pauseBtn.addEventListener('touchend', triggerPause);
    }
}
function initGameInput() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            handlePauseAction();
        }
        else if (e.key === 'Enter' || e.key === ' ') {
            handleConfirmAction();
        }
    });
    canvas.addEventListener('click', handleConfirmAction);
    initTouchInput();
}
function updateGame(now, deltaMs) {
    updateParticles(deltaMs);
    updateScorePopups(now);
    if (state.screen !== 'playing')
        return;
    updatePaddle(paddle);
    const ballLost = updateBall(ball, paddle);
    if (ballLost) {
        state.lives -= 1;
        if (state.lives <= 0) {
            state.screen = 'gameover';
            return;
        }
        ball = createBall();
        resetBallTrail();
    }
    const hitBlock = findHitBlock(ball, blocks);
    if (hitBlock) {
        resolveBlockCollision(ball, hitBlock);
        state.score += hitBlock.points;
        breakBlock(hitBlock, now);
    }
    updateExplosions(blocks, now);
    if (isLevelCleared()) {
        advanceLevel();
    }
}
function drawRoundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}
function drawNeonBackground(ctx) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#050713');
    bgGrad.addColorStop(0.5, '#080c1e');
    bgGrad.addColorStop(1, '#0e1227');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = WALL_THICKNESS; x < CANVAS_WIDTH - WALL_THICKNESS; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, WALL_THICKNESS);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = WALL_THICKNESS; y < CANVAS_HEIGHT; y += step) {
        ctx.beginPath();
        ctx.moveTo(WALL_THICKNESS, y);
        ctx.lineTo(CANVAS_WIDTH - WALL_THICKNESS, y);
        ctx.stroke();
    }
    ctx.restore();
}
function drawNeonWalls(ctx) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.fillRect(0, 0, CANVAS_WIDTH, WALL_THICKNESS);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.lineTo(WALL_THICKNESS, WALL_THICKNESS);
    ctx.lineTo(CANVAS_WIDTH - WALL_THICKNESS, WALL_THICKNESS);
    ctx.lineTo(CANVAS_WIDTH - WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.strokeStyle = '#ff00ea';
    ctx.shadowColor = '#ff00ea';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, WALL_THICKNESS - 4, WALL_THICKNESS - 4);
    ctx.strokeRect(CANVAS_WIDTH - WALL_THICKNESS + 2, 2, WALL_THICKNESS - 4, WALL_THICKNESS - 4);
    ctx.restore();
}
function drawHUD(now) {
    ctx.save();
    ctx.font = 'bold 11px Orbitron, monospace, sans-serif';
    const scoreText = `SCORE ${String(state.score).padStart(5, '0')}`;
    const levelText = `NIVEL ${state.level}`;
    const livesLabel = 'VIDAS:';
    const scoreWidth = ctx.measureText(scoreText).width;
    const levelWidth = ctx.measureText(levelText).width;
    const livesLabelWidth = ctx.measureText(livesLabel).width;
    const miniPaddleWidth = 14;
    const miniPaddleHeight = 5;
    const miniPaddleGap = 4;
    const livesIconsWidth = state.lives * (miniPaddleWidth + miniPaddleGap);
    const sectionGap = 20;
    const totalContentWidth = scoreWidth + sectionGap + levelWidth + sectionGap + livesLabelWidth + 6 + livesIconsWidth;
    const boxX = HUD_MARGIN;
    const boxY = WALL_THICKNESS + 6;
    const paddingX = 14;
    const boxWidth = totalContentWidth + paddingX * 2;
    const boxHeight = 28;
    drawRoundedRect(boxX, boxY, boxWidth, boxHeight, HUD_BOX_RADIUS);
    ctx.fillStyle = HUD_BOX_FILL;
    ctx.fill();
    ctx.strokeStyle = HUD_BOX_BORDER;
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const centerY = boxY + boxHeight / 2;
    let currentX = boxX + paddingX;
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(scoreText, currentX, centerY);
    currentX += scoreWidth + sectionGap;
    ctx.fillStyle = '#ffe600';
    ctx.fillText(levelText, currentX, centerY);
    currentX += levelWidth + sectionGap;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(livesLabel, currentX, centerY);
    currentX += livesLabelWidth + 6;
    ctx.fillStyle = '#ff00ea';
    ctx.shadowColor = '#ff00ea';
    ctx.shadowBlur = 5;
    for (let i = 0; i < state.lives; i++) {
        drawRoundedRect(currentX, centerY - miniPaddleHeight / 2, miniPaddleWidth, miniPaddleHeight, 2);
        ctx.fill();
        currentX += miniPaddleWidth + miniPaddleGap;
    }
    ctx.restore();
}
function drawOverlay(color = 'rgba(5, 7, 18, 0.78)') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
}
function drawStartScreen(now) {
    drawOverlay('rgba(5, 7, 18, 0.85)');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 36px Orbitron, sans-serif';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARKANOID', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 110);
    ctx.font = 'bold 10px Orbitron, monospace, sans-serif';
    ctx.shadowColor = '#ff00ea';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff00ea';
    ctx.fillText('— CYBERPUNK NEON EDITION —', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 75);
    const cardW = 340;
    const cardH = 170;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const cardY = CANVAS_HEIGHT / 2 - 40;
    drawRoundedRect(cardX, cardY, cardW, cardH, 12);
    ctx.fillStyle = 'rgba(10, 15, 32, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(0, 240, 255, ${pulse})`;
    ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
    ctx.font = 'bold 13px Orbitron, monospace, sans-serif';
    ctx.fillText('▶ ENTER O TOCA PARA JUGAR ◀', CANVAS_WIDTH / 2, cardY + 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Orbitron, sans-serif';
    ctx.fillText('( click o toque en la pantalla )', CANVAS_WIDTH / 2, cardY + 68);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cardX + 30, cardY + 95);
    ctx.lineTo(cardX + cardW - 30, cardY + 95);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Orbitron, sans-serif';
    ctx.fillText('[ ← / → ] o deslizar : Mover la pala', CANVAS_WIDTH / 2, cardY + 120);
    ctx.fillText('Tecla [ P ] o botón ⏸ : Pausa', CANVAS_WIDTH / 2, cardY + 144);
    ctx.restore();
}
function drawPauseScreen() {
    drawOverlay('rgba(5, 7, 20, 0.8)');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cardW = 280;
    const cardH = 130;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const cardY = (CANVAS_HEIGHT - cardH) / 2;
    drawRoundedRect(cardX, cardY, cardW, cardH, 12);
    ctx.fillStyle = 'rgba(12, 17, 36, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.font = '900 28px Orbitron, sans-serif';
    ctx.fillStyle = '#ffe600';
    ctx.fillText('PAUSA', CANVAS_WIDTH / 2, cardY + 45);
    ctx.shadowBlur = 0;
    ctx.font = '12px Orbitron, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Presiona P o toca para continuar', CANVAS_WIDTH / 2, cardY + 90);
    ctx.restore();
}
function drawGameOverScreen(now) {
    drawOverlay('rgba(20, 4, 12, 0.85)');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 34px Orbitron, sans-serif';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff0055';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);
    const cardW = 300;
    const cardH = 150;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const cardY = CANVAS_HEIGHT / 2 - 40;
    drawRoundedRect(cardX, cardY, cardW, cardH, 12);
    ctx.fillStyle = 'rgba(20, 10, 20, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = '13px Orbitron, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Puntaje final: ${state.score}`, CANVAS_WIDTH / 2, cardY + 40);
    ctx.fillText(`Nivel alcanzado: ${state.level}`, CANVAS_WIDTH / 2, cardY + 70);
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    ctx.fillStyle = `rgba(255, 0, 85, ${pulse})`;
    ctx.font = 'bold 12px Orbitron, monospace, sans-serif';
    ctx.fillText('▶ ENTER O TOCA PARA REINICIAR', CANVAS_WIDTH / 2, cardY + 115);
    ctx.restore();
}
function drawWinScreen(now) {
    drawOverlay('rgba(4, 20, 14, 0.85)');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 34px Orbitron, sans-serif';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#00ff66';
    ctx.fillText('¡VICTORIA!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);
    const cardW = 320;
    const cardH = 160;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const cardY = CANVAS_HEIGHT / 2 - 40;
    drawRoundedRect(cardX, cardY, cardW, cardH, 12);
    ctx.fillStyle = 'rgba(8, 24, 18, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.45)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillStyle = '#ffe600';
    ctx.fillText('¡MISIÓN CUMPLIDA!', CANVAS_WIDTH / 2, cardY + 38);
    ctx.font = '13px Orbitron, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Puntaje final: ${state.score}`, CANVAS_WIDTH / 2, cardY + 74);
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    ctx.fillStyle = `rgba(0, 255, 102, ${pulse})`;
    ctx.font = 'bold 12px Orbitron, monospace, sans-serif';
    ctx.fillText('▶ ENTER O TOCA PARA REINICIAR', CANVAS_WIDTH / 2, cardY + 120);
    ctx.restore();
}
function renderGame(now) {
    drawNeonBackground(ctx);
    drawNeonWalls(ctx);
    if (state.screen === 'playing' || state.screen === 'paused') {
        drawBlocks(ctx, blocks, now);
        drawParticles(ctx);
        drawScorePopups(ctx, now);
        drawPaddle(ctx, paddle);
        drawBall(ctx, ball);
        drawHUD(now);
    }
    if (state.screen === 'start') {
        drawStartScreen(now);
    }
    else if (state.screen === 'paused') {
        drawPauseScreen();
    }
    else if (state.screen === 'gameover') {
        drawParticles(ctx);
        drawGameOverScreen(now);
    }
    else if (state.screen === 'win') {
        drawParticles(ctx);
        drawWinScreen(now);
    }
}
function gameLoop(now) {
    const deltaMs = Math.min(32, now - lastFrameTime);
    lastFrameTime = now;
    updateGame(now, deltaMs);
    renderGame(now);
    requestAnimationFrame(gameLoop);
}
initKeyboardInput();
initGameInput();
loadSpritesheet(() => requestAnimationFrame(gameLoop));
