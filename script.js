// Nom du fichier Excel attendu à côté de index.html
const EXCEL_FILE_PATH = "poke(1).xlsx";

let pokemonList = []; // { number: string|number, name: string }
let currentPokemon = null;
let currentMode = "mcq"; // "mcq" ou "input"
let score = 0;
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
const modeMcqBtn = document.getElementById("mode-mcq");
const modeInputBtn = document.getElementById("mode-input");
const fileLoaderEl = document.getElementById("file-loader");
const fileInputEl = document.getElementById("file-input");
const fileLoadBtn = document.getElementById("load-file-button");

function normalizeName(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'-]/g, "")
    .toLowerCase();
}

function buildPokemonListFromWorkbook(workbook) {
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rows || rows.length < 2) {
    throw new Error("Le fichier Excel ne contient pas assez de lignes.");
  }

  const headerRow = rows[0].map((h) => (h || "").toString().toLowerCase());

  // On essaie de deviner les colonnes numéro et nom (FR/EN possible)
  let indexNumber = headerRow.findIndex((h) =>
    /(num|n°|no|id|index)/i.test(h || "")
  );
  let indexName = headerRow.findIndex((h) =>
    /(nom|name|pokemon)/i.test(h || "")
  );

  if (indexNumber === -1 || indexName === -1) {
    // Si impossible de deviner, on tente par défaut : première col = numéro, deuxième = nom
    indexNumber = 0;
    indexName = 1;
  }

  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const numRaw = row[indexNumber];
    const nameRaw = row[indexName];
    if (numRaw == null || nameRaw == null || nameRaw === "") continue;

    const num = String(numRaw).trim();
    const name = String(nameRaw).trim();
    if (!num || !name) continue;
    list.push({
      number: num,
      name,
      normalizedName: normalizeName(name),
    });
  }

  if (list.length === 0) {
    throw new Error(
      "Aucune donnée Pokémon valide n'a été trouvée dans le fichier Excel."
    );
  }

  pokemonList = list;
}

async function loadPokemonDataFromServer() {
  if (typeof XLSX === "undefined") {
    throw new Error(
      "La librairie XLSX n'a pas été chargée. Vérifie ta connexion internet."
    );
  }

  const response = await fetch(EXCEL_FILE_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Impossible de charger le fichier ${EXCEL_FILE_PATH}. Vérifie qu'il est bien présent dans le même dossier que index.html (ou sélectionne-le manuellement).`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });

  buildPokemonListFromWorkbook(workbook);
}

async function loadPokemonDataFromFile(file) {
  if (typeof XLSX === "undefined") {
    throw new Error(
      "La librairie XLSX n'a pas été chargée. Vérifie ta connexion internet."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });

  buildPokemonListFromWorkbook(workbook);
}

function updateScoreDisplay() {
  scoreValueEl.textContent = score;
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
    updateScoreDisplay();
    feedbackEl.textContent = "Bonne réponse ! 🎉";
    feedbackEl.classList.add("success");
  } else {
    btn.classList.add("wrong");
    feedbackEl.textContent = `Mauvaise réponse. C'était ${currentPokemon.name}.`;
    feedbackEl.classList.add("error");
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
    updateScoreDisplay();
    feedbackEl.textContent = "Bonne réponse ! 🎉";
    feedbackEl.classList.remove("error");
    feedbackEl.classList.add("success");
  } else {
    feedbackEl.textContent = `Non, ce n'est pas ça. C'était ${currentPokemon.name}.`;
    feedbackEl.classList.remove("success");
    feedbackEl.classList.add("error");
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

  if (fileLoadBtn && fileInputEl) {
    fileLoadBtn.addEventListener("click", async () => {
      if (!fileInputEl.files || !fileInputEl.files[0]) {
        feedbackEl.textContent = "Choisis d'abord un fichier Excel (.xlsx).";
        feedbackEl.classList.remove("success");
        feedbackEl.classList.add("error");
        return;
      }
      try {
        loadingEl.hidden = false;
        errorEl.hidden = true;
        feedbackEl.textContent = "";
        feedbackEl.classList.remove("success", "error");

        await loadPokemonDataFromFile(fileInputEl.files[0]);

        loadingEl.hidden = true;
        fileLoaderEl.hidden = true;
        questionAreaEl.hidden = false;
        updateScoreDisplay();
        setMode("mcq");
      } catch (err) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent =
          (err && err.message) ||
          "Erreur lors du chargement du fichier Excel sélectionné.";
      }
    });
  }
}

async function bootstrap() {
  try {
    await loadPokemonDataFromServer();
    loadingEl.hidden = true;
    errorEl.hidden = true;
    questionAreaEl.hidden = false;
    initEvents();
    updateScoreDisplay();
    setMode("mcq");
  } catch (err) {
    console.error(err);
    loadingEl.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent =
      (err && err.message) || "Erreur lors du chargement des données.";

    // Active le mode de sélection manuelle du fichier Excel
    if (fileLoaderEl) {
      fileLoaderEl.hidden = false;
    }

    initEvents();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap();
});

