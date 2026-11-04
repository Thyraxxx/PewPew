/* ==========================================================================
   Face Shooter - Player System
   Features:
   - Reactive Face States: playerstare, playerbang, playerdone, playerclear
   - Tactical Reload Mechanics: Magazine clip, manual/auto reload, ammo counter
   ========================================================================== */

const PlayerSystem = {
  // Spawn a fresh player instance
  create() {
    return {
      lane: CONFIG.player.initialLane,
      x: CONFIG.player.startX,
      y: getLaneY(CONFIG.player.initialLane),
      hp: CONFIG.player.maxHp,
      cd: 0,
      ph: 0,
      rec: 0,
      fl: 0,

      // Reload & Ammo Mechanics
      ammo: CONFIG.player.magazineSize,
      maxAmmo: CONFIG.player.magazineSize,
      isReloading: false,
      reloadTimer: 0,

      // Burst skill charges
      charges: CONFIG.skill.startCharges
    };
  },

  // Change player lane (up: -1, down: +1)
  changeLane(delta) {
    if (State.status === 'play' && State.player) {
      State.player.lane = Math.max(
        0,
        Math.min(CONFIG.world.laneCount - 1, State.player.lane + delta)
      );
    }
  },

  // Start manual or auto reload (Plays reload sound ONCE)
  startReload() {
    const player = State.player;
    if (!player || player.isReloading || player.ammo >= player.maxAmmo) return;

    player.isReloading = true;
    player.reloadTimer = CONFIG.player.reloadDuration;
    Sound.playReload(); // Trigger single crisp reload action
  },

  // Fire weapon
  shoot() {
    const player = State.player;
    if (!player || player.cd > 0) return;

    // If currently reloading, stay silent (do not repeat clicks)
    if (player.isReloading) {
      return;
    }

    // If clip is empty, trigger reload once
    if (player.ammo <= 0) {
      this.startReload();
      return;
    }

    // Fire bullet
    State.playerBullets.push({
      lane: player.lane,
      x: player.x + 30
    });

    player.ammo--;
    player.cd = CONFIG.player.fireCooldown;
    player.rec = 1;

    Sound.playShoot();
    Animations.addSparks(player.x + 32, player.y - 8, '#ffd026', 3);

    // Auto-reload immediately when last bullet is spent
    if (player.ammo === 0) {
      this.startReload();
    }
  },

  // Pick reactive face image based on current gameplay state
  getCurrentFace() {
    const faces = State.activeFaces.player;
    if (!faces) return null;

    // 1. Defeated / Game Over
    if (State.status === 'over') {
      return faces.done || faces.stare;
    }

    // 2. Wave Clear Celebration
    if (State.isWaveClearing) {
      return faces.clear || faces.stare;
    }

    // 3. Firing Gun (Bang face)
    const player = State.player;
    if (player && player.rec > 0.25) {
      return faces.bang || faces.stare;
    }

    // 4. Default Idle / Walk / Stare
    return faces.stare;
  },

  // Handle player taking damage
  takeDamage(amount = 1) {
    const player = State.player;
    if (!player) return;

    player.hp -= amount;
    player.fl = CONFIG.player.hurtFlashDuration;
    State.screenShake = CONFIG.visuals.shakeDuration;
    State.screenFlash = CONFIG.visuals.screenFlashDuration;

    Sound.playPlayerHurt();
    Animations.addSparks(player.x, player.y, '#e74c3c', 8);

    if (player.hp <= 0) {
      State.status = 'over';
      State.highScore = Math.max(State.highScore, State.score);
      const goBtn = $('go');
      if (goBtn) goBtn.textContent = 'Play again';
      if (typeof Leaderboard !== 'undefined') Leaderboard.onGameOver(State.score, State.wave);
    }
  },

  // Main per-frame update
  update(dt) {
    const player = State.player;
    if (!player) return;

    // 1. Handle reloading timer
    if (player.isReloading) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        player.ammo = player.maxAmmo;
        player.isReloading = false;
      }
    }

    // 2. Horizontal movement
    if (Input.keys.left) player.x -= CONFIG.player.speedX * dt;
    if (Input.keys.right) player.x += CONFIG.player.speedX * dt;

    player.x = Math.max(
      CONFIG.player.minX,
      Math.min(CONFIG.world.width * CONFIG.player.maxXRatio, player.x)
    );

    // 3. Vertical lane transition
    const targetY = getLaneY(player.lane);
    player.y += (targetY - player.y) * Math.min(1, dt * CONFIG.player.lerpSpeedY);

    // 4. Timers & animations
    player.cd -= dt;
    const isMoving = Input.keys.left || Input.keys.right || Math.abs(targetY - player.y) > 3;
    player.ph += (isMoving ? 14 : 0) * dt;
    player.rec = Math.max(0, player.rec - dt * CONFIG.player.recoilRecoverySpeed);
    player.fl = Math.max(0, player.fl - dt);

    // 5. Weapon firing
    const isAutoFire = $('auto') && $('auto').checked;
    if ((Input.keys.fire || isAutoFire) && player.cd <= 0) {
      this.shoot();
    }

    // 6. Update player bullets & check hits against enemies
    for (const bullet of State.playerBullets) {
      bullet.x += CONFIG.bullets.player.speed * dt;

      // Find hit enemy on same lane
      const hitEnemy = State.enemies.find(
        e => e.lane === bullet.lane && Math.abs(e.x - bullet.x) < CONFIG.bullets.player.hitboxRadius
      );

      if (hitEnemy) {
        bullet.dead = true;
        EnemySystem.handleBulletHit(hitEnemy, CONFIG.bullets.player.damage);
      }
    }

    // Prune spent bullets
    State.playerBullets = State.playerBullets.filter(b => !b.dead && b.x < CONFIG.world.width + 10);
  }
};
