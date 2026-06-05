let currentDigits = [];
let targetNumber = 100;
let currentDifficulty = "medium";
let score = 0;
let attempts = 0;
let bestScore = 0;
let timerSeconds = 0;
let timerInterval = null;
let isGameActive = true;

const numbersDisplay = document.getElementById("numbersDisplay");
const expressionInput = document.getElementById("expressionInput");
const submitBtn = document.getElementById("submitBtn");
const newPuzzleBtn = document.getElementById("newPuzzleBtn");
const hintBtn = document.getElementById("hintBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const messageArea = document.getElementById("messageArea");
const scoreValue = document.getElementById("scoreValue");
const attemptsValue = document.getElementById("attemptsValue");
const bestScoreValue = document.getElementById("bestScoreValue");
const targetValueSpan = document.getElementById("targetValue");
const timerDisplay = document.getElementById("timerDisplay");
const themeToggle = document.getElementById("themeToggle");

const solvableDigitsFor50 = [
  [5, 5, 2],
  [10, 5, 1],
  [25, 2, 1],
  [10, 10, 2],
  [5, 10, 1],
  [2, 5, 5],
  [8, 6, 2],
  [7, 7, 1],
  [6, 8, 2],
  [4, 12, 2],
  [3, 16, 2],
  [48, 1, 2],
];

const solvableDigitsFor100 = [
  [5, 5, 4],
  [10, 10, 1],
  [20, 5, 1],
  [25, 4, 1],
  [50, 2, 1],
  [4, 5, 5],
  [2, 10, 5],
  [8, 12, 4],
  [9, 11, 1],
  [7, 14, 2],
  [6, 16, 4],
  [3, 33, 1],
  [98, 1, 2],
  [92, 8, 1],
  [75, 25, 1],
  [12, 8, 4],
  [15, 6, 10],
  [18, 5, 10],
  [20, 4, 5],
  [30, 3, 10],
  [40, 2, 20],
];

const solvableDigitsFor200 = [
  [10, 10, 2],
  [20, 10, 1],
  [25, 8, 1],
  [40, 5, 1],
  [50, 4, 1],
  [100, 2, 1],
  [5, 5, 8],
  [4, 10, 5],
  [2, 20, 5],
  [12, 16, 8],
  [15, 13, 5],
  [18, 11, 2],
  [25, 7, 25],
  [30, 6, 20],
  [35, 5, 25],
  [45, 4, 20],
  [50, 3, 50],
];

function getSolvableDigitsForTarget(target) {
  if (target === 50) return solvableDigitsFor50;
  if (target === 100) return solvableDigitsFor100;
  return solvableDigitsFor200;
}

function generateRandomSolvableDigits() {
  const solvablePool = getSolvableDigitsForTarget(targetNumber);
  const randomIndex = Math.floor(Math.random() * solvablePool.length);
  return [...solvablePool[randomIndex]];
}

function loadStats() {
  const savedScore = localStorage.getItem("make100_solvable_score");
  const savedBest = localStorage.getItem("make100_solvable_best");
  const savedAttempts = localStorage.getItem("make100_solvable_attempts");
  if (savedScore) score = parseInt(savedScore);
  if (savedBest) bestScore = parseInt(savedBest);
  if (savedAttempts) attempts = parseInt(savedAttempts);
  updateStatsUI();
}

function saveStats() {
  localStorage.setItem("make100_solvable_score", score);
  localStorage.setItem("make100_solvable_best", Math.max(score, bestScore));
  localStorage.setItem("make100_solvable_attempts", attempts);
  bestScore = Math.max(score, bestScore);
  updateStatsUI();
}

function updateStatsUI() {
  scoreValue.textContent = score;
  attemptsValue.textContent = attempts;
  bestScoreValue.textContent = Math.max(score, bestScore);
}

function displayNumbers() {
  numbersDisplay.innerHTML = currentDigits
    .map((digit) => `<div class="number-card">${digit}</div>`)
    .join("");
}

function validateDigits(expression) {
  const numberMatches = expression.match(/\d+/g) || [];
  const usedNumbers = numberMatches.map((n) => parseInt(n));

  const digitCount = [...currentDigits];

  for (let num of usedNumbers) {
    const index = digitCount.indexOf(num);
    if (index === -1) return false;
    digitCount.splice(index, 1);
  }
  return digitCount.length === 0;
}

function evaluateExpression(expression) {
  try {
    let sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/");
    const result = Function('"use strict"; return (' + sanitized + ")")();
    return { success: true, value: result };
  } catch (error) {
    return { success: false, error: "Invalid expression syntax" };
  }
}

function showMessage(text, type) {
  messageArea.innerHTML = `<div class="message-${type}"><i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i> ${text}</div>`;
  setTimeout(() => {
    if (messageArea.innerHTML.includes(text)) {
      messageArea.innerHTML = "";
    }
  }, 3000);
}

function animateSuccess() {
  const cards = document.querySelectorAll(".number-card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.transform = "scale(1.2)";
      setTimeout(() => {
        card.style.transform = "";
      }, 200);
    }, index * 100);
  });
}

function checkAnswer() {
  if (!isGameActive) {
    showMessage('Click "New Puzzle" to start a new challenge!', "error");
    return;
  }

  const expression = expressionInput.value.trim();
  if (expression === "") {
    showMessage("Please enter an expression!", "error");
    return;
  }

  if (!validateDigits(expression)) {
    showMessage(
      `You must use each of the 3 digits (${currentDigits.join(", ")}) exactly once, and no other numbers!`,
      "error",
    );
    return;
  }

  const evaluation = evaluateExpression(expression);
  if (!evaluation.success) {
    showMessage(`Invalid expression: ${evaluation.error}`, "error");
    return;
  }

  const result = evaluation.value;
  const target = targetNumber;

  if (Math.abs(result - target) < 0.0001) {
    score++;
    saveStats();
    showMessage(
      `🎉 CORRECT! +1 point! ${expression} = ${result} 🎉`,
      "success",
    );
    animateSuccess();
    stopTimer();
    startTimer();
    generateNewPuzzle();
  } else {
    attempts++;
    saveStats();
    showMessage(
      `❌ ${expression} = ${result}, not ${target}. Try again!`,
      "error",
    );
  }
  expressionInput.value = "";
  expressionInput.focus();
}

function generateNewPuzzle() {
  currentDigits = generateRandomSolvableDigits();
  displayNumbers();
  expressionInput.value = "";
  showMessage(
    `✨ Guaranteed solvable! Use ${currentDigits.join(", ")} to make ${targetNumber}`,
    "success",
  );
  isGameActive = true;
  stopTimer();
  startTimer();
}

function giveHint() {
  const digits = [...currentDigits].sort((a, b) => a - b);
  const target = targetNumber;

  const hintMap = {
    "5,5,4": "Try: (5 × 5) × 4 = 100",
    "10,10,1": "Try: 10 × 10 × 1 = 100",
    "20,5,1": "Try: 20 × 5 × 1 = 100",
    "25,4,1": "Try: 25 × 4 × 1 = 100",
    "50,2,1": "Try: 50 × 2 × 1 = 100",
    "4,5,5": "Try: 4 × 5 × 5 = 100",
    "8,12,4": "Try: (8 × 12) + 4 = 100",
    "9,11,1": "Try: (9 × 11) + 1 = 100",
    "7,14,2": "Try: (7 × 14) + 2 = 100",
    "6,16,4": "Try: (6 × 16) + 4 = 100",
    "2,5,5": "Try: 2 × 5 × 5 = 50",
    "5,5,2": "Try: (5 × 5) × 2 = 50",
    "10,5,1": "Try: 10 × 5 × 1 = 50",
    "6,8,2": "Try: (6 × 8) + 2 = 50",
    "7,7,1": "Try: (7 × 7) + 1 = 50",
    "10,10,2": "Try: 10 × 10 × 2 = 200",
    "20,10,1": "Try: 20 × 10 × 1 = 200",
    "25,8,1": "Try: 25 × 8 × 1 = 200",
    "40,5,1": "Try: 40 × 5 × 1 = 200",
    "12,16,8": "Try: (12 × 16) + 8 = 200",
  };

  const key = digits.join(",");
  if (hintMap[key]) {
    showMessage(`💡 Hint: ${hintMap[key]}`, "success");
  } else {
    showMessage(
      `💡 Hint: Try multiplication first: ${digits[0]} × ${digits[1]} × ${digits[2]} = ${digits[0] * digits[1] * digits[2]}. Adjust with + or -`,
      "success",
    );
  }
}

function startTimer() {
  timerSeconds = 0;
  updateTimerDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isGameActive) {
      timerSeconds++;
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function setDifficulty(level) {
  currentDifficulty = level;
  if (level === "easy") targetNumber = 50;
  else if (level === "medium") targetNumber = 100;
  else targetNumber = 200;

  targetValueSpan.textContent = targetNumber;

  document.querySelectorAll(".difficulty-btn").forEach((btn) => {
    if (btn.dataset.difficulty === level) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  generateNewPuzzle();
}

function resetScore() {
  if (confirm("Are you sure you want to reset your score and attempts?")) {
    score = 0;
    attempts = 0;
    saveStats();
    updateStatsUI();
    showMessage("Score has been reset!", "success");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const icon = themeToggle.querySelector("i");
  if (document.body.classList.contains("dark-mode")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }
  localStorage.setItem(
    "make100_theme_solvable",
    document.body.classList.contains("dark-mode") ? "dark" : "light",
  );
}

function loadTheme() {
  const savedTheme = localStorage.getItem("make100_theme_solvable");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.querySelector("i").classList.remove("fa-moon");
    themeToggle.querySelector("i").classList.add("fa-sun");
  }
}

submitBtn.addEventListener("click", checkAnswer);
newPuzzleBtn.addEventListener("click", () => {
  generateNewPuzzle();
  isGameActive = true;
});
hintBtn.addEventListener("click", giveHint);
resetScoreBtn.addEventListener("click", resetScore);
expressionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") checkAnswer();
});

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

themeToggle.addEventListener("click", toggleTheme);

function init() {
  loadStats();
  loadTheme();
  currentDigits = generateRandomSolvableDigits();
  displayNumbers();
  startTimer();
  expressionInput.focus();
  isGameActive = true;
  showMessage(
    `✨ Guaranteed solvable! Use ${currentDigits.join(", ")} to make ${targetNumber}`,
    "success",
  );
}

init();
