(function (window) {

	'use strict';

	// Constants
	var defaultColor = 'rgb(66, 77, 88)';
	var occupiedColor = 'rgb(158, 11, 15)';
	var visitedColor = 'rgb(60, 184, 120)';
	var pathColor = 'rgba(20, 220, 250, 0.3)';
	var pathWidth = '2';
	var pathTemplate = '<path d="{{points}}" fill="none" stroke="{{color}}" stroke-width="{{width}}"></path>';

	// Scope
	var time, animDraw, directionCorrectedLT, remStartCoord, remEndCoord, remCurCoord;

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

	Renderer.prototype.animDrawMove = function (fromPos, toPos) {
		var fullTileWidth = this.tilePxWidth + this.tilePxPadding;
		var fullTileHeight = this.tilePxHeight + this.tilePxPadding;
		var xOffset = fullTileWidth / 2;
		var yOffset = fullTileHeight / 2;
		var startX = fromPos.x * fullTileWidth + xOffset;
		var startY = fromPos.y * fullTileHeight + yOffset;
		var endX = toPos.x * fullTileWidth + xOffset;
		var endY = toPos.y * fullTileHeight + yOffset;
		remStartCoord = new Coord(startX, startY);
		remEndCoord = new Coord(endX, endY);
		remCurCoord = new Coord(startX, startY);
		animDraw();
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

	animDraw = function () {
		if (directionCorrectedLT(startCoord, endCoord, curCoord)) {
			requestAnimationFrame(animDraw);
		}
		var now = new Date().getTime();
		var dt = now - (time || now);
		time = now;

	};

	directionCorrectedLT = function (startCoord, endCoord, curCoord) {
		var xLess = true;
		var yLess = true;
		if (startCoord.x <= endCoord.x) {
			if (curCoord.x <= endCoord.x) {
				xLess = false;
			}
		} else {
			if (curCoord.x >= endCoord.x) {
				xLess = false;
			}
		}
		if (startCoord.y <= endCoord.y) {
			if (curCoord.y <= endCoord.y) {
				yLess = false;
			}
		} else {
			if (curCoord.y >= endCoord.y) {
				yLess = false;
			}
		}
		return xLess && yLess;
	};

	window.Renderer = Renderer;

}(window));