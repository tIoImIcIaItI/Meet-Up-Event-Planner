/*globals document */
/*globals moment */
/*globals subclass, appendGlyph */
/*globals FormViewModel, EventViewModel */
/*globals timestampFormat */


// Encapsulates and specializes the new event form
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

	function parseDateFrom(input) {
		return moment(
			input.value,
			['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY MM DD',
			'YYYY-M-D', 'YYYY/M/D', 'YYYY M D'],
			true).startOf('day');
	}

	function parseTimeOfDayFrom(date, input) {
		return moment(
			date.format('YYYY-MM-DDT') + input.value,
			[
				'YYYY-MM-DDTh:mm a', 'YYYY-MM-DDTh:mma',
				'YYYY-MM-DDThmm a', 'YYYY-MM-DDThmma',
				'YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHHmm'
			],
			true);
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

		var start = parseTimeOfDayFrom(
			parseDateFrom(document.getElementById('new-event-start-date')),
			document.getElementById('new-event-start-time'));

		var durationHours = parseFloat(
			document.getElementById('new-event-duration').value);

		var end = start.clone().add(durationHours, 'h');

		return new EventViewModel({
			title: document.getElementById('new-event-name').value,
			type: document.getElementById('new-event-type').value,
			host: document.getElementById('new-event-host').value,
			start: start.format(timestampFormat),
			end: end.format(timestampFormat),
			location: document.getElementById('new-event-location').value,
			message: document.getElementById('new-event-message').value,
			guests: this.guestEmails.map(function (widget) { return widget.email; })
		});
	};

	// Populates the form's inputs with values from an event view model
	EventFormViewModel.prototype.populateFrom = function (event) {
		var that = this;

		var start = moment(event.start);
		var duration = start.twix(moment(event.end)).length('hours');


		document.getElementById('new-event-name').value = event.title;
		document.getElementById('new-event-type').value = event.type;
		document.getElementById('new-event-host').value = event.host;
		document.getElementById('new-event-start-date').value = start.format('YYYY-MM-DD');
		document.getElementById('new-event-start-time').value = start.format('h:mm a');
		document.getElementById('new-event-duration').value = duration;
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

		// Reset the guest emails in this view model
		this.guestEmails = [];
		this._nextGuestEmailId = 1;
	};

	// TODO: refactor date and time inputs into single widget
	EventFormViewModel.prototype.init = function () {
		var that = this;

		var emailEl = document.getElementById('new-event-guest');
		var startDateEl = document.getElementById('new-event-start-date');
		var startTimeEl = document.getElementById('new-event-start-time');
		var durationEl = document.getElementById('new-event-duration');
		that._guestList = document.getElementById('new-event-guest-list');

		var minDuration = parseFloat(durationEl.getAttribute('min').value);
		minDuration = isNaN(minDuration) ? 1 : minDuration;

		var maxDuration = parseFloat(durationEl.getAttribute('max').value);
		maxDuration = isNaN(maxDuration) ? 24 : maxDuration;

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

			if (startDateEl.value) {

				var start = parseDateFrom(startDateEl);
				if (start.isValid()) {

					var now = moment(); // TODO: inject current time dependency for testability

					var startDateTime = parseTimeOfDayFrom(start, startTimeEl);

					if (startDateTime.isValid()) {

						// Ensure the start date and time occurs in the future
						if (now.isAfter(startDateTime)) {

							return that.failInput(startDateEl, 'The event cannot begin in the past.');
						}
					} else {

						// Ensure the start date occurs in the future
						if (now.isAfter(start)) {

							return that.failInput(startDateEl, 'The event cannot begin in the past.');
						}
					}
				} else {
					return that.failInput(startDateEl, 'Please enter a start date like 2016-08-21');
				}
			}

			return that.passInput(startDateEl);
		};

		EventFormViewModel.prototype.updateStartTimeValidity = function () {

			if (startTimeEl.value) {

				var now = moment(); // TODO: inject current time dependency for testability

				// Get the input start date, otherwise today
				var startDay = parseDateFrom(startDateEl);

				var haveStartDate = startDay.isValid();

				if (!haveStartDate)
					startDay = now.clone().startOf('day');

				var start = parseTimeOfDayFrom(startDay, startTimeEl);

				if (start.isValid()) {

					if (haveStartDate) {

						// Re-validate the start date with the given TOD
						that.updateStartDateValidity();

						// Ensure the start datetime occurs in the future
						if (now.isAfter(start)) {

							return that.failInput(startTimeEl, 'The event cannot begin in the past.');
						}
					}
				} else {
					return that.failInput(startTimeEl, 'Please enter a time like 7:30 PM or 19:30');
				}
			}

			return that.passInput(startTimeEl);
		};

		// Ensure the event lasts between 1 and 24 hours.
		// Not all browsers (mobile) will respect the min and max attributes on 'number' inputs.
		// Note that we intend to limit the choices to integral hours
		// in the picker (step = 1) for a simpler UX, but non-integral values are not prohibited.
		EventFormViewModel.prototype.updateDurationValidity = function () {

			if (durationEl.value) {

				var hours = parseFloat(durationEl.value);

				// Ensure the user entered a number
				if (isNaN(hours)) {

					return that.failInput(durationEl, 'Please enter a number of hours.');
				}

				// Ensure the user entered a number within the allowed range
				if (hours < minDuration || hours > maxDuration) {

					return that.failInput(durationEl, 'Please enter a number of hours not less than 1 nor more than 24.');
				}
			}

			return that.passInput(durationEl);
		};

		// Custom validate the email field on blur
		emailEl.addEventListener(
			'blur', that.updateEmailValidity);

		// Custom validate the start fields on blur/update
		startDateEl.addEventListener(
			'blur', that.updateStartDateValidity);

		startTimeEl.addEventListener(
			'blur', that.updateStartTimeValidity);

		// Custom validate the duration field on blur
		durationEl.addEventListener(
			'blur', that.updateDurationValidity);

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

				// Update form validation
				that.updateGuestsValidity();

			} else {

				// The email input is invalid, set focus back to it so the user can correct
				emailEl.focus();
			}
		}

		// Respond to the add email button
		document.getElementById('new-event-guest-add-btn').addEventListener(
			'click', handleGuestAdd);

		function handleKeyboardNav(event) {

			//console.log(event.keyCode);

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

		// Wire up keyboard navigation for the guest list
		// TODO: refactor guest list into widget
		that._guestList.addEventListener(
			'keydown', handleKeyboardNav);

		that._guestList.addEventListener(
			'keypress', function (event) {

				if (event.altKey || event.ctrlKey || event.shiftKey) {
					return true;
				}

				switch (event.keyCode) {
					//case keyCodes.space:
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

		// Add an icon to the add email button in our standard way
		var addGuestButton = document.getElementById('new-event-guest-add-btn');
		appendGlyph(addGuestButton, 'fa-plus', 'add guest');

		this.preFormSubmit = function () {

			var isValid = true;

			// Run standard HTML5 validation on standard fields
			that.allInputs().forEach(function (input) {

				input.checkValidity();

				that.updateValidationErrorState(input);

				isValid &= input.validity.valid;
			});

			// Check the start
			that.updateStartDateValidity();
			that.updateStartTimeValidity();

			// Check the duration
			that.updateDurationValidity();

			// Ensure we have at least one guest's email
			isValid &= that.updateGuestsValidity();

			return isValid;
		};

	};

	global.EventFormViewModel = EventFormViewModel;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
