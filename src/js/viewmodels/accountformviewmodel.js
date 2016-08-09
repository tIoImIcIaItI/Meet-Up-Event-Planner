/*globals document */
/*globals subclass */
/*globals FormViewModel */

// Encapsulates and specializes the new user account form
// TODO: componentize the password checker
(function (global) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var AccountFormViewModel = function (form) {

		FormViewModel.call(this, form);

		this._pwdEl = null;
		this._pwdHelper = null;
	};

	subclass(AccountFormViewModel, FormViewModel);

	// Returns a user model from the form's input values
	AccountFormViewModel.prototype.newUserFrom = function () {
		return {
			name: document.getElementById('account-name').value,
			email: document.getElementById('account-email').value,
			password: document.getElementById('account-password').value,

			age: document.getElementById('account-age').value,
			gender: document.getElementById('account-gender').value
		};
	};

	AccountFormViewModel.prototype.init = function () {
		var that = this;

		this._pwdEl = document.getElementById('account-password');

		// Create and initialize a new password helper widget
		this._pwdHelper = new PasswordHelperWidget();
		this._pwdHelper.init();

		this._pwdHelper.isValid.subscribe(function (isValid) {

			that.updateValidationErrorState(that._pwdEl, isValid);
		});
	};

	AccountFormViewModel.prototype.reset = function () {

		// Call the base method to reset standard inputs
		FormViewModel.prototype.reset.call(this);

		// Reset the password helper widget
		this._pwdHelper.reset();
	}

	global.AccountFormViewModel = AccountFormViewModel;

// ReSharper disable once ThisInGlobalContext
}(this));