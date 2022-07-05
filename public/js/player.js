let colour_value = 0;
const soft_threshold = 2;
const hard_threshold = 40;
const sensitivity = 0.005;
const cooldown = 0.003;
let game_over = false;
let alerted = false;

const background = document.getElementById('background');

function getRgb(value, threshold) {
	if (value <= threshold / 2) {
		let red = (2 * (255 * value)) / threshold;
		return `rgb(${red}, 255, 0)`;
	} else {
		let green = 255 - 255 * 2 * ((value - threshold / 2) / threshold);
		return `rgb(255, ${green}, 0)`;
	}
}

document.addEventListener('DOMContentLoaded', function () {
	let socket = io();
	let streaming = false;
	let colour = document.getElementById('colour');
	let sendingId =  document.getElementById('u_id').innerText;
	// let orientation = document.getElementById('orientation');
	setInterval(() => {
		colour_value -= cooldown;
		if (colour_value < 0) {
			colour_value = 0;
		}
	}, 10);

	let startStreaming = (function (e) {
		// e.preventDefault();
		streaming = true;
		// form.style.display = 'none';
		colour.className = 'csspinner line back-and-forth no-overlay';
		colour.style.display = 'block';
		document.activeElement.blur();
		socket.emit('player-join', sendingId);
		return false;
	})()


	if (window.DeviceMotionEvent !== undefined) {
		window.ondevicemotion = function (e) {
			if (!streaming) return false;
			let total = Math.sqrt(
				Math.pow(e.acceleration.x, 2) +
				Math.pow(e.acceleration.y, 2) +
				Math.pow(e.acceleration.z, 2)
			);

			colour_value += (sensitivity * total) / soft_threshold;

			if (colour_value > soft_threshold || total > hard_threshold) {
				colour_value = soft_threshold;
				game_over = true;
			}

			background.style.backgroundColor = getRgb(colour_value, soft_threshold);
			if(game_over){
				socket.emit('eliminated',{sender:sendingId})
			}
			socket.emit('motion', {
				sender: sendingId,
				rgb: getRgb(colour_value, soft_threshold)
			});
		};
	} else {
		colour.style.display = 'block';
		colour.innerHTML =
			'Unfortunately, this device does not have the right sensors.';
	}
});


