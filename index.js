//imports
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')
const fs = require('fs');
const path = require('path');
const https = require('https');
const socketio = require('socket.io');
let server, io;

// --- gloabal variables ---
app.use(bodyParser.urlencoded({ extended: false }))
const players = [];
let p_out = new Set();
let out_count = 0;

// -------------------------

// --- functions ---

function get_rgb(value, threshold) {
	if (value <= threshold / 2) {
		let red = (2 * (255 * value)) / threshold;
		return `rgb(${red}, 255, 0)`;
	} else {
		let green = 255 - 255 * ((value - threshold / 2) / threshold);
		return `rgb(255, ${green}, 0)`;
	}
}

// -----------------

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/admin', (req, res) => {
	res.render('admin.ejs');
});

app.get('/', function (req, res) {
	res.render('home.ejs');
});

app.post('/game', function (req, res) {
	let username = req.body.username;
	res.render('game.ejs', { username });
});

app.get('/eliminated', (req, res)=>{
	res.send("You were eliminated")
})

app.get('/spectate', function (req, res) {
	res.render('spectator.ejs', { players });
});

const ssl = https.createServer(
	{
		key: fs.readFileSync(path.join(__dirname, './certs/key.pem'), 'utf-8'),
		cert: fs.readFileSync(path.join(__dirname, './certs/cert.pem'), 'utf-8'),
	},
	app
);

ssl.listen(process.env.PORT, () => {
	console.log(`Server is active on port: ${process.env.PORT}`);
});

io = socketio(ssl);

io.sockets.on('connection', function (socket) {
	//add the socket id to stack of objects based on id
	socket.on('player-join', (data) => {
		console.log(data)
		let player = { username: data, id: socket.id, rgb: 'rgb(0, 0, 0)', rank: 0 };
		console.log(player)
		players.push(player);
		console.log("User '" + data + "' joined");
		io.sockets.emit('message', player);
		io.sockets.emit('add-player', true)
	});

	socket.on('motion', function (data) {
		const username = data.sender;
		const rgb = data.rgb;

		const index = players.findIndex((object) => {
			return object.username === username;
		});
		if (players[index] != null) {
			players[index].rgb = rgb;
		}
		if (rgb == 'rgb(255, 0, 0)') {
			// console.log(players[index].username + ' eliminated.');
		}
		io.sockets.emit('motion-update', players[index]);
	});
	//problem is that this runs for a short amount of time before stopping, adding 10's of numbers to the counter
	socket.on('eliminated',data=>{
		const index = players.findIndex((object) => {
			return object.username === data.sender;
		});
		//using a set for players that are currently out to count unique names to avoid duplicate problem above
		p_out.add(players[index])
		players[index].rank = players.length - p_out.size +1;
		io.sockets.emit('remove-player', {username:index})
		return;
	})
	// socket.on('orientation', function (data) {
	// console.log(
	// 	'ORIENTATION: ' + data.alpha + ' ' + data.beta + ' ' + data.gamma
	// );
	// console.log('ORIENTATION OBJECT: ' + JSON.stringify(data, null, 4) + '\n');
	// });

	socket.on('disconnect', () => {
		const index = players.findIndex((object) => {
			return object.id === socket.id;
		});

		if (index >= 0) {
			username = players[index].username;
			players.splice(index, 1);
			console.log(username + ' disconnected');
		}
	});


});
