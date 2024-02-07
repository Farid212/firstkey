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
  // console.log(event);
  if (event.code === "Space" && !gameStarted) {
    let userLevel = prompt("What level do you want to start? (1-10)");
    if (userLevel > 1 && userLevel < 11) {
      level = userLevel;
      correctAnswers = (level - 1) * 25;
    } else {
      level = 1;
    }
    gameStarted = true;
    document.getElementById("msg").style.display = "none";
    updateGame();
  } else {
    if (gameStarted && level === 1 && correctAnswers < levelDefinition) {
      const letter =
        document.getElementsByClassName("basic-letter")[0].innerHTML;
      let verified = event.key === letter ? true : false;
      nextLevel(verified);
    } else if (
      gameStarted &&
      level > 1 &&
      correctAnswers < levelDefinition * level
    ) {
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
    score += level;
    correctAnswers++;
    playSound(true);
    if (correctAnswers === levelDefinition * level) {
      level++;
    }
    updateBgColor();
    updateGame();
  } else playSound(false);
}

async function updateGame() {
  const gameEl = document.getElementById("letters-box");
  let letters = await generateRandomLetter();
  if (!letters) return;
  let things = "";
  for (const letter of letters) {
    things += `<div class="basic-letter">${letter}</div>`;
  }
  gameEl.innerHTML = things;
}

// generate the game random letter
async function generateRandomLetter() {
  let currentLetters = "";
  const options = "abcdefghijklmnopqrstuvwxyz1234567890";
  if (level === 1) {
    for (let i = 0; i < level; i++) {
      const randomIndex = Math.floor(Math.random() * options.length);
      currentLetters += options[randomIndex];
    }
  } else {
    try {
      const dataPromise = await fetchData();
      const data = await dataPromise;
      if (data && data.length > 0) {
        currentLetters = data[0];
      } else {
        for (let i = 0; i < level; i++) {
          const randomIndex = Math.floor(Math.random() * options.length);
          currentLetters += options[randomIndex];
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  return currentLetters;
}

async function fetchData() {
  try {
    const response = await fetch(
      `https://random-word-api.herokuapp.com/word?length=${level}`
    );
    const responseAsJson = await response.json();
    return responseAsJson;
  } catch (error) {
    console.log(error);
    return error;
  }
}
