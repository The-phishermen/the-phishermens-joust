let colour_value = 0;
let soft_threshold = 5;
let hard_threshold = 50;
const sensitivity = 0.004;
const cooldown = 0.002 * soft_threshold;
let game_over = false;
let alerted = false;

const background = document.getElementById('status');

function getRgb(value, threshold) {
	if (value <= threshold / 2) {
		let red = (2 * (255 * value)) / threshold;
		return `rgb(${red}, 255, 0)`;
	} else {
		let green = 255 - 255 * 2 * ((value - threshold / 2) / threshold);
		return `rgb(255, ${green}, 0)`;
	}
}

window.addEventListener('devicemotion', (e) => {
	// do something with e
});

// document.addEventListener('DOMContentLoaded', function () {
let socket = io();
let streaming = false;
let status = document.getElementById('status');
let sendingId = document.getElementById('sending-id');
let form = document.getElementById('enter');
let orientation = document.getElementById('orientation');

socket.on('redirect', (url) => {
	window.location.href = url;
});

setInterval(() => {
	colour_value -= cooldown;
	if (colour_value < 0) {
		colour_value = 0;
	}
}, 10);

let startStreaming = function (e) {
	e.preventDefault();
	streaming = true;
	form.style.display = 'none';
	status.className = 'csspinner line back-and-forth no-overlay';
	status.style.display = 'block';
	document.activeElement.blur();
	socket.emit('player-join', sendingId.value);
	return false;
};

form.addEventListener('submit', startStreaming);

if (window.DeviceMotionEvent !== undefined) {
	window.ondevicemotion = function (e) {
		if (!streaming) return false;
		let total = Math.sqrt(
			Math.pow(e.acceleration.x, 2) +
				Math.pow(e.acceleration.y, 2) +
				Math.pow(e.acceleration.z, 2)
		);

		colour_value += sensitivity * total;

		if (colour_value > soft_threshold || total > hard_threshold) {
			colour_value = soft_threshold;
			game_over = true;
		}

		background.style.backgroundColor = getRgb(colour_value, soft_threshold);

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
	};

	socket.on('bpm-change', (bpm_change) => {
		hard_threshold *= bpm_change.threshold_percentage;
		console.log(hard_threshold);
	});
} else {
	status.style.display = 'block';
	status.innerHTML =
		'Unfortunately, this device does not have the right sensors.';
}

DeviceMotionEvent.requestPermission()
	.then((response) => {
		if (response == 'granted') {
			window.addEventListener('devicemotion', (e) => {
				// do something with e
			});
		}
	})
	.catch(console.error);
