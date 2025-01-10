document.addEventListener("DOMContentLoaded", () => {
	let bandmode = 0,
		currentband = 0,
		bandnum = 0,
		tolerancemode = 0,
		gainmode = 0,
		modemode = 0,
		noisemode = 0,
		showsettings = false,
		showstatistics = false,
		frequency = [],
		qfactor = [],
		gain = [],
		xValues = [],
		yValues = [],
		correctgain = [],
		correctfreq = [],
		correctq = [],
		bypassed = true,
		filterlist = [],
		tolerance = 0,
		rounds = 1,
		correctfilterlist = [],
		lives = Number.MAX_VALUE,
		score = 0,
		wins = 0,
		loses = 0,
		delay = true,
		light = true,
		roundreq = Number.MAX_VALUE; //all variables are initalized here
	let bandcolors = ["rgba(255,0,0,", "rgba(255,127,0,", "rgba(255,255,0,", "rgba(0,255,0,", "rgba(0,0,255,"]; //colors, wtihout the opacity
	document.querySelectorAll(".buttoncontainer").forEach((e, i) => { //setting buttons
		Array.from(e.children).forEach((f, j) => {
			f.addEventListener("click", () => {
				switch (i) {
					case 0:
						document.querySelectorAll(".buttoncontainer")[i].children[bandmode].classList.remove("green"); //each case switches the color around and saves it
						bandmode = j;
						document.querySelectorAll(".buttoncontainer")[i].children[bandmode].classList.add("green");
						break;

					case 1:
						document.querySelectorAll(".buttoncontainer")[i].children[tolerancemode].classList.remove("green");
						tolerancemode = j;
						document.querySelectorAll(".buttoncontainer")[i].children[tolerancemode].classList.add("green");
						break;

					case 2:
						document.querySelectorAll(".buttoncontainer")[i].children[gainmode].classList.remove("green");
						gainmode = j;
						document.querySelectorAll(".buttoncontainer")[i].children[gainmode].classList.add("green");
						break;

					case 3:
						document.querySelectorAll(".buttoncontainer")[i].children[modemode].classList.remove("green");
						modemode = j;
						document.querySelectorAll(".buttoncontainer")[i].children[modemode].classList.add("green");
						break;

					case 4:
						if (j < 3) {
							document.querySelectorAll(".buttoncontainer")[i].children[noisemode].classList.remove("green");
							noisemode = j;
							document.querySelectorAll(".buttoncontainer")[i].children[noisemode].classList.add("green");
						}
						if (j === 3) {
							showsettings = !showsettings;
							showsettings
								? document.querySelectorAll(".buttoncontainer")[i].children[3].classList.add("green")
								: document.querySelectorAll(".buttoncontainer")[i].children[3].classList.remove("green");
						}
						if (j === 4) {
							showstatistics = !showstatistics;
							showstatistics
								? document.querySelectorAll(".buttoncontainer")[i].children[4].classList.add("green")
								: document.querySelectorAll(".buttoncontainer")[i].children[4].classList.remove("green");
						}
						break;

					default:
						break;
				}
			});
		});
	});
	let audio, bypassedaudio;
	function restart() { //restart after completing a game
		audio.close(); //close all playing audio
		bypassedaudio.close();
		correctq = [];
		correctfreq = [];
		correctgain = [];
		correctfilterlist = [];
		frequency = [];
		qfactor = [];
		gain = [];
		filterlist = [];
		document.getElementById("bandselect").innerHTML = "";
		chart.data.datasets = [];
		let date1 = Date.now();
		document.getElementById("fader").style.display = "none";
		document.getElementById("game").style.display = "flex";
		bandnum = [1, 3, 5, Math.round(Math.random() * 4) + 1][bandmode]; //setting setup
		audio = new AudioContext();
		let track;
		let othertrack;
		fetch(["/eqgame/assets/audio/pink_noise.wav", "/eqgame/assets/audio/brown_noise.wav", "/eqgame/assets/audio/white_noise.wav"][noisemode]) //grab audio file
			.then((response) => response.arrayBuffer())
			.then((buffer) => audio.decodeAudioData(buffer)) //decode data
			.then((decodedData) => {
				track = audio.createBufferSource();
				track.buffer = decodedData;
				prevfilter = track;
				document.getElementById("audiostatus").innerHTML = "Audio file decoded!";
				for (let i = 0; i < bandnum; i++) { //loops for every band and chains the peaking eq filters together, with given parameters
					let filter = audio.createBiquadFilter();
					filter.type = "peaking";
					let pendingQ = Math.round(Math.random() * 100) / 10;
					correctq.push(pendingQ);
					filter.Q.value = pendingQ;
					let pendinggain = (Math.random() * (12 - 3 * gainmode) + 3 * gainmode) * [-1, 1][Math.round(Math.random())];
					correctgain.push(pendinggain);
					filter.gain.value = pendinggain;
					let pendingfreq = Math.pow(10, Math.random() * 3 + 1.30103);
					correctfreq.push(pendingfreq);
					filter.frequency.value = pendingfreq;
					document.getElementById("audiostatus").innerHTML = "Filter #" + (i + 1) + " Applied!";
					prevfilter.connect(filter);
					if (i === bandnum - 1) filter.connect(audio.destination);
					prevfilter = filter;
					correctfilterlist.push(filter);
				}
				track.loop = true;
				track.start();
				if (!bypassed) audio.suspend(); //save audio choice from last time
				let date2 = Date.now();
				document.getElementById("audiostatus").innerHTML = "Audio is playing! (" + (date2 - date1) + "ms to load)";
			});
		bypassedaudio = new AudioContext();
		fetch(["/eqgame/assets/audio/pink_noise.wav", "/eqgame/assets/audio/brown_noise.wav", "/eqgame/assets/audio/white_noise.wav"][noisemode]) //same thing as above
			.then((response) => response.arrayBuffer())
			.then((buffer) => bypassedaudio.decodeAudioData(buffer))
			.then((decodedData) => {
				othertrack = bypassedaudio.createBufferSource();
				othertrack.buffer = decodedData;
				let prevfilter = othertrack;
				for (let i = 0; i < bandnum; i++) {
					let filter = bypassedaudio.createBiquadFilter();
					filter.type = "peaking";
					let pendingQ = 1;
					filter.Q.value = pendingQ;
					let pendinggain = 6;
					filter.gain.value = pendinggain;
					let pendingfreq = 1000 * (i + 1);
					filter.frequency.value = pendingfreq;
					prevfilter.connect(filter);
					if (i === bandnum - 1) filter.connect(bypassedaudio.destination);
					prevfilter = filter;
					filterlist.push(filter);
				}
				othertrack.loop = true;
				othertrack.start();
				if (bypassed) bypassedaudio.suspend();
			});
		for (let i = 0; i < bandnum; i++) { //start plotting all the graphs
			frequency[i] = 1000 * (i + 1);
			gain[i] = 6;
			qfactor[i] = 1;
			yValues = [];
			xValues = [];
			generate(i); //generates the graph
			chart.data.datasets.push({ //graph of the eq curve
				type: "line",
				fill: true,
				backgroundColor: bandcolors[i] + "0.5)",
				pointRadius: 0,
				borderColor: bandcolors[i] + "1)",
				data: yValues,
				label: xValues,
				dragData: false,
			});
			chart.data.datasets.push({ //draggable point for movement
				type: "scatter",
				fill: true,
				backgroundColor: bandcolors[i] + "1)",
				pointRadius: 5,
				borderColor: bandcolors[i] + "1)",
				data: [{ x: frequency[i], y: gain[i] }],
				pointHitRadius: 50,
				dragData: true,
			});
			chart.data.labels = xValues;
			let element = document.createElement("div"); //create and style the buttons on the bottom
			element.classList.add("bandselectbutton");
			if (i === 0) element.classList.add("bandselected");
			element.id = "bandselect" + i;
			element.innerHTML = "Band " + (i + 1);
			element.style.backgroundImage = "radial-gradient(circle, " + bandcolors[i] + "1) 0%, " + bandcolors[i] + "0.6) 100%)";
			document.getElementById("bandselect").appendChild(element);
		}
		document.getElementById("bypassfilter").innerHTML = bypassed ? "Playing: Sound to Guess" : "Playing: Your Guess";
		chart.update("none"); //update the chart (without lag)
	}
	function fade2(start, end, current, time) { //second portion of the fading animation
		document.getElementById("fader").style.opacity = current;
		document.getElementById("bandselect").innerHTML = "";
		if (current <= end) { //once animation is finished, run process similar to restart
			let date1 = Date.now();
			document.getElementById("fader").style.display = "none";
			document.getElementById("game").style.display = "flex";
			bandnum = [1, 3, 5, Math.round(Math.random() * 4) + 1][bandmode];
			audio = new AudioContext();
			let track;
			let othertrack;
			fetch(["/eqgame/assets/audio/pink_noise.wav", "/eqgame/assets/audio/brown_noise.wav", "/eqgame/assets/audio/white_noise.wav"][noisemode]) //same thing
				.then((response) => response.arrayBuffer())
				.then((buffer) => audio.decodeAudioData(buffer))
				.then((decodedData) => {
					track = audio.createBufferSource();
					track.buffer = decodedData;
					prevfilter = track;
					document.getElementById("audiostatus").innerHTML = "Audio file decoded!";
					for (let i = 0; i < bandnum; i++) {
						let filter = audio.createBiquadFilter();
						filter.type = "peaking";
						let pendingQ = Math.round(Math.random() * 100) / 10;
						correctq.push(pendingQ);
						filter.Q.value = pendingQ;
						let pendinggain = (Math.random() * (12 - 3 * gainmode) + 3 * gainmode) * [-1, 1][Math.round(Math.random())];
						correctgain.push(pendinggain);
						filter.gain.value = pendinggain;
						let pendingfreq = Math.pow(10, Math.random() * 3 + 1.30103);
						correctfreq.push(pendingfreq);
						filter.frequency.value = pendingfreq;
						document.getElementById("audiostatus").innerHTML = "Filter #" + (i + 1) + " Applied!";
						prevfilter.connect(filter);
						if (i === bandnum - 1) filter.connect(audio.destination);
						prevfilter = filter;
						correctfilterlist.push(filter);
					}
					track.loop = true;
					track.start();
					let date2 = Date.now();
					document.getElementById("audiostatus").innerHTML = "Audio is playing! (" + (date2 - date1) + "ms to load)";
				});
			bypassedaudio = new AudioContext();
			fetch(["/eqgame/assets/audio/pink_noise.wav", "/eqgame/assets/audio/brown_noise.wav", "/eqgame/assets/audio/white_noise.wav"][noisemode]) //same thing
				.then((response) => response.arrayBuffer())
				.then((buffer) => bypassedaudio.decodeAudioData(buffer))
				.then((decodedData) => {
					othertrack = bypassedaudio.createBufferSource();
					othertrack.buffer = decodedData;
					let prevfilter = othertrack;
					for (let i = 0; i < bandnum; i++) {
						let filter = bypassedaudio.createBiquadFilter();
						filter.type = "peaking";
						let pendingQ = 1;
						filter.Q.value = pendingQ;
						let pendinggain = 6;
						filter.gain.value = pendinggain;
						let pendingfreq = 1000 * (i + 1);
						filter.frequency.value = pendingfreq;
						prevfilter.connect(filter);
						if (i === bandnum - 1) filter.connect(bypassedaudio.destination);
						filterlist.push(filter);
					}
					othertrack.loop = true;
					othertrack.start();
					bypassedaudio.suspend();
					document.getElementById("bypassfilter").addEventListener("click", () => { //button funcitonality
						bypassed = !bypassed;
						document.getElementById("bypassfilter").innerHTML = bypassed ? "Playing: Sound to Guess" : "Playing: Your Guess";
						if (bypassed) {
							bypassedaudio.suspend();
							audio.resume();
						} else {
							bypassedaudio.resume();
							audio.suspend();
						}
					});
					document.addEventListener("keydown", (e) => { //same thing but with space key
						if (e.code === "Space") {
							bypassed = !bypassed;
							document.getElementById("bypassfilter").innerHTML = bypassed ? "Playing: Sound to Guess" : "Playing: Your Guess";
							if (bypassed) {
								bypassedaudio.suspend();
								audio.resume();
							} else {
								bypassedaudio.resume();
								audio.suspend();
							}
						}
					});
				});
			for (let i = 0; i < bandnum; i++) {  //same thing
				frequency[i] = 1000 * (i + 1);
				gain[i] = 6;
				qfactor[i] = 1;
				yValues = [];
				xValues = [];
				generate(i);
				chart.data.datasets.push({
					type: "line",
					fill: true,
					backgroundColor: bandcolors[i] + "0.5)",
					pointRadius: 0,
					borderColor: bandcolors[i] + "1)",
					data: yValues,
					label: xValues,
					dragData: false,
				});
				chart.data.datasets.push({
					type: "scatter",
					fill: true,
					backgroundColor: bandcolors[i] + "1)",
					pointRadius: 5,
					borderColor: bandcolors[i] + "1)",
					data: [{ x: frequency[i], y: gain[i] }],
					pointHitRadius: 50,
					dragData: true,
				});
				chart.data.labels = xValues;
				let element = document.createElement("div");
				element.classList.add("bandselectbutton");
				if (i === 0) element.classList.add("bandselected");
				element.id = "bandselect" + i;
				element.innerHTML = "Band " + (i + 1);
				element.style.backgroundImage = "radial-gradient(circle, " + bandcolors[i] + "1) 0%, " + bandcolors[i] + "0.6) 100%)";
				document.getElementById("bandselect").appendChild(element);
			}
			document.querySelectorAll(".bandselectbutton").forEach((e, i) => { //band switching via buttons
				e.addEventListener("click", () => {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = i;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				});
			});
			document.addEventListener("keydown", (e) => {//band switching via number keys
				if (e.code === "Digit1") {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = 0;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				}
				if (e.code === "Digit2" && bandnum >= 1) {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = 1;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				}
				if (e.code === "Digit3" && bandnum >= 1) {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = 2;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				}
				if (e.code === "Digit4" && bandnum >= 4) {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = 3;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				}
				if (e.code === "Digit5" && bandnum >= 5) {
					document.getElementById("bandselect" + currentband).classList.remove("bandselected");
					currentband = 4;
					document.getElementById("bandselect" + currentband).classList.add("bandselected");
					document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
					document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
				}
			});
			//process settings
			tolerance = [0.8, 0.6, 0.4, 1, 1][tolerancemode];
			lives = [1, 3, 5, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE][modemode];
			roundreq = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 10, 25, Number.MAX_VALUE][modemode];
			if (modemode <= 2) document.getElementById("gamedisplay").innerHTML = "Lives: " + lives;
			if (modemode >= 3) document.getElementById("gamedisplay").innerHTML = "Score: " + score;
			document.getElementById("settings").style.opacity = showsettings ? "1" : "0";
			document.getElementById("statisticsdisplay").style.opacity = showstatistics ? "1" : "0";
			document.getElementById("settings").innerHTML =
				"Band: " +
				["1 Band", "3 Band", "5 Band", "Random"][bandmode] +
				"<br>Tolerance: " +
				["Low", "Medium", "High", "Decreasing", "Adjusted"][tolerancemode] +
				"<br>Gain: " +
				["Random", "Low", "Medium", "High"][gainmode] +
				"<br>Mode: " +
				["1 Life", "3 Lives", "5 Lives", "10 Rounds", "25 Rounds", "Endless"][modemode] +
				"<br>Noise: " +
				["Pink", "Brown", "White"][noisemode];
			//settings display on the right
			chart.update("none");
			return;
		}
		setTimeout(fade2, 1, start, end, current + (end - start) / time, time);
	}
	function fade1(start, end, current, time) { //first part of the fading animation
		document.getElementById("fader").style.opacity = current;
		if (current >= end) {
			document.getElementById("selectmenu").style.display = "none";
			setTimeout(fade2, 1, 1, 0, 1, 150);
			return;
		}
		setTimeout(fade1, 1, start, end, current + (end - start) / time, time);
	}
	function fade3(start, end, current, time) { // second part of the ending animation
		document.getElementById("fader").style.opacity = current;
		if (current <= end) {
			document.getElementById("fader").style.display = "none";
			document.getElementById("selectmenu").style.display = "flex";
			document.getElementById("gamedisplay").innerHTML = "Menu";
			document.getElementById("statisticsdisplay").innerHTML = 'Round #1<span id="fpsdisplay"></span>';
			frequency = [];
			qfactor = [];
			gain = [];
			xValues = [];
			yValues = [];
			correctgain = [];
			correctfreq = [];
			correctq = [];
			bypassed = true;
			filterlist = [];
			tolerance = 0;
			rounds = 1;
			correctfilterlist = [];
			lives = Number.MAX_VALUE;
			score = 0;
			wins = 0;
			loses = 0;
			delay = true;
			light = true;
			roundreq = Number.MAX_VALUE;
			chart.data.datasets = [];
			//reset literally everything and update the chart to clear
			chart.update("none");
			return;
		}
		setTimeout(fade3, 1, start, end, current + (end - start) / time, time);
	}
	function fade4(start, end, current, time) { //first part of the ending animation
		document.getElementById("fader").style.opacity = current;
		if (current >= end) {
			document.getElementById("game").style.display = "none";
			setTimeout(fade3, 1, 1, 0, 1, 150);
			return;
		}
		setTimeout(fade4, 1, start, end, current + (end - start) / time, time);
	}
	document.getElementById("play").addEventListener("click", () => { //play button that starts the game
		document.getElementById("fader").style.display = "block";
		fade1(0, 1, 0, 150);
	});
	let fps, fps1;
	function tick() { //fps tracking for performance issues
		let fps2 = Date.now();
		fps = fps2 - fps1;
		try {
			document.getElementById("fpsdisplay").innerHTML = "FPS: " + (1000 / fps).toFixed(4) + " (" + fps + "ms)";
		} catch (e) {}
		fps1 = fps2;
		window.requestAnimationFrame(tick);
	}
	fps1 = new Date();
	window.requestAnimationFrame(tick);
	//horrors lie ahead. generates the eq curve
	function generate(i) {
		let equation = //see the reference.png for a readable version of the equation
			Math.abs(gain[i]) > 3
				? "" +
				  gain[i] +
				  " * Math.pow(Math.E, (-1 * Math.pow(Math.log(x) - Math.log( " +
				  frequency[i] +
				  " ), 2)) / ( " +
				  frequency[i] +
				  " / (Math.pow(Math.E, Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(( " +
				  gain[i] +
				  " " +
				  (gain[i] > 0 ? "-" : "+") +
				  " 3) / " +
				  gain[i] +
				  " )) + Math.log( " +
				  frequency[i] +
				  " )) - Math.pow(Math.E, -1 * Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(( " +
				  gain[i] +
				  " " +
				  (gain[i] > 0 ? "-" : "+") +
				  " 3) / " +
				  gain[i] +
				  " )) + Math.log( " +
				  frequency[i] +
				  " )))))"
				: "" +
				  gain[i] +
				  " * Math.pow(Math.E, (-1 * Math.pow(Math.log(x) - Math.log( " +
				  frequency[i] +
				  " ), 2)) / ( " +
				  frequency[i] +
				  " / (Math.pow(Math.E, Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(0.065)) + Math.log( " +
				  frequency[i] +
				  " )) - Math.pow(Math.E, -1 * Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(0.065)) + Math.log( " +
				  frequency[i] +
				  " )))))";
				  /*formula explanation:
					a peaking eq curve is basically a normal distribution curve but on a log scaled graph
					the basic formula for it is
					y = a * e^(-(lnx-lnb)^2/c)
					a determines the height of the curve
					b determines where it is x-axis wise
					c determines the width of the curve
					a and b are easily represented with gain and frequency
					so we have y = g * e(-(lnx-lnf)^2/c)
					the issue lies with c
					a peaking eq curves' q factor is the center frequency divided by the difference between the frequency of the 2 points 3db off the central frequency in both directions
					to understand i used this: https://www.astralsound.com/parametric-eq.htm
					keep in mind other eq tools use different ways to represent this (some use half the gain amount), which is why visualizations look different
					start by solving for the frequency 3 db down (we will sub in q temporarily)
					g - 3 = g*e^(-(lnx-lnf)^2/q) base formula
					(g - 3) / g = e^(-(lnx-lnf)^2/q) divide by gain
					ln((g-3)/g) = -(lnx-lnf)^2/q take the natural log on both sides
					-qln((g-3)/g) = (lnx-lnf)^2 mulitply by -q
					sqrt(-qln((g-3)/g)) = lnx - lnf square root on both sides
					sqrt(-qln((g-3)/g))+lnf = lnx add natural log of frequency
					e^(sqrt(-qln((g-3)/g))+lnf) = x raise both sides to e
					repeat this process to get the frequency 3db down on the other side
					now we get the frequencies (f1 and f2) as
					f1 = e^(sqrt(-qln((g-3)/g))+lnf)
					f2 = e^(-sqrt(-qln((g-3)/g))+lnf)
					to get c we use the definition
					c = f / (f1 - f2)
					c = f / (e^(sqrt(-qln((g-3)/g))+lnf) - e^(-sqrt(-qln((g-3)/g))+lnf))
					subbing back in c we get
					y = g * e^(-(lnx-lnf)^2/(f / (e^(sqrt(-qln((g-3)/g))+lnf) - e^(-sqrt(-qln((g-3)/g))+lnf))))
					last problem is that filter under 3db cant be represented, as
					ln(x) is not a real number for 0 and all negatives
					also 3db down would be negative db, which the function never reaches as it cant go under 0 (including)
					to compromise we replace (g-3)/g with 0.000001 (or a value close enough to 0, i think i chose 0.065)
					y = g * e^(-(lnx-lnf)^2/(f / (e^(sqrt(-qln(0.00001))+lnf) - e^(-sqrt(-qln(0.00001))+lnf))))
					these two give us a near-perfect repersentation of a peaking eq curve
					near 3db theres a noticable jump in the graph but it works perfectly otherwise
				  */
		generateData(equation, Math.log10(20), Math.log10(20000), 100);
	}
	function updatechart(i) { //similar to generate, but doesn't generate x values
		yValues = [];
		let equation =
			Math.abs(gain[i]) > 3
				? "" +
				  gain[i] +
				  " * Math.pow(Math.E, (-1 * Math.pow(Math.log(x) - Math.log( " +
				  frequency[i] +
				  " ), 2)) / ( " +
				  frequency[i] +
				  " / (Math.pow(Math.E, Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(( " +
				  gain[i] +
				  " " +
				  (gain[i] > 0 ? "-" : "+") +
				  " 3) / " +
				  gain[i] +
				  " )) + Math.log( " +
				  frequency[i] +
				  " )) - Math.pow(Math.E, -1 * Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(( " +
				  gain[i] +
				  " " +
				  (gain[i] > 0 ? "-" : "+") +
				  " 3) / " +
				  gain[i] +
				  " )) + Math.log( " +
				  frequency[i] +
				  " )))))"
				: "" +
				  gain[i] +
				  " * Math.pow(Math.E, (-1 * Math.pow(Math.log(x) - Math.log( " +
				  frequency[i] +
				  " ), 2)) / ( " +
				  frequency[i] +
				  " / (Math.pow(Math.E, Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(0.065)) + Math.log( " +
				  frequency[i] +
				  " )) - Math.pow(Math.E, -1 * Math.sqrt(-1 * " +
				  qfactor[i] +
				  " * Math.log(0.065)) + Math.log( " +
				  frequency[i] +
				  " )))))";
		recalc(equation);
		chart.data.datasets[i * 2].data = yValues;
	}
	let chart = new Chart("eqgraph", { //setup chart at the very beginning
		data: {
			labels: xValues,
			datasets: [],
		},
		options: {
			plugins: {
				tooltip: {
					enabled: false,
				},
				legend: {
					display: false,
				},
				dragData: {
					round: 1,
					showTooltip: false,
					dragX: true,
					drayY: true,
					onDrag: function (e, datasetIndex, index, value) {
						gain[(datasetIndex - 1) / 2] = value.y;
						frequency[(datasetIndex - 1) / 2] = value.x;
						currentband = (datasetIndex - 1) / 2;
						document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
						updatechart((datasetIndex - 1) / 2);
						filterlist[(datasetIndex - 1) / 2].gain.value = value.y;
						filterlist[(datasetIndex - 1) / 2].frequency.value = value.x;
						document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
					},
				},
			},
			events: [],
			scales: {
				y: {
					suggestedMin: -12,
					suggestedMax: 12,
					title: {
						display: true,
						text: "Gain (dB)",
						font: {
							family: '"Lexend", sans-serif',
							weight: "600",
						},
					},
					grid: {
						color: "#00339988",
						lineWidth: 2,
					},
					ticks: {
						stepSize: 3,
						color: "black",
						font: {
							family: '"Lexend", sans-serif',
							weight: "600",
						},
					},
				},
				x: {
					type: "logarithmic",
					suggestedMin: 20,
					suggestedMax: 20000,
					grid: {
						color: "#00339988",
						lineWidth: 2,
					},
					title: {
						display: true,
						text: "Frequency (Hz)",
						font: {
							family: '"Lexend", sans-serif',
							weight: "600",
						},
					},
					ticks: {
						stepSize: 1000,
						color: "black",
						font: {
							family: '"Lexend", sans-serif',
							weight: "600",
						},
					},
				},
			},
		},
	});
	function generateData(value, i1, i2, step = 1) { //generate each x and y value
		for (let i = i1; i <= i2; i += (i2 - i1) / step) {
			x = Math.pow(10, i);
			yValues.push(eval(value));
			xValues.push(Math.pow(10, i));
		}
	}
	function recalc(value) { //recalculate y values on movement
		for (let i = 0; i < xValues.length; i++) {
			x = xValues[i];
			yValues.push(eval(value));
		}
	}
	document.getElementById("qrange").oninput = () => { //q factor slider
		qfactor[currentband] = document.getElementById("qrange").value;
		document.getElementById("qoutput").innerHTML = document.getElementById("qrange").value;
		filterlist[currentband].Q.value = document.getElementById("qrange").value;
		updatechart(currentband);
		chart.update("none");
	};
	document.getElementById("submit").addEventListener("click", () => { //submit
		if (delay) {
			let averagescore = 0;
			let frequencydifference = [];
			let gaindifference = [];
			let qdifference = [];
			let frequencyscore = [];
			let gainscore = [];
			let qscore = [];
			for (let i = 0; i < filterlist.length; i++) {
				let e = filterlist[i];
				frequencydifference.push(e.frequency.value - correctfreq[i]);
				gaindifference.push(e.gain.value - correctgain[i]);
				qdifference.push(e.Q.value - correctq[i]);
				//formulas for calculating score (might require some more tweaking)
				frequencyscore.push(2 / (1 + Math.pow(Math.E, 2 * Math.abs(Math.log10(correctfreq[i]) - Math.log10(e.frequency.value)))));
				gainscore.push(2 / (1 + Math.pow(Math.E, 1.25 * Math.abs(Math.log10(Math.abs(correctgain[i] - e.gain.value))))));
				qscore.push(2 / (1 + Math.pow(Math.E, 2 * Math.abs(Math.log10(correctq[i]) - Math.log10(e.Q.value)))));
				averagescore += frequencyscore[i] + gainscore[i] + qscore[i];
			}
			averagescore /= filterlist.length * 3;
			if (averagescore >= tolerance) { //handle winning and losing
				if (tolerancemode === 4) tolerance += 0.05;
				if (tolerancemode === 5) tolerance += 0.05;
				document.body.classList.add("green2");
				wins++;
				setTimeout(() => {
					document.body.classList.remove("green2");
				}, 2000);
			} else {
				if (tolerancemode === 4) tolerance -= 0.05;
				if (tolerancemode === 5) tolerance += 0.05;
				document.body.classList.add("red");
				lives--;
				loses++;
				setTimeout(() => {
					document.body.classList.remove("red");
				}, 2000);
			}
			score += Math.round(averagescore * 1500);
			rounds++;
			document.getElementById("statisticsdisplay").innerHTML = //statistic display on the left
				"- Last Round Statistics -<br><br> Frequency Error(s): <br>" +
				frequencydifference.map((e) => e.toFixed(3)).join(", ") +
				"<br>Gain Error(s): <br>" +
				gaindifference.map((e) => e.toFixed(3)).join(", ") +
				"<br>Q Error(s): <br>" +
				qdifference.map((e) => e.toFixed(3)).join(", ") +
				"<br>Frequency Score(s): <br>" +
				frequencyscore.map((e) => e.toFixed(3)).join(", ") +
				"<br>Gain Score(s): <br>" +
				gainscore.map((e) => e.toFixed(3)).join(", ") +
				"<br>Q Score(s): <br>" +
				qscore.map((e) => e.toFixed(3)).join(", ") +
				"<br>Average Score: " +
				averagescore.toFixed(2) +
				"<br> Current Tolerance: " +
				tolerance.toFixed(2) +
				"<br> Passed: " +
				(averagescore >= tolerance) +
				"<br><br> - This Round Statistics - <br><br> Round #" +
				rounds.toFixed(2) +
				"<br> Wins: " +
				wins.toFixed(2) +
				"<br> Loses: " +
				loses.toFixed(2) +
				"<br> W/L: " +
				(wins / loses).toFixed(2) +
				"<br>Average Score per Round: " +
				(score / (rounds - 1)).toFixed(2) +
				"<br> Score: " +
				score.toFixed(2) +
				'<br><span id="fpsdisplay"></span>';
			if (lives <= 0 || rounds > roundreq) {
				document.getElementById("fader").style.display = "block";
				audio.close();
				bypassedaudio.close();
				fade4(0, 1, 0, 150);
				return;
			}
			restart();
			delay = false; //delay for submitting again
			setTimeout(() => {
				delay = true;
			}, 2500);
			if (modemode <= 2) document.getElementById("gamedisplay").innerHTML = "Lives: " + lives;
			if (modemode >= 3) document.getElementById("gamedisplay").innerHTML = "Score: " + score;
		}
	});
	document.getElementById("theme").addEventListener("click", () => { //change theme
		light = !light;
		chart.destroy(); //kabooms the chart
		if (light) {
			document.querySelector(":root").style.setProperty("--light1", "rgb(199, 199, 199)");
			document.querySelector(":root").style.setProperty("--light2", "rgb(223, 223, 223)");
			document.querySelector(":root").style.setProperty("--light3", "rgb(238, 238, 238)");
			document.getElementById("fader").style.backgroundColor = "white";
			document.body.style.color = "black";
			document.querySelectorAll("button").forEach((e) => {
				e.style.color = "black";
			});
			chart = new Chart("eqgraph", { //redefine the chart with new settings
				data: {
					labels: xValues,
					datasets: [],
				},
				options: {
					plugins: {
						tooltip: {
							enabled: false,
						},
						legend: {
							display: false,
						},
						dragData: {
							round: 1,
							showTooltip: false,
							dragX: true,
							drayY: true,
							onDrag: function (e, datasetIndex, index, value) {
								gain[(datasetIndex - 1) / 2] = value.y;
								frequency[(datasetIndex - 1) / 2] = value.x;
								currentband = (datasetIndex - 1) / 2;
								document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
								updatechart((datasetIndex - 1) / 2);
								filterlist[(datasetIndex - 1) / 2].gain.value = value.y;
								filterlist[(datasetIndex - 1) / 2].frequency.value = value.x;
								document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
							},
						},
					},
					events: [],
					scales: {
						y: {
							suggestedMin: -12,
							suggestedMax: 12,
							title: {
								display: true,
								text: "Gain (dB)",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
							grid: {
								color: "#00339988",
								lineWidth: 2,
							},
							ticks: {
								stepSize: 3,
								color: "black",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
						},
						x: {
							type: "logarithmic",
							suggestedMin: 20,
							suggestedMax: 20000,
							grid: {
								color: "#00339988",
								lineWidth: 2,
							},
							title: {
								display: true,
								text: "Frequency (Hz)",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
							ticks: {
								stepSize: 1000,
								color: "black",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
						},
					},
				},
			});
		} else { //same thing but dark mode
			document.querySelector(":root").style.setProperty("--light1", "rgb(61, 61, 61)");
			document.querySelector(":root").style.setProperty("--light2", "rgb(49, 49, 49)");
			document.querySelector(":root").style.setProperty("--light3", "rgb(26, 26, 26)");
			document.getElementById("fader").style.backgroundColor = "black";
			document.body.style.color = "white";
			document.querySelectorAll("button").forEach((e) => {
				e.style.color = "white";
			});
			chart = new Chart("eqgraph", {
				data: {
					labels: xValues,
					datasets: [],
				},
				options: {
					plugins: {
						tooltip: {
							enabled: false,
						},
						legend: {
							display: false,
						},
						dragData: {
							round: 1,
							showTooltip: false,
							dragX: true,
							drayY: true,
							onDrag: function (e, datasetIndex, index, value) {
								gain[(datasetIndex - 1) / 2] = value.y;
								frequency[(datasetIndex - 1) / 2] = value.x;
								currentband = (datasetIndex - 1) / 2;
								document.getElementById("qtitle").innerHTML = "Q Factor for Band " + (currentband + 1) + ":";
								updatechart((datasetIndex - 1) / 2);
								filterlist[(datasetIndex - 1) / 2].gain.value = value.y;
								filterlist[(datasetIndex - 1) / 2].frequency.value = value.x;
								document.getElementById("qrange").value = qfactor[currentband];
					document.getElementById("qoutput").innerHTML = qfactor[currentband].toString();
							},
						},
					},
					events: [],
					scales: {
						y: {
							suggestedMin: -12,
							suggestedMax: 12,
							title: {
								display: true,
								text: "Gain (dB)",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
							grid: {
								color: "#003399ff",
								lineWidth: 2,
							},
							ticks: {
								stepSize: 3,
								color: "white",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
						},
						x: {
							type: "logarithmic",
							suggestedMin: 20,
							suggestedMax: 20000,
							grid: {
								color: "#003399ff",
								lineWidth: 2,
							},
							title: {
								display: true,
								text: "Frequency (Hz)",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
							ticks: {
								stepSize: 1000,
								color: "white",
								font: {
									family: '"Lexend", sans-serif',
									weight: "600",
								},
							},
						},
					},
				},
			});
		}
		for (let i = 0; i < bandnum; i++) { //regenerate all the curves... again
			yValues = [];
			xValues = [];
			generate(i);
			chart.data.datasets.push({
				type: "line",
				fill: true,
				backgroundColor: bandcolors[i] + "0.5)",
				pointRadius: 0,
				borderColor: bandcolors[i] + "1)",
				data: yValues,
				label: xValues,
				dragData: false,
			});
			chart.data.datasets.push({
				type: "scatter",
				fill: true,
				backgroundColor: bandcolors[i] + "1)",
				pointRadius: 5,
				borderColor: bandcolors[i] + "1)",
				data: [{ x: frequency[i], y: gain[i] }],
				pointHitRadius: 50,
				dragData: true,
			});
			chart.data.labels = xValues;
		}
		chart.update("none");
	});
}); //end lol