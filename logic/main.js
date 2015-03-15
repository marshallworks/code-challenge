(function (window) {

	'use strict';

	// Import
	var UT = window.UT || {};

	// Scope
	var init;

	// Initializer
	init = function () {
		console.log('Page Load');
		return true;
	};

	UT.on(window, 'load', init);

}(window));