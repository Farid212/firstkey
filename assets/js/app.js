(() => {
  let msg = document.getElementById("msg");

  document.addEventListener("keypress", event => changeActualKey(event));

  const randomColor = () => {
    let hex = Math.round(Math.random() * 0xffffff).toString(16);
    while (hex.length < 6) hex = "0" + hex;
    return hex;
  };

  const changeActualKey = param => {
    document.getElementsByClassName("contentBorder")[0].style.background = "#" + randomColor();
    
    msg.innerHTML = param.key;
    msg.className = zoomer;
  };
})();
