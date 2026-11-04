# Face Shooter: where to change things

Everything lives in `js/config.js` unless noted. Save, refresh the page, test.

## Running it
Use a local server or a static host (GitHub Pages, Netlify). In the project folder run
`python3 -m http.server`, then open http://localhost:8000. Double-clicking index.html also
works now, but the saved-face thumbnail is skipped in that mode.

## Customizing photos in the game
Open "Customize Characters" under the controls. There is a slot for each of your 4 moods and each of the 7 enemies.
"Change photo" opens a crop box (Portrait / Square / Landscape, drag, zoom, rotate, mirror), then saves it in this browser.
"Reset to default" brings back the photo from the assets folder. Saved photos are kept in the browser's local storage.

## Leaderboard
Top 5 scores are saved in this browser. If your score makes the top 5 when you lose, a name box appears.
Change the size or name length in `leaderboard` (config.js). The Clear button wipes it.

## Photos (defaults in the assets folder)
- `assets` section: one entry per photo. `path` must be `assets/...` (NOT `../assets/...`).
- `cx, cy, size, rotation, flipX`: the HEAD circle crop (used when overlay mode is 'head').
- `overlay` section: `mode: 'full'` puts the whole photo over the stick figure, `'head'` goes back to the circle.
  - `maxW / maxH`: photo box size in pixels (the photo keeps its shape)
  - `ox / oy`: move photo left-right / up-down (more negative oy = higher)
  - `radius`: rounded corners, `border`: outline width, `flip`: mirror it
- One photo only: add `overlay: { maxH: 120, oy: -40 }` inside that photo's `assets` entry.

## Size of the game
- `world.width / world.height`: canvas size in pixels (now applied automatically).
- `world.laneHeight`, `laneCount`, `laneTop`: lane thickness, number of lanes, space between the scoreboard and lane 1
  (bigger laneTop = more room for tall photos on the top lane). Keep height about laneTop + laneCount * laneHeight + 40.
- `css/styles.css`: `.game-viewport` and `canvas#c` `max-width` = how big it shows on the page.
  The aspect ratio now follows world.width / world.height automatically.

## You
`player`: startX, speedX, maxXRatio (how far right you can go), maxHp, fireCooldown,
magazineSize, reloadDuration, hitboxRadius, looks.headRadius, looks.gunLength.
`bullets.player`: speed, width, height, color.

## Enemies
`enemyTypes.<name>`: baseHp, speed, headRadius, scoreValue, minWave (first wave it appears), color.

## Difficulty
`difficulty`: baseWaveCount, waveCountMultiplier, maxActiveEnemies, minSpawnDelay,
spawnDecayPerWave, hardcoreSpeedBoost (after wave 20).

## Look and effects
`theme` (colors), `camera` (shadows, lane marks), `visuals` (shake, flash, particles).
Sounds: `js/audio.js`, add your own files under `assets/audio/` and list them in that file.

## Fullscreen
`css/styles.css`: change `--fs-reserve` (near the bottom). It is the height kept free for the controls under the game.
The game always keeps its shape and grows until the width OR the height runs out. Smaller number = bigger game.
