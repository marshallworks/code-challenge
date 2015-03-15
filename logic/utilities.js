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

	// EXPORT
	window.UT = UT;

}(window));