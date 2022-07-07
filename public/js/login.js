const container_details = document.getElementById('container_details');

let socket = io();

const heading = document.querySelector('h1');
const container = document.getElementById('colour-block');

function initDetails() {
	container_details.innerHTML = `<h2 class="prompt">Please enter your username</h2>
	<input type="text" class="username-input" placeholder="Username" autocorrect="off" autocapitalize="off"
		required id="username-input">
	<button class="button-input" id="btn-submit">Join Game!</button>`;
	
	const button = document.getElementById('btn-submit');
	
	button.addEventListener('click', (e) => {
		const sendingId = document.getElementById('username-input');
		socket.emit('availability-check', sendingId.value);
	});
}

document.addEventListener("DOMContentLoaded", function() {
	initDetails();
});


// socket.emit('login-check');

// socket.on('login-response', (logged_in) => {
//     if (!logged_in) {
//         alert('You are not logged in, please refresh the page')
//     }
// })


// Login & game
socket.on('force-refresh', () => {
	location.reload(true);
});

// Login
socket.on('availability-response', (data) => {
	if (data.available) {
		// playerStatus = 'waiting';

		// const sheet = document.querySelector('.login-sheet');
		// sheet.classList.add('after');

		// const heading = document.querySelector('h1');
		// heading.innerHTML = 'Waiting';
		// heading.style.color = 'rgb(207, 187, 89)';

		// container_details.innerHTML = '';

		sessionStorage.setItem('sessionId', data.sessionId);
		
		setInterval(() => {
			indicator_value -= cooldown;
			if (indicator_value < 0) {
				indicator_value = 0;
			}
		}, 10);
		window.location = '/game';
	} else {
		const prompt = document.querySelector('.prompt');
		prompt.innerHTML = 'User already exists';
	}
});

