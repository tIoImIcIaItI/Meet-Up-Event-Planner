/*globals document, alert */
/*globals moment */
/*globals subclass, arrayFrom */


// Base form class, providing convenience functions and
// standardizing the way this app will handle validation, autofocus, etc.

(function (global, alert) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var FormViewModel = function (formElement) {

		this.el = formElement;

		this.onSubmitValid = null;
		this.preFormSubmit = null;
		this.postFormSubmit = null;

		this.initializeValidation();
		this.initializeSubmitHook();
		this.addDateTimeLocalFallback();
	};

	FormViewModel.prototype.constructor = FormViewModel;

	// Return an array filled with all the likely DOM input elements in this form
	FormViewModel.prototype.allInputs = function () {

		return arrayFrom(this.el.getElementsByTagName('input')).concat(
			arrayFrom(this.el.getElementsByTagName('textarea'))).concat(
			arrayFrom(this.el.getElementsByClassName('input-datetime-local')));
	};

	// Because of habit in other languages, I sooo want to set value to null
	FormViewModel.prototype.clearInput = function (input) {

		input.value = '';
	};

	// Removes any value and validation errors from the given DOM input element
	FormViewModel.prototype.resetInput = function (input) {

		this.clearInput(input);
		this.clearValidationErrorState(input);
	};

	// Removes all values and validation errors from all the known input elements in this form
	FormViewModel.prototype.reset = function () {
		var that = this;

		this.allInputs().forEach(function (input) {
			that.resetInput(input);
		});
	};

	// Returns the label in this form whose 'for' attribute points to the given input element's id
	FormViewModel.prototype.labelFor = function (input) {
		return this.el.querySelector(
			'#' + this.el.id + ' label[for=\'' + input.id + '\']');
	};

	// Returns all the DOM elements in this form declared as being an error annotation
	// for the given DOM input element.
	// To associate an error with an input, place the 'data-error-for' attribute
	// on the error element and give it a value of the id of the input element.
	FormViewModel.prototype.errorElementsFor = function (input) {

		return arrayFrom(this.el.getElementsByClassName('validation-error')).
		filter(function (el) {
			return el.getAttribute('data-error-for') === input.id;
		});
	};

	// Pushes an input element's validation message into any associated error elements' textContent,
	// adds the 'aria-invalid' attribute to the input element,
	// and adds the 'has-error' class to the input element's parent.
	FormViewModel.prototype.setValidationErrorState = function (input) {

		this.errorElementsFor(input).forEach(function (error) {
			error.removeAttribute('aria-hidden');
			error.textContent = input.validationMessage;
			error.classList.remove('invisible');
		});

		input.setAttribute('aria-invalid', 'true');

		input.parentNode.classList.add('has-error');
	};

	// Un-does what setValidationErrorState() does
	FormViewModel.prototype.clearValidationErrorState = function (input) {

		this.errorElementsFor(input).forEach(function (error) {
			error.setAttribute('aria-hidden', 'true');
			error.classList.add('invisible');
			error.textContent = '&nbsp;'; // prevent collapse
		});

		input.removeAttribute('aria-invalid');

		input.classList.remove('dirty');

		input.parentNode.classList.remove('has-error');
		input.parentNode.classList.remove('has-warning');
		input.parentNode.classList.remove('has-success');
	};

	// Sets or clears the input element's custom error state based on its 'valid' property
	FormViewModel.prototype.updateValidationErrorState = function (input) {

		if (!input.validity.valid)
			this.setValidationErrorState(input);
		else
			this.clearValidationErrorState(input);
	};

	FormViewModel.prototype.initializeValidation = function () {
		var that = this;

		function addDirtyClass(evt) {
			evt.target.classList.add('dirty');
		}

		function validate(evt) {
			that.updateValidationErrorState(evt.target);
		}

		this.allInputs().forEach(function (input) {

			// Skip elements opting-out with a 'data-novalidate' attribute
			if (input.hasAttribute('data-novalidate'))
				return;

			// Add the 'required' class to the label of any required input
			if (input.hasAttribute('required')) {

				var label = that.labelFor(input);

				if (label)
					label.classList.add('required');
			}

			/* ADAPTED FROM: https://developers.google.com/web/fundamentals/design-and-ui/input/forms/provide-real-time-validation?hl=en */
			input.addEventListener('blur', addDirtyClass);
			input.addEventListener('invalid', addDirtyClass);
			input.addEventListener('valid', addDirtyClass);

			input.addEventListener('blur', validate);
		});

	};

	// Returns the first descendant element of the form
	// with a 'data-autofocus' attribute present
	FormViewModel.prototype.getInitialFocusElement = function () {

		return this.el.querySelector(
			'#' + this.el.id + ' [data-autofocus]');
	};

	// Attempts to set focus to the element designated to receive initial focus.
	// Returns true if focus was set.
	FormViewModel.prototype.setInitialFocus = function () {

		var focusElement = this.getInitialFocusElement();

		if (focusElement) {
			focusElement.focus();

			return focusElement === document.activeElement;
		}

		return false;
	};

	// Wire up the form's submit event to provide some default handling of
	// invalid forms (preventing submission, showing an alert),
	// and perform custom application logic via a callback for valid form submits.
	// Calling code should assign a function to onSubmitValid to register the callback.
	// If the callback returns falsey (or no callback is registered), the form submittal is cancelled.
	FormViewModel.prototype.initializeSubmitHook = function () {
		var that = this;

		this.el.addEventListener('submit', function (evt) {

			if (that.preFormSubmit && !that.preFormSubmit()) {
				evt.preventDefault();
				return false;
			}

			if (that.el.checkValidity() === false) {

				// FALLBACK for browsers that don't block invalid form submittal
				that.el.reportValidity();

				alert('Please correct the form and try again');

				if (that.postFormSubmit)
					that.postFormSubmit();

				evt.preventDefault();
				return false;

			} else {

				// Callback to any submit listener
				var cancel = !that.onSubmitValid || !that.onSubmitValid(that.el);

				if (that.postFormSubmit)
					that.postFormSubmit();

				// Cancel form submittal if instructed
				if (cancel) {
					evt.preventDefault();
					return false;
				}
			}

			return true;
		});
	};

	// FALLBACK for browsers not fully supporting datetime-local inputs.
	// Here we provide validation for the very specific format we're expecting.
	// If the parsing is successful, we replace the input value with a string
	// representing the full date and time in the browser's locale; this helps
	// ensure the user really entered what they thought they entered
	// (not everyone is fluent in ISO-8601 derivatives!)
	FormViewModel.prototype.addDateTimeLocalFallback = function () {
		var that = this;

		arrayFrom(this.el.getElementsByClassName('input-datetime-local')).
		forEach(function (el) {

			el.addEventListener('blur', function (event) {

				var input = event.target;
				var rawValue = input.value;

				if (!rawValue) {

					input.setCustomValidity('Enter a date and time as 2016-08-28 07:30 PM');
				} else {

					var parsedValue = moment(rawValue);

					if (!parsedValue || !parsedValue.isValid()) {

						input.setCustomValidity('Format the date and time as 2016-08-28 07:30 PM');
					} else {

						input.value = parsedValue.format('LLLL');
						input.setCustomValidity('');
					}
				}

				that.updateValidationErrorState(input);
			});
		});
	};

	global.FormViewModel = FormViewModel;

// ReSharper disable once ThisInGlobalContext
}(this, alert));
