(function (window) {

	'use strict';

	// Constants
	var defaultBoardWidth = 28;
	var defaultBoardHeight = 28;
	var tileDirections = ['up', 'up-right', 'right', 'right-down', 'down', 'down-left', 'left', 'left-up'];

	// Private Methods
	var generate, randomTileDirection;

	function Board (width, height) {
		if (width == null) {
			width = defaultBoardWidth;
		}
		if (height == null) {
			height = defaultBoardHeight;
		}
		this.width = width;
		this.height = height;
		this.grid = generate(width, height);
		return this;
	}

	Board.prototype.getTileDirection = function (pos) {
		return this.grid[pos.y][pos.x].getDirection();
	};

	Board.prototype.visitTileWithPath = function (pos, path) {
		this.grid[pos.y][pos.x].visit(path.id);
		return this;
	};

	Board.prototype.wasTileVisited = function (pos) {
		return this.grid[pos.y][pos.x].wasVisited();
	};

	Board.prototype.wasTileVisitedByPath = function (pos, path) {
		return this.grid[pos.y][pos.x].wasVisitedByPath(path.id);
	};

	Board.prototype.isPositionInBounds = function (pos) {
		if (pos.x < 0 ||
			pos.x + 1 > this.width ||
			pos.y < 0 ||
			pos.y + 1 > this.height)
		{
			return false;
		}
		return true;
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