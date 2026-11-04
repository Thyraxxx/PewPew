/* ==========================================================================
   Face Shooter - Visual Engine & Enemy Skill Renderers
   Features:
   - Reactive Player Faces: playerstare, playerbang, playerdone, playerclear
   - Tactical HUD: Ammo magazine counter, Reload progress gauge
   - Wooden Door Shield with crack effects (for door.jpg)
   - Glowing Barrier Bubble & Face Pop-Up (for barrier.jpg)
   - Drifting Animated ZZZ text particles (for sleep.jpg)
   - Boss Purple Aura & Boss Health Bar (for enemy.jpg)
   ========================================================================== */

const Animations = {
  sparks: [],

  addSparks(x, y, color = '#ffd026', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 70 + Math.random() * 150;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4
      });
    }
  },

  updateSparks(dt) {
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
  },

  renderSparks(ctx) {
    for (const s of this.sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // Draw procedural stick figure with dynamic KNEES, ELBOWS, and BOBBLEHEAD
  drawFigure(ctx, x, y, opts) {
    const {
      img = null,
      color = '#102e23',
      lineWidth = 3.5,
      dir = 1,
      phase = 0,
      recoil = 0,
      flash = 0,
      bodyTilt = 0,
      gunLength = 22,
      headRadius = 28,
      muzzleColor = '#ffd84a',
      hp = null,
      maxHp = null,
      showHealthBar = false,
      isIdle = false,
      flipHead = false,
      hideHeadImage = false,
      isBoss = false
    } = opts;

    const bodyColor = flash > 0 ? CONFIG.visuals.damageColor : color;

    // Full-photo overlay (CONFIG.overlay.mode === 'full'): whole photo sits over the stick figure
    const full = (CONFIG.overlay.mode === 'full' && !hideHeadImage && img && img.full && img.full.width) ? img.full : null;
    let fullTop = 0;
    let drawFull = () => { };
    if (full) {
      const oc = Object.assign({}, CONFIG.overlay.defaults, img.fullCfg || {});
      const k = oc.scaleWithHead ? headRadius / 26 : 1;
      const sc = Math.min((oc.maxW * k) / full.width, (oc.maxH * k) / full.height);
      const fw = full.width * sc, fh = full.height * sc;
      const bob = isIdle ? 0 : Math.abs(Math.sin(phase)) * 2.2;
      const fx = x + oc.ox, fy = y - bob + oc.oy;
      fullTop = fy - fh / 2;
      drawFull = () => {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate((isIdle ? 0 : Math.sin(phase) * 0.05 * dir) - recoil * 0.08 * dir + (flash > 0 ? Math.sin(flash * 35) * 0.12 : 0));
        if (oc.flip || flipHead) ctx.scale(-1, 1);
        const r = Math.min(oc.radius, fw / 2, fh / 2);
        ctx.beginPath();
        ctx.moveTo(-fw / 2 + r, -fh / 2);
        ctx.arcTo(fw / 2, -fh / 2, fw / 2, fh / 2, r);
        ctx.arcTo(fw / 2, fh / 2, -fw / 2, fh / 2, r);
        ctx.arcTo(-fw / 2, fh / 2, -fw / 2, -fh / 2, r);
        ctx.arcTo(-fw / 2, -fh / 2, fw / 2, -fh / 2, r);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.drawImage(full, -fw / 2, -fh / 2, fw, fh);
        if (flash > 0) { ctx.fillStyle = 'rgba(231,76,60,0.38)'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh); }
        ctx.restore();
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = oc.border;
        ctx.stroke();
        ctx.restore();
      };
    }

    ctx.save();

    // 1. Soft Ground Drop Shadow
    if (CONFIG.camera.showDropShadows) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 25, 20, 0.28)';
      ctx.beginPath();
      const shadowW = isBoss ? 30 : headRadius > 30 ? 24 : 18;
      ctx.ellipse(x, y + 26, shadowW, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Boss Purple Flame Aura
    if (isBoss) {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.12;
      ctx.fillStyle = 'rgba(142, 68, 173, 0.22)';
      ctx.beginPath();
      ctx.arc(x, y, 48 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Body Core Kinematics
    const walkBob = isIdle ? 0 : Math.abs(Math.sin(phase)) * 2.2;
    const hipY = y + 8 - walkBob;
    const hipX = x;
    const shoulderY = y - 14 - walkBob;
    const shoulderX = x + bodyTilt * 18 * dir;
    const groundY = y + 24;

    ctx.strokeStyle = bodyColor;
    ctx.fillStyle = bodyColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawJointedLimb = (startX, startY, jointX, jointY, endX, endY) => {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(jointX, jointY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    };

    // Leg Kinematics (Forward Knee Bending)
    const computeLegJoints = (cyclePhi, isBack) => {
      if (isIdle) {
        const offset = isBack ? -5 * dir : 5 * dir;
        return {
          footX: hipX + offset,
          footY: groundY,
          kneeX: hipX + offset * 0.5 + dir * 2,
          kneeY: (hipY + groundY) / 2
        };
      }

      const swing = Math.sin(cyclePhi) * 12 * dir;
      const isSwingingForward = Math.cos(cyclePhi) > 0;
      const lift = isSwingingForward ? Math.cos(cyclePhi) * 6.5 : 0;
      const footX = hipX + swing;
      const footY = groundY - lift;

      const kneeBend = dir * (4 + (lift > 1 ? 4.5 : 1));
      const kneeX = (hipX + footX) / 2 + kneeBend;
      const kneeY = (hipY + footY) / 2 - (lift > 1 ? 2.5 : 0);

      return { footX, footY, kneeX, kneeY };
    };

    // Draw Back Leg
    const backLeg = computeLegJoints(phase + Math.PI, true);
    ctx.save();
    ctx.strokeStyle = bodyColor;
    ctx.globalAlpha = 0.82;
    drawJointedLimb(hipX, hipY, backLeg.kneeX, backLeg.kneeY, backLeg.footX, backLeg.footY);
    ctx.beginPath();
    ctx.moveTo(backLeg.footX, backLeg.footY);
    ctx.lineTo(backLeg.footX + dir * 5, backLeg.footY);
    ctx.stroke();
    ctx.restore();

    // Draw Back Arm (Bracing weapon if present)
    if (gunLength > 0) {
      const gunGripX = shoulderX + dir * (gunLength * 0.5 - recoil * 4);
      const gunGripY = shoulderY + 8;
      const backElbowX = (shoulderX + gunGripX) / 2 - dir * 3;
      const backElbowY = (shoulderY + gunGripY) / 2 + 6;
      ctx.save();
      ctx.globalAlpha = 0.82;
      drawJointedLimb(shoulderX, shoulderY, backElbowX, backElbowY, gunGripX, gunGripY);
      ctx.restore();
    }

    // Draw Torso Spine
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    // Draw Front Leg
    const frontLeg = computeLegJoints(phase, false);
    drawJointedLimb(hipX, hipY, frontLeg.kneeX, frontLeg.kneeY, frontLeg.footX, frontLeg.footY);
    ctx.beginPath();
    ctx.moveTo(frontLeg.footX, frontLeg.footY);
    ctx.lineTo(frontLeg.footX + dir * 5, frontLeg.footY);
    ctx.stroke();

    if (full && gunLength > 0) drawFull();   // photo goes under the gun arm

    // Draw Front Arm & Gun (if player) or Runner arms (if enemy)
    if (gunLength > 0) {
      const gunTipX = shoulderX + dir * (gunLength - recoil * 6);
      const gunTipY = shoulderY + 6;
      const frontElbowX = (shoulderX + gunTipX) / 2 - dir * 2;
      const frontElbowY = (shoulderY + gunTipY) / 2 + 7 + recoil * 4;
      drawJointedLimb(shoulderX, shoulderY, frontElbowX, frontElbowY, gunTipX, gunTipY);
      ctx.fillRect(gunTipX - (dir > 0 ? 5 : 7), gunTipY - 3, 10, 5);

      // Muzzle Flash
      if (recoil > 0.45) {
        ctx.fillStyle = muzzleColor;
        ctx.beginPath();
        ctx.arc(gunTipX + dir * 14, gunTipY, 8 * recoil, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gunTipX + dir * 14, gunTipY, 4 * recoil, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bodyColor;
      }
    } else {
      // Natural running arms for enemies
      const armSwing = Math.sin(phase) * 10 * dir;
      const elbowX = shoulderX - armSwing * 0.5 + dir * 6;
      const elbowY = shoulderY + 8;
      const handX = shoulderX - armSwing + dir * 12;
      const handY = shoulderY + 12;
      drawJointedLimb(shoulderX, shoulderY, elbowX, elbowY, handX, handY);
    }
    if (full && gunLength <= 0) drawFull();

    // 4. Bobblehead (Springy Head)
    const headCenterX = shoulderX;
    const headCenterY = shoulderY - headRadius - 2;

    const walkTilt = isIdle ? 0 : Math.sin(phase) * 0.12 * dir;
    const recoilJolt = -recoil * 0.22 * dir;
    const damageWobble = flash > 0 ? Math.sin(flash * 35) * 0.35 : 0;
    const totalHeadAngle = walkTilt + recoilJolt + damageWobble;

    if (!full) {
      ctx.save();
      ctx.translate(headCenterX, headCenterY);
      ctx.rotate(totalHeadAngle);
      if (flipHead) ctx.scale(-1, 1);

      ctx.beginPath();
      ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
      ctx.clip();

      if (!hideHeadImage && img && img.complete && img.naturalWidth) {
        const squareSize = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - squareSize) / 2,
          (img.height - squareSize) / 2,
          squareSize,
          squareSize,
          -headRadius,
          -headRadius,
          headRadius * 2,
          headRadius * 2
        );
      } else {
        // Stylized Face
        ctx.fillStyle = '#f1c9a5';
        ctx.fillRect(-headRadius, -headRadius, headRadius * 2, headRadius * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-8, -4, 4, 4);
        ctx.fillRect(4, -4, 4, 4);
        ctx.fillRect(-6, 6, 12, 2.5);
      }
      ctx.restore();

      // Head border ring
      ctx.save();
      ctx.translate(headCenterX, headCenterY);
      ctx.rotate(totalHeadAngle);
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = Math.max(1, lineWidth * 0.10);
      ctx.beginPath();
      ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

    }

    // 5. Overhead Health Bar (for Tanks & Bosses)
    if (showHealthBar && hp !== null && maxHp !== null && maxHp > 1) {
      const barW = Math.max(44, headRadius * 1.5);
      const barH = isBoss ? 8 : 6;
      const barX = headCenterX - barW / 2;
      const barY = (full ? fullTop : headCenterY - headRadius) - 14;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpPercent = Math.max(0, hp / maxHp);
      ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }

    ctx.restore();
  },

  // Draw Wooden Door in front of Door enemies
  drawDoorShield(ctx, x, y, doorHp) {
    ctx.save();
    const doorW = 22;
    const doorH = 58;
    const doorX = x - 18;
    const doorY = y - 30;

    // Wooden door slab
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(doorX, doorY, doorW, doorH);

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door window / peephole
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(doorX + 3, doorY + 6, doorW - 6, 16);
    ctx.strokeRect(doorX + 3, doorY + 6, doorW - 6, 16);

    // Door knob
    ctx.fillStyle = '#ffd026';
    ctx.beginPath();
    ctx.arc(doorX + 5, doorY + 34, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cracks if door is damaged (doorHp === 1)
    if (doorHp === 1) {
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(doorX + 2, doorY + 12);
      ctx.lineTo(doorX + 10, doorY + 22);
      ctx.lineTo(doorX + 6, doorY + 38);
      ctx.lineTo(doorX + 16, doorY + 48);
      ctx.stroke();
    }

    ctx.restore();
  },

  // Draw Glowing Barrier Shield for Barrier enemies
  drawBarrierShield(ctx, x, y) {
    ctx.save();
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.08;

    // Glowing energy wall
    ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 6, 26 * pulse, 38 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd026';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Barrier label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHIELDED', x - 6, y - 48);
    ctx.restore();
  },

  // Particle / Floating Score & ZZZ Effects
  renderEffect(ctx, effect) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - effect.t / CONFIG.visuals.fxDuration);

    if (effect.k === 'die') {
      ctx.translate(
        effect.x + effect.t * 50,
        effect.y + 24 - Math.sin(Math.min(effect.t, 0.5) * 6.28) * 22
      );
      ctx.rotate(Math.min(effect.t * 5.5, 1.8));

      this.drawFigure(ctx, 0, -24, {
        img: effect.img,
        color: effect.color || CONFIG.enemyTypes.standard.color,
        lineWidth: effect.lineWidth || 3,
        dir: -1,
        flash: effect.t < 0.1 ? 1 : 0
      });
    } else if (effect.k === 'txt') {
      ctx.fillStyle = effect.color || '#ffd026';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(effect.s, effect.x, effect.y - effect.t * 45);
    } else if (effect.k === 'burst') {
      // Golden shockwave sweeping across every lane
      const W = CONFIG.world.width;
      const top = CONFIG.world.laneTop + CONFIG.world.laneOffsetY;
      const h = CONFIG.world.laneHeight * CONFIG.world.laneCount;
      const fx = effect.x + (W - effect.x + 90) * Math.min(1, effect.t / 0.45);
      const grad = ctx.createLinearGradient(fx - 110, 0, fx, 0);
      grad.addColorStop(0, 'rgba(255, 208, 38, 0)');
      grad.addColorStop(1, 'rgba(255, 244, 170, 0.9)');
      ctx.globalAlpha = Math.max(0, 1 - effect.t / 0.6);
      ctx.fillStyle = grad;
      ctx.fillRect(fx - 110, top, 110, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - 3, top, 3, h);
    } else if (effect.k === 'zzz') {
      // Drifting cartoon ZZZ
      ctx.fillStyle = '#64b5f6';
      ctx.font = 'bold 16px monospace, sans-serif';
      const waveX = effect.x + Math.sin(effect.t * 6) * 10;
      const waveY = effect.y + effect.vy * effect.t;
      ctx.fillText('Z', waveX, waveY);
    }

    ctx.restore();
  },

  // Render the School Sports Field / Running Track
  renderSportsField(ctx) {
    // 1. School Grass Sideline
    ctx.fillStyle = CONFIG.theme.grassBorder;
    ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);

    // 2. 5 Terracotta sprint lanes
    for (let i = 0; i < CONFIG.world.laneCount; i++) {
      const laneY = CONFIG.world.laneTop + CONFIG.world.laneHeight * i + CONFIG.world.laneOffsetY;

      ctx.fillStyle = i % 2 === 0 ? CONFIG.theme.trackEven : CONFIG.theme.trackOdd;
      ctx.fillRect(0, laneY, CONFIG.world.width, CONFIG.world.laneHeight);

      // White Chalk Track Dividers
      ctx.fillStyle = CONFIG.theme.trackLines;
      ctx.fillRect(0, laneY + CONFIG.world.laneHeight - 2, CONFIG.world.width, 2.5);

      // Painted White Sprint Lane Numbers
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 32px monospace, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), 22, laneY + CONFIG.world.laneHeight * 0.7);

      // Lane dash markers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let sx = 55; sx < CONFIG.world.width; sx += 48) {
        ctx.fillRect(sx, laneY + CONFIG.world.laneHeight / 2 - 1, 16, 2);
      }
      ctx.restore();
    }

    // Gold field boundary line
    ctx.fillStyle = CONFIG.theme.sidelineLine;
    ctx.fillRect(0, CONFIG.world.laneTop + 4, CONFIG.world.width, 2);
  },

  // Ultra-Visible Stadium Scoreboard with AMMO Counter & Health
  renderScoreboard(ctx) {
    const barHeight = 44;

    ctx.fillStyle = CONFIG.theme.scoreboardBg;
    ctx.fillRect(0, 0, CONFIG.world.width, barHeight);

    ctx.fillStyle = CONFIG.theme.scoreboardBorder;
    ctx.fillRect(0, barHeight - 2.5, CONFIG.world.width, 2.5);

    ctx.textBaseline = 'middle';
    const textY = barHeight / 2;

    // 1. Score Badge
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#a0b5a8';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 10, textY);

    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.fillStyle = '#ffd026';
    ctx.fillText(`${State.score}`, 62, textY);

    // 2. Wave Pill Badge
    const waveBadgeX = 145;
    ctx.fillStyle = '#1e3829';
    ctx.fillRect(waveBadgeX, 8, 80, 28);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(waveBadgeX, 8, 80, 28);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${State.wave}`, waveBadgeX + 40, textY);

    // 3. Ammo / Reload Gauge
    if (State.player) {
      const ammoX = 245;
      if (State.player.isReloading) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('RELOADING... ⏳', ammoX, textY);
      } else {
        ctx.fillStyle = '#a0b5a8';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('AMMO', ammoX, textY);

        // Ammo bullet pips
        for (let b = 0; b < State.player.maxAmmo; b++) {
          ctx.fillStyle = b < State.player.ammo ? '#ffd026' : '#44554b';
          ctx.fillRect(ammoX + 46 + b * 11, textY - 8, 7, 16);
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1;
          ctx.strokeRect(ammoX + 46 + b * 11, textY - 8, 7, 16);
        }
      }
    }

    // 4. Large Ruby Hearts (HP)
    if (State.player) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a0b5a8';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('HP', CONFIG.world.width - 120, textY);

      const hearts = '♥'.repeat(Math.max(0, State.player.hp));
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = State.player.hp <= 1 ? '#ff1e1e' : '#ff3838';
      ctx.shadowColor = 'rgba(255, 56, 56, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(hearts, CONFIG.world.width - 12, textY + 1);
      ctx.shadowBlur = 0;
    }

    ctx.textBaseline = 'alphabetic';
  },

  // Master Scene Rendering
  renderScene() {
    const ctx = State.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(State.renderScale, 0, 0, State.renderScale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Screen Shake Translation
    if (State.screenShake > 0) {
      const shakeAmt = (Math.random() - 0.5) * CONFIG.visuals.shakeIntensity * State.screenShake;
      ctx.translate(shakeAmt, shakeAmt);
    }

    // 2. Render Sports Track
    this.renderSportsField(ctx);

    // 3. Gameplay Objects
    if (State.status !== 'idle') {
      // Player Bullets (Glowing Golden Lasers)
      for (const bullet of State.playerBullets) {
        const y = getLaneY(bullet.lane) - 8;
        ctx.fillStyle = CONFIG.bullets.player.trailColor;
        ctx.fillRect(bullet.x - 30, y + 1, 30, 2);
        ctx.fillStyle = CONFIG.bullets.player.color;
        ctx.fillRect(bullet.x, y, CONFIG.bullets.player.width, CONFIG.bullets.player.height);
      }

      // Hit Spark Particles
      this.renderSparks(ctx);

      // Effects (Tumbling ragdolls, floating text, ZZZ particles)
      for (const effect of State.effects) {
        if (effect.k === 'die') this.renderEffect(ctx, effect);   // tumbling ragdolls stay under the figures
      }

      // Enemies (Sorted by lane for proper depth)
      const sortedEnemies = [...State.enemies].sort((a, b) => a.lane - b.lane);
      for (const enemy of sortedEnemies) {
        const typeDef = CONFIG.enemyTypes[enemy.typeId] || CONFIG.enemyTypes.standard;

        // Barrier enemy: image only pops up during skill usage!
        const hideHead = false;

        this.drawFigure(ctx, enemy.x, enemy.y || getLaneY(enemy.lane), {
          img: enemy.img,
          color: typeDef.color,
          lineWidth: typeDef.lineWidth,
          headRadius: typeDef.headRadius || 26,
          bodyTilt: typeDef.bodyTilt,
          gunLength: 0,
          dir: -1,
          phase: enemy.ph || 0,
          recoil: 0,
          flash: enemy.fl || 0,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          showHealthBar: typeDef.showHealthBar || false,
          isIdle: enemy.isBarrierActive,
          flipHead: (enemy.typeId === 'sleep'),
          hideHeadImage: hideHead,
          isBoss: enemy.isBoss
        });

        // Draw Wooden Door in front of Door enemies
        if (enemy.typeId === 'door' && enemy.doorHp > 0) {
          this.drawDoorShield(ctx, enemy.x, enemy.y || getLaneY(enemy.lane), enemy.doorHp);
        }

        // Draw Glowing Barrier Shield when Barrier skill active
        if (enemy.isBarrierActive) {
          this.drawBarrierShield(ctx, enemy.x, enemy.y || getLaneY(enemy.lane));
        }
      }

      // Player with Reactive Face
      if (State.player) {
        const isPlayerIdle = !Input.keys.left && !Input.keys.right && Math.abs(getLaneY(State.player.lane) - State.player.y) <= 3;
        const currentHeroFace = PlayerSystem.getCurrentFace();

        this.drawFigure(ctx, State.player.x, State.player.y, {
          img: currentHeroFace,
          color: CONFIG.player.looks.bodyColor,
          lineWidth: CONFIG.player.looks.lineWidth,
          headRadius: CONFIG.player.looks.headRadius,
          gunLength: CONFIG.player.looks.gunLength,
          muzzleColor: CONFIG.player.looks.muzzleFlashColor,
          dir: 1,
          phase: State.player.ph,
          recoil: State.player.rec,
          flash: State.player.fl,
          isIdle: isPlayerIdle,
          flipHead: false
        });
      }

      Skill.renderPickups(ctx);

      // Text (DOOR BROKEN, +score, NO!) and ZZZ are drawn last so they sit OVER every figure
      for (const effect of State.effects) {
        if (effect.k !== 'die') this.renderEffect(ctx, effect);
      }
    }

    // 4. Scoreboard Header
    this.renderScoreboard(ctx);
    Skill.renderHud(ctx);

    // 5. Overlays (Ready?, Game Over, Next Wave)
    if (State.status !== 'play') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 44, CONFIG.world.width, CONFIG.world.height - 44);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText(
        State.status === 'over' ? 'GAME OVER!' : 'TRACK DEFENSE READY?',
        CONFIG.world.width / 2,
        CONFIG.world.height / 2 - 10
      );

      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(
        State.status === 'over'
          ? `You sprinted to Wave ${State.wave} with ${State.score} points!`
          : 'Tap Start to run. Do not let enemies past your line!',
        CONFIG.world.width / 2,
        CONFIG.world.height / 2 + 22
      );
      ctx.textAlign = 'left';
    } else if (State.enemiesLeftToSpawn === 0 && State.enemies.length === 0) {
      ctx.fillStyle = '#ffd026';
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillText(
        (State.wave % 5 === 0) ? `BOSS APPROACHING! ⚠️` : `WAVE ${State.wave + 1} APPROACHING!`,
        CONFIG.world.width / 2,
        CONFIG.world.height / 2
      );
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // 6. Red Hurt Screen Flash
    if (State.screenFlash > 0) {
      ctx.fillStyle = `rgba(231, 76, 60, ${State.screenFlash * 1.3})`;
      ctx.fillRect(-10, -10, CONFIG.world.width + 20, CONFIG.world.height + 20);
    }

    ctx.restore();
  }
};
