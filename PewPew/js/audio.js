/* ==========================================================================
   Face Shooter - Audio System with Sound Adjuster & Custom File Routing
   Features:
   - Master volume slider adjuster
   - Dedicated cartoon meme SFX:
     * Runner heavy breathing / panting
     * Sleep snoring (HONK-SHOO / ZZZ)
     * Barrier comical "NO!" shout
     * Door wooden thuds & door shattering crash
     * Boss teasing laugh & taunts
     * Gun reload single crisp mechanical action
     * Wave clear celebration fanfare
   - Custom Audio File Routing hook (drop in your own audio anytime!)
   ========================================================================== */

const Sound = {
  ctx: null,
  masterGain: null,
  enabled: true,
  volume: 0.7,

  // ==========================================================================
  // CUSTOM AUDIO FILE ROUTING REGISTRY
  // To use your own recorded/downloaded sound files, specify their path below!
  // Example: shoot: 'assets/audio/pew.mp3'
  // If set to null, the game will automatically use the built-in procedural synth.
  // ==========================================================================
  customAudio: {
    shoot: null,          // e.g. 'assets/audio/shoot.mp3'
    reload: null,         // e.g. 'assets/audio/reload.mp3'
    emptyClip: null,      // e.g. 'assets/audio/click.mp3'
    runnerPant: null,     // e.g. 'assets/audio/pant.mp3'
    sleepSnore: null,     // e.g. 'assets/audio/snore.mp3'
    barrierShout: null,   // e.g. 'assets/audio/no.mp3'
    doorHit: null,        // e.g. 'assets/audio/wood_hit.mp3'
    doorBreak: null,      // e.g. 'assets/audio/wood_break.mp3'
    bossTaunt: null,      // e.g. 'assets/audio/boss_laugh.mp3'
    celebrate: null,      // e.g. 'assets/audio/cheer.mp3'
    hurt: null            // e.g. 'assets/audio/oof.mp3'
  },

  _audioElements: {},

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  },

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Master Volume Adjuster (0.0 to 1.0)
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  },

  toggleMute() {
    this.enabled = !this.enabled;
    const btn = $('sfx-btn');
    if (btn) {
      btn.textContent = this.enabled ? '🔊 Sound' : '🔇 Muted';
      btn.classList.toggle('active', this.enabled);
    }
    return this.enabled;
  },

  _playCustom(key) {
    const src = this.customAudio[key];
    if (!src || !this.enabled) return false;

    if (!this._audioElements[key]) {
      this._audioElements[key] = new Audio(src);
    }
    const audio = this._audioElements[key];
    audio.volume = this.volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return true;
  },

  // 1. Player Shoot (Cartoon Laser)
  playShoot() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('shoot')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);
    osc.frequency.linearRampToValueAtTime(450, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.16);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  },

  // 2. Gun Reload Action: Single crisp mechanical "CH-CLACK" (Plays ONCE per reload)
  playReload() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('reload')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;

    // Part 1: Magazine slide insertion ("CH-")
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(360, t);
    osc1.frequency.exponentialRampToValueAtTime(120, t + 0.07);
    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Part 2: Slide snap lock ("-CLACK")
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(780, t + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(240, t + 0.17);
    gain2.gain.setValueAtTime(0.28, t + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.17);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.09);
    osc2.stop(t + 0.18);
  },

  // 3. Empty Clip Click (Out of ammo)
  playEmptyClip() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('emptyClip')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  },

  // 4. Runner Heavy Breathing / Panting ("huh-huh-huh")
  playRunnerPant() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('runnerPant')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    [0, 0.12, 0.24].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t + offset);
      osc.frequency.exponentialRampToValueAtTime(180, t + offset + 0.09);

      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + offset);
      osc.stop(t + offset + 0.1);
    });
  },

  // 5. Sleep Snore ("HONK-SHOOOO / ZZZ")
  playSleepSnore() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('sleepSnore')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.linearRampToValueAtTime(160, t + 0.25);
    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.26);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.26);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(420, t + 0.26);
    osc2.frequency.exponentialRampToValueAtTime(160, t + 0.55);
    gain2.gain.setValueAtTime(0.18, t + 0.26);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.26);
    osc2.stop(t + 0.55);
  },

  // 6. Barrier Shouts "NO!" Comical Denial
  playBarrierShout() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('barrierShout')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  },

  // 7. Wooden Door Hit ("THUD")
  playDoorHit() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('doorHit')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  },

  // 8. Wooden Door Shatter ("CRASH")
  playDoorBreak() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('doorBreak')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    [220, 340, 520, 140].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(40, t + i * 0.03 + 0.18);

      gain.gain.setValueAtTime(0.25, t + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.03 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.03);
      osc.stop(t + i * 0.03 + 0.2);
    });
  },

  // 9. Boss Teasing Laugh ("HE-HE-HE-HA!")
  playBossTaunt() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('bossTaunt')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    [320, 390, 320, 480].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.11);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + idx * 0.11 + 0.09);

      gain.gain.setValueAtTime(0.25, t + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.11 + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.11);
      osc.stop(t + idx * 0.11 + 0.1);
    });
  },

  // 10. Wave Clear Celebration (Triumphant fanfare)
  playCelebrate() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('celebrate')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.28, t + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.35);
    });
  },

  // 11. Generic Hit & Hurt
  playHit() {
    if (!this.enabled || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  },

  playExplode() {
    if (!this.enabled || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  },

  playPlayerHurt() {
    if (!this.enabled || !this.ctx) return;
    if (this._playCustom('hurt')) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }
};
