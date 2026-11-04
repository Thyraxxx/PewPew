/* ==========================================================================
   Face Shooter - Configuration & Asset/Crop Tuning Registry
   Edit coordinates, zoom, and stats here for complete control!
   ========================================================================== */

const CONFIG = {
  // 1. World & Setting Geometry (School Athletic Running Track)
  world: {
    width: 680,
    height: 464,
    laneTop: 104,               // Space under the scoreboard (tall photos in lane 1 fit here)
    laneHeight: 64,
    laneCount: 5,
    laneOffsetY: 6,
    renderScale: 'auto',        // 'auto' = sharp on any screen. Or a number (1 = fast/blurry, 2 = sharp)
    maxRenderScale: 3
  },

  // 2. Camera View & 2.5D Perspective (10° to 30°)
  camera: {
    tiltAngle: 50,
    showDropShadows: true,
    showLaneMarkings: true
  },

  // 3. School Sports Field Theme Colors
  theme: {
    scoreboardBg: '#0f1712',
    scoreboardBorder: '#ffd026',
    trackEven: '#b24034',       // Terracotta running track
    trackOdd: '#a1362b',        // Alternating sprint lane
    trackLines: '#ffffff',      // White chalk lane dividers
    grassBorder: '#3b7444',     // Green sideline grass
    sidelineLine: '#f1c40f'     // Gold sideline border
  },

  // 4. Player Settings & Reload Mechanics
  player: {
    initialLane: 2,
    startX: 110,
    maxHp: 5,
    speedX: 240,
    lerpSpeedY: 18,
    minX: 42,
    maxXRatio: 0.52,
    fireCooldown: 0.20,
    recoilRecoverySpeed: 8.5,
    hurtFlashDuration: 0.35,
    hitboxRadius: 28,

    // Reload Mechanics
    magazineSize: 6,            // Number of shots before reload
    reloadDuration: 1.15,       // Seconds to reload clip

    looks: {
      bodyColor: '#102e23',
      lineWidth: 3.5,
      headRadius: 28,           // Big exaggerated cartoon head
      gunLength: 22,
      muzzleFlashColor: '#ffd84a'
    }
  },

  // 5. Player Bullets
  bullets: {
    player: {
      speed: 620,
      hitboxRadius: 24,
      damage: 1,
      width: 16,
      height: 4,
      color: '#ffd026',
      trailColor: 'rgba(255, 208, 38, 0.45)'
    }
  },

  // ==========================================================================
  // 6. CROP & IMAGE ADJUSTER REGISTRY
  // Tweak image crop centers (cx, cy), zoom (size), and rotation here!
  // cx: 0.0 (left) to 1.0 (right)
  // cy: 0.0 (top) to 1.0 (bottom)
  // size: zoom multiplier (smaller = closer zoom, larger = wider)
  // rotation: 0, 90, 180, 270 degrees
  // flipX: true/false (mirror horizontally)
  // ==========================================================================
  assets: {
    // Player Reactive Faces
    playerstare: {
      path: 'assets/player/playerstare.jpg',
      cx: 0.45, cy: 0.39, size: 0.45, rotation: 0, flipX: false,
      overlay: { scaleWithHead: false },
      desc: 'Idle'
    },
    playerbang: {
      path: 'assets/player/playerbang.jpg',
      cx: 0.38, cy: 0.42, size: 0.46, rotation: 0, flipX: false,
      overlay: { scaleWithHead: false },
      desc: 'Bangbang'
    },
    playerdone: {
      path: 'assets/player/playerdone.jpg',
      cx: 0.5, cy: 0.42, size: 0.45, rotation: 0, flipX: false,
      overlay: { scaleWithHead: false },
      desc: '(Game Over)'
    },
    playerclear: {
      path: 'assets/player/playerclear.jpg',
      cx: 0.5, cy: 0.42, size: 0.45, rotation: 0, flipX: false,
      overlay: { scaleWithHead: false },
      desc: 'Wave Clear Celebrate'
    },

    // Enemy Faces
    standard: {
      path: 'assets/enemies/standard.jpg',
      cx: 0.5, cy: 0.36, size: 0.56, rotation: 0, flipX: false,
      desc: 'Ok lng'
    },
    runner: {
      path: 'assets/enemies/runner.jpg',
      cx: 0.52, cy: 0.48, size: 0.56, rotation: 0, flipX: false,
      desc: 'Dagan'
    },
    sidestep: {
      path: 'assets/enemies/sidestep.jpg',
      cx: 0.49, cy: 0.41, size: 0.45, rotation: 0, flipX: false,
      desc: 'Dodgerist'
    },
    barrier: {
      path: 'assets/enemies/barrier.jpg',
      cx: 0.52, cy: 0.42, size: 0.45, rotation: 0, flipX: false,
      desc: 'Invulnerable barrier caster'
    },
    door: {
      path: 'assets/enemies/door.jpg',
      cx: 0.45, cy: 0.46, size: 0.46, rotation: 0, flipX: false,
      desc: 'Has a Door to shield (Dunno where the door from)'
    },
    sleep: {
      path: 'assets/enemies/sleep.jpg',
      cx: 0.45, cy: 0.48, size: 0.5, rotation: 0, flipX: true,
      overlay: { scaleWithHead: false },
      desc: 'Slow tanky snoozer'
    },
    enemy: {
      path: 'assets/enemies/enemy.jpg',
      cx: 0.5, cy: 0.42, size: 0.67, rotation: 0, flipX: false,
      overlay: { maxW: 96, maxH: 108, scaleWithHead: false },   // boss: about 20% bigger
      desc: 'Bossing every 5 waves (initial 10 HP, +5 every 5 waves)'
    }
  },

  // ==========================================================================
  // 6b. FULL-PHOTO OVERLAY: the whole photo is drawn over the stick figure.
  // mode: 'full' = whole photo over the body, 'head' = old circle on the head only.
  // maxW/maxH: size box in pixels (photo keeps its shape). ox/oy: move left-right / up-down.
  // radius: rounded corners. border: outline thickness. flip: mirror the photo.
  // scaleWithHead: bigger headRadius (like the boss) makes the photo bigger too.
  // Per-photo tweaks: add  overlay: { maxH: 120, oy: -40, flip: true }  to any entry in assets.
  // ==========================================================================
  overlay: {
    mode: 'full',
    storeHeight: 480,
    defaults: { maxW: 80, maxH: 90, ox: 0, oy: -30, radius: 14, border: 2.5, flip: false, scaleWithHead: true }
  },

  // 7. Enemy Archetypes & Behaviors (Enemies do not attack with bullets)
  enemyTypes: {
    // 1. Standard: Normal march towards player
    standard: {
      id: 'standard',
      name: 'Standard Runner',
      assetKey: 'standard',
      color: '#7a1f1f',
      lineWidth: 3.2,
      headRadius: 26,
      bodyTilt: 0,
      gunLength: 0,
      baseHp: 1,
      speed: 55,
      scoreValue: 10,
      minWave: 1
    },

    // 2. Runner: Walks normally, then SUDDENLY bursts into high-speed sprint!
    runner: {
      id: 'runner',
      name: 'Surprise Sprinter',
      assetKey: 'runner',
      color: '#e74c3c',
      lineWidth: 2.8,
      headRadius: 26,
      bodyTilt: 0.35,           // Deep forward sprint lean
      gunLength: 0,
      baseHp: 1,
      normalSpeed: 58,
      sprintSpeed: 145,         // Sudden 2.5x speed burst!
      sprintDistanceTrigger: 460,// X position where surprise sprint activates
      scoreValue: 20,
      minWave: 2
    },

    // 3. Sidestep: Dodges incoming bullets or changes lanes behind other enemies
    sidestep: {
      id: 'sidestep',
      name: 'Lane Dodger',
      assetKey: 'sidestep',
      color: '#0e8388',         // Neon Cyan
      lineWidth: 3.0,
      headRadius: 26,
      bodyTilt: 0.1,
      gunLength: 0,
      baseHp: 1,
      speed: 68,
      dodgeCooldown: 1.8,
      scoreValue: 25,
      minWave: 3
    },

    // 4. Barrier: Calls an invulnerable barrier, immobilized, shouting "NO!"
    barrier: {
      id: 'barrier',
      name: 'Barrier Defender',
      assetKey: 'barrier',
      color: '#f39c12',         // Golden Barrier Armor
      lineWidth: 3.5,
      headRadius: 27,
      bodyTilt: 0,
      gunLength: 0,
      baseHp: 1,
      speed: 48,
      barrierDuration: 2.7,     // Seconds invulnerable
      barrierCooldown: 5.2,     // Seconds between barrier activations
      scoreValue: 30,
      minWave: 6
    },

    // 5. Door: Enemy standing behind a 2 HP wooden door (door 2hp, unit 1hp)
    door: {
      id: 'door',
      name: 'Door Breaker',
      assetKey: 'door',
      color: '#8d6e63',         // Wood Door Brown
      lineWidth: 3.2,
      headRadius: 26,
      bodyTilt: 0,
      gunLength: 0,
      doorHp: 2,                // Absorbs 2 shots before shattering!
      baseHp: 1,                // Unit itself has 1 HP
      speed: 50,
      scoreValue: 35,
      minWave: 4
    },

    // 6. Sleep: Slow heavy unit with 5 HP, ZZZ animation, and snoring audio
    sleep: {
      id: 'sleep',
      name: 'Snoozer',
      assetKey: 'sleep',
      color: '#243342',         // Heavy Armor Charcoal
      lineWidth: 5.2,
      headRadius: 33,           // Giant snoozing bobblehead
      bodyTilt: -0.05,
      gunLength: 0,
      baseHp: 5,                // 5 HP tank!
      speed: 32,                // Very slow plodding
      scoreValue: 50,
      showHealthBar: true,
      minWave: 5
    },

    // 7. Enemy Boss: Appears every 5 waves (Wave 5, 10, 15, 20...)
    boss: {
      id: 'boss',
      name: 'Track Master Boss',
      assetKey: 'enemy',
      color: '#8e44ad',         // Royal Purple Aura
      lineWidth: 6.0,
      headRadius: 36,           // Massive boss bobblehead!
      bodyTilt: 0.05,
      gunLength: 0,
      baseHp: 10,               // 10 HP base (+5 per 5 waves)
      speed: 46,
      laneSwitchInterval: 1.8,  // Moves between lanes to tease
      teaseInterval: 3.2,       // Pauses, mocks, fake-charges
      scoreValue: 200,
      isBoss: true,
      showHealthBar: true
    }
  },

  // 8. Dynamic Difficulty Progression Curve
  difficulty: {
    baseWaveCount: 4,
    waveCountMultiplier: 1.5,
    maxActiveEnemies: 14,
    // Spawn pacing
    initialSpawnDelay: 1.4,
    minSpawnDelay: 0.38,
    spawnDecayPerWave: 0.05,
    // Wave 20+ "Near Impossible" parameters
    hardcoreSpeedBoost: 1.35,
    hardcoreSpawnInterval: 0.42
  },

  // 9. Visuals & Effects
  visuals: {
    textColor: '#ffffff',
    damageColor: '#e74c3c',
    shakeIntensity: 15,
    shakeDuration: 0.32,
    screenFlashDuration: 0.25,
    fxDuration: 0.95,
    sparksPerHit: 7
  },

  // 8b. BURST SKILL (press Q or the Burst button): hits every enemy on screen
  skill: {
    maxCharges: 3,
    startCharges: 1,          // charges at the start of a game
    damage: 3,                // damage to every normal enemy on screen
    bossDamage: 5,            // damage to bosses
    cooldown: 0.6,            // seconds between uses
    bossDropChance: 1,        // 1 = bosses always drop a charge
    enemyDropChance: 0.05,    // 0.05 = 5% from normal enemies (0 = never). Per enemy: add dropChance: 0.1 in enemyTypes
    pickupLifetime: 5,        // seconds before the pickup disappears
    pickupRadius: 30,         // how close you must stand (same lane) to grab it
    fullChargeBonus: 50,      // score if you grab one while already at max charges
    color: '#ffd026'
  },

  // 9b. Leaderboard (saved in this browser)
  leaderboard: { key: 'faceShooter.leaderboard.v1', size: 5, nameMax: 12 },

  // 10. Storage
  storage: {
    key: 'faceShooter.v7',
    thumbSize: 256,
    thumbQuality: 0.88
  }
};

// Helper: Calculate vertical center Y coordinate for a given lane index
function getLaneY(laneIndex) {
  return (
    CONFIG.world.laneTop +
    CONFIG.world.laneHeight * laneIndex +
    CONFIG.world.laneHeight / 2 +
    CONFIG.world.laneOffsetY
  );
}
