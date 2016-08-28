/*globals document */
/*globals moment */
/*globals subclass, appendGlyph */
/*globals FormViewModel, EventViewModel */
/*globals timestampFormat */


// Encapsulates and specializes the new event form
// TODO: componentize guest list into widget
// TODO: componentize datetime range into widget
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


	// Returns an array filled with the current guest widget elements
	function allGuestWidgetEls() {

		return arrayFrom(
			document.getElementById('new-event-guest-list').
			querySelectorAll('.guest-item'));
	}

	// Ensures only the given list element is selected
	function selectListItem(el) {

		if (el) {
			allGuestWidgetEls()
				.forEach(function (sibling) {
					sibling.setAttribute('tabindex', '-1');
					sibling.setAttribute('aria-selected', 'false');
				});

			el.setAttribute('tabindex', '0');
			el.setAttribute('aria-selected', 'true');
		}
	}

	function onSelectListItem(vm, el) {

		var isSelected = el.getAttribute('aria-selected') === 'true';

		if (!isSelected) {
			selectListItem(el);
		}
	}

	// Ensures only the given list element is selected and focused
	function maybeFocusListItem(event, el) {

		if (el) {
			allGuestWidgetEls()
				.forEach(function (sibling) {
					sibling.blur();
					sibling.setAttribute('tabindex', '-1');
					sibling.setAttribute('aria-selected', 'false');
				});

			el.focus();
			el.setAttribute('tabindex', '0');
			el.setAttribute('aria-selected', 'true');

			if (event)
				event.stopPropagation();
			return false;
		}

		return true;
	}

	// Ensures only the given element is focused, and stops event propagation
	function maybeFocusToolButton(event, el) {

		if (el) {
			el.focus();

			if (event)
				event.stopPropagation();
			return false;
		}

		return true;
	}

	// Builds an example date-time string, suitable for input, from the given date
	function getDateTimeSampleText(now) {
		return now.clone().format(timestampFormat);
	}

	// Returns a new moment rounded to the nearest minute from the given input's value, or null
	function parseDateTimeFrom(input) {
		if (input && input.value) {
			return moment(moment(input.value).format(timestampFormat));
		}
		return null;
	}

	// Adds our events to a new guest widget
	EventFormViewModel.prototype._wireUpEmailWidget = function (newWidget) {
		var that = this;

		function onAboutToRemove(event, widget) {

			var index = that.guestEmails.indexOf(widget);

			if (index >= 0) {
				that.guestEmails.splice(index, 1);
			}

			if (that.guestEmails.length === 0) {

				// Re-add the required attribute to the email input so it's clear this widget requires data entry
				document.getElementById('new-event-guest').setAttribute('required', null);

				// If there are no more list items, make the container not focusable
				that._guestList.setAttribute('tabindex', '-1');

				// Return focus to the input field so the user can quickly add a new item
				document.getElementById('new-event-guest').focus();

			} else {

				// Otherwise, set focus to the previous item
				var newIndex = index - 1;
				newIndex = Math.max(0, newIndex);

				var newItemId = that.guestEmails[newIndex].id;

				maybeFocusListItem(
					event, document.getElementById(newItemId));
			}

			return true; // proceed with the DOM removal
		}

		function onClick(event, widget) {

			// Ensure the container is not focusable once an item is focusable
			that._guestList.setAttribute('tabindex', '-1');

			return maybeFocusListItem(
				event, document.getElementById(widget.id));
		}

		newWidget.onAboutToRemove = onAboutToRemove;
		newWidget.onClick = onClick;
		newWidget.onSelect = onSelectListItem;

		return newWidget;
	};

	// Create a widget for the guest email and add our events
	EventFormViewModel.prototype._createWidgetForEmail = function (email) {

		return this._wireUpEmailWidget(
			new EmailAddressWidget(
				'email-address-widget-' + this._nextGuestEmailId++,
				email));
	};

	// Adds an email widget to the guest list in the DOM
	EventFormViewModel.prototype._renderEmailInList = function (widget) {

		document.getElementById('new-event-guest-list').
			appendChild(widget.render());
	};

	// Returns an event view model from the form's validated input values
	EventFormViewModel.prototype.newEventFrom = function () {

		return new EventViewModel({
			title: document.getElementById('new-event-name').value,
			type: document.getElementById('new-event-type').value,
			host: document.getElementById('new-event-host').value,
			start: parseDateTimeFrom(document.getElementById('new-event-start-date')).format(timestampFormat),
			end: parseDateTimeFrom(document.getElementById('new-event-end-date')).format(timestampFormat),
			location: document.getElementById('new-event-location').value,
			message: document.getElementById('new-event-message').value,
			guests: this.guestEmails.map(function (widget) { return widget.email; })
		});
	};

	// Populates the form's inputs with values from an event view model
	EventFormViewModel.prototype.populateFrom = function (event) {
		var that = this;

		document.getElementById('new-event-name').value = event.title;
		document.getElementById('new-event-type').value = event.type;
		document.getElementById('new-event-host').value = event.host;
		document.getElementById('new-event-start-date').value = moment(event.start).format(timestampFormat);
		document.getElementById('new-event-end-date').value = moment(event.end).format(timestampFormat);
		document.getElementById('new-event-location').value = event.location;
		document.getElementById('new-event-message').value = event.message;

		this.guestEmails =
			event.guests.map(
				that._createWidgetForEmail);

		this.guestEmails.forEach(
			that._renderEmailInList);
	};

	EventFormViewModel.prototype.reset = function () {

		// Call the base method to reset standard inputs
		FormViewModel.prototype.reset.call(this);

		// Remove the guest emails from the DOM
		this.guestEmails.forEach(function (widget) {
			widget.unrender();
		});

		// Re-add the required attribute to the email input
		document.getElementById('new-event-guest').setAttribute('required', null);

		// Reset the guest emails in this view model
		this.guestEmails = [];
		this._nextGuestEmailId = 1;
	};

	EventFormViewModel.prototype.init = function () {
		var that = this;

		var startValidationDepth = 0;
		var endValidationDepth = 0;

		var emailEl = document.getElementById('new-event-guest');
		var startDateEl = document.getElementById('new-event-start-date');
		var endDateEl = document.getElementById('new-event-end-date');
		that._guestList = document.getElementById('new-event-guest-list');

		// Permit empty, or a valid email
		EventFormViewModel.prototype.updateEmailValidity = function () {

			var email = emailEl.value;

			if (email && email.length > 0) {
				if (!validateEmail(email)) {
					return that.failInput(emailEl, 'Enter a guest\'s email address.');
				}
			}

			return that.passInput(emailEl);
		};

		// Ensure we have at least one guest listed.
		// If we don't, we'll invalidate the input field the user will employ to enter one.
		EventFormViewModel.prototype.updateGuestsValidity = function () {

			if (!that.guestEmails || that.guestEmails.length < 1) {

				return that.failInput(emailEl, 'Enter a guest\'s email address.');
			}

			return that.passInput(emailEl);
		};

		// Ensure the event is not in the past or invalid
		EventFormViewModel.prototype.updateStartDateValidity = function () {

			if (startValidationDepth > 1)
				return true;

			startValidationDepth++;
			try {

				if (startDateEl.value) {

					var now = moment().add(1, 'm'); // TODO: inject current time dependency for testability

					var startDateTime = parseDateTimeFrom(startDateEl);
					if (startDateTime && startDateTime.isValid()) {

						// Update the input's value with our most-correct format;
						// this avoids 'step mismatch' validation errors on mobile
						// (when a default datetime is supplied, which includes seconds).
						startDateEl.value = startDateTime.format(timestampFormat);

						// Ensure the start date and time occurs in the future
						if (now.isAfter(startDateTime)) {

							// We don't have a valid start date, so no longer can we assert anything about the end date relative to the start
							endDateEl.removeAttribute('min');

							return that.failInput(startDateEl, 'The event cannot begin in the past.');
						}

						// Set the min value on the end date to be after the start
						var minEnd = startDateTime.clone().add(1, 'm').format(timestampFormat);
						if (endDateEl.getAttribute('min') !== minEnd) // setting this attribute may clear any 'partial' input value
							endDateEl.setAttribute('min', minEnd);

						if (!endDateEl.value) {

							// If still empty, default the end time based on the valid start time
							endDateEl.value = startDateTime.clone().add(2, 'h').format(timestampFormat);
						}

					} else {

						// We don't have a valid start date, so no longer can we assert anything about the end date relative to the start
						endDateEl.removeAttribute('min');

						return that.failInput(startDateEl, 'Please enter a start date and time like ' + getDateTimeSampleText(now));
					}
				}

				return that.passInput(startDateEl);

			} finally {

				// Always re-validate the end date after the start date changes
				that.updateEndDateValidity();

				startValidationDepth--;
			}
		};

		// Ensure the event does not end before it starts or is invalid
		EventFormViewModel.prototype.updateEndDateValidity = function () {

			if (endValidationDepth > 1)
				return true;

			endValidationDepth++;
			try {

				if (endDateEl.value) {

					var now = moment().add(1, 'm'); // TODO: inject current time dependency for testability

					var endDateTime = parseDateTimeFrom(endDateEl);
					if (endDateTime && endDateTime.isValid()) {

						// Update the input's value with our most-correct format;
						// this avoids 'step mismatch' validation errors on mobile
						// (when a default datetime is supplied, which includes noneditable and nonvisible seconds).
						endDateEl.value = endDateTime.format(timestampFormat);

						// Ensure the end occurs after the start
						var startDateTime = parseDateTimeFrom(startDateEl);
						if (startDateTime && startDateTime.isValid()) {

							if (startDateTime.clone().add(1, 'm').isAfter(endDateTime)) {

								// We don't have a valid end date, so no longer can we assert anything about the start date relative to the end
								startDateEl.removeAttribute('max');

								return that.failInput(endDateEl, 'The event cannot end before it starts.');
							}
						}

						// Ensure the end date and time occurs in the future
						if (now.isAfter(endDateTime)) {

							// We don't have a valid end date, so no longer can we assert anything about the start date relative to the end
							startDateEl.removeAttribute('max');

							return that.failInput(endDateEl, 'The event cannot end in the past.');
						}

						// Set the max value on the start date to be before the end
						var maxStart = endDateTime.clone().subtract(1, 'm').format(timestampFormat);
						if (startDateEl.getAttribute('max') !== maxStart) // setting this attribute may clear any 'partial' input value
							startDateEl.setAttribute('max', maxStart);

					} else {

						// We don't have a valid end date, so no longer can we assert anything about the start date relative to the end
						startDateEl.removeAttribute('max');

						return that.failInput(startDateEl, 'Please enter an end date and time like ' + getDateTimeSampleText(now));
					}
				}

				return that.passInput(endDateEl);

			} finally {

				// Always re-validate the start date after the end date changes
				that.updateStartDateValidity();

				endValidationDepth--;
			}
		};

		// Custom validate the email field on blur
		emailEl.addEventListener(
			'blur', that.updateEmailValidity);

		// Custom validate the date fields on blur

		startDateEl.addEventListener(
			'blur', that.updateStartDateValidity);

		endDateEl.addEventListener(
			'blur', that.updateEndDateValidity);


		// Complete initialization of the guest list widget

		function handleGuestAdd() {

			// Force validation
			emailEl.focus();
			emailEl.blur();
			that.updateEmailValidity();

			if (emailEl.validity.valid && emailEl.value && emailEl.value.length > 0) {

				// Add the email to the list
				var widget = that._createWidgetForEmail(emailEl.value);

				// Make the container focusable
				that._guestList.setAttribute('tabindex', '0');

				// Add the widget to the view model
				that.guestEmails.push(widget);

				// Add the guest's email to the DOM
				that._renderEmailInList(widget);

				// Clear the input
				emailEl.value = '';

				// Set focus back to the input so it's easier to add a bunch of guests at one time
				emailEl.focus();

				// Remove the required attribute from the email input
				emailEl.removeAttribute('required');

				// Update form validation
				that.updateGuestsValidity();

			} else {

				// The email input is invalid, set focus back to it so the user can correct
				emailEl.focus();
			}
		}

		document.getElementById('new-event-guest-add-btn').addEventListener(
			'click', handleGuestAdd);

		function handleKeyboardNav(event) {

			if (event.altKey || event.ctrlKey || event.shiftKey) {
				return true;
			}

			var res = true;

			var curItem = that._guestList.querySelector('.guest-item[aria-selected=true]');

			switch (event.keyCode) {

				case keyCodes.down: // down arrow - move to next

					res = maybeFocusListItem(event,
						curItem ?
							nextWrappedSiblingOf(curItem.parentNode, null) : // item selected, move to the next, if any
							that._guestList.querySelector('.guest-item')); // no item selected, move to the first, if any
					break;

				case keyCodes.up: // up arrow - move to previous

					res = maybeFocusListItem(event,
						curItem ?
							previousWrappedSiblingOf(curItem.parentNode, null) : // item selected, move to the previous, if any
							arrayFrom(that._guestList.querySelectorAll('.guest-item')).last()); // item selected, move to the previous, if any
					break;

				case keyCodes.right: // right arrow - move to next item action
					if (curItem) {
						// Move focus from list item to first action
						res = maybeFocusToolButton(event,
							curItem.querySelector('button'));
					}
					break;

				case keyCodes.left: // left arrow - move to previous item action, or item
					if (curItem) {
						var curAction = curItem.querySelector('button');
						if (curAction === document.activeElement) {
							// Move focus from first action to list item
							curAction.blur();
							that._guestList.focus();
							res = maybeFocusListItem(event,
								curItem);
						}
					}
					break;

			}

			return res;
		}

		that._guestList.addEventListener(
			'keydown', handleKeyboardNav);

		that._guestList.addEventListener(
			'keypress', function (event) {

				if (event.altKey || event.ctrlKey || event.shiftKey) {
					return true;
				}

				switch (event.keyCode) {
					case keyCodes.left:
					case keyCodes.right:
					case keyCodes.up:
					case keyCodes.down:
						{
							event.stopPropagation();
							return false;
						}
				}

				return true;
			});

		that._guestList.addEventListener(
			'focus', function (event) {

				// If there are any list items, make the first focusable, then make the container not focusable
				var firstItem = that._guestList.querySelector('.guest-item');
				if (firstItem) {
					that._guestList.setAttribute('tabindex', '-1');
					return maybeFocusListItem(event, firstItem);
				}

				return true;
			});

		var addGuestButton = document.getElementById('new-event-guest-add-btn');
		appendGlyph(addGuestButton, 'fa-plus', 'add guest');


		// Perform final and cross-input validation checks on the new event form
		this.preFormSubmit = function () {

			var isValid = true;

			// Run standard HTML5 validation on standard fields
			that.allInputs().forEach(function (input) {

				input.checkValidity();

				that.updateValidationErrorState(input);

				isValid &= input.validity.valid;
			});

			// Check the dates
			isValid &= that.updateStartDateValidity();
			isValid &= that.updateEndDateValidity();

			// Ensure we have at least one guest's email
			isValid &= that.updateGuestsValidity();

			return isValid;
		};

	};

	global.EventFormViewModel = EventFormViewModel;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
