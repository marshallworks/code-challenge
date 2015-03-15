(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};

	// SCOPE:
	var init, generateBoard;
	// Base Board Settings
	var boardTileWidth = 10;
	var boardTileHeight = 10;
	var tileDirections = ['up', 'right', 'down', 'left'];

	// Functions
	generateBoard = function (tileWidth, tileHeight) {
		var _i, _j;
		// Board defaults
		if (tileWidth == null) {
			tileWidth = boardTileWidth;
		}
		if (tileHeight == null) {
			tileHeight = boardTileHeight;
		}
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
					direction: tileDirections[Math.floor(Math.random() * tileDirections.length)]
				};
			}
		}
		return board;
	};

	// Initializer
	init = function () {
		console.log('Page Load');
		var board = generateBoard();
		console.log(board);
		return true;
	};

	UT.on(window, 'load', init);

}(window));