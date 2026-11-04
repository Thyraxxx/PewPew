/* ==========================================================================
   Face Shooter - Input & Device Controller
   Features:
   - Full keyboard bindings: Arrows/WASD, Space (Fire), R (Manual Reload), F (Fullscreen)
   - Mobile controls: Left D-Pad, Right BANG trigger, RELOAD button, Auto-fire switch
   - Master volume slider handler
   ========================================================================== */

const Input = {
  keys: {
    left: false,
    right: false,
    fire: false
  },

  isMobile: false,

  detectDevice() {
    this.isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth <= 768
    );

    if (this.isMobile) {
      document.body.classList.add('is-mobile');
      document.body.classList.remove('is-desktop');
    } else {
      document.body.classList.add('is-desktop');
      document.body.classList.remove('is-mobile');
    }
  },

  toggleFullscreen() {
    const fsBtn = $('fs-btn');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        if (fsBtn) fsBtn.textContent = '⛶ Exit';
      }).catch(err => {
        console.warn('Fullscreen request blocked', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          if (fsBtn) fsBtn.textContent = '⛶ Fullscreen';
        });
      }
    }
  },

  bindHold(elementId, actionKey) {
    const el = $(elementId);
    if (!el) return;

    const start = e => {
      e.preventDefault();
      this.keys[actionKey] = true;
      Sound.resumeContext();
    };
    const end = () => {
      this.keys[actionKey] = false;
    };

    el.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt =>
      el.addEventListener(evt, end)
    );
  },

  init() {
    this.detectDevice();
    window.addEventListener('resize', () => this.detectDevice());

    // 1. Mobile Controls (Left Thumb = Movement / Right Thumb = Fire & Reload)
    this.bindHold('l', 'left');
    this.bindHold('r', 'right');
    this.bindHold('fire', 'fire');

    const upBtn = $('u');
    if (upBtn) {
      upBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        Sound.resumeContext();
        PlayerSystem.changeLane(-1);
      });
    }

    const downBtn = $('d');
    if (downBtn) {
      downBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        Sound.resumeContext();
        PlayerSystem.changeLane(1);
      });
    }

    // Mobile Reload button
    const reloadBtn = $('reload-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        Sound.resumeContext();
        PlayerSystem.startReload();
      });
    }

    // 2. Keyboard Listeners
    window.addEventListener('keydown', e => {
      if (e.target && e.target.type === 'text') return;   // typing a name
      const k = e.key.toLowerCase();
      Sound.resumeContext();

      // Lane changes (Up / Down)
      if (['arrowup', 'w'].includes(k) && !e.repeat) {
        PlayerSystem.changeLane(-1);
      }
      if (['arrowdown', 's'].includes(k) && !e.repeat) {
        PlayerSystem.changeLane(1);
      }

      // Horizontal movement (Left / Right)
      if (['arrowleft', 'a'].includes(k)) {
        this.keys.left = true;
      }
      if (['arrowright', 'd'].includes(k)) {
        this.keys.right = true;
      }

      // Shooting
      if (k === ' ') {
        this.keys.fire = true;
        e.preventDefault();
      }

      // Manual Reload (R key)
      if (k === 'r' && !e.repeat) {
        PlayerSystem.startReload();
      }

      // Fullscreen shortcut (F key)
      if (k === 'f' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
        this.toggleFullscreen();
      }

      if (k.startsWith('arrow')) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      if (e.target && e.target.type === 'text') return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(k)) this.keys.left = false;
      if (['arrowright', 'd'].includes(k)) this.keys.right = false;
      if (k === ' ') this.keys.fire = false;
    });

    // 3. Toolbar & Audio Controls
    const startBtn = $('go');
    if (startBtn) {
      startBtn.onclick = () => {
        Sound.resumeContext();
        Game.start();
      };
    }

    const fsBtn = $('fs-btn');
    if (fsBtn) {
      fsBtn.onclick = () => this.toggleFullscreen();
    }

    const sfxBtn = $('sfx-btn');
    if (sfxBtn) {
      sfxBtn.onclick = () => Sound.toggleMute();
    }

    const volSlider = $('volume-slider');
    if (volSlider) {
      volSlider.oninput = e => {
        Sound.setVolume(e.target.value);
      };
    }
  }
};
