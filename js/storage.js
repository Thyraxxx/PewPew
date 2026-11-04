/* ==========================================================================
   Face Shooter - Asset Preloader & Interactive Face Storage
   Automatically preloads and crops player & enemy assets from assets/ folder.
   ========================================================================== */

const FaceStorage = {
  // Cropper state
  cropper: {
    active: false,
    img: null,
    scale: 1,
    rotation: 0,
    flipX: false,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    callback: null
  },

  // Generate cropped image from an asset definition
  cropAsset(assetDef, onComplete) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CONFIG.storage.thumbSize;
      canvas.height = CONFIG.storage.thumbSize;
      const ctx = canvas.getContext('2d');

      const outSize = CONFIG.storage.thumbSize;
      const outCenter = outSize / 2;

      ctx.translate(outCenter, outCenter);
      if (assetDef.rotation) ctx.rotate((assetDef.rotation * Math.PI) / 180);
      if (assetDef.flipX) ctx.scale(-1, 1);

      const minDim = Math.min(img.width, img.height);
      const cropW = minDim * assetDef.size;
      const cropH = minDim * assetDef.size;
      const cropX = img.width * assetDef.cx - cropW / 2;
      const cropY = img.height * assetDef.cy - cropH / 2;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, -outCenter, -outCenter, outSize, outSize);
      
      let croppedImg;
      let dataUrl = null;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', CONFIG.storage.thumbQuality);
        croppedImg = new Image();
        croppedImg.src = dataUrl;
      } catch (err) {
        // Page opened as file:// -> browser blocks toDataURL. Use the canvas itself instead.
        croppedImg = canvas;
        croppedImg.complete = true;
        croppedImg.naturalWidth = canvas.width;
      }

      // Keep a shrunken copy of the WHOLE photo for the overlay mode
      const sc = Math.min(1, CONFIG.overlay.storeHeight / img.height);
      const full = document.createElement('canvas');
      full.width = Math.round(img.width * sc);
      full.height = Math.round(img.height * sc);
      full.getContext('2d').drawImage(img, 0, 0, full.width, full.height);
      croppedImg.full = full;
      croppedImg.fullCfg = assetDef.overlay || null;

      // Release the big original photo right away (it can be 10+ MB decoded) so phones don't run out of memory
      img.onload = img.onerror = null;
      img.src = '';

      onComplete(croppedImg, dataUrl);
    };
    img.onerror = () => {
      console.warn('Could not load asset:', assetDef.path);
    };
    img.src = assetDef.path;
  },

  // ---- Custom photos: every default photo can be replaced, cropped, and saved in this browser
  custom: {},          // slotKey -> { head: dataUrl, full: dataUrl }
  pendingSlot: null,
  FRAME: 260,          // crop frame size (pixels) inside the 280px crop canvas
  slotKeys: {
    player: ['playerstare', 'playerbang', 'playerdone', 'playerclear'],
    enemy: ['standard', 'runner', 'sidestep', 'barrier', 'door', 'sleep', 'enemy']
  },

  loadCustom() {
    try {
      const s = JSON.parse(localStorage.getItem(CONFIG.storage.key) || '{}');
      this.custom = s && typeof s === 'object' ? s : {};
    } catch (err) { this.custom = {}; }
  },

  // Show a status line under the photo slots (red when something is wrong)
  say(text, bad) {
    const msg = $('msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = bad ? '#ff6b6b' : '';
    msg.style.fontWeight = bad ? '700' : '';
  },

  // True if this browser really keeps data between visits (private mode, in-app browsers
  // and some file:// setups silently throw it away)
  canPersist() {
    try {
      const t = CONFIG.storage.key + '.test';
      localStorage.setItem(t, '1');
      const ok = localStorage.getItem(t) === '1';
      localStorage.removeItem(t);
      return ok;
    } catch (err) { return false; }
  },

  saveCustom() {
    try {
      const data = JSON.stringify(this.custom);
      localStorage.setItem(CONFIG.storage.key, data);
      // Read it back to be sure it really stuck
      if (localStorage.getItem(CONFIG.storage.key) !== data) throw new Error('verify failed');
      this.say('Saved in this browser. Photos never leave your device.', false);
      return true;
    } catch (err) {
      this.say('NOT saved: this browser is blocking or has no room for storage (private mode, in-app browser, or full). The photo works until you close or reload the page.', true);
      return false;
    }
  },

  place(key, imgObj) {
    if (key.startsWith('player')) State.activeFaces.player[key.replace('player', '')] = imgObj;
    else State.activeFaces.enemies[key] = imgObj;
  },

  applySlot(key) {
    const def = CONFIG.assets[key];
    if (!def) return;
    const c = this.custom[key];
    if (c && c.head && c.full) {
      const head = new Image();
      const full = new Image();
      head.src = c.head;
      full.src = c.full;
      head.full = full;
      head.fullCfg = def.overlay || null;
      this.place(key, head);
    } else {
      this.cropAsset(def, imgObj => this.place(key, imgObj));
    }
  },

  loadAllAssets() {
    State.activeFaces = { player: { stare: null, bang: null, done: null, clear: null }, enemies: {} };
    this.slotKeys.player.concat(this.slotKeys.enemy).forEach(k => this.applySlot(k));
    this.renderSlots();
  },

  renderSlots() {
    const build = (id, keys) => {
      const box = $(id);
      if (!box) return;
      box.innerHTML = '';
      keys.forEach(k => {
        const def = CONFIG.assets[k];
        const c = this.custom[k];
        const d = document.createElement('div');
        d.className = 'slot';
        const im = document.createElement('img');
        im.src = c ? c.full : def.path;
        im.alt = k;
        const t = document.createElement('div');
        t.className = 'slot-name';
        t.textContent = def.desc;
        const b1 = document.createElement('button');
        b1.textContent = 'Change photo';
        b1.onclick = () => { this.pendingSlot = k; $('slot-file').click(); };
        d.append(im, t, b1);
        if (c) {
          const b2 = document.createElement('button');
          b2.textContent = 'Reset to default';
          b2.onclick = () => {
            delete this.custom[k];
            this.saveCustom();
            this.applySlot(k);
            this.renderSlots();
          };
          d.append(b2);
        }
        box.appendChild(d);
      });
    };
    build('slots-player', this.slotKeys.player);
    build('slots-enemy', this.slotKeys.enemy);
  },

  // ---- Cropper (rectangle crop: Portrait / Square / Landscape, drag + zoom + rotate + mirror)
  openCropper(fileOrImg, onComplete) {
    if (fileOrImg instanceof Image) {
      this.initCropSession(fileOrImg, onComplete);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => this.initCropSession(img, onComplete);
        img.src = reader.result;
      };
      reader.readAsDataURL(fileOrImg);
    }
  },

  frame() {
    const a = this.cropper.aspect, F = this.FRAME;
    return a <= 1 ? { w: F * a, h: F } : { w: F, h: F / a };
  },

  initCropSession(img, onComplete) {
    const c = this.cropper;
    c.active = true;
    c.img = img;
    c.callback = onComplete;
    c.rotation = 0;
    c.flipX = false;
    c.aspect = img.width > img.height ? 4 / 3 : 3 / 4;
    const modal = $('crop-modal');
    if (modal) modal.classList.remove('hidden');
    this.fitCrop();
  },

  fitCrop() {
    const c = this.cropper;
    if (!c.img) return;
    const f = this.frame();
    const s = Math.max(f.w / c.img.width, f.h / c.img.height);
    c.scale = s;
    c.offsetX = 0;
    c.offsetY = 0;
    const slider = $('crop-zoom');
    if (slider) {
      slider.min = (s * 0.5).toFixed(3);
      slider.max = (s * 4).toFixed(3);
      slider.step = '0.005';
      slider.value = s.toFixed(3);
    }
    this.renderCropCanvas();
  },

  renderCropCanvas() {
    const c = this.cropper;
    const canvas = $('crop-canvas');
    if (!canvas || !c.img) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((c.rotation * Math.PI) / 180);
    if (c.flipX) ctx.scale(-1, 1);
    const dw = c.img.width * c.scale, dh = c.img.height * c.scale;
    ctx.drawImage(c.img, c.offsetX - dw / 2, c.offsetY - dh / 2, dw, dh);
    ctx.restore();

    const f = this.frame();
    const fx = (w - f.w) / 2, fy = (h - f.h) / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(fx, fy, f.w, f.h);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#ffd026';
    ctx.lineWidth = 3;
    ctx.strokeRect(fx, fy, f.w, f.h);
  },

  applyCrop() {
    const c = this.cropper;
    if (!c.img) return;
    const f = this.frame();
    const k = Math.min(CONFIG.overlay.storeHeight, 480) / f.h;   // frame px -> output px
    const ow = Math.round(f.w * k), oh = Math.round(f.h * k);

    const cv = document.createElement('canvas');
    cv.width = ow;
    cv.height = oh;
    const x = cv.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, ow, oh);
    x.translate(ow / 2, oh / 2);
    x.rotate((c.rotation * Math.PI) / 180);
    if (c.flipX) x.scale(-1, 1);
    const dw = c.img.width * c.scale * k, dh = c.img.height * c.scale * k;
    x.drawImage(c.img, c.offsetX * k - dw / 2, c.offsetY * k - dh / 2, dw, dh);

    // Head version (used when overlay mode is 'head'): top square of the crop
    const side = Math.min(ow, oh), t = CONFIG.storage.thumbSize;
    const hc = document.createElement('canvas');
    hc.width = t;
    hc.height = t;
    hc.getContext('2d').drawImage(cv, (ow - side) / 2, oh > ow ? 0 : (oh - side) / 2, side, side, 0, 0, t, t);

    const q = CONFIG.storage.thumbQuality;
    const result = { full: cv.toDataURL('image/jpeg', q), head: hc.toDataURL('image/jpeg', q) };
    const cb = c.callback;
    this.closeCropper();
    if (cb) cb(result);
  },

  closeCropper() {
    const modal = $('crop-modal');
    if (modal) modal.classList.add('hidden');
    this.cropper.active = false;
    this.cropper.img = null;
  },

  setupCropperUI() {
    const canvas = $('crop-canvas');
    if (!canvas) return;
    const c = this.cropper;
    const ratio = () => canvas.width / (canvas.getBoundingClientRect().width || canvas.width);

    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      c.isDragging = true;
      c.startX = e.clientX - c.offsetX / ratio();
      c.startY = e.clientY - c.offsetY / ratio();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!c.isDragging) return;
      c.offsetX = (e.clientX - c.startX) * ratio();
      c.offsetY = (e.clientY - c.startY) * ratio();
      this.renderCropCanvas();
    });
    const endDrag = () => { c.isDragging = false; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    const slider = $('crop-zoom');
    if (slider) slider.oninput = e => { c.scale = parseFloat(e.target.value); this.renderCropCanvas(); };

    [['crop-ar-p', 3 / 4], ['crop-ar-s', 1], ['crop-ar-l', 4 / 3]].forEach(([id, a]) => {
      const b = $(id);
      if (b) b.onclick = () => { c.aspect = a; this.fitCrop(); };
    });

    const applyBtn = $('crop-apply');
    if (applyBtn) applyBtn.onclick = () => this.applyCrop();
    const cancelBtn = $('crop-cancel');
    if (cancelBtn) cancelBtn.onclick = () => this.closeCropper();
    const rotBtn = $('crop-rotate');
    if (rotBtn) rotBtn.onclick = () => { c.rotation = (c.rotation + 90) % 360; this.renderCropCanvas(); };
    const flipBtn = $('crop-flip');
    if (flipBtn) flipBtn.onclick = () => { c.flipX = !c.flipX; this.renderCropCanvas(); };
  },

  init() {
    this.setupCropperUI();
    this.loadCustom();
    this.loadAllAssets();
    if (!this.canPersist()) {
      this.say('Warning: this browser will not remember uploaded photos after reload (private mode, in-app browser, or blocked storage). Open the game in a normal Chrome/Safari tab.', true);
    }

    const fi = $('slot-file');
    if (fi) {
      fi.onchange = e => {
        const file = e.target.files[0];
        const key = this.pendingSlot;
        e.target.value = '';
        if (!file || !key) return;
        this.openCropper(file, res => {
          this.custom[key] = { head: res.head, full: res.full };
          this.saveCustom();
          this.applySlot(key);
          this.renderSlots();
        });
      };
    }

    const ra = $('reset-all');
    if (ra) ra.onclick = () => {
      if (!confirm('Reset all photos to the defaults?')) return;
      this.custom = {};
      try { localStorage.removeItem(CONFIG.storage.key); } catch (err) { /* ignore */ }
      this.loadAllAssets();
    };
  }
};
