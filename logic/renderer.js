(function (window) {

	'use strict';

	// Constants
	var defaultColor = 'rgb(66, 77, 88)';
	var occupiedColor = 'rgb(158, 11, 15)';
	var visitedColor = 'rgb(60, 184, 120)';
	var pathColor = 'rgba(20, 220, 250, 0.1)';
	var pathWidth = '2';
	var pathTemplate = '<path d="{{points}}" fill="none" stroke="{{color}}" stroke-width="{{width}}"></path>';

	function Coord (attr) {
		if (attr == null) {
			attr = {};
		}
		this.x = attr.hasOwnProperty('x') ? attr.x : 0;
		this.y = attr.hasOwnProperty('y') ? attr.y : 0;
		return this;
	}

	function Renderer (attr) {
		if (attr == null) {
			attr = {};
		}
		this.canvas = attr.hasOwnProperty('canvas') ? attr.canvas : null;
		this.paths = attr.hasOwnProperty('paths') ? attr.paths : null;
		this.boardWidth = attr.hasOwnProperty('boardWidth') ? attr.boardWidth : 28;
		this.boardHeight = attr.hasOwnProperty('boardHeight') ? attr.boardHeight : 28;
		this.tilePxWidth = attr.hasOwnProperty('tilePxWidth') ? attr.tilePxWidth : 4;
		this.tilePxHeight = attr.hasOwnProperty('tilePxHeight') ? attr.tilePxHeight : 4;
		this.tilePxPadding = attr.hasOwnProperty('tilePxPadding') ? attr.tilePxPadding : 16;
		this.ctx = this.canvas.getContext ? this.canvas.getContext('2d') : null;
		return this;
	}

	Renderer.prototype.fillScreenSize = function () {
		return {
			width: Math.floor(window.innerWidth / (this.tilePxWidth + this.tilePxPadding)),
			height: Math.floor(window.innerHeight / (this.tilePxHeight + this.tilePxPadding))
		};
	};

	Renderer.prototype.drawBoard = function (sim) {
		var _i, _j;
		var recentPathPos = sim.paths[sim.paths.length - 1].getPosition();
		this.canvas.width = (this.tilePxWidth + this.tilePxPadding) * sim.board.width;
		this.canvas.height = (this.tilePxHeight + this.tilePxPadding) * sim.board.height;
		this.paths.setAttribute('width', this.canvas.width);
		this.paths.setAttribute('height', this.canvas.height);
		this.paths.setAttribute('viewBox', '0 0 ' + this.canvas.width + ' ' + this.canvas.height);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// Row loop
		for(_i = 0; _i < sim.board.height; _i++) {
			// Tile loop
			for(_j = 0; _j < sim.board.width; _j++) {
				// Draw tile
				this.ctx.fillStyle = defaultColor;
				if (_i === recentPathPos.y && _j === recentPathPos.x) {
					this.ctx.fillStyle = occupiedColor;
				} else if (sim.board.wasTileVisited({x: _j, y: _i})) {
					this.ctx.fillStyle = visitedColor;
				}
				this.ctx.fillRect(
					_j * (this.tilePxWidth + this.tilePxPadding) + (this.tilePxPadding/2),
					_i * (this.tilePxHeight + this.tilePxPadding) + (this.tilePxPadding/2),
					this.tilePxWidth,
					this.tilePxHeight);
			}
		}
		return sim;
	};

	Renderer.prototype.drawSVGPaths = function (sim) {
		var _i, count, pathsString = '';
		sim.renderer.paths.innerHTML = '';
		for(_i = 0, count = sim.paths.length; _i < count; _i++) {
			pathsString += this.drawSVGPath(sim.paths[_i]);
		}
		sim.renderer.paths.innerHTML = pathsString;
		return sim;
	};

	Renderer.prototype.drawSVGPath = function (path) {
		var _i, count, coord, pathString;
		var points = 'M';
		for(_i = 0, count = path.moves.length; _i < count; _i++) {
			coord = this.posToCoord(path.moves[_i]);
			points += ' ' + coord.x + ' ' + coord.y + ' L';
		}
		pathString = pathTemplate.replace('{{points}}', points.substring(0, points.length - 2));
		pathString = pathString.replace('{{color}}', pathColor);
		pathString = pathString.replace('{{width}}', pathWidth);
		return pathString;
	};

	Renderer.prototype.drawPaths = function (sim) {
		var _i, count;
		for(_i = 0, count = sim.paths.length; _i < count; _i++) {
			this.drawPath(sim.paths[_i]);
		}
		return sim;
	};

	Renderer.prototype.drawPath = function (path) {
		var _i, count, lFrom, lTo;
		var fullTileWidth = this.tilePxWidth + this.tilePxPadding;
		var fullTileHeight = this.tilePxHeight + this.tilePxPadding;
		var xOffset = fullTileWidth / 2;
		var yOffset = fullTileHeight / 2;
		this.ctx.strokeStyle = pathColor;
		for(_i = 1, count = path.moves.length; _i < count; _i++) {
			lFrom = path.moves[_i - 1];
			lTo = path.moves[_i];
			this.ctx.beginPath();
			this.ctx.moveTo(lFrom.x * fullTileWidth + xOffset, lFrom.y * fullTileHeight + yOffset);
			this.ctx.lineTo(lTo.x * fullTileWidth + xOffset, lTo.y * fullTileHeight + yOffset);
			this.ctx.stroke();
		}
		return path;
	};

	Renderer.prototype.posToCoord = function (pos) {
		var fullTileWidth = this.tilePxWidth + this.tilePxPadding;
		var fullTileHeight = this.tilePxHeight + this.tilePxPadding;
		var xOffset = fullTileWidth / 2;
		var yOffset = fullTileHeight / 2;
		return new Coord({
			x: pos.x * fullTileWidth + xOffset,
			y: pos.y * fullTileHeight + yOffset
		});
	};

	window.Renderer = Renderer;

}(window));