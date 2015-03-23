(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};
	var Position = window.Position || {};
	var Path = window.Path || {};
	var Board = window.Board || {};
	var Renderer = window.Renderer || {};
	var Sound = window.Sound || {};

	function Simulation (boardWidth, boardHeight, fillScreen) {
		var temp;
		if (fillScreen) {
			temp = new Renderer({canvas: UT.qs('#board')}).fillScreenSize();
			boardWidth = temp.width;
			boardHeight = temp.height;
		}
		this.board = new Board(boardWidth, boardHeight);
		this.paths = [];
		this.status = 'OK';
		this.message = 'New Simulation';
		this.sound = new Sound();
		this.renderer = new Renderer({
			canvas: UT.qs('#board'),
			paths: UT.qs('#paths'),
			boardWidth: this.board.width,
			boardHeight: this.board.height
		});
		return this;
	}

	Simulation.prototype.start = function (startX, startY) {
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
		this.board.visitTileWithPath(startPos, startPath);
		return this;
	};

	Simulation.prototype.advancePath = function () {
		var path = this.paths[this.paths.length - 1];
		var direction = this.board.getTileDirection(path.getPosition());
		var newPos = path.move(direction).getPosition();
		if (!this.board.isPositionInBounds(newPos)) {
			this.status = 'FELL';
			path.setResult('FELL');
		} else {
			if (this.board.wasTileVisitedByPath(newPos, path)) {
				this.status = 'LOOP';
				path.setResult('LOOP');
			} else {
				// Simultion can continue
				this.status = 'OK';
				this.board.visitTileWithPath(newPos, path);
			}
		}
		return this;
	};

	Simulation.prototype.completePath = function () {
		while (this.isOk()) {
			this.advancePath();
		}
		return this;
	};

	Simulation.prototype.advanceBoard = function () {
		if (!this.isComplete()) {
			var path = this.paths[this.paths.length - 1];
			var pos = path.getStartPosition();
			var newX = pos.x + 1;
			var newY = pos.y;
			if (newX >= this.board.width) {
				newX = 0;
				newY++;
				if (newY >= this.board.height) {
					newY = 0;
				}
			}
			var newStart = new Position(newX, newY);
			var newPath = new Path(newStart);
			this.paths.push(newPath);
			this.status = 'OK';
		}
		return this;
	};

	Simulation.prototype.advanceBoardAndCompletePath = function () {
		if (!this.isComplete()) {
			this.advanceBoard().completePath();
		}
		return this;
	};

	Simulation.prototype.completeBoard = function () {
		this.completePath();
		while (!this.isComplete()) {
			this.advanceBoardAndCompletePath();
		}
		return this;
	};

	Simulation.prototype.signal = function () {
		var _i, loopPath;
		var totalPaths = this.paths.length;
		var currentPath = this.paths[totalPaths - 1];
		var currentPos = currentPath.getPosition();
		var messageDisplay = UT.qs('.message');
		var loopCount = 0;
		var fellCount = 0;
		var pathLengths = 0;
		var averagePathLength = 0;
		for (_i = 0; _i < totalPaths; _i++) {
			loopPath = this.paths[_i];
			pathLengths += loopPath.moves.length - 1;
			if (loopPath.result === 'LOOP') {
				loopCount++;
			}
			if (loopPath.result === 'FELL') {
				fellCount++;
			}
		}
		averagePathLength = pathLengths / totalPaths;
		UT.qs('#board-width').value = this.board.width;
		UT.qs('#board-height').value = this.board.height;
		UT.qs('.path-next').disabled = true;
		UT.qs('.path-complete').disabled = true;
		UT.qs('.path-play').disabled = true;
		UT.qs('.board-next').disabled = false;
		UT.qs('.board-play').disabled = false;
		UT.qs('.board-complete').disabled = false;
		UT.qs('.move-count').innerHTML = currentPath.moves.length - 1;
		UT.qs('.path-number').innerHTML = totalPaths;
		UT.qs('.loop-number').innerHTML = loopCount;
		UT.qs('.fell-number').innerHTML = fellCount;
		UT.qs('.average-path-length-number').innerHTML = averagePathLength;
		switch (this.status) {
			case 'OK':
				UT.qs('.path-next').disabled = false;
				UT.qs('.path-complete').disabled = false;
				UT.qs('.path-play').disabled = false;
				this.message = 'Can continue.';
				this.sound.playFreq(440);
				break;
			case 'LOOP':
				this.message = 'Detected Loop.';
				this.sound.playFreq(880);
				break;
			case 'FELL':
				this.message = 'Fell Off at: ' + currentPos.x + ' x ' + currentPos.y;
				this.sound.playFreq(220);
				break;
			case 'COMPLETE':
				UT.qs('.board-next').disabled = true;
				UT.qs('.board-play').disabled = true;
				UT.qs('.board-complete').disabled = true;
				this.message = 'Board is Complete';
				this.sound.playFreq(110);
				break;
			default:
				console.log('Unknown state: ' + this.status);
				return false;
		}
		messageDisplay.innerHTML = this.message;
		return this;
	};

	Simulation.prototype.render = function () {
		this.renderer.drawBoard(this);
		this.renderer.drawSVGPaths(this);
		return this;
	};

	Simulation.prototype.isOk = function () {
		return this.status === 'OK' ? true : false;
	};

	Simulation.prototype.isComplete = function () {
		if (this.status !== 'COMPLETE' &&
			this.paths.length < this.board.width * this.board.height) {
			return false;
		} else {
			this.status = 'COMPLETE';
		}
		return true;
	};

	// Export
	window.Simulation = Simulation;

}(window));