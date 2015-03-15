(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};

	// SCOPE:
	var init, generateBoard, drawBoard, movePiece, advanceSim, runSim, resetSim;
	// Base Board Settings
	var boardDefaultWidth = 10;
	var boardDefaultHeight = 10;
	var tileDirections = ['up', 'right', 'down', 'left'];
	var currentState = null;

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
		this.status = 'New Simulation'
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
		var statusDisplay = UT.qs('.status');
		statusDisplay.innerHTML = sim.status;
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
			sim.status = '<strong>Start was Doomed</strong>: Fell Off at: ' + sim.position.x + ' x ' + sim.position.y;
			return false;
		}
		newTile = sim.board[sim.position.y][sim.position.x];
		if (newTile.visited) {
			sim.status = '<strong>Start was Safe</strong>: detected Loop.';
			return false;
		} else {
			// Simultion can continue
			sim.status = 'Can continue.';
			newTile.visited = true;
			return true;
		}
	};

	advanceSim = function () {
		UT.qs('.advance').disabled = !movePiece(currentState);
		drawBoard(currentState);
	};

	runSim = function () {
		UT.qs('.advance').disabled = true;
		var result = true;
		while (result) {
			result = movePiece(currentState);
		}
		drawBoard(currentState);
	}

	resetSim = function () {
		UT.qs('.advance').disabled = false;
		currentState = new SimState();
		drawBoard(currentState);
	};

	// Initializer
	init = function () {
		console.log('Page Load');
		var advanceButton = UT.qs('.advance');
		var runButton = UT.qs('.run');
		var resetButton = UT.qs('.reset');
		UT.on(advanceButton, 'click', advanceSim);
		UT.on(runButton, 'click', runSim)
		UT.on(resetButton, 'click', resetSim);
		resetSim();
		return true;
	};

	UT.on(window, 'load', init);

}(window));