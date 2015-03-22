(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var Position = window.Position || {};
	var Path = window.Path || {};
	var Board = window.Board || {};
	var Renderer = window.Renderer || {};
	var Sound = window.Sound || {};

	// SCOPE:
	var advance,
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

	// Simulation State
	function SimState (boardWidth, boardHeight) {
		this.board = new Board(boardWidth, boardHeight);
		this.paths = [];
		this.status = 'OK';
		this.message = 'New Simulation';
		this.sound = new Sound();
		this.renderer = new Renderer({
			canvas: UT.qs('#board'),
			boardWidth: board.width,
			boardHeight: board.height
		});
		return this;
	}

	SimState.prototype.start = function (startX, startY) {
		if (startX == null) {
			startX = Math.floor(Math.random() * this.board.width);
		}
		if (startY == null) {
			startY = Math.floor(Math.random() * this.board.height);
		}
		var startPos = new Position(startX, startY);
		if (!this.board.isPositionInBounds(startPos)) {
			console.log('Board Starting Position was out of bounds: x->' + startX + ' y->' + startY);
			startPos = new Position(0, 0);
		}
		var startPath = new Path(startPos);
		this.paths.push(startPath);
		this.board.visitTile(startPath);
		return this;
	};

	// Functions
	advance = function (sim, pathIndex) {
		if (pathIndex == null) {
			pathIndex = 0;
		}
		var currentPath = sim.paths[pathIndex];
		var newPos = currentPath.move(sim.board.getTileDirection(currentPath.getPosition())).getPosition();
		if (!sim.board.isPositionInBounds(newPos)) {
			sim.status = 'FELL';
			currentPath.setResult('FELL');
			return false;
		}
		if (sim.board.wasTileVisitedByPath(currentPath)) {
			sim.status = 'LOOP';
			currentPath.setResult('LOOP');
			return false;
		} else {
			// Simultion can continue
			sim.status = 'OK';
			sim.board.visitTile(currentPath);
			return true;
		}
	};

	signalState = function (sim) {
		var _i, loopPath;
		var totalPaths = sim.paths.length;
		var currentPath = sim.paths[totalPaths - 1];
		var currentPos = currentPath.getPosition();
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
				sim.message = 'Fell Off at: ' + currentPos.x + ' x ' + currentPos.y;
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
			result = advance(sim, pathIndex);
		}
		return result;
	};

	simAdvancePathStart = function (sim) {
		var maxPaths = sim.board.width * sim.board.height;
		if (sim.paths.length < maxPaths) {
			var currentPath = sim.paths[sim.paths.length - 1];
			var newX = currentPath.moves[0].x + 1;
			var newY = currentPath.moves[0].y;
			if (newX >= sim.board.width) {
				newX = 0;
				newY++;
				if (newY >= sim.board.height) {
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
		var maxPaths = sim.board.width * sim.board.height;
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
		currentState = new SimState(setWidth, setHeight).start(setStartX, setStartY);
		return currentState;
	};

	// Event Functions
	pathNext = function () {
		advance(currentState, currentState.paths.length - 1);
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