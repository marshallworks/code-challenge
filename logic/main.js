(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	// SCOPE:
	var generateBoard,
		drawBoard,
		initSound,
		playSound,
		movePiece,
		signalState,
		advanceSim,
		runSim,
		resetSim,
		init;
	// Base Board Settings
	var boardDefaultWidth = 10;
	var boardDefaultHeight = 10;
	var tileDirections = ['up', 'right', 'down', 'left'];
	var currentState = null;
	var soundFreqDefault = 440;

	// Audio Context
	var audioCtx = null;
	try {
		audioCtx = new AudioContext();
	}
	catch(e) {
		console.log('Web Audio API not supported.');
	}

	// Simulation State
	function SimState (boardWidth, boardHeight, startX, startY) {
		// Set defaults
		if (boardWidth == null) {
			boardWidth = boardDefaultWidth;
		}
		if (boardHeight == null) {
			boardHeight = boardDefaultHeight;
		}
		if (startX == null) {
			startX = Math.floor(Math.random() * boardWidth);
		}
		if (startY == null) {
			startY = Math.floor(Math.random() * boardHeight);
		}
		if (startX < 0 || startY < 0 || startX > boardWidth - 1 || startY > boardHeight - 1) {
			console.log('Board Starting Position was out of bounds: x->' + startX + ' y->' + startY);
			startX = 0;
			startY = 0;
		}
		this.board = generateBoard(boardWidth, boardHeight);
		this.board[startY][startX].visited = true;
		this.position = {
			x: startX,
			y: startY
		};
		this.size = {
			width: boardWidth,
			height: boardHeight
		};
		this.status = 'OK';
		this.message = 'New Simulation';
		this.sound = {
			osc: null,
			amp: null
		};
		return this;
	}

	// Functions
	generateBoard = function (tileWidth, tileHeight) {
		var _i, _j;
		// Create board
		var board = [];
		// Loop to create tile rows.
		for (_i = 0; _i < tileHeight; _i++) {
			// Create row
			board[_i] = [];
			// Loop to create tiles.
			for (_j = 0; _j < tileWidth; _j++) {
				// Create tile, as object assuming additional properties
				board[_i][_j] = {
					// Math.random() is 0 inclusive and 1 exclusive; so using Math.floor for an even
					// distribution of directions on the board.
					direction: tileDirections[Math.floor(Math.random() * tileDirections.length)],
					visited: false
				};
			}
		}
		return board;
	};

	drawBoard = function (sim) {
		var _i, _j;
		var tilePxWidth = 28;
		var tilePxHeight = 28;
		var tilePadding = 6;
		var defaultColor = 'rgb(0, 170, 0)';
		var occupiedColor = 'rgb(170, 0, 0)';
		var visitedColor = 'rgb(120, 120, 120)';
		var canvas = UT.qs('#board');
		var messageDisplay = UT.qs('.message');
		messageDisplay.innerHTML = sim.message;
		canvas.width = (tilePxWidth + tilePadding) * sim.size.width;
		canvas.height = (tilePxHeight + tilePadding) * sim.size.height;
		if (canvas.getContext) {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// Row loop
			for(_i = 0; _i < sim.size.height; _i++) {
				// Tile loop
				for(_j = 0; _j < sim.size.width; _j++) {
					// Draw tile
					ctx.fillStyle = defaultColor;
					if (_i === sim.position.y && _j === sim.position.x) {
						ctx.fillStyle = occupiedColor;
					} else if (sim.board[_i][_j].visited) {
						ctx.fillStyle = visitedColor;
					}
					ctx.fillRect(
						_j * (tilePxWidth + tilePadding) + (tilePadding/2),
						_i * (tilePxHeight + tilePadding) + (tilePadding/2),
						tilePxWidth,
						tilePxHeight);
				}
			}
		} else {
			console.log('Canvas context not supported.');
		}
		return sim;
	};

	initSound = function (sim) {
		sim.sound.osc = audioCtx.createOscillator();
		sim.sound.osc.frequency.value = soundFreqDefault;
		sim.sound.amp = audioCtx.createGain();
		sim.sound.amp.gain.value = 0;

		sim.sound.osc.connect(sim.sound.amp);
		sim.sound.amp.connect(audioCtx.destination);
		sim.sound.osc.start(0);
		return sim;
	};

	playSound = function (freq) {
		if (freq == null) {
			freq = soundFreqDefault;
		}
		var now = audioCtx.currentTime;
		currentState.sound.osc.frequency.setValueAtTime(freq, now);
		currentState.sound.amp.gain.cancelScheduledValues(now);
		currentState.sound.amp.gain.setValueAtTime(currentState.sound.amp.gain.value, now);
		currentState.sound.amp.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
		currentState.sound.amp.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
	};

	movePiece = function (sim) {
		var currentTile = sim.board[sim.position.y][sim.position.x];
		var newTile = currentTile;
		switch (currentTile.direction) {
			case 'up':
				sim.position.y--;
				break;
			case 'right':
				sim.position.x++;
				break;
			case 'down':
				sim.position.y++;
				break;
			case 'left':
				sim.position.x--;
				break;
			default:
				console.log('Invalid Direction.');
				return false;
		}
		if (sim.position.x < 0 ||
			sim.position.x + 1 > sim.size.width ||
			sim.position.y < 0 ||
			sim.position.y + 1 > sim.size.height)
		{
			sim.status = 'FELL';
			return false;
		}
		newTile = sim.board[sim.position.y][sim.position.x];
		if (newTile.visited) {
			sim.status = 'LOOP';
			return false;
		} else {
			// Simultion can continue
			sim.status = 'OK';
			newTile.visited = true;
			return true;
		}
	};

	signalState = function (sim) {
		UT.qs('.advance').disabled = true;
		UT.qs('.run').disabled = true;
		switch (sim.status) {
			case 'OK':
				UT.qs('.advance').disabled = false;
				UT.qs('.run').disabled = false;
				sim.message = 'Can continue.';
				playSound(440);
				break;
			case 'LOOP':
				sim.message = '<strong>Start was Safe</strong>: detected Loop.';
				playSound(800);
				break;
			case 'FELL':
				sim.message = '<strong>Start was Doomed</strong>: Fell Off at: ' + sim.position.x + ' x ' + sim.position.y;
				playSound(200);
				break;
			default:
				console.log('Unknown state: ' + sim.status);
				return false;
		}
	};

	advanceSim = function () {
		movePiece(currentState);
		signalState(currentState);
		drawBoard(currentState);
	};

	runSim = function () {
		var result = true;
		while (result) {
			result = movePiece(currentState);
		}
		signalState(currentState);
		drawBoard(currentState);
	};

	resetSim = function () {
		currentState = new SimState();
		initSound(currentState);
		signalState(currentState);
		drawBoard(currentState);
	};

	// Initializer
	init = function () {
		console.log('Page Load');
		var advanceButton = UT.qs('.advance');
		var runButton = UT.qs('.run');
		var resetButton = UT.qs('.reset');
		UT.on(advanceButton, 'click', advanceSim);
		UT.on(runButton, 'click', runSim);
		UT.on(resetButton, 'click', resetSim);
		resetSim();
		return true;
	};

	UT.on(window, 'load', init);

}(window));