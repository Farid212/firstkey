let score = 0;
let gameStarted = false;
const correctAnswer = document.getElementById("correctAnswer")
const wrongAnswer = document.getElementById("wrongAnswer")

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !gameStarted) {
    gameStarted = true;
    updateGame();
  } else if (gameStarted) {
    const gameEl = document.getElementById("msg");
    if (event.key === gameEl.innerHTML) {
      score++;
      correctAnswer.currentTime = 0;
      correctAnswer.play()
      updateGame();
    } else {
      wrongAnswer.currentTime = 0;
      wrongAnswer.play()
    }
  }
  const scoreEl = document.getElementById("score");
  scoreEl.innerHTML = `Score: ${score}`;
});

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
