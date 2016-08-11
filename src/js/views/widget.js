/*globals document */
/*globals subclass, newTextElement */

// Encapsulates bits of UI managed by script
(function (global, document) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var Widget = function (id) {

		this.id = id;
	};

	Widget.prototype.constructor = Widget;

	// Override this function to return an insertable DOM element or document fragment
	Widget.prototype.render = function () { };

	// By default we simply remove the element with our ID from the DOM
	Widget.prototype.unrender = function () {

		var el = document.getElementById(this.id);

		if (el)
			el.remove();
	};

	global.Widget = Widget;

	// ReSharper disable once ThisInGlobalContext
}(this, document));