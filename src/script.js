import target from "./wordLists/target.json" assert { type: "json" };
import dictionary from "./wordLists/dictionary.json" assert { type: "json" };
//const targetJSON = JSON.stringify(target);
const targetWordsArray = Object.values(target);
const dictionaryArray = Object.values(dictionary);
const winMessages = [
  "Impressive",
  "You Rock",
  "You Win",
  "Amazing",
  "Magnificent",
];
const loseMessages = [
  "You lose",
  "Are you stupid?",
  "Do you speak English?",
  "Must try harder",
  "'F' for effort",
];
const WORD_LENGTH = 5;
const ANIMATION_DURATION = 500;
const offsetFromDate = new Date(2021, 10, 1);
const msOffset = Date.now() - offsetFromDate;
const dayOffet = Math.floor(msOffset / 1000 / 60 / 60 / 24);
const targetWord = targetWordsArray[dayOffet];

const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const gameGrid = document.querySelector("[data-game-grid]");

console.log(targetWord);
startInteraction();

function startInteraction() {
  document.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeypress);
}

function stopinteraction() {
  document.removeEventListener("click", handleClick);
  document.removeEventListener("keydown", handleKeypress);
}

function handleClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }
  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }
  if (e.target.matches("[data-delete]")) {
    deleteKey();
    return;
  }
}

function handleKeypress(e) {
  if (e.key === "Enter") {
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey();
    return;
  }

  if (e.key.match(/^[a-z]{1}$/i)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  const currentRow = gameGrid.querySelector('[data-active="current"]');
  const nextBlankTile = currentRow.querySelector(":not([data-letter])");
  if (nextBlankTile == null) return;
  nextBlankTile.dataset.letter = key.toLowerCase();
  nextBlankTile.textContent = key;
  nextBlankTile.dataset.state = "active";
}

function deleteKey() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile == null) return;
  lastTile.textContent = "";
  lastTile.dataset.state = "empty";
  delete lastTile.dataset.letter;
}

function getActiveTiles() {
  const currentRow = gameGrid.querySelector('[data-active="current"]');
  return currentRow.querySelectorAll('[data-state = "active"]');
}

function getCurrentRowTiles() {
  const currentRow = gameGrid.querySelector('[data-active="current"]');
  return currentRow.querySelectorAll("[data-state]");
}

function submitGuess() {
  const currentRowTiles = [...getCurrentRowTiles()];
  const activeTiles = [...getActiveTiles()];

  if (activeTiles.length != WORD_LENGTH) {
    showAlert("Not enough letters");
    shaketiles(currentRowTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");

  if (!dictionaryArray.includes(guess) && !targetWordsArray.includes(guess)) {
    showAlert("Not in word list");
    shaketiles(currentRowTiles);
    return;
  }

  stopinteraction();
  activeTiles.forEach((...params) => flipTile(...params, guess));
}

function evaluateGuess(guess, target) {
  const guessArr = [...guess];
  const targArr = [...target];
  const result = new Array(5).fill("absent");

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] == targArr[i]) {
      result[i] = "correct";
      delete guessArr[i];
      delete targArr[i];
    }
  }
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] != undefined && targArr.includes(guessArr[i])) {
      result[i] = "present";

      delete targArr[targArr.indexOf(guessArr[i])];
      delete guessArr[i];
    }
  }

  return result;
}

function flipTile(tile, index, array, guess) {
  const currentRow = gameGrid.querySelector('[data-active="current"]');
  const nextRow = gameGrid.querySelector(".row:not([data-active])");
  const letter = tile.dataset.letter;
  const evaluated = evaluateGuess(guess, targetWord);
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * ANIMATION_DURATION) / 2);
  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");
      tile.dataset.state = evaluated[index];
      if (key.dataset.state !== "correct") {
        key.dataset.state = evaluated[index];
      }

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            if (nextRow != null) nextRow.dataset.active = "current";
            currentRow.dataset.active = "completed";
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

function checkWinLose(guess, tiles) {
  console.log(guess === targetWord);
  if (guess === targetWord) {
    var rand = Math.floor(Math.random() * winMessages.length);
    console.log(rand);
    const winMsg = winMessages[rand];
    stopinteraction();
    showAlertWinLose(winMsg, 3000);
    danceTiles(tiles);
    return;
  }

  const completedRows = gameGrid.querySelectorAll(
    '[data-active="completed"]'
  ).length;
  if (completedRows === 6) {
    rand = Math.floor(Math.random() * loseMessages.length);
    console.log(rand);
    const loseMsg = loseMessages[rand];
    stopinteraction();
    const msgArr = [
      loseMsg,
      "The word you were looking for was...",
      targetWord.toUpperCase(),
    ];
    const allTiles = gameGrid.querySelectorAll("[data-letter]");
    shaketiles(allTiles);
    msgArr.forEach((msg, index) => {
      setTimeout(() => {
        showAlertWinLose(msg, null);
      }, index * 1500);
    });
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * ANIMATION_DURATION) / 5);
  });
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);

  if (duration == null) return;

  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}
function showAlertWinLose(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert-W-L");
  alertContainer.append(alert);
  setTimeout(() => {
    alert.classList.add("show");
  }, 100);
  if (duration == null) return;
  alert.addEventListener("transitionend", () => {
    setTimeout(() => {
      alert.classList.add("hide");
      alert.addEventListener("transitionend", () => {
        alert.remove();
      });
    }, duration);
  });
}

function shaketiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}
