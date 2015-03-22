(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var Simulation = window.Simulation || {};

	// SCOPE:
	var newSim,
		reset,
		fillReset,
		getValues,
		pathNext,
		pathComplete,
		pathPlay,
		boardAdvance,
		boardComplete,
		boardPlay,
		stopPlay,
		interval,
		init;

	// Base Board Settings
	var currentState = null;

	// Set Board Settings
	var setWidth = null;
	var setHeight = null;
	var setStartX = null;
	var setStartY = null;

	// Event Functions
	newSim = function (fillScreen) {
		getValues();
		currentState = new Simulation(setWidth, setHeight, fillScreen)
			.start(setStartX, setStartY)
			.signal()
			.render();
	};

	reset = function () {
		newSim(false);
	};

	fillReset = function () {
		newSim(true);
	};

	getValues = function () {
		var domWidth = UT.getInt(UT.qs('#board-width').value);
		var domHeight = UT.getInt(UT.qs('#board-height').value);
		var domStartX = UT.getInt(UT.qs('#start-x').value);
		var domStartY = UT.getInt(UT.qs('#start-y').value);
		setWidth = domWidth !== false ? domWidth : null;
		setHeight = domHeight !== false ? domHeight : null;
		setStartX = domStartX !== false ? domStartX : null;
		setStartY = domStartY !== false ? domStartY : null;
	};

	pathNext = function () {
		currentState.advancePath().signal().render();
	};

	pathComplete = function () {
		currentState.completePath().signal().render();
	};

	pathPlay = function () {
		currentState.advancePath().render().signal();
		interval = window.setInterval(function () {
			currentState.advancePath().render().signal();
			if (!currentState.isOk()) {
				window.clearInterval(interval);
			}
		}, 600);
	};

	boardAdvance = function () {
		currentState.completePath()
			.signal()
			.advanceBoard()
			.signal()
			.render();
	};

	boardComplete = function () {
		currentState.completeBoard().signal().render();
	};

	boardPlay = function () {
		currentState.advancePath().render().signal();
		interval = window.setInterval(function () {
			if (!currentState.isOk()) {
				currentState.advanceBoard().render().signal();
			} else {
				currentState.advancePath().render().signal();
			}
			if (currentState.isComplete()) {
				window.clearInterval(interval);
			}
		}, 34);
	};

	stopPlay = function () {
		window.clearInterval(interval);
		interval = null;
	};

	// Initializer
	init = function () {
		console.log('Page Load Complete');
		UT.on(UT.qs('.set'), 'click', reset);
		UT.on(UT.qs('.reset'), 'click', reset);
		UT.on(UT.qs('.fill-screen'), 'click', fillReset);
		UT.on(UT.qs('.path-next'), 'click', pathNext);
		UT.on(UT.qs('.path-play'), 'click', pathPlay);
		UT.on(UT.qs('.path-stop'), 'click', stopPlay);
		UT.on(UT.qs('.path-complete'), 'click', pathComplete);
		UT.on(UT.qs('.board-next'), 'click', boardAdvance);
		UT.on(UT.qs('.board-play'), 'click', boardPlay);
		UT.on(UT.qs('.board-stop'), 'click', stopPlay);
		UT.on(UT.qs('.board-complete'), 'click', boardComplete);
		reset();
		return true;
	};

	UT.on(window, 'load', init);

}(window));