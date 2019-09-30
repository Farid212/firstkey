(() => {

	const promiseGoInvisible = () =>{ 
		return new Promise((resolve)=>{
			$(".contentBorder")[0].style.background = "#" + randomColor();  
			resolve($("#msg").fadeOut())	
		})
	}

	const randomColor = () => {
		let hex = Math.round(Math.random() * 0xffffff).toString(16);
    	while (hex.length < 6) hex = "0" + hex;
    	return hex;
	};

	const swapKey = param => { 
		return new Promise ((resolve)=>{
			resolve(
				document.getElementById("msg").innerText = param.key,
				$("#msg")[0].style.color = "white",
				$("#msg")[0].style.fontSize = "13rem",
				$("#msg").fadeIn()
			)
		})
		 
	}


	document.addEventListener("keypress", async function(event){
		await promiseGoInvisible()
		await swapKey(event)
	});

})();
