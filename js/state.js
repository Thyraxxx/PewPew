/* ==========================================================================
   Face Shooter - Global State Management
   Centralized state container for all active entities, scores, and media.
   ========================================================================== */

// DOM helper
const $ = id => document.getElementById(id);

const State = {
  // Game lifecycle
  status: 'idle',       // 'idle' | 'play' | 'over'
  score: 0,
  wave: 0,
  highScore: 0,

  // Spawning & wave timers
  enemiesLeftToSpawn: 0,
  spawnTimer: 0,
  waveTimer: 0,
  lastTimestamp: 0,

  // Screen feedback
  screenShake: 0,
  screenFlash: 0,

  // Active Entities
  player: null,         // Managed by player.js
  enemies: [],          // Managed by enemies.js
  playerBullets: [],
  enemyBullets: [],
  effects: [],          // Particles & floating text managed by animations.js

  // Face Photos (In-memory drawable Images)
  activeFaces: {
    player: null,
    enemies: []
  },

  // Face Photos (Base64 data URLs for localStorage)
  savedFaceData: {
    p: null,
    e: []
  },

  // Canvas References
  canvas: null,
  ctx: null,

  initCanvas() {
    this.canvas = $('c');
    this.canvas.style.aspectRatio = CONFIG.world.width + ' / ' + CONFIG.world.height;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.resizeCanvas(), 150));
    document.documentElement.style.setProperty('--game-ar', CONFIG.world.width / CONFIG.world.height);
    this.ctx = this.canvas.getContext('2d');
  },

  // Sharp rendering: the drawing surface is made bigger on high-res / big displays
  renderScale: 1,
  resizeCanvas() {
    const cv = this.canvas;
    const W = CONFIG.world.width, H = CONFIG.world.height;
    const cssW = cv.getBoundingClientRect().width || W;
    let s = CONFIG.world.renderScale;
    if (typeof s !== 'number') s = (window.devicePixelRatio || 1) * cssW / W;   // 'auto'
    s = Math.max(1, Math.min(CONFIG.world.maxRenderScale || 3, Math.ceil(s * 4) / 4));
    if (cv.width && s === this.renderScale) return;
    this.renderScale = s;
    cv.width = Math.round(W * s);
    cv.height = Math.round(H * s);
  },

  resetForNewGame() {
    this.status = 'play';
    this.score = 0;
    this.wave = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.enemiesLeftToSpawn = 0;
    this.screenShake = 0;
    this.screenFlash = 0;

    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.effects = [];
  }
};

