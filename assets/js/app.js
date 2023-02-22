let score = 0;
let gameStarted = false;
const correctAnswer = new Audio("./audio/CA1.mp3");
const wrongAnswer = new Audio("./audio/WA3.mp3");

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !gameStarted) {
    gameStarted = true;
    updateGame();
  } else if (gameStarted) {
    const gameEl = document.getElementById("msg");
    if (event.key === gameEl.innerHTML) {
      score++;
      playSound(true);
      updateGame();
    } else {
      playSound(false);
    }
  }
  const scoreEl = document.getElementById("score");
  scoreEl.innerHTML = `Score: ${score}`;
});

function playSound(bool) {
  if (!bool) {
    wrongAnswer.currentTime = 0;
    wrongAnswer.play();
  } else {
    correctAnswer.currentTime = 0;
    correctAnswer.play();
  }
}

function updateGame() {
  const gameEl = document.getElementById("msg");
  gameEl.innerHTML = generateRandomLetter();
}

// generate the game random letter
function generateRandomLetter() {
  const options = "abcdefghijklmnopqrstuvwxyz1234567890";
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}
