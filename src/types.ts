type GameScreen = 'start' | 'playing' | 'paused' | 'gameover' | 'win';

type BlockColor = 'red' | 'yellow' | 'cyan' | 'magenta' | 'hotpink' | 'green' | 'gray';

interface GameState {
  screen: GameScreen;
  level: number;
  score: number;
  lives: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: BlockColor;
  points: number;
  alive: boolean;
  exploding: boolean;
  explosionStart: number;
}

type LevelLayout = ( BlockColor | null )[][];

// Efectos visuales de partículas, estela y popups de puntuación
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  created: number;
  duration: number;
}

interface BallTrailPoint {
  x: number;
  y: number;
}

// Ambient declarations for assets/spritesheet.js, cargado como <script> plano
// antes de dist/game.js (ver index.html). No es un módulo TS, solo expone
// estas globales en tiempo de ejecución.
interface ExplosionFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

declare const EXPLOSION_FRAMES: Record<BlockColor, ExplosionFrame[]>;
declare const EXPLOSION_DURATION: number;

declare function loadSpritesheet( cb: () => void ): void;
declare function drawSprite( ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number ): void;
declare function drawFrame( ctx: CanvasRenderingContext2D, frame: ExplosionFrame, x: number, y: number, w: number, h: number ): void;
