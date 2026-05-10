const canvas = document.querySelector("#game-board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const speedEl = document.querySelector("#speed");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");

const tileCount = 20;
const tileSize = canvas.width / tileCount;
const initialSnake = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score")) || 0;
let gameTimer;
let isRunning = false;
let isPaused = false;

bestScoreEl.textContent = bestScore;
resetGame();
drawGame();

function resetGame() {
  snake = initialSnake.map((segment) => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  food = createFood();
  updateHud();
}

function startGame() {
  resetGame();
  isRunning = true;
  isPaused = false;
  overlay.classList.add("hidden");
  clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, getGameSpeed());
  drawGame();
}

function gameLoop() {
  if (!isRunning || isPaused) {
    return;
  }

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (hasHitWall(head) || hasHitSnake(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = createFood();
    updateHud();
    refreshSpeed();
  } else {
    snake.pop();
  }

  drawGame();
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFood();
  drawSnake();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    ctx.fillStyle = isHead ? "#d6ffe1" : "#74f59b";
    ctx.shadowColor = isHead ? "rgba(214, 255, 225, 0.5)" : "rgba(116, 245, 155, 0.3)";
    ctx.shadowBlur = isHead ? 18 : 8;
    drawRoundedTile(segment.x, segment.y, isHead ? 8 : 7);
  });
  ctx.shadowBlur = 0;
}

function drawFood() {
  const center = gridToPixel(food);
  ctx.beginPath();
  ctx.fillStyle = "#ff667d";
  ctx.shadowColor = "rgba(255, 102, 125, 0.55)";
  ctx.shadowBlur = 20;
  ctx.arc(center.x + tileSize / 2, center.y + tileSize / 2, tileSize * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawRoundedTile(x, y, radius) {
  const pixel = gridToPixel({ x, y });
  const padding = 2;
  const size = tileSize - padding * 2;
  ctx.beginPath();
  ctx.roundRect(pixel.x + padding, pixel.y + padding, size, size, radius);
  ctx.fill();
}

function gridToPixel(position) {
  return {
    x: position.x * tileSize,
    y: position.y * tileSize,
  };
}

function createFood() {
  let newFood;

  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));

  return newFood;
}

function changeDirection(newDirection) {
  const isOpposite = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;

  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

function togglePause() {
  if (!isRunning) {
    startGame();
    return;
  }

  isPaused = !isPaused;
  overlay.classList.toggle("hidden", !isPaused);

  if (isPaused) {
    overlay.querySelector("h2").textContent = "Oyun duraklatıldı";
    overlay.querySelector("p").textContent = "Devam etmek için Space tuşuna ya da düğmeye bas.";
    startButton.textContent = "Devam Et";
  } else {
    overlay.classList.add("hidden");
  }
}

function endGame() {
  isRunning = false;
  clearInterval(gameTimer);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake-best-score", bestScore);
  }

  updateHud();
  overlay.classList.remove("hidden");
  overlay.querySelector("h2").textContent = "Oyun bitti!";
  overlay.querySelector("p").textContent = `Skorun ${score}. Tekrar denemek için başlat düğmesine bas.`;
  startButton.textContent = "Tekrar Başlat";
}

function hasHitWall(position) {
  return position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount;
}

function hasHitSnake(position) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedEl.textContent = `${getSpeedLevel()}x`;
}

function getSpeedLevel() {
  return Math.min(5, 1 + Math.floor(score / 50));
}

function getGameSpeed() {
  return 145 - (getSpeedLevel() - 1) * 18;
}

function refreshSpeed() {
  clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, getGameSpeed());
}

const directions = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const newDirection = directions[event.code];

  if (newDirection) {
    event.preventDefault();
    changeDirection(newDirection);
  }
});

startButton.addEventListener("click", () => {
  if (isPaused) {
    togglePause();
    return;
  }

  startGame();
});

document.querySelectorAll(".control-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const directionName = button.dataset.direction;
    const mobileDirections = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };

    changeDirection(mobileDirections[directionName]);
  });
});
