(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var Board = window.Board || {};
	var Renderer = window.Renderer || {};
	var Sound = window.Sound || {};

	// SCOPE:
	var movePiece,
		signalState,
		simCompletePath,
		simAdvancePathStart,
		simAdvanceAndComplete,
		getSimValues,
		resetSim,
		pathNext,
		pathComplete,
		boardAdvancePathStart,
		boardRunAllPaths,
		boardStart,
		boardReset,
		init;

	// Base Board Settings
	var currentState = null;

	// Set Board Settings
	var setWidth = null;
	var setHeight = null;
	var setStartX = null;
	var setStartY = null;

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
	}

	// Simulation State
	function SimState (boardWidth, boardHeight, startX, startY) {
		// Set defaults
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
		this.board = new Board(boardWidth, boardHeight);
		this.board.visitTile(startPos, 0);
		this.status = 'OK';
		this.message = 'New Simulation';
		this.paths = [];
		this.paths.push(new Path(startPos));
		this.sound = new Sound();
		this.renderer = new Renderer({
			canvas: UT.qs('#board'),
			boardWidth: boardWidth,
			boardHeight: boardHeight
		});
		return this;
	}

	// Functions
	movePiece = function (sim, pathIndex) {
		if (pathIndex == null) {
			pathIndex = 0;
		}
		var currentPath = sim.paths[pathIndex];
		switch (sim.board.getTileDirection(currentPath.position)) {
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
			currentPath.result = 'FELL';
			return false;
		}
		if (sim.board.wasTileVisitedByPath(currentPath.position, pathIndex)) {
			sim.status = 'LOOP';
			currentPath.result = 'LOOP';
			return false;
		} else {
			// Simultion can continue
			sim.status = 'OK';
			sim.board.visitTile(currentPath.position, pathIndex);
			return true;
		}
	};

	signalState = function (sim) {
		var _i, loopPath;
		var totalPaths = sim.paths.length;
		var currentPath = sim.paths[totalPaths - 1];
		var messageDisplay = UT.qs('.message');
		var loopCount = 0;
		var fellCount = 0;
		for (_i = 0; _i < totalPaths; _i++) {
			loopPath = sim.paths[_i];
			if (loopPath.result === 'LOOP') {
				loopCount++;
			}
			if (loopPath.result === 'FELL') {
				fellCount++;
			}
		}
		UT.qs('.next').disabled = true;
		UT.qs('.complete').disabled = true;
		UT.qs('.move-count').innerHTML = currentPath.moves.length - 1;
		UT.qs('.path-number').innerHTML = totalPaths;
		UT.qs('.loop-number').innerHTML = loopCount;
		UT.qs('.fell-number').innerHTML = fellCount;
		switch (sim.status) {
			case 'OK':
				UT.qs('.next').disabled = false;
				UT.qs('.complete').disabled = false;
				sim.message = 'Can continue.';
				sim.sound.playFreq(440);
				break;
			case 'LOOP':
				sim.message = 'Detected Loop.';
				sim.sound.playFreq(880);
				break;
			case 'FELL':
				sim.message = 'Fell Off at: ' + currentPath.position.x + ' x ' + currentPath.position.y;
				sim.sound.playFreq(220);
				break;
			default:
				console.log('Unknown state: ' + sim.status);
				return false;
		}
		messageDisplay.innerHTML = sim.message;
	};

	simCompletePath = function (sim, pathIndex) {
		var result = true;
		while (result) {
			result = movePiece(sim, pathIndex);
		}
		return result;
	};

	simAdvancePathStart = function (sim) {
		var maxPaths = sim.size.width * sim.size.height;
		if (sim.paths.length < maxPaths) {
			var currentPath = sim.paths[sim.paths.length - 1];
			var newX = currentPath.moves[0].x + 1;
			var newY = currentPath.moves[0].y;
			if (newX >= sim.size.width) {
				newX = 0;
				newY++;
				if (newY >= sim.size.height) {
					newY = 0;
				}
			}
			var newStart = new Position(newX, newY);
			var newPath = new Path(newStart);
			sim.paths.push(newPath);
			sim.status = 'OK';
		}
	};

	simAdvanceAndComplete = function (sim) {
		var maxPaths = sim.size.width * sim.size.height;
		if (sim.paths.length < maxPaths) {
			simAdvancePathStart(sim);
			simCompletePath(sim, sim.paths.length - 1);
			return true;
		} else {
			return false;
		}
	};

	getSimValues = function () {
		var domWidth = UT.getInt(UT.qs('#board-width').value);
		var domHeight = UT.getInt(UT.qs('#board-height').value);
		var domStartX = UT.getInt(UT.qs('#start-x').value);
		var domStartY = UT.getInt(UT.qs('#start-y').value);
		setWidth = domWidth !== false ? domWidth : null;
		setHeight = domHeight !== false ? domHeight : null;
		setStartX = domStartX !== false ? domStartX : null;
		setStartY = domStartY !== false ? domStartY : null;
	};

	resetSim = function () {
		getSimValues();
		currentState = new SimState(setWidth, setHeight, setStartX, setStartY);
		return currentState;
	};

	// Event Functions
	pathNext = function () {
		movePiece(currentState, currentState.paths.length - 1);
		signalState(currentState);
		currentState.renderer.drawBoard(currentState);
		currentState.renderer.drawPaths(currentState);
	};

	pathComplete = function () {
		simCompletePath(currentState, currentState.paths.length - 1);
		signalState(currentState);
		currentState.renderer.drawBoard(currentState);
		currentState.renderer.drawPaths(currentState);
	};

	boardAdvancePathStart = function () {
		simCompletePath(currentState, currentState.paths.length - 1);
		signalState(currentState);
		simAdvancePathStart(currentState);
		currentState.renderer.drawBoard(currentState);
		currentState.renderer.drawPaths(currentState);
		UT.qs('.next').disabled = false;
		UT.qs('.complete').disabled = false;
	};

	boardRunAllPaths = function () {
		var result = true;
		simCompletePath(currentState, currentState.paths.length - 1);
		while (result) {
			result = simAdvanceAndComplete(currentState);
		}
		signalState(currentState);
		currentState.renderer.drawBoard(currentState);
		currentState.renderer.drawPaths(currentState);
	};

	boardStart = function () {
		var newSim = resetSim();
		signalState(newSim);
		newSim.renderer.drawBoard(newSim);
	};

	boardReset = function () {
		var newSim = resetSim();
		signalState(newSim);
		newSim.renderer.drawBoard(newSim);
	};

	// Initializer
	init = function () {
		console.log('Page Load Complete');
		var setButton = UT.qs('.set');
		var nextButton = UT.qs('.next');
		var completeButton = UT.qs('.complete');
		var advanceButton = UT.qs('.advance');
		var runButton = UT.qs('.run');
		var resetButton = UT.qs('.reset');
		UT.on(setButton, 'click', boardReset);
		UT.on(nextButton, 'click', pathNext);
		UT.on(completeButton, 'click', pathComplete);
		UT.on(advanceButton, 'click', boardAdvancePathStart);
		UT.on(runButton, 'click', boardRunAllPaths);
		UT.on(resetButton, 'click', boardReset);
		boardStart();
		return true;
	};

	UT.on(window, 'load', init);

}(window));