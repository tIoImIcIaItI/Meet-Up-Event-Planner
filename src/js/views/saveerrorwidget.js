/*globals document */
/*globals subclass, newTextElement */
/*globals Widget */

// Encapsulates the error message shown if an event fails to save
(function (global) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var SaveErrorWidget = function (id) {

		Widget.call(this, id);
	};

	subclass(SaveErrorWidget, Widget);

	SaveErrorWidget.prototype.render = function () {

		var errMsg = newTextElement('div', 'Unable to save event');
		errMsg.id = this.id;
		errMsg.classList.add('alert');
		errMsg.classList.add('alert-danger');
		// ??? Should we be more assertive here? We don't want the user to leave the form yet!
		errMsg.setAttribute('aria-live', 'polite');

		return errMsg;
	};

	global.SaveErrorWidget = SaveErrorWidget;

// ReSharper disable once ThisInGlobalContext
}(this));