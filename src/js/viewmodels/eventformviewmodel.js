/*globals document */
/*globals moment */
/*globals subclass, appendGlyph */
/*globals FormViewModel, EventViewModel */
/*globals timestampFormat */


// Encapsulates and specializes the user login form
// TODO: componentize guest list into widget
(function (global, document) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var EventFormViewModel = function (form) {

		FormViewModel.call(this, form);

		this.guestEmails = [];
		this._nextGuestEmailId = 1;
	};

	subclass(EventFormViewModel, FormViewModel);

	EventFormViewModel.prototype._createWidgetForEmail = function(email) {
		var that = this;

		// Create a widget for the guest email
		var widget =
			new EmailAddressWidget(
				'email-address-widget-' + this._nextGuestEmailId++,
				email);

		widget.onRemove = function (widget) {

			var index = that.guestEmails.indexOf(widget);

			if (index >= 0)
				that.guestEmails.splice(index, 1);
		};

		return widget;
	};

	// Adds an email widget to the guest list in the DOM
	EventFormViewModel.prototype._renderEmailInList = function(widget) {

		document.getElementById('new-event-guest-list').
			appendChild(widget.render());
	};

	// Returns an event view model from the form's input values
	EventFormViewModel.prototype.newEventFrom = function () {

		return new EventViewModel({
			title: document.getElementById('new-event-name').value,
			type: document.getElementById('new-event-type').value,
			host: document.getElementById('new-event-host').value,
			start: moment(document.getElementById('new-event-start').value).format(timestampFormat),
			end: moment(document.getElementById('new-event-end').value).format(timestampFormat),
			location: document.getElementById('new-event-location').value,
			message: document.getElementById('new-event-message').value,
			guests: this.guestEmails.map(function (widget) { return widget.email; })
		});
	};

	// Populates the form's inputs with values from an event view model
	EventFormViewModel.prototype.populateFrom = function (event) {

		document.getElementById('new-event-name').value = event.title;
		document.getElementById('new-event-type').value = event.type;
		document.getElementById('new-event-host').value = event.host;
		document.getElementById('new-event-start').value = event.start;
		document.getElementById('new-event-end').value = event.end;
		document.getElementById('new-event-location').value = event.location;
		document.getElementById('new-event-message').value = event.message;

		this.guestEmails = event.guests.map(this._createWidgetForEmail);
		this.guestEmails.forEach(this._renderEmailInList);
	};

	EventFormViewModel.prototype.reset = function () {

		// Call the base method to reset standard inputs
		FormViewModel.prototype.reset.call(this);

		// Remove the guest emails from the DOM
		this.guestEmails.forEach(function(widget){
			widget.unrender();
		});

		// Reset the guest emails in this view model
		this.guestEmails = [];
		this._nextGuestEmailId = 1;
	};

	EventFormViewModel.prototype.init = function () {
		var that = this;

		var emailEl = document.getElementById('new-event-guest');
		var startEl = document.getElementById('new-event-start');
		var endEl = document.getElementById('new-event-end');

		// SOURCE: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		function validateEmail(email) {

		    var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

		    return re.test(email);
		}

		// Permit empty, or a valid email
		function updateEmailValidity () {

			var email = emailEl.value;

			if (email && email.length > 0) {

				if (!validateEmail(email))
					emailEl.setCustomValidity('Enter a guest\'s email address, for example you@there.com');
				else
					emailEl.setCustomValidity('');

			} else {

				emailEl.setCustomValidity('');
			}

			that.updateValidationErrorState(emailEl);
		}

		// Ensure we have at least one guest listed.
		// If we don't, we'll invalidate the input field the user will employ to enter one.
		function updateGuestsValidity() {

			if (!that.guestEmails || that.guestEmails.length < 1) {

				emailEl.setCustomValidity('Enter a guest\'s email address, for example you@there.com');

				that.updateValidationErrorState(emailEl);

				return false;
			}

			return true;
		}

		function updateDateRangeValidity() {

			// Empty range is handled by required attribute
			if (!startEl.value && !endEl.value)
				return true;

			var now = moment(); // TODO: inject for testability
			var start = moment(startEl.value);
			var end = moment(endEl.value);

			if (start.isValid()) {

				// Ensure the start date occurs in the future
				if (now.isAfter(start)) {

					startEl.setCustomValidity('The event cannot begin in the past');

					that.updateValidationErrorState(startEl);

					return false;
				}

				if (end.isValid()) {

					// Ensure the end date occurs after the start date
					if (start.isAfter(end)) {

						endEl.setCustomValidity('The event cannot end before it starts');

						that.updateValidationErrorState(endEl);

						return false;
					}
				}
			}

			return true;
		}

		// Custom validate the email field on blur
		emailEl.addEventListener(
			'blur',
			updateEmailValidity);

		// Custom validate the datetime fields on blur
		startEl.addEventListener(
			'blur',
			updateDateRangeValidity);

		endEl.addEventListener(
			'blur',
			updateDateRangeValidity);

		// Add an icon to the add email button
		var addGuestButton = document.getElementById('new-event-guest-add-btn');
		appendGlyph(addGuestButton, 'fa-plus', 'add guest');

		// Respond to the add email button
		document.getElementById('new-event-guest-add-btn').addEventListener(
			'click', function() {

				// Force validation
				emailEl.focus();
				emailEl.blur();
				updateEmailValidity();

				if (emailEl.validity.valid && emailEl.value && emailEl.value.length > 0) {

					// Add the email to the list
					var widget = that._createWidgetForEmail(emailEl.value);

					that.guestEmails.push(widget);

					// Add the guest's email to the DOM
					that._renderEmailInList(widget);

					// Clear the input
					emailEl.value = '';

					// Set focus back to the input so it's easier to add a bunch of guests at one time
					emailEl.focus();

					// Update form validation
					updateGuestsValidity();

				} else {

					// The email input is invalid, set focus back to it so the user can correct
					emailEl.focus();
				}
			});

		this.preFormSubmit = function () {

			var isValid = true;

			// Run standard HTML5 validation on standard fields,
			// then perform custom validation state update
			this.allInputs().forEach(function (input) {

				input.checkValidity();

				that.updateValidationErrorState(input);

				isValid &= input.validity.valid;
			});

			// Check the datetime range
			updateDateRangeValidity();

			// Ensure we have at least one guest's email
			isValid &= updateGuestsValidity();

			return isValid;
		};

	};

	global.EventFormViewModel = EventFormViewModel;

// ReSharper disable once ThisInGlobalContext
}(this, document));
