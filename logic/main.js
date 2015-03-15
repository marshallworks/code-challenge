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
		drawPaths,
		initSound,
		playSound,
		movePiece,
		signalState,
		nextSim,
		completePathSim,
		advanceSim,
		advanceAndComplete,
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
	var pathColor = 'rgba(20, 220, 250, 0.7)';
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

	// Position Type
	function Position (x, y) {
		// Ensure position uses integers
		this.x = UT.isNumber(x) ? UT.getInt(x) : 0;
		this.y = UT.isNumber(y) ? UT.getInt(y) : 0;
		return this;
	}
	// Position Equality
	Position.prototype.equal = function (comparePos) {
		if (comparePos instanceof Position) {
			return (this.x === comparePos.x && this.y === comparePos.y);
		}
		return false;
	};

	// Path Type
	function Path (startPos) {
		if (startPos == null || !(startPos instanceof Position)) {
			startPos = new Position(0, 0);
		}
		this.position = startPos;
		this.moves = [];
		this.moves.push(new Position(startPos.x, startPos.y));
		this.result = '';
		return this;
	};

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
		var startPos = new Position(startX, startY);
		this.size = {
			width: boardWidth,
			height: boardHeight
		};
		this.board = generateBoard(boardWidth, boardHeight);
		this.board[startY][startX].visited = true;
		this.status = 'OK';
		this.message = 'New Simulation';
		this.sound = {
			osc: null,
			amp: null
		};
		this.paths = [];
		this.paths.push(new Path(startPos));
		// this.position = new Position(startX, startY);
		// this.moves = [new Position(startX, startY)];
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
					visitedBy: [],
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
		var recentPath = sim.paths[sim.paths.length - 1];
		canvas.width = (tilePxWidth + tilePxPadding) * sim.size.width;
		canvas.height = (tilePxHeight + tilePxPadding) * sim.size.height;
		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
		// Row loop
		for(_i = 0; _i < sim.size.height; _i++) {
			// Tile loop
			for(_j = 0; _j < sim.size.width; _j++) {
				// Draw tile
				canvasCtx.fillStyle = defaultColor;
				if (_i === recentPath.position.y && _j === recentPath.position.x) {
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

	drawPath = function (path) {
		var _i, count, lFrom, lTo;
		var fullTileWidth = tilePxWidth + tilePxPadding;
		var fullTileHeight = tilePxHeight + tilePxPadding;
		var xOffset = fullTileWidth / 2;
		var yOffset = fullTileHeight / 2;
		canvasCtx.strokeStyle = pathColor;
		for(_i = 1, count = path.moves.length; _i < count; _i++) {
			lFrom = path.moves[_i - 1];
			lTo = path.moves[_i];
			canvasCtx.beginPath();
			canvasCtx.moveTo(lFrom.x * fullTileWidth + xOffset, lFrom.y * fullTileHeight + yOffset);
			canvasCtx.lineTo(lTo.x * fullTileWidth + xOffset, lTo.y * fullTileHeight + yOffset);
			canvasCtx.stroke();
		}
		return path;
	};

	drawPaths = function (sim) {
		var _i, count;
		for(_i = 0, count = sim.paths.length; _i < count; _i++) {
			drawPath(sim.paths[_i]);
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
		var currentPathIndex = sim.paths.length - 1;
		var currentPath = sim.paths[currentPathIndex];
		var currentTile = sim.board[currentPath.position.y][currentPath.position.x];
		var newTile = currentTile;
		switch (currentTile.direction) {
			case 'up':
				currentPath.position.y--;
				break;
			case 'right':
				currentPath.position.x++;
				break;
			case 'down':
				currentPath.position.y++;
				break;
			case 'left':
				currentPath.position.x--;
				break;
			default:
				console.log('Invalid Direction.');
				return false;
		}
		currentPath.moves.push(new Position(currentPath.position.x, currentPath.position.y));
		if (currentPath.position.x < 0 ||
			currentPath.position.x + 1 > sim.size.width ||
			currentPath.position.y < 0 ||
			currentPath.position.y + 1 > sim.size.height)
		{
			sim.status = 'FELL';
			return false;
		}
		newTile = sim.board[currentPath.position.y][currentPath.position.x];
		if (newTile.visitedBy.indexOf(currentPathIndex) !== -1) {
			sim.status = 'LOOP';
			return false;
		} else {
			// Simultion can continue
			sim.status = 'OK';
			newTile.visitedBy.push(currentPathIndex);
			newTile.visited = true;
			return true;
		}
	};

	signalState = function (sim) {
		var messageDisplay = UT.qs('.message');
		var currentPath = sim.paths[sim.paths.length - 1];
		UT.qs('.next').disabled = true;
		UT.qs('.complete').disabled = true;
		UT.qs('.move-count').innerHTML = 'Moves: ' + (currentPath.moves.length - 1);
		switch (sim.status) {
			case 'OK':
				UT.qs('.next').disabled = false;
				UT.qs('.complete').disabled = false;
				sim.message = 'Can continue.';
				playSound(440);
				break;
			case 'LOOP':
				currentPath.result = 'LOOP';
				sim.message = '<strong>Start was Safe</strong>: detected Loop.';
				playSound(880);
				break;
			case 'FELL':
				currentPath.result = 'FELL'
				sim.message = '<strong>Start was Doomed</strong>: Fell Off at: ' + currentPath.position.x + ' x ' + currentPath.position.y;
				playSound(220);
				break;
			default:
				console.log('Unknown state: ' + sim.status);
				return false;
		}
		messageDisplay.innerHTML = sim.message;
	};

	nextSim = function () {
		movePiece(currentState);
		signalState(currentState);
		drawBoard(currentState);
		drawPaths(currentState);
	};

	advanceSim = function () {
		var currentPath = currentState.paths[currentState.paths.length - 1];
		var newX = currentPath.moves[0].x + 1;
		var newY = currentPath.moves[0].y;
		if (newX >= currentState.size.width) {
			newX = 0;
			newY++;
			if (newY >= currentState.size.height) {
				newY = 0;
			}
		}
		var newStart = new Position(newX, newY);
		var newPath = new Path(newStart);
		currentState.paths.push(newPath);
		currentState.status = 'OK';
		signalState(currentState);
		drawBoard(currentState);
		drawPaths(currentState);
	};

	completePathSim = function () {
		var result = true;
		while (result) {
			result = movePiece(currentState);
		}
		signalState(currentState);
		drawBoard(currentState);
		drawPaths(currentState);
	};

	advanceAndComplete = function () {
		var maxPaths = currentState.size.width * currentState.size.height;
		if (currentState.paths.length <= maxPaths) {
			advanceSim();
			completePathSim();
			return true;
		} else {
			return false;
		}
	};

	runSim = function () {
		var result = true;
		completePathSim();
		while (result) {
			result = advanceAndComplete();
		}
		console.log(currentState);
	};

	resetSim = function () {
		var makeWidth = null;
		var makeHeight = null;
		var makeStartX = null;
		var makeStartY = null;
		var setWidth = UT.getInt(UT.qs('#board-width').value);
		var setHeight = UT.getInt(UT.qs('#board-height').value);
		var setStartX = UT.getInt(UT.qs('#start-x').value);
		var setStartY = UT.getInt(UT.qs('#start-y').value);
		if (setWidth !== false) {
			makeWidth = setWidth;
		}
		if (setHeight !== false) {
			makeHeight = setHeight;
		}
		if (setStartX !== false) {
			makeStartX = setStartX;
		}
		if (setStartY !== false) {
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
		var nextButton = UT.qs('.next');
		var completeButton = UT.qs('.complete');
		var advanceButton = UT.qs('.advance');
		var runButton = UT.qs('.run');
		var resetButton = UT.qs('.reset');
		UT.on(nextButton, 'click', nextSim);
		UT.on(completeButton, 'click', completePathSim);
		UT.on(advanceButton, 'click', advanceSim);
		UT.on(runButton, 'click', runSim);
		UT.on(resetButton, 'click', resetSim);
		resetSim();
		return true;
	};

	UT.on(window, 'load', init);

}(window));