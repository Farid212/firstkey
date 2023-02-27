let score = 0; // ini score to 0
let gameStarted = false; // init start game
let level = 1; // init lvl to 1
let correctAnswers = 0; // init correct answers to 0
let patternCode;
let keyStroke = [];
let patternIndex = 0;
let verified = false;
const levelDefinition = 25;

document.addEventListener("keydown", (event) => {
  console.log(event);
  if (event.code === "Space" && !gameStarted) {
    let userLevel = prompt("What level do you want to start? (1-10)");
    if (userLevel > 0 && userLevel < 11) {
      level = userLevel;
    } else {
      level = 1;
    }
    gameStarted = true;
    document.getElementById("msg").style.display = "none";
    updateGame();
  } else {
    if (gameStarted && level === 1 && correctAnswers < 50) {
      const letter =
        document.getElementsByClassName("basic-letter")[0].innerHTML;
      let verified = event.key === letter ? true : false;
      nextLevel(verified);
    } else if (gameStarted && level > 1 && correctAnswers < 50 * level) {
      console.log("condition 2");
      patternCode = document.getElementsByClassName("basic-letter");
      if (event.key === patternCode[patternIndex].innerHTML) {
        playSound(true);
        patternCode[patternIndex].classList.add("right");
        patternIndex++;
        if (patternIndex === patternCode.length) {
          patternIndex = 0;
          nextLevel(true);
        }
      } else {
        playSound(false);
        for (const el of patternCode) {
          el.classList.remove("right");
        }
        patternIndex = 0;
      }
    }
  }

  const scoreEl = document.getElementById("score");
  scoreEl.innerHTML = `Score: ${score}`;
  const levelEl = document.getElementById("level");
  levelEl.innerHTML = `Level: ${level}`;
});

function updateGame() {
  const gameEl = document.getElementById("letters-box");
  let letters = generateRandomLetter();
  console.log(letters);
  let things = "";
  for (const letter of letters) {
    things += `<div class="basic-letter">${letter}</div>`;
  }
  gameEl.innerHTML = things;
}

// generate the game random letter
function generateRandomLetter() {
  let currentLetters = "";
  const options = "abcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < level; i++) {
    const randomIndex = Math.floor(Math.random() * options.length);
    currentLetters += options[randomIndex];
  }
  return currentLetters;
}
// update background color
function updateBgColor() {
  let hex = Math.round(Math.random() * 0xffffff).toString(16);
  while (hex.length < 6) hex = "0" + hex;
  document.getElementsByClassName("contentBorder")[0].style.backgroundColor =
    "#" + hex;
}

// right or wrong song
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

//move to next step
function nextLevel(verified) {
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
}
