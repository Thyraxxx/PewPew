/* ==========================================================================
   Face Shooter - Enemy System & Multi-Type AI (Track Defense Overhaul)
   Enemies DO NOT attack with bullets. They march forward, use unique skills,
   and breach the defense line if not stopped!
   Types:
   - standard: Normal walking runner (1 HP)
   - runner: Surprise high-speed sprinter (1 HP) + heavy breathing audio
   - sidestep: Dodges incoming bullets or hides behind allies (1 HP)
   - barrier: Calls invulnerable barrier, immobilized" (1 HP)
   - door: Hiding behind a 2 HP wooden door (door 2 HP, unit 1 HP)
   - sleep: Slow tank with floating ZZZ animation and snoring audio (5 HP)
   - boss: Giant Track Master every 5 waves (20+ HP, lane teasing & taunts)
   ========================================================================== */

const EnemySystem = {
  // Select enemy type based on current wave & progression curve
  chooseEnemyType(wave) {
    // Collect available types for current wave
    const available = Object.values(CONFIG.enemyTypes).filter(t => !t.isBoss && wave >= t.minWave);
    if (!available.length) return CONFIG.enemyTypes.standard;

    // Weighted selection
    const totalWeight = available.reduce((sum, t) => sum + (t.spawnWeight || 25), 0);
    let rand = Math.random() * totalWeight;

    for (const type of available) {
      const w = type.spawnWeight || 25;
      if (rand < w) return type;
      rand -= w;
    }
    return available[0];
  },

  // True if a player bullet is close behind this enemy in the same lane
  hasIncomingBullet(enemy, range = 170) {
    return State.playerBullets.some(
      b => b.lane === enemy.lane && b.x < enemy.x && enemy.x - b.x < range
    );
  },

  // Spawn an individual enemy unit
  spawn(forceType = null) {
    const isBossWave = (State.wave % 5 === 0);
    let typeDef = forceType;

    // Boss spawns first on every 5th wave!
    if (!typeDef && isBossWave && !State.bossSpawnedThisWave) {
      typeDef = CONFIG.enemyTypes.boss;
      State.bossSpawnedThisWave = true;
    } else if (!typeDef) {
      typeDef = this.chooseEnemyType(State.wave);
    }

    const lane = Math.floor(Math.random() * CONFIG.world.laneCount);

    // Calculate scaled stats based on wave progression
    const isHardcore = State.wave > 20;
    const speedMult = isHardcore ? CONFIG.difficulty.hardcoreSpeedBoost : 1.0;

    let baseHp = typeDef.baseHp;
    if (typeDef.isBoss) {
      baseHp = 10 + Math.floor((State.wave / 5) - 1) * 5;
    }

    // Resolve assigned face image from State.activeFaces.enemies
    const faceImg = State.activeFaces.enemies[typeDef.assetKey] || null;

    const enemy = {
      id: Math.random().toString(36).substr(2, 9),
      typeId: typeDef.id,
      lane: lane,
      x: CONFIG.world.width + 35,
      y: getLaneY(lane),
      hp: baseHp,
      maxHp: baseHp,
      speed: (typeDef.speed || typeDef.normalSpeed || 50) * speedMult,
      img: faceImg,
      ph: 0,
      fl: 0,
      dead: false,

      // Type-specific state fields
      isSprinting: false,
      sprintDistanceTrigger: typeDef.sprintDistanceTrigger || 460,

      // Skill cooldowns start at 0 = ready the moment the enemy spawns.
      // The configured cooldown values only apply AFTER a skill has been used.
      dodgeCooldown: 0,

      isBarrierActive: false,
      barrierCooldown: 0,
      barrierTimer: 0,

      doorHp: typeDef.doorHp || 0,

      snoreTimer: 1.5,
      zzzTimer: 0.4,

      // Boss specific
      isBoss: typeDef.isBoss || false,
      laneSwitchTimer: typeDef.laneSwitchInterval || 2.0,
      teaseTimer: typeDef.teaseInterval || 3.0,
      isTeasing: false,
      teaseOffset: 0
    };

    State.enemies.push(enemy);
    State.enemiesLeftToSpawn--;

    // Dynamic spawn pacing
    let delay = Math.max(
      CONFIG.difficulty.minSpawnDelay,
      CONFIG.difficulty.initialSpawnDelay - State.wave * CONFIG.difficulty.spawnDecayPerWave
    );
    if (isHardcore) delay = CONFIG.difficulty.hardcoreSpawnInterval;
    State.spawnTimer = delay;
  },

  // Bullet hit resolution (respects barriers, wooden doors, and armor)
  handleBulletHit(enemy, damage) {
    const typeDef = CONFIG.enemyTypes[enemy.typeId] || CONFIG.enemyTypes.standard;

    // 1. BARRIER: Completely immune when skill is active!
    if (enemy.isBarrierActive) {
      Animations.addSparks(enemy.x, enemy.y, '#f1c40f', 10);
      Sound.playHit();
      State.effects.push({
        k: 'txt',
        x: enemy.x,
        y: enemy.y - 50,
        s: 'NO! 🚫',
        color: '#f1c40f',
        t: 0
      });
      return;
    }

    // 2. DOOR: Wooden door absorbs 2 hits before breaking
    if (enemy.doorHp > 0) {
      enemy.doorHp -= damage;
      Animations.addSparks(enemy.x - 12, enemy.y, '#8d6e63', 8);

      if (enemy.doorHp > 0) {
        Sound.playDoorHit();
        State.effects.push({
          k: 'txt',
          x: enemy.x,
          y: enemy.y - 50,
          s: 'THUD! 🚪',
          color: '#8d6e63',
          t: 0
        });
      } else {
        Sound.playDoorBreak();
        State.effects.push({
          k: 'txt',
          x: enemy.x,
          y: enemy.y - 50,
          s: 'DOOR BROKEN! 💥',
          color: '#e74c3c',
          t: 0
        });
      }
      return;
    }

    // 3. Regular Unit Damage
    enemy.hp -= damage;
    enemy.fl = 0.14;
    Animations.addSparks(enemy.x, enemy.y, typeDef.color, CONFIG.visuals.sparksPerHit);
    Sound.playHit();

    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.killEnemy(enemy);
    }
  },

  // Enemy Defeat
  killEnemy(enemy) {
    const typeDef = CONFIG.enemyTypes[enemy.typeId] || CONFIG.enemyTypes.standard;

    State.score += typeDef.scoreValue;
    Skill.maybeDrop(enemy, typeDef);
    Sound.playExplode();

    // Defeat tumble effect
    State.effects.push({
      k: 'die',
      x: enemy.x,
      y: enemy.y,
      img: enemy.img,
      color: typeDef.color,
      lineWidth: typeDef.lineWidth,
      t: 0
    });

    // Floating score popup
    State.effects.push({
      k: 'txt',
      x: enemy.x,
      y: enemy.y - 50,
      s: `+${typeDef.scoreValue}`,
      color: typeDef.isBoss ? '#ffd026' : typeDef.color,
      t: 0
    });
  },

  // Per-frame enemy updates, mechanics & AI
  update(dt) {
    // 1. Spawning
    if (State.enemiesLeftToSpawn > 0) {
      State.spawnTimer -= dt;
      if (State.spawnTimer <= 0) {
        this.spawn();
      }
    }

    // 2. Process each enemy
    for (const enemy of State.enemies) {
      const typeDef = CONFIG.enemyTypes[enemy.typeId] || CONFIG.enemyTypes.standard;

      // Animation & flash decay
      enemy.ph += enemy.speed * 0.12 * dt;
      enemy.fl = Math.max(0, enemy.fl - dt);

      // ----------------------------------------------------------------------
      // TYPE BEHAVIORS
      // ----------------------------------------------------------------------

      // TYPE 2: RUNNER (Surprise Sprint)
      if (enemy.typeId === 'runner') {
        if (!enemy.isSprinting && enemy.x < enemy.sprintDistanceTrigger) {
          enemy.isSprinting = true;
          enemy.speed = typeDef.sprintSpeed;
          Sound.playRunnerPant(); // Heavy breathing audio!
          State.effects.push({
            k: 'txt',
            x: enemy.x,
            y: enemy.y - 50,
            s: 'SPRINT! 💨',
            color: '#e74c3c',
            t: 0
          });
        }
      }

      // TYPE 3: SIDESTEP (Dodges incoming bullets or hides behind allies)
      if (enemy.typeId === 'sidestep') {
        enemy.dodgeCooldown -= dt;
        if (enemy.dodgeCooldown <= 0) {
          // Check for incoming player bullet on same lane
          if (this.hasIncomingBullet(enemy)) {
            // Shift to adjacent lane to dodge!
            const options = [];
            if (enemy.lane > 0) options.push(-1);
            if (enemy.lane < CONFIG.world.laneCount - 1) options.push(1);
            if (options.length) {
              enemy.lane += options[Math.floor(Math.random() * options.length)];
              enemy.dodgeCooldown = typeDef.dodgeCooldown;
              Sound.playHit(); // Comedic slide
            }
          }
        }
      }

      // TYPE 4: BARRIER (Immobilized, immune, shouts "NO!")
      if (enemy.typeId === 'barrier') {
        if (enemy.isBarrierActive) {
          // 1. Barrier is active: Tick down timer, IGNORE all bullets
          enemy.barrierTimer -= dt;
          if (enemy.barrierTimer <= 0) {
            enemy.isBarrierActive = false;
            enemy.barrierCooldown = typeDef.barrierCooldown;
          }
        } else {
          // 2. Barrier is NOT active: tick the cooldown down (starts at 0 on spawn)
          if (enemy.barrierCooldown > 0) {
            enemy.barrierCooldown -= dt;
          }

          // 3. Cooldown is 0 (or finished): react to the next incoming bullet
          if (enemy.barrierCooldown <= 0 && this.hasIncomingBullet(enemy)) {
            enemy.isBarrierActive = true;
            enemy.barrierTimer = typeDef.barrierDuration;
            Sound.playBarrierShout();
          }
        }
      }


      // TYPE 6: SLEEP (Slow snoozer with ZZZ and snore audio)
      if (enemy.typeId === 'sleep') {
        // Snoring sound pulse
        enemy.snoreTimer -= dt;
        if (enemy.snoreTimer <= 0) {
          Sound.playSleepSnore();
          enemy.snoreTimer = 2.6;
        }

        // Drifting ZZZ particle
        enemy.zzzTimer -= dt;
        if (enemy.zzzTimer <= 0) {
          State.effects.push({
            k: 'zzz',
            x: enemy.x,
            y: enemy.y - 28,
            vx: 15,
            vy: -25,
            t: 0
          });
          enemy.zzzTimer = 0.6;
        }
      }

      // TYPE 7: BOSS (Moves between lanes, pauses, teases player)
      if (enemy.isBoss) {
        // Lane shifting
        enemy.laneSwitchTimer -= dt;
        if (enemy.laneSwitchTimer <= 0) {
          const shift = Math.random() < 0.5 ? -1 : 1;
          enemy.lane = Math.max(0, Math.min(CONFIG.world.laneCount - 1, enemy.lane + shift));
          enemy.laneSwitchTimer = typeDef.laneSwitchInterval;
        }

        // Teasing taunts
        enemy.teaseTimer -= dt;
        if (enemy.teaseTimer <= 0) {
          Sound.playBossTaunt();
          const taunts = ['Too slow! 😜', 'Missed me! 🤣', 'Catch me! 💨', 'Haha! 💃', 'Try harder! 🥱'];
          const taunt = taunts[Math.floor(Math.random() * taunts.length)];
          State.effects.push({
            k: 'txt',
            x: enemy.x,
            y: enemy.y - 58,
            s: taunt,
            color: '#ffd026',
            t: 0
          });
          enemy.teaseTimer = typeDef.teaseInterval;
        }
      }

      // ----------------------------------------------------------------------
      // MOVEMENT & VERTICAL LERP
      // ----------------------------------------------------------------------
      // Barrier immobilizes the unit during skill!
      if (!enemy.isBarrierActive) {
        enemy.x -= enemy.speed * dt;
      }

      // Smooth vertical movement to lane
      const targetY = getLaneY(enemy.lane);
      enemy.y = enemy.y || targetY;
      enemy.y += (targetY - enemy.y) * Math.min(1, dt * 10);

      // ----------------------------------------------------------------------
      // COLLISIONS WITH PLAYER & TRACK BREACH
      // ----------------------------------------------------------------------
      // 1. Collides with player on track
      if (
        State.player &&
        enemy.lane === State.player.lane &&
        Math.abs(enemy.x - State.player.x) < CONFIG.player.hitboxRadius
      ) {
        PlayerSystem.takeDamage(1);
        enemy.dead = true;
      }
      // 2. Reached defense goal (breached track end)
      else if (enemy.x < -10) {
        PlayerSystem.takeDamage(1);
        enemy.dead = true;
      }
    }

    // Prune dead enemies
    State.enemies = State.enemies.filter(e => !e.dead);
  }
};