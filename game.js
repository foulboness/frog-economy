(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayEyebrow = document.getElementById("overlay-eyebrow");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayCopy = document.getElementById("overlay-copy");
  const startButton = document.getElementById("start-button");
  const pausePill = document.getElementById("pause-pill");
  const paceLabel = document.getElementById("pace-label");
  const paceMeter = document.getElementById("pace-meter");
  const paceCopy = document.getElementById("pace-copy");

  const W = canvas.width;
  const H = canvas.height;
  const STORAGE_KEY = "frog-economy-best-v1";
  const MAX_LIVES = 3;
  const MAX_PACE = 2.25;
  const RATES = [
    { type: "big", weight: 48, points: 1, size: 34, speed: 105 },
    { type: "medium", weight: 24, points: 3, size: 24, speed: 125 },
    { type: "small", weight: 11, points: 6, size: 15, speed: 145 },
    { type: "poop", weight: 16, points: 0, size: 22, speed: 118 }
  ];
  // The supplied rates total 99%; normalize their weights to cover all spawns.
  const TOTAL_WEIGHT = RATES.reduce((sum, item) => sum + item.weight, 0);

  let state = "ready"; // ready, playing, paused, over
  let score = 0;
  let lives = MAX_LIVES;
  let best = readBest();
  let elapsed = 0;
  let spawnTimer = 0;
  let lastTime = 0;
  let objects = [];
  let particles = [];
  let keys = new Set();
  let pointerActive = false;
  let targetX = W / 2;
  const pad = { x: W / 2, y: H - 55, width: 100, height: 24 };

  function readBest() {
    try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; }
    catch { return 0; }
  }
  function saveBest() {
    try { localStorage.setItem(STORAGE_KEY, String(best)); } catch {}
  }
  function fmt(n) { return String(n).padStart(4, "0"); }

  function updateHud() {
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(best);
    livesEl.textContent = Array.from({ length: MAX_LIVES }, (_, i) => i < lives ? "♥" : "♡").join(" ");
    livesEl.setAttribute("aria-label", `${lives} of ${MAX_LIVES} lives`);
    const pace = paceFor(elapsed);
    paceLabel.textContent = `${pace.toFixed(2)}×`;
    paceMeter.style.width = `${((pace - 1) / (MAX_PACE - 1)) * 100}%`;
    paceCopy.textContent = elapsed < 60 ? "The pond is getting volatile." : "Market volatility has reached its ceiling.";
  }

  function paceFor(seconds) {
    return 1 + (MAX_PACE - 1) * Math.min(1, seconds / 60);
  }

  function showOverlay(kind) {
    overlay.hidden = false;
    if (kind === "ready") {
      overlayEyebrow.textContent = "WELCOME, INVESTOR";
      overlayTitle.innerHTML = "The pond<br><em>is open.</em>";
      overlayCopy.textContent = "Catch the frogs. Let the poop pass. Three missed frogs and your business is finished.";
      startButton.innerHTML = 'Start the shift <span>↗</span>';
      document.querySelector(".overlay-hint").textContent = "PRESS SPACE TO BEGIN";
    } else {
      overlayEyebrow.textContent = "SHIFT COMPLETE / BUSINESS CLOSED";
      overlayTitle.innerHTML = "Your pond<br><em>has spoken.</em>";
      overlayCopy.textContent = `Final score: ${score}. Personal best: ${best}. The market is unforgiving.`;
      startButton.innerHTML = 'Try again <span>↗</span>';
      document.querySelector(".overlay-hint").textContent = "PRESS SPACE TO RESTART";
    }
  }

  function startGame() {
    score = 0;
    lives = MAX_LIVES;
    elapsed = 0;
    spawnTimer = 0.35;
    objects = [];
    particles = [];
    pad.x = W / 2;
    targetX = W / 2;
    state = "playing";
    overlay.hidden = true;
    pausePill.hidden = true;
    updateHud();
    canvas.focus({ preventScroll: true });
  }

  function endGame() {
    state = "over";
    pausePill.hidden = true;
    if (score > best) {
      best = score;
      saveBest();
    }
    updateHud();
    showOverlay("over");
    // Intentionally no name prompt: leaderboard adapter ships disabled.
    if (window.FrogLeaderboard?.enabled) {
      window.FrogLeaderboard.submit("Player", score).catch(() => {});
    }
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      pausePill.hidden = false;
    } else if (state === "paused") {
      state = "playing";
      pausePill.hidden = true;
      lastTime = performance.now();
    }
  }

  function chooseType() {
    let roll = Math.random() * TOTAL_WEIGHT;
    for (const item of RATES) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return RATES[0];
  }

  function spawnObject() {
    const spec = chooseType();
    const size = spec.size;
    objects.push({
      type: spec.type,
      points: spec.points,
      size,
      x: 20 + Math.random() * (W - 40),
      y: -size - 4,
      speed: spec.speed * paceFor(elapsed),
      wobble: Math.random() * Math.PI * 2,
      rotation: (Math.random() - 0.5) * 0.2
    });
  }

  function addBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 100;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: .35 + Math.random() * .35, maxLife: .7, color, size: 2 + Math.random() * 3 });
    }
  }

  function catchObject(obj) {
    if (obj.type === "poop") {
      lives--;
      addBurst(obj.x, pad.y - 12, "#bd8b66", 12);
    } else {
      score += obj.points;
      addBurst(obj.x, pad.y - 13, obj.type === "small" ? "#d5f078" : "#7ab46b", 7);
    }
    updateHud();
    if (lives <= 0) endGame();
  }

  function missObject(obj) {
    if (obj.type !== "poop") {
      lives--;
      addBurst(obj.x, H - 12, "#e9f1d0", 5);
      updateHud();
      if (lives <= 0) endGame();
    }
    // Poop falling through is good: no penalty.
  }

  function update(dt) {
    if (state !== "playing") return;
    elapsed += dt;
    const pace = paceFor(elapsed);
    const moveSpeed = 420;
    if (!pointerActive) {
      if (keys.has("ArrowLeft") || keys.has("a")) targetX -= moveSpeed * dt;
      if (keys.has("ArrowRight") || keys.has("d")) targetX += moveSpeed * dt;
    }
    targetX = Math.max(pad.width / 2 + 4, Math.min(W - pad.width / 2 - 4, targetX));
    pad.x += (targetX - pad.x) * Math.min(1, dt * (pointerActive ? 18 : 12));

    spawnTimer -= dt;
    const spawnInterval = Math.max(.28, .92 / (1 + (pace - 1) * .42));
    if (spawnTimer <= 0) {
      spawnObject();
      spawnTimer = spawnInterval * (0.72 + Math.random() * .56);
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.y += obj.speed * dt;
      obj.wobble += dt * 3;
      const hitX = Math.abs(obj.x - pad.x) < pad.width * .43 + obj.size * .35;
      const hitY = obj.y + obj.size * .35 >= pad.y - 7 && obj.y - obj.size * .35 <= pad.y + 10;
      if (hitX && hitY) {
        catchObject(obj);
        objects.splice(i, 1);
        if (state !== "playing") return;
      } else if (obj.y - obj.size > H + 3) {
        missObject(obj);
        objects.splice(i, 1);
        if (state !== "playing") return;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    updateHud();
  }

  function drawBackground() {
    ctx.fillStyle = "#102b2a";
    ctx.fillRect(0, 0, W, H);
    // Pond bands and understated water texture.
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? "rgba(87,139,113,.055)" : "rgba(0,0,0,.035)";
      ctx.fillRect(0, i * 78 + 15, W, 28);
    }
    ctx.strokeStyle = "rgba(179,221,176,.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 28; i++) {
      const x = (i * 79 + 23) % W;
      const y = (i * 47 + 31) % H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 13 + (i % 4) * 5, y); ctx.stroke();
    }
    // subtle boundary
    ctx.strokeStyle = "rgba(213,240,120,.14)";
    ctx.setLineDash([3, 8]);
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(12, H); ctx.moveTo(W - 12, 0); ctx.lineTo(W - 12, H); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawFrog(x, y, size, alpha = 1) {
    // A deliberately simple pixel-ish frog sprite, scaled for value tiers.
    const s = size / 20;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.globalAlpha = alpha;
    ctx.scale(s, s);
    ctx.fillStyle = "#78b66b";
    // feet
    ctx.fillRect(-10, 3, 5, 5); ctx.fillRect(5, 3, 5, 5);
    // body
    ctx.fillRect(-9, -3, 18, 10);
    ctx.fillRect(-7, -6, 14, 4);
    // eye bumps
    ctx.fillRect(-8, -9, 6, 6); ctx.fillRect(2, -9, 6, 6);
    // eyes
    ctx.fillStyle = "#f5f2df";
    ctx.fillRect(-6, -7, 3, 3); ctx.fillRect(3, -7, 3, 3);
    ctx.fillStyle = "#142e2b";
    ctx.fillRect(-5, -6, 2, 2); ctx.fillRect(4, -6, 2, 2);
    // smile
    ctx.fillStyle = "#315e43";
    ctx.fillRect(-3, 2, 6, 1); ctx.fillRect(2, 1, 1, 1);
    ctx.restore();
  }

  function drawPoop(x, y, size) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const s = size / 22;
    ctx.scale(s, s);
    ctx.fillStyle = "#b98b67";
    ctx.fillRect(-7, -7, 14, 13);
    ctx.fillRect(-5, -11, 10, 5);
    ctx.fillRect(-2, -14, 5, 4);
    ctx.fillRect(-9, -2, 18, 7);
    ctx.fillStyle = "#533f34";
    ctx.fillRect(-4, -2, 2, 2); ctx.fillRect(3, -2, 2, 2);
    ctx.fillRect(-2, 3, 5, 1);
    ctx.restore();
  }

  function drawLilyPad() {
    const x = Math.round(pad.x), y = Math.round(pad.y);
    // Water shadow
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath(); ctx.ellipse(x, y + 11, pad.width * .48, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Pad body with a little notch.
    ctx.fillStyle = "#6b9e58";
    ctx.beginPath();
    ctx.ellipse(x, y, pad.width * .48, 17, 0, .23, Math.PI * 1.91);
    ctx.lineTo(x + 7, y - 2);
    ctx.lineTo(x + 20, y - 19);
    ctx.lineTo(x + 13, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#9bc66d"; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = "rgba(25,65,44,.6)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 5, y + 2); ctx.lineTo(x + 24, y - 10); ctx.stroke();
    ctx.fillStyle = "#d5f078";
    ctx.fillRect(x - 23, y - 5, 4, 2); ctx.fillRect(x + 28, y + 3, 3, 2);
  }

  function draw() {
    drawBackground();
    // Gentle floating bubbles
    for (let i = 0; i < 10; i++) {
      const x = (i * 97 + 44) % W;
      const y = (i * 61 + (performance.now() * .012)) % H;
      ctx.strokeStyle = "rgba(177,220,183,.16)";
      ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.stroke();
    }
    objects.forEach(obj => {
      if (obj.type === "poop") drawPoop(obj.x, obj.y, obj.size);
      else drawFrog(obj.x, obj.y + Math.sin(obj.wobble) * 2, obj.size);
    });
    drawLilyPad();
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    if (state === "ready") {
      ctx.fillStyle = "rgba(213,240,120,.7)";
      ctx.font = "10px monospace";
      ctx.fillText("POND STATUS: OPEN", 24, H - 22);
    } else if (state === "playing") {
      ctx.fillStyle = "rgba(213,240,120,.7)";
      ctx.font = "10px monospace";
      ctx.fillText(`SHIFT ${String(Math.floor(elapsed)).padStart(3, "0")}s`, 24, H - 22);
    }
  }

  function loop(timestamp) {
    const dt = Math.min(.035, (timestamp - (lastTime || timestamp)) / 1000);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function pointerX(event) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * W;
  }
  canvas.addEventListener("pointerdown", event => {
    pointerActive = true;
    targetX = pointerX(event);
    canvas.setPointerCapture?.(event.pointerId);
    if (state === "ready" || state === "over") startGame();
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerType === "mouse" || event.pointerType === "pen" || event.buttons > 0) {
      pointerActive = true;
      targetX = pointerX(event);
    }
  });
  canvas.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse" && event.buttons === 0) pointerActive = false;
  });
  canvas.addEventListener("pointerup", event => {
    if (event.pointerType !== "mouse") pointerActive = false;
  });

  window.addEventListener("keydown", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    if (key === "p") {
      togglePause();
      return;
    }
    if (key === " " && (state === "ready" || state === "over")) {
      startGame();
      return;
    }
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key)) {
      keys.add(key);
      pointerActive = false;
    }
  });
  window.addEventListener("keyup", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys.delete(key);
  });
  window.addEventListener("blur", () => {
    keys.clear();
    pointerActive = false;
  });
  startButton.addEventListener("click", startGame);

  bestEl.textContent = fmt(best);
  updateHud();
  showOverlay("ready");
  requestAnimationFrame(loop);
})();