(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	// SCOPE:
	var generateBoard,
		initCanvas,
		drawBoard,
		drawPath,
		initSound,
		playSound,
		movePiece,
		signalState,
		advanceSim,
		runSim,
		resetSim,
		init;
	// Base Board Settings
	var boardDefaultWidth = 16;
	var boardDefaultHeight = 16;
	var tileDirections = ['up', 'right', 'down', 'left'];
	var currentState = null;
	var tilePxWidth = 8;
	var tilePxHeight = 8;
	var tilePxPadding = 26;
	var defaultColor = 'rgb(66, 77, 88)';
	var occupiedColor = 'rgb(158, 11, 15)';
	var visitedColor = 'rgb(60, 184, 120)';
	var pathColor = 'rgba(20, 220, 250, 0.95)';
	var soundFreqDefault = 440;

	// Canvas Context
	var canvas = null;
	var canvasCtx = null;

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
		this.moves = [{
			x: startX,
			y: startY
		}];
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

	initCanvas = function () {
		canvas = UT.qs('#board');
		if (canvas.getContext) {
			canvasCtx = canvas.getContext('2d');
		} else {
			console.log('Canvas context not supported.');
		}
	};

	drawBoard = function (sim) {
		var _i, _j;
		canvas.width = (tilePxWidth + tilePxPadding) * sim.size.width;
		canvas.height = (tilePxHeight + tilePxPadding) * sim.size.height;
		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
		// Row loop
		for(_i = 0; _i < sim.size.height; _i++) {
			// Tile loop
			for(_j = 0; _j < sim.size.width; _j++) {
				// Draw tile
				canvasCtx.fillStyle = defaultColor;
				if (_i === sim.position.y && _j === sim.position.x) {
					canvasCtx.fillStyle = occupiedColor;
				} else if (sim.board[_i][_j].visited) {
					canvasCtx.fillStyle = visitedColor;
				}
				canvasCtx.fillRect(
					_j * (tilePxWidth + tilePxPadding) + (tilePxPadding/2),
					_i * (tilePxHeight + tilePxPadding) + (tilePxPadding/2),
					tilePxWidth,
					tilePxHeight);
			}
		}
		return sim;
	};

	drawPath = function (sim) {
		var _i, count, lFrom, lTo;
		var fullTileWidth = tilePxWidth + tilePxPadding;
		var fullTileHeight = tilePxHeight + tilePxPadding;
		var xOffset = fullTileWidth / 2;
		var yOffset = fullTileHeight / 2;
		canvasCtx.strokeStyle = pathColor;
		for(_i = 1, count = sim.moves.length; _i < count; _i++) {
			lFrom = sim.moves[_i - 1];
			lTo = sim.moves[_i];
			canvasCtx.beginPath();
			canvasCtx.moveTo(lFrom.x * fullTileWidth + xOffset, lFrom.y * fullTileHeight + yOffset);
			canvasCtx.lineTo(lTo.x * fullTileWidth + xOffset, lTo.y * fullTileHeight + yOffset);
			canvasCtx.stroke();
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
		sim.moves.push({
			x: sim.position.x,
			y: sim.position.y
		});
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
		var messageDisplay = UT.qs('.message');
		UT.qs('.advance').disabled = true;
		UT.qs('.run').disabled = true;
		UT.qs('.move-count').innerHTML = 'Moves: ' + (sim.moves.length - 1);
		switch (sim.status) {
			case 'OK':
				UT.qs('.advance').disabled = false;
				UT.qs('.run').disabled = false;
				sim.message = 'Can continue.';
				playSound(440);
				break;
			case 'LOOP':
				sim.message = '<strong>Start was Safe</strong>: detected Loop.';
				playSound(880);
				break;
			case 'FELL':
				sim.message = '<strong>Start was Doomed</strong>: Fell Off at: ' + sim.position.x + ' x ' + sim.position.y;
				playSound(220);
				break;
			default:
				console.log('Unknown state: ' + sim.status);
				return false;
		}
		messageDisplay.innerHTML = sim.message;
	};

	advanceSim = function () {
		movePiece(currentState);
		signalState(currentState);
		drawBoard(currentState);
		drawPath(currentState);
	};

	runSim = function () {
		var result = true;
		while (result) {
			result = movePiece(currentState);
		}
		signalState(currentState);
		drawBoard(currentState);
		drawPath(currentState);
	};

	resetSim = function () {
		var makeWidth = null;
		var makeHeight = null;
		var makeStartX = null;
		var makeStartY = null;
		var setWidth = parseInt(UT.qs('#board-width').value.replace(' ', ''));
		var setHeight = parseInt(UT.qs('#board-height').value.replace(' ', ''));
		var setStartX = parseInt(UT.qs('#start-x').value.replace(' ', ''));
		var setStartY = parseInt(UT.qs('#start-y').value.replace(' ', ''));
		if (!isNaN(setWidth)) {
			makeWidth = setWidth;
		}
		if (!isNaN(setHeight)) {
			makeHeight = setHeight;
		}
		if (!isNaN(setStartX)) {
			makeStartX = setStartX;
		}
		if (!isNaN(setStartY)) {
			makeStartY = setStartY;
		}
		currentState = new SimState(makeWidth, makeHeight, makeStartX, makeStartY);
		if (canvasCtx === null) {
			initCanvas();
		}
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