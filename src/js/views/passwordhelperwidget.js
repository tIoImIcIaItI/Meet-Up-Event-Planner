/*globals document */
/*globals subclass, newTextElement, appendGlyph */
/*globals Widget */

// Encapsulates the password hints widget and validation logic in the new account form
(function (global, document) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var PasswordHelperWidget = function (id) {

		Widget.call(this, id);

		this.isValid = observable(null);

		this._pwdNumEl = null;
		this._pwdLowerEl = null;
		this._pwdUpperEl = null;
		this._pwdSpecialEl = null;
		this._pwdLengthEl = null;
		this._allCheckEls = [];
	};

	subclass(PasswordHelperWidget, Widget);


	var pwdCheckFailedClass = 'text-danger';
	var pwdCheckPassedClass = 'text-success';

	// Clears the validation state on a given password hint
	PasswordHelperWidget.prototype._clearValidationStateOn = function (el) {
		el.classList.remove(pwdCheckFailedClass);
		el.classList.remove(pwdCheckPassedClass);
	};

	// Sets the validation state on a given password hint, based on the given validation flag
	PasswordHelperWidget.prototype._setValidationStateOn = function (el, valid) {
		el.addOrRemoveClass(pwdCheckFailedClass, !valid);
		el.addOrRemoveClass(pwdCheckPassedClass, valid);
	};

	// Randomize the password constraint hints so as not to skew the distribution via power of suggestion
	PasswordHelperWidget.prototype._randomizeHints = function () {

		// Returns a single-character string from the given ASCII character code.
		// Ensures we don't accidentally pass multiple args to fromCharCode().
		function fromAscii(asciiValue) {
			return String.fromCharCode(asciiValue);
		}

		// list of ambiguous alpha-numeric ASCII characters within 0-9, a-z, A-Z
		// A super-set of FAA standards (https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry/forming_nnumber/)
		var exclusions = ['0', '1', 'i', 'I', 'l', 'L', 'o', 'O', 'u', 'U', 'v', 'V'];

		function whereNotExcluded(char) {
			return !exclusions.includes(char);
		}

		// lists of non-ambiguous symbols allowed in password field
		var numbers = closedRange(0, 9).map(function (n) { return n + 48; }).map(fromAscii).filter(whereNotExcluded);
		var lower = closedRange(97, 122).map(fromAscii).filter(whereNotExcluded);
		var upper = closedRange(65, 90).map(fromAscii).filter(whereNotExcluded);

		document.querySelector('#pwd-check-number span.pwd-ex').textContent = pickFrom(numbers);
		document.querySelector('#pwd-check-lower span.pwd-ex').textContent = pickFrom(lower);
		document.querySelector('#pwd-check-upper span.pwd-ex').textContent = pickFrom(upper);
	};

	// Clear the validation state of all hints
	PasswordHelperWidget.prototype._clearValidationState = function () {
		var that = this;

		this._allCheckEls.forEach(function (el) {
			that._clearValidationStateOn(el);
		});
	};

	// Evaluate the current password value and update the validation states of all hints,
	// and the overall validation state.
	PasswordHelperWidget.prototype._updatePasswordValidation = function () {

		var password = this._pwdEl.value;
		var isValid = false;

		if (!password || password.length < 1) {

			// empty resets all checks
			this._clearValidationState();

		} else {

			// ADAPTED FROM: http://www.the-art-of-web.com/javascript/validate-password/
			// (?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{8,}

			var hasNum = /\d/.test(password);
			this._setValidationStateOn(this._pwdNumEl, hasNum);

			var hasLower = /[a-z]/.test(password);
			this._setValidationStateOn(this._pwdLowerEl, hasLower);

			var hasUpper = /[A-Z]/.test(password);
			this._setValidationStateOn(this._pwdUpperEl, hasUpper);

			var hasNoSpecial = /^\w+$/.test(password);
			this._setValidationStateOn(this._pwdSpecialEl, hasNoSpecial);

			var hasLength = password.length >= 8 && password.length <= 16;
			this._setValidationStateOn(this._pwdLengthEl, hasLength);

			isValid = hasNum && hasLower && hasUpper && hasLength && hasNoSpecial;
		}

		this.isValid(isValid);
	};

	PasswordHelperWidget.prototype.init = function () {
		var that = this;

		// Cache our DOM element references
		this._pwdEl = document.getElementById('account-password');

		this._pwdNumEl = document.getElementById('pwd-check-number');
		this._pwdLowerEl = document.getElementById('pwd-check-lower');
		this._pwdUpperEl = document.getElementById('pwd-check-upper');
		this._pwdSpecialEl = document.getElementById('pwd-check-special');
		this._pwdLengthEl = document.getElementById('pwd-check-length');

		this._allCheckEls = [this._pwdNumEl, this._pwdLowerEl, this._pwdUpperEl, this._pwdSpecialEl, this._pwdLengthEl];

		// Update validation state on input and blur
		this._pwdEl.addEventListener('input', function () { that._updatePasswordValidation(); });
		this._pwdEl.addEventListener('blur', function () { that._updatePasswordValidation(); });

		// Choose new values for the hint examples
		this._randomizeHints();
	};

	PasswordHelperWidget.prototype.reset = function () {

		// Clear the validation state of all hints
		this._clearValidationState();
	};

	global.PasswordHelperWidget = PasswordHelperWidget;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
