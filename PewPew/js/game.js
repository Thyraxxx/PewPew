/* ==========================================================================
   Face Shooter - Main Game Orchestrator & Loop
   Coordinates game state, wave transitions, physics tick, sound, and rendering.
   ========================================================================== */

const Game = {
  // Begin or restart the game
  start() {
    State.resetForNewGame();
    State.player = PlayerSystem.create();
    Skill.onNewGame();
    State.isWaveClearing = false;
    State.bossSpawnedThisWave = false;
    this.nextWave();
  },

  // Advance to next wave with dynamic difficulty scaling
  nextWave() {
    State.wave++;
    State.isWaveClearing = false;
    State.bossSpawnedThisWave = false;

    // Difficulty scaling formula
    const isHardcore = State.wave > 20;
    let waveCount = Math.floor(
      CONFIG.difficulty.baseWaveCount + State.wave * CONFIG.difficulty.waveCountMultiplier
    );

    // Boss waves have extra tactical intensity
    if (State.wave % 5 === 0) {
      waveCount += 4;
    }

    State.enemiesLeftToSpawn = waveCount;
    State.spawnTimer = 0.5;

    // Triumphant wave fanfare
    Sound.playCelebrate();
  },

  // Per-frame physics and logic tick
  update(dt) {
    // 1. Update player & player bullets
    PlayerSystem.update(dt);

    // 2. Update enemies & collisions
    EnemySystem.update(dt);

    // 2b. Burst skill timers & pickups
    Skill.update(dt);

    // 3. Update spark particles
    Animations.updateSparks(dt);

    // 4. Wave completion check & momentary celebration
    if (State.enemiesLeftToSpawn === 0 && State.enemies.length === 0) {
      if (!State.isWaveClearing) {
        State.isWaveClearing = true;
        Sound.playCelebrate();
      }

      State.waveTimer += dt;
      if (State.waveTimer > 1.8) {
        State.waveTimer = 0;
        this.nextWave();
      }
    }
  },

  // Main 60FPS animation loop
  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - State.lastTimestamp) / 1000 || 0);
    State.lastTimestamp = timestamp;

    if (State.status === 'play') {
      this.update(dt);
    }

    // Decay visual timers
    for (const eff of State.effects) {
      eff.t += dt;
    }
    State.effects = State.effects.filter(eff => eff.t < CONFIG.visuals.fxDuration);

    State.screenShake = Math.max(0, State.screenShake - dt);
    State.screenFlash = Math.max(0, State.screenFlash - dt);

    // Draw frame
    Animations.renderScene();

    requestAnimationFrame(ts => this.loop(ts));
  },

  // Bootstrap game systems
  init() {
    State.initCanvas();
    Sound.init();
    FaceStorage.init();
    Leaderboard.init();
    Skill.init();
    Input.init();
    requestAnimationFrame(ts => this.loop(ts));
  }
};

// Start when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Game.init());
} else {
  Game.init();
}
