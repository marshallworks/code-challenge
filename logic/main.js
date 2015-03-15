(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};

	// SCOPE:
	var init, generateBoard, drawBoard;
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

	drawBoard = function (board) {
		var _i, _j, height, width;
		if (board == null) {
			board = generateBoard();
		}
		var tilePxWidth = 28;
		var tilePxHeight = 28;
		var canvas = UT.qs('#board');
		if (canvas.getContext) {
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = 'rgb(0, 200, 0)';
			// Row loop
			for(_i = 0, height = board.length; _i < height; _i++) {
				// Tile loop
				for(_j = 0, width = board[_i].length; _j < width; _j++) {
					// Draw tile
					ctx.fillRect(
						_j * (tilePxWidth + 2),
						_i * (tilePxHeight + 2),
						tilePxWidth,
						tilePxHeight);
				}
			}
		} else {
			console.log('Canvas context not supported.');
		}
		return board;
	};

	// Initializer
	init = function () {
		console.log('Page Load');
		drawBoard();
		return true;
	};

	UT.on(window, 'load', init);

}(window));