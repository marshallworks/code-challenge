(function (window) {

	'use strict';

	// Imports
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	// Constants
	var soundFreqDefault = 440;

	function Sound (attr) {
		if (attr == null) {
			attr = {};
		}
		this.ctx = null;
		try {
			this.ctx = new AudioContext();
		} catch (e) {
			console.log('Web Audio API not supported');
		}
		if (this.ctx !== null) {
			this.osc = this.ctx.createOscillator();
			this.osc.frequency.value = attr.hasOwnProperty('freq') ? attr.freq : soundFreqDefault;

			this.amp = this.ctx.createGain();
			this.amp.gain.value = 0;

			this.osc.connect(this.amp);
			this.amp.connect(this.ctx.destination);
			this.osc.start(0);
		}
		return this;
	}

	Sound.prototype.playFreq = function (freq) {
		if (freq == null) {
			freq = soundFreqDefault;
		}
		var now = this.ctx.currentTime;
		this.osc.frequency.setValueAtTime(freq, now);
		this.amp.gain.cancelScheduledValues(now);
		this.amp.gain.setValueAtTime(this.amp.gain.value, now);
		this.amp.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
		this.amp.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
	};

	window.Sound = Sound;

}(window));