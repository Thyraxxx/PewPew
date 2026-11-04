/* ==========================================================================
   Face Shooter - Leaderboard (top 5, saved in this browser)
   After a defeat that makes the top 5, a name box appears.
   Change size / name length in CONFIG.leaderboard (config.js).
   ========================================================================== */

const Leaderboard = {
  load() {
    try {
      const a = JSON.parse(localStorage.getItem(CONFIG.leaderboard.key) || '[]');
      return Array.isArray(a)
        ? a.filter(x => x && typeof x.score === 'number').slice(0, CONFIG.leaderboard.size)
        : [];
    } catch (err) { return []; }
  },

  save(list) {
    try {
      localStorage.setItem(CONFIG.leaderboard.key, JSON.stringify(list));
    } catch (err) {
      console.warn('Could not save leaderboard', err);
    }
  },

  best() {
    const l = this.load();
    return l.length ? l[0].score : 0;
  },

  qualifies(score) {
    if (score <= 0) return false;
    const l = this.load();
    return l.length < CONFIG.leaderboard.size || score > l[l.length - 1].score;
  },

  add(name, score, wave) {
    const list = this.load();
    list.push({ name, score, wave, date: Date.now() });
    list.sort((a, b) => b.score - a.score || a.date - b.date);
    this.save(list.slice(0, CONFIG.leaderboard.size));
  },

  render() {
    const ol = $('lb-list');
    if (!ol) return;
    ol.innerHTML = '';
    const list = this.load();
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No scores yet. Be the first!';
      ol.appendChild(li);
    }
    list.forEach(e => {
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.textContent = e.name;
      const s = document.createElement('span');
      s.textContent = `${e.score} pts · wave ${e.wave}`;
      li.append(n, s);
      ol.appendChild(li);
    });
  },

  openModal(score, wave) {
    this.pending = { score, wave };
    const info = $('lb-info');
    if (info) info.textContent = `You reached wave ${wave} with ${score} points!`;
    const input = $('lb-name');
    if (input) {
      try { input.value = localStorage.getItem('faceShooter.lastName') || ''; } catch (err) { input.value = ''; }
      input.maxLength = CONFIG.leaderboard.nameMax;
    }
    const m = $('score-modal');
    if (m) m.classList.remove('hidden');
    setTimeout(() => input && input.focus(), 60);
  },

  closeModal() {
    const m = $('score-modal');
    if (m) m.classList.add('hidden');
    this.pending = null;
  },

  submit() {
    if (!this.pending) return;
    const input = $('lb-name');
    const name = ((input && input.value) || '').trim().slice(0, CONFIG.leaderboard.nameMax) || 'Player';
    try { localStorage.setItem('faceShooter.lastName', name); } catch (err) { /* ignore */ }
    this.add(name, this.pending.score, this.pending.wave);
    this.closeModal();
    this.render();
  },

  // Called by player.js when your HP hits 0
  onGameOver(score, wave) {
    State.highScore = Math.max(State.highScore, score);
    if (this.qualifies(score)) this.openModal(score, wave);
  },

  init() {
    State.highScore = this.best();
    this.render();
    const save = $('lb-save'), skip = $('lb-skip'), clear = $('lb-clear'), input = $('lb-name');
    if (save) save.onclick = () => this.submit();
    if (skip) skip.onclick = () => this.closeModal();
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') this.submit(); });
    if (clear) clear.onclick = () => {
      if (confirm('Clear the whole leaderboard?')) {
        this.save([]);
        State.highScore = 0;
        this.render();
      }
    };
  }
};
