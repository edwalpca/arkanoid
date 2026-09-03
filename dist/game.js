"use strict";
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const PADDLE_WIDTH = 162;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 7;
const PADDLE_Y = CANVAS_HEIGHT - 40;
const BALL_RADIUS = 8;
const BALL_SPEED = 5;
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ROWS_TOP_MARGIN = 60;
const BLOCK_COLS = 12;
const LIVES_START = 3;
const TOTAL_LEVELS = 3;
const POINTS_BY_COLOR = {
    gray: 1,
    red: 2,
    yellow: 3,
    cyan: 4,
    magenta: 5,
    hotpink: 6,
    green: 7,
};
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
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));
}
function drawPaddle(ctx, paddle) {
    drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height);
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
}
function updateBall(ball, paddle) {
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx *= -1;
        playBounce();
    }
    else if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.dx *= -1;
        playBounce();
    }
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
        playBounce();
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
    drawSprite(ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
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
function resetLevel(levelIndex) {
    paddle = createPaddle();
    ball = createBall();
    blocks = buildBlocks(LEVELS[levelIndex]);
}
function isLevelCleared() {
    return blocks.every((b) => !b.alive && !b.exploding);
}
function advanceLevel() {
    if (state.level >= TOTAL_LEVELS) {
        state.screen = 'win';
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
function handleConfirmAction() {
    if (state.screen === 'start') {
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
}
function updateGame(now) {
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
function drawHUD() {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${state.score}`, 12, 12);
    ctx.fillText(`Vidas: ${state.lives}`, 12, 32);
    ctx.fillText(`Nivel: ${state.level}`, 12, 52);
}
function drawOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
function drawMessageScreen(title, subtitles) {
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '16px sans-serif';
    subtitles.forEach((line, i) => {
        ctx.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 + i * 24);
    });
}
function renderGame(now) {
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (state.screen === 'playing' || state.screen === 'paused') {
        drawBlocks(ctx, blocks, now);
        drawPaddle(ctx, paddle);
        drawBall(ctx, ball);
        drawHUD();
    }
    if (state.screen === 'start') {
        drawMessageScreen('ARKANOID', ['Flechas: mover la pala', 'ENTER o click: empezar']);
    }
    else if (state.screen === 'paused') {
        drawOverlay();
        drawMessageScreen('PAUSA', ['Presiona P para continuar']);
    }
    else if (state.screen === 'gameover') {
        drawOverlay();
        drawMessageScreen('GAME OVER', [`Score final: ${state.score}`, 'ENTER o click: reiniciar']);
    }
    else if (state.screen === 'win') {
        drawOverlay();
        drawMessageScreen('¡GANASTE!', [`Score final: ${state.score}`, 'ENTER o click: reiniciar']);
    }
}
function gameLoop(now) {
    updateGame(now);
    renderGame(now);
    requestAnimationFrame(gameLoop);
}
initKeyboardInput();
initGameInput();
loadSpritesheet(() => requestAnimationFrame(gameLoop));
