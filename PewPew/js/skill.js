/* ==========================================================================
   Face Shooter - Burst Skill + Pickups
   - You start with CONFIG.skill.startCharges charge(s), max CONFIG.skill.maxCharges.
   - Press Q (or the Burst button) to hit every enemy on screen.
   - Bosses always drop a charge pickup, normal enemies rarely do.
   - Walk onto the pickup (same lane) before it disappears.
   ========================================================================== */

const Skill = {
  cd: 0,

  onNewGame() {
    State.pickups = [];
    this.cd = 0;
    this.updateUI();
  },

  // Fire the burst: damages every enemy currently on screen
  use() {
    const p = State.player;
    if (State.status !== 'play' || !p || p.charges <= 0 || this.cd > 0) return false;

    p.charges--;
    this.cd = CONFIG.skill.cooldown;
    State.screenShake = 0.3;
    State.effects.push({ k: 'burst', x: p.x, y: p.y, t: 0 });
    State.effects.push({ k: 'txt', x: p.x + 70, y: p.y - 60, s: 'BURST! ⚡', color: CONFIG.skill.color, t: 0 });
    if (Sound.playExplode) Sound.playExplode();

    const targets = State.enemies.filter(e => !e.dead && e.x < CONFIG.world.width);
    for (const e of targets) {
      const def = CONFIG.enemyTypes[e.typeId];
      EnemySystem.handleBulletHit(e, def && def.isBoss ? CONFIG.skill.bossDamage : CONFIG.skill.damage);
    }
    this.updateUI();
    return true;
  },

  // Called from EnemySystem.killEnemy
  maybeDrop(enemy, typeDef) {
    const chance = typeDef.isBoss ? CONFIG.skill.bossDropChance : (typeDef.dropChance ?? CONFIG.skill.enemyDropChance);
    if (Math.random() >= chance) return;
    // Keep it inside the area the player can actually reach
    const maxX = CONFIG.world.width * CONFIG.player.maxXRatio + CONFIG.skill.pickupRadius - 6;
    State.pickups.push({ lane: enemy.lane, x: Math.min(enemy.x, maxX), t: 0 });
  },

  update(dt) {
    if (this.cd > 0) this.cd -= dt;
    const p = State.player;
    const list = State.pickups || (State.pickups = []);
    for (const k of list) {
      k.t += dt;
      if (p && k.lane === p.lane && Math.abs(k.x - p.x) < CONFIG.skill.pickupRadius) {
        k.taken = true;
        if (p.charges < CONFIG.skill.maxCharges) {
          p.charges++;
          State.effects.push({ k: 'txt', x: k.x, y: getLaneY(k.lane) - 40, s: '+1 BURST ⚡', color: CONFIG.skill.color, t: 0 });
        } else {
          State.score += CONFIG.skill.fullChargeBonus;
          State.effects.push({ k: 'txt', x: k.x, y: getLaneY(k.lane) - 40, s: `+${CONFIG.skill.fullChargeBonus}`, color: CONFIG.skill.color, t: 0 });
        }
        if (Sound.playReload) Sound.playReload();
        this.updateUI();
      }
    }
    State.pickups = list.filter(k => !k.taken && k.t < CONFIG.skill.pickupLifetime);
  },

  renderPickups(ctx) {
    for (const k of State.pickups || []) {
      const life = CONFIG.skill.pickupLifetime - k.t;
      if (life < 1.5 && Math.floor(k.t * 8) % 2 === 0) continue;   // blink when about to vanish
      const x = k.x, y = getLaneY(k.lane) + 4 + Math.sin(k.t * 5) * 3, r = 15;
      ctx.save();
      ctx.shadowColor = CONFIG.skill.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = CONFIG.skill.color;
      ctx.lineWidth = 3;
      ctx.beginPath();   // countdown ring
      ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, life / CONFIG.skill.pickupLifetime));
      ctx.stroke();
      ctx.fillStyle = CONFIG.skill.color;   // lightning bolt
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 10);
      ctx.lineTo(x - 6, y + 2);
      ctx.lineTo(x - 1, y + 2);
      ctx.lineTo(x - 3, y + 10);
      ctx.lineTo(x + 6, y - 3);
      ctx.lineTo(x + 1, y - 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },

  // Small charge counter under the scoreboard
  renderHud(ctx) {
    const p = State.player;
    if (!p || State.status === 'idle') return;
    const y = CONFIG.world.laneTop - 22;
    ctx.save();
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('BURST [Q]', 10, y);
    for (let i = 0; i < CONFIG.skill.maxCharges; i++) {
      ctx.beginPath();
      ctx.arc(94 + i * 18, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = i < p.charges ? CONFIG.skill.color : 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
    ctx.restore();
  },

  updateUI() {
    const btn = $('skill-btn');
    if (!btn) return;
    const n = State.player ? State.player.charges : CONFIG.skill.startCharges;
    btn.textContent = `⚡ Burst (${n})`;
    btn.style.opacity = n > 0 ? '1' : '0.5';
  },

  init() {
    const btn = $('skill-btn');
    if (btn) {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        Sound.resumeContext();
        this.use();
      });
    }
    window.addEventListener('keydown', e => {
      if (e.target && e.target.type === 'text') return;
      if (e.key.toLowerCase() === 'q' && !e.repeat) this.use();
    });
    this.updateUI();
  }
};
