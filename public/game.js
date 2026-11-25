// NEON ROGUE // Cyberpunk Roguelike Engine
(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    play(type) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.05);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.15);
      } else if (type === 'item') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(660, t + 0.06);
        osc.frequency.setValueAtTime(880, t + 0.12);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.2);
      } else if (type === 'stairs') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.3);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.35);
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }

  const sound = new SoundEngine();
  const canvas = document.getElementById('dungeon-canvas');
  const ctx = canvas.getContext('2d');

  const MAP_W = 48;
  const MAP_H = 32;
  const TILE_SIZE = 24;

  let dungeon = [];
  let discovered = [];
  let visible = [];

  let player = {
    x: 0, y: 0,
    hp: 100, maxHp: 100,
    energy: 50, maxEnergy: 50,
    shield: 25, maxShield: 25,
    attack: 14,
    nanites: 2,
    emp: 1,
    floor: 1,
    score: 0,
    alive: true
  };

  let enemies = [];
  let items = [];
  let stairs = { x: 0, y: 0 };
  let particles = [];

  // --- RESIZE CANVAS ---
  function resize() {
    canvas.width = MAP_W * TILE_SIZE;
    canvas.height = MAP_H * TILE_SIZE;
    render();
  }
  window.addEventListener('resize', resize);

  // --- PROCEDURAL DUNGEON GENERATOR ---
  function generateDungeon() {
    dungeon = [];
    discovered = [];
    visible = [];

    // Fill with walls (1 = wall, 0 = floor)
    for (let y = 0; y < MAP_H; y++) {
      const dRow = [], discRow = [], visRow = [];
      for (let x = 0; x < MAP_W; x++) {
        dRow.push(1);
        discRow.push(false);
        visRow.push(false);
      }
      dungeon.push(dRow);
      discovered.push(discRow);
      visible.push(visRow);
    }

    const rooms = [];
    const maxRooms = 8 + player.floor;
    for (let i = 0; i < maxRooms; i++) {
      const w = Math.floor(Math.random() * 6) + 5;
      const h = Math.floor(Math.random() * 5) + 4;
      const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;

      // Carve room
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          dungeon[ry][rx] = 0;
        }
      }

      // Connect with previous room via corridor
      if (rooms.length > 0) {
        const prev = rooms[rooms.length - 1];
        const cx1 = Math.floor(x + w / 2);
        const cy1 = Math.floor(y + h / 2);
        const cx2 = Math.floor(prev.x + prev.w / 2);
        const cy2 = Math.floor(prev.y + prev.h / 2);

        // Horizontal corridor
        const minX = Math.min(cx1, cx2);
        const maxX = Math.max(cx1, cx2);
        for (let cx = minX; cx <= maxX; cx++) dungeon[cy1][cx] = 0;

        // Vertical corridor
        const minY = Math.min(cy1, cy2);
        const maxY = Math.max(cy1, cy2);
        for (let cy = minY; cy <= maxY; cy++) dungeon[cy][cx2] = 0;
      }

      rooms.push({ x, y, w, h });
    }

    // Place Player in room 0
    player.x = Math.floor(rooms[0].x + rooms[0].w / 2);
    player.y = Math.floor(rooms[0].y + rooms[0].h / 2);

    // Place Stairs in last room
    const lastRoom = rooms[rooms.length - 1];
    stairs.x = Math.floor(lastRoom.x + lastRoom.w / 2);
    stairs.y = Math.floor(lastRoom.y + lastRoom.h / 2);

    // Spawn Enemies and Items
    enemies = [];
    items = [];
    for (let r = 1; r < rooms.length; r++) {
      const rm = rooms[r];
      // 1-2 enemies per room
      const enemyCount = Math.floor(Math.random() * 2) + 1;
      for (let k = 0; k < enemyCount; k++) {
        const ex = rm.x + Math.floor(Math.random() * (rm.w - 1)) + 1;
        const ey = rm.y + Math.floor(Math.random() * (rm.h - 1)) + 1;
        if (dungeon[ey][ex] === 0) {
          enemies.push({
            x: ex, y: ey,
            name: (Math.random() < 0.4) ? 'Stalker Drone' : 'Sentry Mk.II',
            hp: 20 + player.floor * 6,
            maxHp: 20 + player.floor * 6,
            attack: 8 + player.floor * 3,
            color: (Math.random() < 0.4) ? '#ff007f' : '#ff3344'
          });
        }
      }

      // Loot chest / item
      if (Math.random() < 0.5) {
        items.push({
          x: rm.x + 1, y: rm.y + 1,
          type: Math.random() < 0.5 ? 'nanite' : 'emp',
          name: Math.random() < 0.5 ? 'Nanite Injector' : 'EMP Cell'
        });
      }
    }

    computeFOV();
  }

  // --- FIELD OF VIEW (RAYCASTING FOV) ---
  function computeFOV() {
    const RADIUS = 7;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        visible[y][x] = false;
      }
    }

    for (let angle = 0; angle < 360; angle += 4) {
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      let cx = player.x + 0.5;
      let cy = player.y + 0.5;

      for (let step = 0; step < RADIUS; step++) {
        const tx = Math.floor(cx);
        const ty = Math.floor(cy);
        if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
          visible[ty][tx] = true;
          discovered[ty][tx] = true;
          if (dungeon[ty][tx] === 1) break;
        }
        cx += dx;
        cy += dy;
      }
    }
  }

  // --- COMBAT & MOVEMENT ---
  function movePlayer(dx, dy) {
    if (!player.alive) return;
    sound.init();

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return;
    if (dungeon[ny][nx] === 1) return; // Wall

    // Check Enemy Attack
    const targetEnemy = enemies.find(e => e.x === nx && e.y === ny);
    if (targetEnemy) {
      attackEnemy(targetEnemy);
    } else {
      player.x = nx;
      player.y = ny;
      sound.play('step');

      // Check item pickup
      const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
      if (itemIdx !== -1) {
        const it = items[itemIdx];
        if (it.type === 'nanite') player.nanites++;
        else player.emp++;
        addLog(`Acquired ${it.name}!`, 'text-cyan');
        sound.play('item');
        items.splice(itemIdx, 1);
        updateUI();
      }

      // Check stairs
      if (player.x === stairs.x && player.y === stairs.y) {
        descendFloor();
        return;
      }
    }

    computeFOV();
    enemyTurns();
    updateUI();
    render();
  }

  function attackEnemy(enemy) {
    const dmg = player.attack + Math.floor(Math.random() * 5);
    enemy.hp -= dmg;
    sound.play('hit');
    addLog(`You strike ${enemy.name} for ${dmg} DMG!`, 'text-yellow');

    spawnSpark(enemy.x, enemy.y, '#00f3ff');

    if (enemy.hp <= 0) {
      addLog(`Defeated ${enemy.name}! +150 EXP`, 'text-green');
      player.score += 150 * player.floor;
      enemies = enemies.filter(e => e !== enemy);
    }
  }

  function enemyTurns() {
    enemies.forEach(e => {
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < 6) {
        if (dist <= 1.5) {
          // Attack player
          const rawDmg = e.attack;
          let actualDmg = rawDmg;
          if (player.shield > 0) {
            const absorbed = Math.min(player.shield, actualDmg);
            player.shield -= absorbed;
            actualDmg -= absorbed;
          }
          player.hp -= actualDmg;
          sound.play('hit');
          addLog(`${e.name} strikes you for ${rawDmg} DMG!`, 'text-red');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath(e.name);
          }
        } else {
          // Step towards player
          const stepX = e.x < player.x ? 1 : (e.x > player.x ? -1 : 0);
          const stepY = e.y < player.y ? 1 : (e.y > player.y ? -1 : 0);
          if (dungeon[e.y + stepY]?.[e.x + stepX] === 0) {
            e.x += stepX;
            e.y += stepY;
          }
        }
      }
    });
  }

  function descendFloor() {
    player.floor++;
    player.score += 500;
    sound.play('stairs');
    addLog(`Descending to Floor ${player.floor}... Mainframe temperature dropping.`, 'text-cyan');
    generateDungeon();
    updateUI();
    render();
  }

  function triggerDeath(killer) {
    player.alive = false;
    document.getElementById('death-cause').textContent = `Eliminated by ${killer} on Floor ${player.floor}.`;
    document.getElementById('death-score').textContent = player.score;
    document.getElementById('death-floors').textContent = player.floor;
    document.getElementById('death-screen').classList.add('active');
  }

  function useActiveItem() {
    if (player.nanites > 0) {
      player.nanites--;
      player.hp = Math.min(player.maxHp, player.hp + 45);
      sound.play('item');
      addLog('Nanite injector deployed. +45 HP!', 'text-green');
      updateUI();
      render();
    } else if (player.emp > 0) {
      player.emp--;
      sound.play('hit');
      enemies.forEach(e => {
        if (Math.hypot(e.x - player.x, e.y - player.y) < 6) {
          e.hp -= 35;
        }
      });
      enemies = enemies.filter(e => e.hp > 0);
      addLog('EMP Shockwave cleared nearby hostiles!', 'text-cyan');
      updateUI();
      render();
    }
  }

  // --- RENDERING ---
  function render() {
    ctx.fillStyle = '#020307';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!discovered[y][x]) continue;

        const isVis = visible[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (dungeon[y][x] === 1) {
          // Wall
          ctx.fillStyle = isVis ? '#141c2b' : '#080c14';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = isVis ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)';
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        } else {
          // Floor
          ctx.fillStyle = isVis ? '#080a14' : '#040508';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = isVis ? 'rgba(0, 243, 255, 0.08)' : 'transparent';
          ctx.fillRect(px + 10, py + 10, 4, 4);
        }

        // Draw Stairs
        if (x === stairs.x && y === stairs.y && isVis) {
          ctx.fillStyle = '#ffee00';
          ctx.font = 'bold 18px Fira Code';
          ctx.fillText('▼', px + 4, py + 18);
        }

        // Draw Items
        if (isVis) {
          const it = items.find(i => i.x === x && i.y === y);
          if (it) {
            ctx.fillStyle = '#00f3ff';
            ctx.font = 'bold 16px Fira Code';
            ctx.fillText('◆', px + 5, py + 17);
          }
        }
      }
    }

    // Draw Enemies in FOV
    enemies.forEach(e => {
      if (visible[e.y][e.x]) {
        ctx.fillStyle = e.color;
        ctx.font = 'bold 18px Fira Code';
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
        ctx.fillText('§', e.x * TILE_SIZE + 4, e.y * TILE_SIZE + 18);
        ctx.shadowBlur = 0;
      }
    });

    // Draw Player
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 20px Fira Code';
    ctx.fillText('@', player.x * TILE_SIZE + 3, player.y * TILE_SIZE + 19);
    ctx.shadowBlur = 0;

    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function spawnSpark(x, y, color) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: x * TILE_SIZE + 12,
        y: y * TILE_SIZE + 12,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color,
        life: 15
      });
    }
  }

  function addLog(msg, colorClass = '') {
    const logBox = document.getElementById('combat-log');
    const div = document.createElement('div');
    div.className = `log-line ${colorClass}`;
    div.textContent = `> ${msg}`;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function updateUI() {
    document.getElementById('hud-floor').textContent = player.floor;
    document.getElementById('hud-score').textContent = player.score;

    document.getElementById('txt-hp').textContent = `${player.hp}/${player.maxHp}`;
    document.getElementById('bar-hp').style.width = `${(player.hp / player.maxHp) * 100}%`;

    document.getElementById('txt-energy').textContent = `${player.energy}/${player.maxEnergy}`;
    document.getElementById('bar-energy').style.width = `${(player.energy / player.maxEnergy) * 100}%`;

    document.getElementById('txt-shield').textContent = `${player.shield}/${player.maxShield}`;
    document.getElementById('bar-shield').style.width = `${(player.shield / player.maxShield) * 100}%`;

    document.getElementById('slot-nanite').textContent = `💉 Nanite Stim [x${player.nanites}]`;
    document.getElementById('slot-emp').textContent = `💣 EMP Charge [x${player.emp}]`;
  }

  // --- KEYBOARD & CONTROLS ---
  window.addEventListener('keydown', e => {
    switch(e.key.toLowerCase()) {
      case 'arrowup': case 'w': movePlayer(0, -1); break;
      case 'arrowdown': case 's': movePlayer(0, 1); break;
      case 'arrowleft': case 'a': movePlayer(-1, 0); break;
      case 'arrowright': case 'd': movePlayer(1, 0); break;
      case 'e': case 'u': useActiveItem(); break;
      case '.': movePlayer(0, 0); break; // Wait turn
    }
  });

  document.getElementById('btn-use-item').addEventListener('click', useActiveItem);

  document.querySelectorAll('.dbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (k === 'w') movePlayer(0, -1);
      else if (k === 's') movePlayer(0, 1);
      else if (k === 'a') movePlayer(-1, 0);
      else if (k === 'd') movePlayer(1, 0);
      else if (k === 'wait') movePlayer(0, 0);
    });
  });

  document.getElementById('mobile-btn-use').addEventListener('click', useActiveItem);

  document.getElementById('btn-sound').addEventListener('click', () => {
    sound.init();
    const state = sound.toggle();
    document.getElementById('btn-sound').textContent = state ? '🔊' : '🔇';
  });

  document.getElementById('btn-graveyard').addEventListener('click', () => {
    document.getElementById('graveyard-modal').classList.add('active');
    fetchGraveyard();
  });

  document.getElementById('btn-close-graveyard').addEventListener('click', () => {
    document.getElementById('graveyard-modal').classList.remove('active');
  });

  document.getElementById('btn-respawn').addEventListener('click', () => {
    player = {
      x: 0, y: 0,
      hp: 100, maxHp: 100,
      energy: 50, maxEnergy: 50,
      shield: 25, maxShield: 25,
      attack: 14,
      nanites: 2,
      emp: 1,
      floor: 1,
      score: 0,
      alive: true
    };
    document.getElementById('death-screen').classList.remove('active');
    generateDungeon();
    updateUI();
    render();
  });

  // Submit graveyard form
  document.getElementById('form-graveyard').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pilotName = document.getElementById('input-callsign').value.trim() || 'ANONYMOUS';
    try {
      await fetch('/api/graveyard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilot: pilotName,
          floor: player.floor,
          score: player.score,
          killer: document.getElementById('death-cause').textContent
        })
      });
      document.getElementById('death-screen').classList.remove('active');
      document.getElementById('graveyard-modal').classList.add('active');
      fetchGraveyard();
    } catch (_) {}
  });

  async function fetchGraveyard() {
    const tbody = document.getElementById('grave-rows');
    tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Connecting to mainframe...</td></tr>';
    try {
      const res = await fetch('/api/graveyard');
      const data = await res.json();
      tbody.innerHTML = '';
      data.records.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="glow-cyan">${r.pilot}</td>
          <td>${r.floor}</td>
          <td class="glow-yellow">${r.score}</td>
          <td>${r.killer}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Archive offline.</td></tr>';
    }
  }

  // --- INITIALIZE ---
  resize();
  generateDungeon();
  updateUI();
  render();

})();
