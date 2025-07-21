const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let fruits = [];
let slices = [];
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;

const fruitImg = new Image();
fruitImg.src = "lemon.png"; // Sostituisci con l'immagine della frutta
const bombImg = new Image();
bombImg.src = "goblin.png"; // Assicurati che il file sia nel percorso corretto

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnFruit() {
  const isBomb = Math.random() < 0.3; // 10% di probabilità che sia una bomba
  const x = rand(100, 500);
  const y = 700;
  const vx = rand(-2, 2);
  const vy = rand(-12, -16);
  const type = isBomb ? "bomb" : "fruit";

  fruits.push({ x, y, vx, vy, sliced: false, type });
}

// Funzione per aggiornare il punteggio finale quando il gioco finisce
function showGameOverModal() {
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOverModal").style.display = "flex";
  gameOver = true;
}


// Aggiorna la funzione update() per controllare le vite
function update() {
  if (gameOver) return;

  if (Math.random() < 0.008) spawnFruit(); // meno frequente

  for (let fruit of fruits) {
    fruit.x += fruit.vx;
    fruit.y += fruit.vy;
    fruit.vy += 0.2; // gravità

    if (fruit.y > canvas.height && !fruit.sliced) {
      if (fruit.type === "fruit") {
        lives--;
        if (lives <= 0) {
          // Se le vite sono 0, mostra Game Over
          showGameOverModal();
        }
      }
      fruit.sliced = true;
    }
  }

  fruits = fruits.filter(f => f.y <= canvas.height || f.sliced);
}

// Gestione riavvio del gioco
document.getElementById("restartButton").addEventListener("click", () => {
  // Nascondi tutte le modali
  document.getElementById("bombModal").style.display = "none";
  document.getElementById("gameOverModal").style.display = "none";

  // Riavvia il gioco
  fruits = [];
  slices = [];
  score = 0;
  lives = 3;
  gameOver = false;
  gameStarted = false;

  // Mostra il menu di avvio
  document.getElementById("start-menu").style.display = "block";
});



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fdf6e3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let fruit of fruits) {
    if (!fruit.sliced) {
      if (fruit.type === "fruit") {
        ctx.drawImage(fruitImg, fruit.x, fruit.y, 50, 50);
      } else if (fruit.type === "bomb") {
        ctx.drawImage(bombImg, fruit.x, fruit.y, 50, 50);
      }
    }
  }

  ctx.strokeStyle = "red";
  for (let s of slices) {
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }

  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.fillText("Punteggio: " + score, 10, 30);
  ctx.fillText("Vite: " + lives, 500, 30);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("Game Over", 180, 350);
  }
}

function gameLoop() {
  if (!gameStarted) return;  // Fermare il gioco se non è iniziato

  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Aggiungi questa funzione per far partire il gioco quando si clicca OK
document.getElementById("start-yes").addEventListener("click", () => {
  // Rimuovi il menu di avvio
  document.getElementById("start-menu").style.display = "none";

  // Avvia il gioco
  gameStarted = true;
  gameLoop();
});

// Funzione per gestire la collisione della bomba
function handleSlice(x1, y1, x2, y2) {
  slices.push({ x1, y1, x2, y2 });
  setTimeout(() => {
    slices.shift();
  }, 100);

  for (let fruit of fruits) {
    if (!fruit.sliced && lineIntersectsCircle(x1, y1, x2, y2, fruit.x + 25, fruit.y + 25, 25)) {
      fruit.sliced = true;

      if (fruit.type === "bomb") {
        // Mostra la modale quando colpisci una bomba
        showBombModal();
        gameOver = true; // Fermare il gioco
      } else {
        score++;
      }
    }
  }
}

// Funzione per mostrare la modale della bomba
function showBombModal() {
  document.getElementById("bombModal").style.display = "flex";
}

// Funzione per riavviare il gioco
document.getElementById("restartButton").addEventListener("click", () => {
  // Nascondi la modale
  document.getElementById("bombModal").style.display = "none";

  // Riavvia il gioco
  fruits = [];
  slices = [];
  score = 0;
  lives = 3;
  gameOver = false;
  gameStarted = false;
  document.getElementById("start-menu").style.display = "block"; // Mostra il menu iniziale
});


let lastX = null, lastY = null;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (lastX != null && lastY != null) {
    handleSlice(lastX, lastY, x, y);
  }

  lastX = x;
  lastY = y;
});

canvas.addEventListener("mouseup", () => {
  lastX = null;
  lastY = null;
});

// Touch support
canvas.addEventListener("touchmove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  if (lastX != null && lastY != null) {
    handleSlice(lastX, lastY, x, y);
  }

  lastX = x;
  lastY = y;
});

canvas.addEventListener("touchend", () => {
  lastX = null;
  lastY = null;
});

// Collisione riga/cerchio
function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
  const ac = { x: cx - x1, y: cy - y1 };
  const ab = { x: x2 - x1, y: y2 - y1 };
  const ab2 = ab.x * ab.x + ab.y * ab.y;
  const acab = ac.x * ab.x + ac.y * ab.y;
  const t = Math.max(0, Math.min(1, acab / ab2));
  const h = {
    x: x1 + ab.x * t,
    y: y1 + ab.y * t,
  };
  const dx = cx - h.x;
  const dy = cy - h.y;
  return dx * dx + dy * dy <= r * r;
}

gameLoop(); // Avvio del loop del gioco
