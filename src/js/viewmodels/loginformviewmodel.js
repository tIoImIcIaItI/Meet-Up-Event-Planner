/*globals document */
/*globals subclass */
/*globals FormViewModel */

// Encapsulates and specializes the user login form
(function (global, document) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var LoginFormViewModel = function (form) {
		FormViewModel.call(this, form);
	};

	subclass(LoginFormViewModel, FormViewModel);

	// Returns a user model from the form's input values
	LoginFormViewModel.prototype.newUserFrom = function () {
		return {
			email: document.getElementById('user-login-email').value,
			password: document.getElementById('user-login-password').value
		};
	};

	global.LoginFormViewModel = LoginFormViewModel;

// ReSharper disable once ThisInGlobalContext
}(this, document));