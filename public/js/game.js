const indicator = document.querySelector('.indicator-sheet');

let indicator_value = 0;
let soft_threshold = 2;
let hard_threshold = 50;
const sensitivity = 0.002;
const orientation_sensitivity = 0.016;
let old_gamma;
let cooldown = 0.005 * soft_threshold;
let motionTracking = false;
let playerStatus = '';
let colour_value = 0;

playerStatus = 'waiting';

const sheet = document.querySelector('.login-sheet');
sheet.classList.add('after');

const heading = document.querySelector('h1');
heading.innerHTML = 'Waiting';
heading.style.color = 'rgb(207, 187, 89)';

var session_id;
// Get saved data from sessionStorage
let data = sessionStorage.getItem('sessionId');
console.log(data)
if (data == null) {
	window.location = '/play';
} else {
	session_id = data//when we connect n times 
	socket.emit('reconnect-socket', { sessionId: session_id });
}

// Game
function getRgb(value, threshold) {
	if (value <= threshold / 2) {
		let red = (2 * (255 * value)) / threshold;
		return `rgb(${red}, 255, 0)`;
	} else {
		let green = 255 - 255 * 2 * ((value - threshold / 2) / threshold);
		return `rgb(255, ${green}, 0)`;
	}
}

// Login & game
socket.on('force-refresh', () => {
	location.reload(true);
});

socket.on('reconnect-acknowledgement', (data) => {
	sessionStorage.setItem('sessionId', data.sessionId);
});

// Game
//BPM CHANGES
socket.on('bpm-change', function(threshold_percentage) {
	hard_threshold *= threshold_percentage;
	soft_threshold *= threshold_percentage;
});

// Game
socket.on('game-start', () => {
	if (playerStatus == 'ready') {
		playerStatus = 'playing';

		socket.emit('status-change', {
			status: playerStatus,
			colour: getRgb(colour_value, soft_threshold)
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
		alert("You weren't ready'");
		window.location = "/spectate";
	}
});


// Game
if (window.DeviceMotionEvent !== undefined) {
	window.ondevicemotion = function (e) {
		e.preventDefault();
		if (playerStatus == 'waiting') {
			let total = Math.sqrt(
				Math.pow(e.acceleration.x, 2) +
					Math.pow(e.acceleration.y, 2) +
					Math.pow(e.acceleration.z, 2)
			);

			indicator_value += sensitivity * total;
			if (indicator_value > 1) {
				indicator_value = 1;
				cooldown = 0;

				heading.innerHTML = 'Ready';
				heading.style.color = 'rgb(36, 209, 134)';

				// if (!document.fullscreenElement) {
				// 	document.documentElement.requestFullscreen();
				// }
				motionTracking = false;
				playerStatus = 'ready';

				socket.emit('status-change', {
					status: playerStatus,
					colour: getRgb(colour_value, soft_threshold)
				});

				container.style.backgroundColor = 'rgb(36, 209, 134)';
				container.innerHTML = 'Game will begin soon';

				indicator.style.clipPath = `circle(0% at 50% 150%)`;
			}

			indicator.style.clipPath = `circle(${
				150 * indicator_value + 50
			}% at 50% 150%)`;
		} else if (playerStatus == 'playing') {
			
			let total_acceleration = Math.sqrt(
				Math.pow(e.acceleration.x, 2) +
					Math.pow(e.acceleration.y, 2) +
					Math.pow(e.acceleration.z, 2)
			);

			// //Rate of change of Acceleration
			// temp_acceleration = Math.sqrt(
			// 	Math.pow(e.acceleration.x, 2) +
			// 	Math.pow(e.acceleration.y, 2) +
			// 	Math.pow(e.acceleration.z, 2)
			// );
			// total_acceleration = prev_acceleration - temp_acceleration;
			// prev_acceleration = temp_acceleration;

			colour_value += sensitivity * total_acceleration;

			if (
				colour_value > soft_threshold ||
				total_acceleration > hard_threshold
			) {
				colour_value = soft_threshold;
				game_over = true;

				console.log('PLAYER DIED');
				new Audio('./../audio_files/game_over.mp3').play();

				playerStatus = "eliminated";

				container.innerHTML = "You are out :( Better luck next time!"

				// socket.emit('status-change', {
				// 	status: playerStatus,
				// 	colour: getRgb(colour_value, soft_threshold)
				// });
			}

			socket.emit('status-change', {
				status: playerStatus,
				colour: getRgb(colour_value, soft_threshold)
			});

			container.style.backgroundColor = getRgb(colour_value, soft_threshold);

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
	// window.ondeviceorientation = function (orientation) {
	// 	if (playerStatus == 'waiting') {
	// 		if (!old_gamma) {
	// 			old_gamma = orientation.gamma;
	// 		}

	// 		indicator_value = orientation_sensitivity * Math.abs(orientation.gamma - old_gamma);
	// 		if (indicator_value > 1) {
	// 			indicator_value = 1;
	// 			cooldown = 0;

	// 			heading.innerHTML = player.username;
	// 			heading.style.color = 'rgb(36, 209, 134)';

	// 			if (!document.fullscreenElement) {
	// 				document.documentElement.requestFullscreen();
	// 			}
	// 			motionTracking = false;
	// 			playerStatus = 'ready';

	// 			socket.emit('status-change', {
	// 				status: playerStatus,
	// 				colour: getRgb(colour_value, soft_threshold)
	// 			});

	// 			container.style.backgroundColor = 'rgb(36, 209, 134)';
	// 			container.innerHTML = 'Game will begin soon';

	// 			indicator.style.clipPath = `circle(0% at 50% 150%)`;
	// 		}

	// 		indicator.style.clipPath = `circle(${
	// 			150 * indicator_value + 50
	// 		}% at 50% 150%)`;
	// 	}
	// }
}

