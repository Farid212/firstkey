document.addEventListener("keypress", function (event) {
  goInvisible();
  console.log("event: ", event);
  const verified = verify(event);
  let actualKey = generateKeyCode();
  console.log("generateKC: ", actualKey);
  swapKey(actualKey);
});

function goInvisible() {
  $(".contentBorder")[0].style.background = "#" + randomColor();
  $("#msg").fadeOut();
}

function randomColor() {
  let hex = Math.round(Math.random() * 0xffffff).toString(16);
  while (hex.length < 6) hex = "0" + hex;
  return hex;
}

async function swapKey(param) {
  console.log(param);
  await playSound(Boolean(param));
  document.getElementById("msg").innerText = String.fromCharCode(param);
  $("#msg")[0].style.color = "white";
  $("#msg")[0].style.fontSize = "13rem";
  $("#msg").fadeIn();
}

function generateKeyCode() {
  return Math.floor(Math.random() * (122 - 97 + 1)) + 97;
}

function verify(keypressEvent) {
  let answer = false;

  const text = document.getElementById("msg").innerText;
  const charCode = text.charCodeAt(0);

  console.log("transformed CharCode: ", charCode);

  return answer;
}

function playSound(e) {
  const wrongAnswer = new Audio("./assets/audio/WA3.mp3");
  const correctAnswer = new Audio("./assets/audio/CA1.mp3");

  e
    ? () => {
        correctAnswer.currentTime = 0;
        correctAnswer.play();
      }
    : () => {
        wrongAnswer.currentTime = 0;
        wrongAnswer.play();
      };
}

function startGame() {}
