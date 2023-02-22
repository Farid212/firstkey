(() => {
  function promiseGoInvisible() {
    $(".contentBorder")[0].style.background = "#" + randomColor();
    $("#msg").fadeOut();
  }

  function randomColor() {
    let hex = Math.round(Math.random() * 0xffffff).toString(16);
    while (hex.length < 6) hex = "0" + hex;
    return hex;
  }

  function swapKey(param) {
    randomLetter();
    document.getElementById("msg").innerText = param.key;

    $("#msg")[0].style.color = "white";
    $("#msg")[0].style.fontSize = "13rem";
    $("#msg").fadeIn();
  }

  document.addEventListener("keypress", function (event) {
    promiseGoInvisible();
    swapKey(event);
  });

  function randomLetter() {
    let randamKeyCode = Math.floor(Math.random() * 90 + 65);
    console.log(randamKeyCode);
  }
})();
