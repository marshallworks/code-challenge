(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var Simulation = window.Simulation || {};

	// SCOPE:
	var reset,
		getValues,
		pathNext,
		pathComplete,
		boardAdvance,
		boardComplete,
		init;

	// Base Board Settings
	var currentState = null;

	// Set Board Settings
	var setWidth = null;
	var setHeight = null;
	var setStartX = null;
	var setStartY = null;

	// Event Functions
	reset = function () {
		getValues();
		currentState = new Simulation(setWidth, setHeight)
			.start(setStartX, setStartY)
			.signal()
			.render();
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

	// Initializer
	init = function () {
		console.log('Page Load Complete');
		var setButton = UT.qs('.set');
		var nextButton = UT.qs('.next');
		var completeButton = UT.qs('.complete');
		var advanceButton = UT.qs('.advance');
		var runButton = UT.qs('.run');
		var resetButton = UT.qs('.reset');
		UT.on(setButton, 'click', reset);
		UT.on(nextButton, 'click', pathNext);
		UT.on(completeButton, 'click', pathComplete);
		UT.on(advanceButton, 'click', boardAdvance);
		UT.on(runButton, 'click', boardComplete);
		UT.on(resetButton, 'click', reset);
		reset();
		return true;
	};

	UT.on(window, 'load', init);

}(window));