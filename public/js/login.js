const button = document.getElementById('button_input');
const indicator = document.getElementById('indicator_sheet');
const heading = document.querySelector('h1');
const container = document.getElementById('page_container');

const sensitivity = 0.003;
let indicator_value = 0;
let soft_threshold = 2;
let hard_threshold = 25;
let cooldown = 0.005 * soft_threshold;
let playerStatus = '';
let colour_value = 0;
let result = 0;
let sendingId = '';
let total_acceleration;
let numPlayersLeft;

let socket = io();

//powers
let invincibility = false;
let nIntervId = null;
let nIntervPowId = null;
let intrvl1 = null;
let remainingTime = 8;
let randNum = 0;

function getRgb(value, threshold) {

	if (invincibility == true) {
		return `rgb(0,255,255)`;
	} else {
		if (value <= threshold / 2) {
			let red = (2 * (255 * value)) / threshold;
			return `rgb(${red}, 255, 0)`;
		} else {
			let green = 255 - 255 * 2 * ((value - threshold / 2) / threshold);
			return `rgb(255, ${green}, 0)`;
		}
	}
}

// socket.on('invincibility-response', (randNum) => {

// 	alert("here");
// 	if (randNum == 2) {
// 		invincibility = true;
// 		container.innerHTML = `You have INVINCIBILITY`;
// 	} else {
// 		invincibility = false;
// 		container.innerHTML = `${remainingCount} players remaining...`;
// 	}
// }); 

function powers() {
	randNum = Math.floor((Math.random() * 60) + 1);
	console.log(randNum);
	if ((randNum == 1) && (invincibility == false)) {
		invincibility = true;
		remainingTime = 8;
		container.innerHTML = container.innerHTML = `<span>You are INVINCIBLE!!<br><br>
		${remainingTime}s</span>`;
		intrvl1 = setInterval(() => {
			if (remainingTime <= 1) {
				if (intrvl1 != null) {
					clearInterval(intrvl1);
					intrvl1 = null;
					invincibility = false;
					container.innerHTML = `<span>${numPlayersLeft} players remaining...`;//<br><br>${randNum}</span>`;
				}
			} else {
				remainingTime--;
				container.innerHTML = `<span>You are INVINCIBLE!!<br><br>
				${remainingTime}s</span>`;
			}
		}, 1000);
	} else {
		invincibility = false;
		container.innerHTML = `<span>${numPlayersLeft} players remaining...`;//<br><br>${randNum}</span>`;
	}
	//socket.emit('invincibility-response', randNum);
}

container.addEventListener('click', () => {
	if (playerStatus == 'waiting') {
		indicator_value = 2;
	}
});

button.addEventListener('click', (e) => {
	sendingId = document.getElementById('username_input');
	socket.emit('availability-check', sendingId.value);
});

socket.on('availability-response', (availible) => {
	//for power player refresh. 

	if (availible) {
		playerStatus = 'waiting';

		const sheet = document.querySelector('#login_sheet');
		sheet.classList.add('after');

		const heading = document.querySelector('h1');
		heading.innerHTML = 'Waiting';
		heading.style.color = 'rgb(207, 187, 89)';

		setTimeout(() => {
			document
				.getElementById('container_details')
				.removeChild(document.getElementsByTagName('input')[0]);
			document
				.getElementById('container_details')
				.removeChild(document.getElementById('button_input'));
		}, 1000);

		setInterval(() => {
			indicator_value -= cooldown * 0.5;
			if (indicator_value < 0) {
				indicator_value = 0;
			}
		}, 10);
	} else {
		const prompt = document.querySelector('.prompt');
		prompt.innerHTML = 'User already exists';
	}
});

socket.on('remaining-count', (remainingCount) => {
	//for power player refresh. Definitely a better way of doing this
	numPlayersLeft = remainingCount;

	if (playerStatus == 'eliminated') {
		result = remainingCount + 1;

		let suffix = 'th';

		if (((result % 10) == 3) && result != 13) {
			suffix = 'rd';
		}

		if (((result % 10) == 2) && result != 12) {
			suffix = 'nd';
		}
		container.innerHTML = `<span>You came ${result}${suffix}!</span>`;

		playerStatus = '';
	} else if (playerStatus == 'playing') {
		if (remainingCount > 1) {
			container.innerHTML = `<span>${remainingCount} players remaining...`;//<br><br>${randNum}</span>`;
		}
	}
});

socket.on('end-of-game', () => {

	//nIntervId = null;

	if (playerStatus == 'playing') {
		container.innerHTML = 'You won!!!';
		socket.emit('status-change', {
			status: 'winner',
			colour: getRgb(colour_value, soft_threshold),
		});
		playerStatus = '';
		socket.emit('winner-found', sendingId.value);
	}
});

socket.on('winner-found', (username) => {
	window.location = '/winner';
});

//BPM CHANGES
socket.on('bpm-change', function (threshold_percentage) {
	// hard_threshold *= threshold_percentage;
	soft_threshold *= threshold_percentage;
});

socket.on('force-refresh', () => {
	location.reload(true);
});

socket.on('game-start', () => {
	if (playerStatus == 'ready') {
		playerStatus = 'playing';
		heading.innerHTML = sendingId.value;
		heading.style.color = '#fff';

		if (nIntervId == null) {
			nIntervId = setInterval(() => {
				if(!invincibility){
					powers();
				}
			}, 2000);
		}

		socket.emit('status-change', {
			status: playerStatus,
			colour: getRgb(colour_value, soft_threshold),
		});

		cooldown = 0.005 * soft_threshold;
		container.innerHTML = '';
		setInterval(() => {
			colour_value -= cooldown;
			if (colour_value < 0) {
				colour_value = 0;
			}
		}, 10);
	} else {
		window.location = '/spectate';
	}
});

socket.on('player-change', (readyCount, totalCount) => {
	if (playerStatus == 'ready') {
		container.innerHTML = `<span>${readyCount}/${totalCount} players ready</span>`;
	}
});

let time_to_change = false;

setInterval(() => {
	time_to_change = true;
}, 200);

if (window.DeviceMotionEvent !== undefined) {
	window.ondevicemotion = function (e) {
		if (playerStatus == 'waiting') {
			let total = Math.sqrt(
				Math.pow(e.acceleration.x, 2) +
				Math.pow(e.acceleration.y, 2) +
				Math.pow(e.acceleration.z, 2)
			);

			indicator_value += sensitivity * 2 * total;
			if (indicator_value > 1) {
				indicator_value = 1;
				cooldown = 0;

				heading.innerHTML = 'Ready';
				heading.style.color = 'rgb(36, 209, 134)';

				playerStatus = 'ready';

				socket.emit('status-change', {
					status: playerStatus,
					colour: getRgb(colour_value, soft_threshold),
				});

				container.style.backgroundColor = 'rgb(36, 209, 134)';
				container.innerHTML = '<span> Game will begin soon </span>';

				indicator.style.clipPath = `polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)`;
			}

			indicator.style.clipPath = `polygon(0 ${100 - 100 * indicator_value
				}%, 100% ${100 - 100 * indicator_value}%, 100% 100%, 0% 100%)`;
		} else if (playerStatus == 'playing') {

			if (!invincibility) {
				total_acceleration = Math.sqrt(
					Math.pow(e.acceleration.x, 2) +
					Math.pow(e.acceleration.y, 2) +
					Math.pow(e.acceleration.z, 2)
				);
				colour_value += sensitivity * total_acceleration;
			} else {
				//colour_value = colour_value;
				//total.acceleration = total.acceleration;
			}
			colour_value = colour_value;

			if (
				colour_value > soft_threshold ||
				total_acceleration > hard_threshold
			) {
				if (nIntervId != null) {
					clearInterval(nIntervId);
					nIntervId = null;
				}

				colour_value = soft_threshold;
				game_over = true;

				console.log('PLAYER DIED');
				new Audio('./../audio_files/game_over.mp3').play();

				playerStatus = 'eliminated';
				socket.emit('status-change', {
					status: playerStatus,
					colour: getRgb(colour_value, soft_threshold),
					value: colour_value / soft_threshold,
				});
			}

			if (time_to_change) {
				socket.emit('status-change', {
					status: playerStatus,
					colour: getRgb(colour_value, soft_threshold),
					value: colour_value / soft_threshold,
				});
				time_to_change = false;
			}

			let rgb = getRgb(colour_value, soft_threshold);
			container.style.backgroundColor = rgb;
			container.style.borderColor = rgb;
			document.querySelector('header').style.borderColor = rgb;

			if (game_over && !alerted) {
				game_over = false;
				alerted = true;
				setTimeout(() => {
					alert('You lose :(');
				}, 100);
				setTimeout(() => {
					alerted = false;
				}, 3000);
			}

			socket.emit('motion', {
				sender: sendingId.value,
				rgb: getRgb(colour_value, soft_threshold),
			});
		} else {
			return;
		}
	};
}
