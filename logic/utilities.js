(function (window) {

	'use strict';

	// Scope
	var UT = {};

	// DOM Query Helpers
	UT.qs = function (selector, scope) {
		return (scope || document).querySelector(selector);
	};
	UT.qsa = function (selector, scope) {
		return (scope || document).querySelectorAll(selector);
	};
	// Event Listener Helper
	UT.on = function (target, type, callback, useCapture) {
		if (target) {
			target.addEventListener(type, callback, !!useCapture);
			return true;
		}
		return false;
	};
	// Type Checking
	UT.isNumber = function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	// Get Type
	UT.getInt = function (n) {
		if (UT.isNumber(n)) {
			return parseInt(n, 10);
		} else {
			return false;
		}
	}

	// EXPORT
	window.UT = UT;

}(window));