let score = 0; // ini score to 0
let gameStarted = false; // init start game
let level = 1; // init lvl to 1
let letterCount = 1; // init count letter to 1
let correctAnswers = 0; // init correct answers to 0
let patternCode;

document.addEventListener("keydown", (event) => {
  console.log(event);
  if (event.code === "Space" && !gameStarted) {
    gameStarted = true;
    updateGame();
  } else {
    if (gameStarted && score < 50 && correctAnswers < 50) {
      const letter = document.getElementById("msg").innerHTML;
      let verified = event.key === letter ? true : false;
      if (verified) {
        score++;
        correctAnswers++;
        playSound(true);
        if (correctAnswers === 50 * level) {
          level++;
          letterCount++;
          correctAnswers = 0;
        }
        updateBgColor();
        updateGame();
      } else playSound(false);
    } else if (gameStarted && score >= 50 && correctAnswers < 50 * level) {
      console.log("condition 2");
      patternCode = document.getElementById("msg").innerHTML.split("");
      let patternIndex = 0;

      if (event.key.toLocaleLowerCase() === patternCode[patternIndex]) {
        patternIndex++;
        if (patternIndex === patternCode.length) {
          patternIndex = 0;
          score++;
          correctAnswers++;
          playSound(true);
          if (correctAnswers === 50 * level) {
            level++;
            letterCount++;
            correctAnswers = 0;
          }
          updateBgColor();
          updateGame;
        }
      } else playSound(false);
    }
  }

  const scoreEl = document.getElementById("score");
  scoreEl.innerHTML = `Score: ${score}`;
  const levelEl = document.getElementById("level");
  levelEl.innerHTML = `Level: ${level}`;
});

function listenKeyStroke(event, patternCode, patternIndex, verified) {
  if (event.code === patternCode[patternIndex]) {
    patternIndex++;
    if (patternIndex === patternCode.length) {
      verified = true;
      patternIndex = 0;
    }
  } else {
    verified = false;
    patternIndex = 0;
  }
}

function updateGame() {
  const gameEl = document.getElementById("msg");
  gameEl.innerHTML = generateRandomLetter();
}

// generate the game random letter
function generateRandomLetter() {
  let currentLetters = "";
  const options = "abcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < letterCount; i++) {
    const randomIndex = Math.floor(Math.random() * options.length);
    currentLetters += options[randomIndex];
  }
  return currentLetters;
}

function checkInput(input, count) {
  const letters = document.getElementById("msg").innerHTML;
  if (count === 1) {
    if (input.key === letters) {
      return true;
    } else return false;
  }
}

function checkMultipleInput(event, pattern, current) {
  if (pattern.indexOf(event.key) < 0 || event.key[current]) {
    current = 0;
    return false;
  }

  if (pattern.length === current) {
    return true;
  } else {
    current++;
  }
}

function updateBgColor() {
  document.getElementsByClassName("contentBorder")[0].style.backgroundColor =
    "#" + randomColor();
}

function randomColor() {
  let hex = Math.round(Math.random() * 0xffffff).toString(16);
  while (hex.length < 6) hex = "0" + hex;
  return hex;
}

function playSound(answer) {
  const correctAnswerSound = document.getElementById("correctAnswer");
  const wrongAnswerSound = document.getElementById("wrongAnswer");

  if (answer) {
    correctAnswerSound.currentTime = 0;
    correctAnswerSound.play();
  } else {
    wrongAnswerSound.currentTime = 0;
    wrongAnswerSound.play();
  }
}
