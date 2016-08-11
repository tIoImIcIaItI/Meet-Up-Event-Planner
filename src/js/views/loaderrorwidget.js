/*globals document */
/*globals subclass, newTextElement */
/*globals Widget */

// Encapsulates the warning message shown if the list of events fails to load
// NOTE: this is considered a warning as the user can still (possibly)
// do everything else with the app (but view existing events).
(function (global) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var LoadErrorWidget = function (id) {

		Widget.call(this, id);
	};

	subclass(LoadErrorWidget, Widget);

	LoadErrorWidget.prototype.render = function () {

		var errMsg = newTextElement('div', 'Unable to load events');
		errMsg.id = this.id;
		errMsg.classList.add('alert');
		errMsg.classList.add('alert-warning');
		errMsg.setAttribute('aria-live', 'polite');

		return errMsg;
	};

	global.LoadErrorWidget = LoadErrorWidget;

	// ReSharper disable once ThisInGlobalContext
}(this));