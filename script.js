let pokemonList = []; // { number: string|number, name: string, normalizedName: string }
let currentPokemon = null;
let currentMode = "mcq"; // "mcq" ou "input"
let score = 0;
let bestScore = 0;
let hasAnsweredCurrent = false;

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const questionAreaEl = document.getElementById("question-area");
const pokemonNumberEl = document.getElementById("pokemon-number");
const mcqAreaEl = document.getElementById("mcq-area");
const inputAreaEl = document.getElementById("input-area");
const optionButtons = Array.from(document.querySelectorAll(".option-button"));
const answerInputEl = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer");
const feedbackEl = document.getElementById("feedback");
const nextQuestionBtn = document.getElementById("next-question");
const scoreValueEl = document.getElementById("score-value");
const bestScoreEl = document.getElementById("best-score-value");
const modeMcqBtn = document.getElementById("mode-mcq");
const modeInputBtn = document.getElementById("mode-input");

function normalizeName(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'-]/g, "")
    .toLowerCase();
}

function buildPokemonListFromEmbeddedData() {
  if (!Array.isArray(POKEMON_DATA) || POKEMON_DATA.length === 0) {
    throw new Error(
      "Les données Pokémon intégrées (POKEMON_DATA) sont introuvables ou vides."
    );
  }

  pokemonList = POKEMON_DATA.map((p) => ({
    number: p.number,
    name: p.name,
    normalizedName: normalizeName(p.name),
  }));
}

function updateScoreDisplay() {
  scoreValueEl.textContent = score;
  if (bestScoreEl) {
    bestScoreEl.textContent = bestScore;
  }
}

function loadBestScore() {
  try {
    const stored = localStorage.getItem("pokeQuizBestScore");
    const parsed = stored != null ? parseInt(stored, 10) : 0;
    bestScore = Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    bestScore = 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem("pokeQuizBestScore", String(bestScore));
  } catch {
    // ignore storage errors
  }
}

function resetFeedback() {
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("success", "error");
}

function pickRandomPokemon() {
  if (!pokemonList.length) return null;
  const index = Math.floor(Math.random() * pokemonList.length);
  return pokemonList[index];
}

function generateMcqOptions(correctPokemon) {
  const options = [correctPokemon];
  const usedIndices = new Set([pokemonList.indexOf(correctPokemon)]);

  while (options.length < 4 && usedIndices.size < pokemonList.length) {
    const candidateIndex = Math.floor(Math.random() * pokemonList.length);
    if (usedIndices.has(candidateIndex)) continue;
    usedIndices.add(candidateIndex);
    options.push(pokemonList[candidateIndex]);
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

function showNewQuestion() {
  if (!pokemonList.length) return;

  hasAnsweredCurrent = false;
  resetFeedback();
  nextQuestionBtn.hidden = true;

  optionButtons.forEach((btn) => {
    btn.classList.remove("correct", "wrong");
    btn.disabled = false;
  });

  if (answerInputEl) {
    answerInputEl.value = "";
  }

  currentPokemon = pickRandomPokemon();
  pokemonNumberEl.textContent = currentPokemon.number;

  if (currentMode === "mcq") {
    const options = generateMcqOptions(currentPokemon);
    optionButtons.forEach((btn, index) => {
      const pokemon = options[index];
      if (pokemon) {
        btn.textContent = pokemon.name;
        btn.dataset.correct =
          normalizeName(pokemon.name) === normalizeName(currentPokemon.name)
            ? "true"
            : "false";
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    });
  } else {
    if (answerInputEl) {
      answerInputEl.focus();
    }
  }
}

function handleMcqClick(event) {
  if (hasAnsweredCurrent) return;
  const btn = event.currentTarget;
  const isCorrect = btn.dataset.correct === "true";
  hasAnsweredCurrent = true;

  optionButtons.forEach((b) => {
    b.disabled = true;
    if (b.dataset.correct === "true") {
      b.classList.add("correct");
    }
  });

  if (isCorrect) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      saveBestScore();
    }
    updateScoreDisplay();
    feedbackEl.textContent = "Bonne réponse ! 🎉";
    feedbackEl.classList.add("success");
  } else {
    btn.classList.add("wrong");
    feedbackEl.textContent = `Mauvaise réponse. C'était ${currentPokemon.name}.`;
    feedbackEl.classList.add("error");
    score = 0;
    updateScoreDisplay();
  }

  nextQuestionBtn.hidden = false;
}

function handleInputSubmit() {
  if (hasAnsweredCurrent) return;
  const userAnswer = answerInputEl.value.trim();
  if (!userAnswer) return;

  const normalizedUser = normalizeName(userAnswer);
  const normalizedCorrect = currentPokemon.normalizedName;

  hasAnsweredCurrent = true;

  if (normalizedUser === normalizedCorrect) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      saveBestScore();
    }
    updateScoreDisplay();
    feedbackEl.textContent = "Bonne réponse ! 🎉";
    feedbackEl.classList.remove("error");
    feedbackEl.classList.add("success");
  } else {
    feedbackEl.textContent = `Non, ce n'est pas ça. C'était ${currentPokemon.name}.`;
    feedbackEl.classList.remove("success");
    feedbackEl.classList.add("error");
    score = 0;
    updateScoreDisplay();
  }

  nextQuestionBtn.hidden = false;
}

function setMode(mode) {
  if (mode !== "mcq" && mode !== "input") return;
  currentMode = mode;

  modeMcqBtn.classList.toggle("active", mode === "mcq");
  modeInputBtn.classList.toggle("active", mode === "input");

  mcqAreaEl.hidden = mode !== "mcq";
  inputAreaEl.hidden = mode !== "input";

  showNewQuestion();
}

function initEvents() {
  optionButtons.forEach((btn) => {
    btn.addEventListener("click", handleMcqClick);
  });

  submitAnswerBtn.addEventListener("click", handleInputSubmit);

  answerInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    }
  });

  nextQuestionBtn.addEventListener("click", () => {
    showNewQuestion();
  });

  modeMcqBtn.addEventListener("click", () => setMode("mcq"));
  modeInputBtn.addEventListener("click", () => setMode("input"));
}

async function bootstrap() {
  try {
    buildPokemonListFromEmbeddedData();
    loadingEl.hidden = true;
    errorEl.hidden = true;
    questionAreaEl.hidden = false;
    initEvents();
     loadBestScore();
    updateScoreDisplay();
    setMode("mcq");
  } catch (err) {
    console.error(err);
    loadingEl.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent =
      (err && err.message) || "Erreur lors du chargement des données.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap();
});

