const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); // c = context

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
	constructor(x, y, radius, colour, velocity, username, id) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.colour = colour;
		this.velocity = velocity;
		this.username = username;
		this.id = id;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.colour;
		c.fill();
		c.font = '20px Arial';
		c.fillStyle = '#000';
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(this.username, this.x, this.y);
	}

	update() {
		this.draw();
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

	setColour(colour) {
		this.colour = colour;
	}

	getUsername() {
		return this.username;
	}

	getId() {
		return this.id;
	}
}

let x_center = canvas.width / 2;
let y_center = canvas.height / 2;

function init() {
	animate();
}

let animationId;

function animate() {
	animationId = requestAnimationFrame(animate);
	c.fillStyle = 'rgba(0, 0, 0, 1)';
	c.fillRect(0, 0, canvas.width, canvas.height);
	players.forEach((player) => {
		player.draw();
	});
}

addEventListener('resize', (event) => {
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	x_center = canvas.width / 2;
	y_center = canvas.height / 2;
});

const players = [];

document.addEventListener('DOMContentLoaded', () => {
	let socket = io();
	socket.emit('request-players', '');
	socket.on('player-load', (loaded_players) => {
		loaded_players.forEach((player) => {
			let x = Math.random() * canvas.width;
			let y = Math.random() * canvas.height;
			let radius = 30;
			let colour = 'rgb(255, 100, 0)';
			let velocity = {
				x: 0,
				y: 0,
			};

			players.push(
				new Player(x, y, radius, colour, velocity, player.username, player.id)
			);
		});
	});

	init();
	socket.on('player-connected', (player) => {
		let x = Math.random() * canvas.width;
		let y = Math.random() * canvas.height;
		let radius = 30;
		let colour = 'rgb(255, 100, 0)';
		let velocity = {
			x: 0,
			y: 0,
		};

		players.push(
			new Player(x, y, radius, colour, velocity, player.username, player.id)
		);
		// alert("User '" + player.username + "' joined");
	});

	socket.on('player-disconnected', (player) => {
		const index = players.findIndex((object) => {
			return object.getId() === player.id;
		});

		players.splice(index, 1);
	});

	socket.on('motion-update', (player) => {
		const index = players.findIndex((object) => {
			return object.getId() === player.id;
		});

		players[index].setColour(player.rgb);
	});
});
