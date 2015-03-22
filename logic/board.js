(function (window) {

	'use strict';

	// Constants
	var defaultBoardWidth = 28;
	var defaultBoardHeight = 28;
	var tileDirections = ['up', 'right', 'down', 'left'];

	// Private Methods
	var generate, randomTileDirection;

	function Board (tileWidth, tileHeight) {
		if (tileWidth == null) {
			tileWidth = defaultBoardWidth;
		}
		if (tileHeight == null) {
			tileHeight = defaultBoardHeight;
		}
		this.grid = generate(tileWidth, tileHeight);
		return this;
	}

	Board.prototype.getTileDirection = function (pos) {
		return this.grid[pos.y][pos.x].getDirection();
	};

	Board.prototype.visitTile = function (pos, pathID) {
		this.grid[pos.y][pos.x].visit(pathID);
		return this;
	};

	Board.prototype.wasTileVisited = function (pos) {
		return this.grid[pos.y][pos.x].wasVisited();
	};

	Board.prototype.wasTileVisitedByPath = function (pos, pathID) {
		return this.grid[pos.y][pos.x].wasVisitedByPath(pathID);
	};

	function Tile (attr) {
		if (attr == null) {
			attr = {};
		}
		this.direction = attr.hasOwnProperty('direction') ? attr.direction : randomTileDirection();
		this.visitedBy = attr.hasOwnProperty('visitedBy') ? attr.visitedBy : [];
		this.visited = attr.hasOwnProperty('visited') ? attr.visited : false;
		return this;
	}

	Tile.prototype.getDirection = function () {
		return this.direction;
	};

	Tile.prototype.visit = function (pathID) {
		this.visitedBy.push(pathID);
		return this;
	};

	Tile.prototype.wasVisited = function () {
		return this.visitedBy.length > 0 ? true : false;
	};

	Tile.prototype.wasVisitedByPath = function (pathID) {
		return this.visitedBy.indexOf(pathID) !== -1 ? true : false;
	};

	// Private Methods

	generate = function (width, height) {
		var _i, _j;
		// Create grid
		var grid = [];
		// Loop to create tile rows.
		for (_i = 0; _i < height; _i++) {
			// Create row
			grid[_i] = [];
			// Loop to create tiles.
			for (_j = 0; _j < width; _j++) {
				// Create tile, as object assuming additional properties
				grid[_i][_j] = new Tile();
			}
		}
		return grid;
	};

	randomTileDirection = function () {
		// Math.random() is 0 inclusive and 1 exclusive; so using Math.floor for an even
		// distribution of directions on the grid.
		return tileDirections[Math.floor(Math.random() * tileDirections.length)];
	};

	// Export
	window.Board = Board;

}(window));