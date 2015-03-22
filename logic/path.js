(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};

	var indexTracker = 0;

	// Position Type
	function Position (x, y) {
		// Ensure position uses integers
		this.x = UT.isNumber(x) ? UT.getInt(x) : 0;
		this.y = UT.isNumber(y) ? UT.getInt(y) : 0;
		return this;
	}

	// Position Equality
	Position.prototype.equal = function (comparePos) {
		if (comparePos instanceof Position) {
			return (this.x === comparePos.x && this.y === comparePos.y);
		}
		return false;
	};

	// Path Type
	function Path (startPos) {
		if (!(startPos instanceof Position)) {
			startPos = new Position();
		}
		this.id = indexTracker;
		this.moves = [];
		this.moves.push(startPos);
		this.result = '';
		indexTracker++;
		return this;
	}

	Path.prototype.getPosition = function () {
		return this.moves[this.moves.length - 1];
	};

	Path.prototype.getStartPosition = function () {
		return this.moves[0];
	};

	Path.prototype.move = function (direction) {
		var pos = this.getPosition();
		var newX = pos.x;
		var newY = pos.y;
		switch (direction) {
			case 'up':
				newY--;
				break;
			case 'right':
				newX++;
				break;
			case 'down':
				newY++;
				break;
			case 'left':
				newX--;
				break;
			default:
				console.log('Invalid Direction.');
				return this;
		}
		this.moves.push(new Position(newX, newY));
		return this;
	};

	Path.prototype.setResult = function (result) {
		this.result = result;
		return this;
	};

	// Export
	window.Position = Position;
	window.Path = Path;

}(window));