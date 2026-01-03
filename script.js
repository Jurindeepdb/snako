// script.js
// Minimal, complete game logic that matches the simplified HTML
console.log('script.js loaded');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// UI elements
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const leaderboardBody = document.querySelector('#leaderboard tbody');
const usernameInput = document.getElementById('username');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearScores');

const overlay = document.getElementById('gameOverOverlay');
const overlayName = document.getElementById('overlayName');
const finalScoreEl = document.getElementById('finalScore');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const continueBtn = document.getElementById('continueBtn');

let snake = [{ x: 10, y: 10 }];
let dx = 1;
let dy = 0;
let nextDx = dx;
let nextDy = dy;
let food = randomFood();
let score = 0;

let running = false;
let tickInterval = 120;
let tickHandle = null;

// storage keys
const LS_LEADER = 'snake_leaderboard_v1';
const LS_NAME = 'snake_name_v1';

/* ---------- Username persistence ---------- */
usernameInput.value = localStorage.getItem(LS_NAME) || '';

usernameInput.addEventListener('change', () => {
  localStorage.setItem(LS_NAME, usernameInput.value.trim());
  renderLeaderboard();
});

/* ---------- Leaderboard helpers ---------- */
function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LS_LEADER) || '[]');
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(list) {
  localStorage.setItem(LS_LEADER, JSON.stringify(list));
}

function addScoreEntry(user, sc) {
  if (!user) {
    user = 'Anonymous';
  }

  const list = loadLeaderboard();

  list.push({
    user: user,
    score: sc,
    date: new Date().toISOString()
  });

  list.sort(function (a, b) {
    return b.score - a.score || (new Date(b.date) - new Date(a.date));
  });

  saveLeaderboard(list.slice(0, 50));
  renderLeaderboard();
}

function renderLeaderboard() {
  const list = loadLeaderboard();

  leaderboardBody.innerHTML = '';

  list.slice(0, 20).forEach(function (entry, i) {
    const tr = document.createElement('tr');
    const d = new Date(entry.date);

    tr.innerHTML = ''
      + '<td>' + (i + 1) + '</td>'
      + '<td>' + escapeHtml(entry.user) + '</td>'
      + '<td>' + entry.score + '</td>'
      + '<td>' + d.toLocaleString() + '</td>';

    leaderboardBody.appendChild(tr);
  });

  const user = (usernameInput.value || '').trim();

  const best = list.reduce(function (m, e) {
    return e.user === user ? Math.max(m, e.score) : m;
  }, 0);

  bestEl.textContent = best || 0;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
  });
}


/* ---------- Loop control ---------- */
function startLoop() {
  if (tickHandle) {
    clearInterval(tickHandle);
  }

  tickHandle = setInterval(gameLoop, tickInterval);
  running = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  startBtn.hidden = true;
  pauseBtn.textContent = 'Pause';
}

function stopLoop() {
  if (tickHandle) {
    clearInterval(tickHandle);
  }

  tickHandle = null;
  running = false;
  pauseBtn.textContent = 'Resume';
}

/* Buttons */
startBtn.addEventListener('click', function () {
  startLoop();
});

pauseBtn.addEventListener('click', function () {
  if (!startBtn.hidden) {
    return;
  }

  if (running) {
    stopLoop();
  } else {
    startLoop();
  }
});

resetBtn.addEventListener('click', function () {
  resetGame(false);
});

clearBtn.addEventListener('click', function () {
  if (confirm('Clear leaderboard?')) {
    localStorage.removeItem(LS_LEADER);
    renderLeaderboard();
  }
});

/* ---------- Game logic ---------- */
function gameLoop() {
  update();
  draw();
}

function update() {
  dx = nextDx;
  dy = nextDy;

  const newHead = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  if (newHead.x < 0) {
    newHead.x = tileCount - 1;
  }

  if (newHead.x >= tileCount) {
    newHead.x = 0;
  }

  if (newHead.y < 0) {
    newHead.y = tileCount - 1;
  }

  if (newHead.y >= tileCount) {
    newHead.y = 0;
  }

  if (snake.some(function (p) {
    return p.x === newHead.x && p.y === newHead.y;
  })) {
    finalScoreEl.textContent = score;
    showGameOverOverlay();
    stopLoop();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    food = randomFood();

    if (score % 5 === 0 && tickInterval > 50) {
      tickInterval = Math.max(50, tickInterval - 8);

      if (running) {
        startLoop();
      }
    }
  } else {
    snake.pop();
  }

  scoreEl.textContent = score;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ef4444';

  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize,
    gridSize
  );

  ctx.fillStyle = '#22c55e';

  snake.forEach(function (p) {
    ctx.fillRect(
      p.x * gridSize,
      p.y * gridSize,
      gridSize,
      gridSize
    );
  });
}

/* ---------- Helpers ---------- */
function randomFood() {
  let pos;

  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(function (p) {
    return p.x === pos.x && p.y === pos.y;
  }));

  return pos;
}

function resetGame(preserveRunning) {
  snake = [{
    x: Math.floor(tileCount / 2),
    y: Math.floor(tileCount / 2)
  }];

  dx = 1;
  dy = 0;
  nextDx = dx;
  nextDy = dy;

  food = randomFood();
  score = 0;
  tickInterval = 120;
  scoreEl.textContent = '0';

  stopLoop();
  startBtn.hidden = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;

  draw();
}

/* ---------- Overlay handlers ---------- */
function showGameOverOverlay() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  overlayName.value = (usernameInput.value || '').trim();
  pauseBtn.disabled = true;
  resetBtn.disabled = false;
  startBtn.hidden = true;
}

function hideGameOverOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  pauseBtn.disabled = false;
}

saveScoreBtn.addEventListener('click', function () {
  const name = (overlayName.value || '').trim() || 'Anonymous';
  addScoreEntry(name, score);
  localStorage.setItem(LS_NAME, name);
  hideGameOverOverlay();
  resetGame(false);
});

continueBtn.addEventListener('click', function () {
  hideGameOverOverlay();
  resetGame(false);
});

/* ---------- Keyboard input ---------- */
document.addEventListener('keydown', function (e) {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (dy === 0) {
        nextDx = 0;
        nextDy = -1;
      }

      break;

    case 'ArrowDown':
    case 's':
    case 'S':
      if (dy === 0) {
        nextDx = 0;
        nextDy = 1;
      }

      break;

    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (dx === 0) {
        nextDx = -1;
        nextDy = 0;
      }

      break;

    case 'ArrowRight':
    case 'd':
    case 'D':
      if (dx === 0) {
        nextDx = 1;
        nextDy = 0;
      }

      break;

    case ' ':
      if (!startBtn.hidden) {
        return;
      }

      if (running) {
        stopLoop();
      } else {
        startLoop();
      }

      break;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggle');
  const img = document.getElementById('toggleImg');

  if (!btn || !img) {
    console.error('Toggle button or image not found');
    return;
  }

  const targets = [
    document.querySelector('header'),
    document.getElementById('controls'),
    document.getElementById('leaderboard'),
    document.getElementById('game-area'),
    document.getElementById('game'),
    document.getElementById('overlayCard')
  ].filter(Boolean);

  let isDark = false;

  function apply() {
    targets.forEach(el => {
      el.classList.toggle('dark', isDark);
    });

    img.src = isDark ? 'images/brightness.png' : 'images/moon.png';
    img.style.filter = isDark ? 'invert(1)' : 'invert(0)';
  }

  apply();

  btn.addEventListener('click', () => {
    isDark = !isDark;
    apply();
  });
});


/* ---------- Init ---------- */
renderLeaderboard();
resetGame(false);
