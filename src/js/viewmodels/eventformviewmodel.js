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

	// TODO: move element seek into own file or utils
	// ReSharper disable once InconsistentNaming
	var SeekOrigin = {
		begin: 0,
		current: 1,
		end: 2
	};

	function seekSiblingOf(el, origin, offset/*, filter*/) {

		if (!el) throw new Error('Must supply an element');
		if (!el.parentNode) throw new Error('Must supply an element that is a child of some other element');

		origin = origin || SeekOrigin.begin;

		var res = null;

		// TODO: filter

		switch (origin) {
			case SeekOrigin.begin:
				// TODO
				break;

			case SeekOrigin.current:
				if (offset > 0) {

					do {
						res = el.nextSibling;
					} while (res && offset-- > 1)

				} else {

					offset *= -1;
					do {
						res = el.previousSibling;
					} while (res && offset-- > 1)

				}
				break;

			case SeekOrigin.end:
				// TODO
				break;

			default:
				break;
		}

		return res;
	}

	// Returns the previous sibling of a wrapped element
	function previousWrappedSiblingOf(el, filter) {
		var res = seekSiblingOf(el, SeekOrigin.current, -1, filter);
		return res ? res.firstElementChild : null;
	}

	// Returns the next sibling of a wrapped element
	function nextWrappedSiblingOf(el, filter) {
		var res = seekSiblingOf(el, SeekOrigin.current, 1, filter);
		return res ? res.firstElementChild : null;
	}

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
					//sibling.blur();
					sibling.setAttribute('tabindex', '-1');
					//sibling.classList.remove('focus');
					sibling.setAttribute('aria-selected', 'false');
				});

			//el.focus();
			el.setAttribute('tabindex', '0');
			//el.classList.add('focus');
			el.setAttribute('aria-selected', 'true');
		}
	}

	// Ensures only the given list element is selected and focused
	function maybeFocusListItem(event, el) {

		if (el) {
			allGuestWidgetEls()
				.forEach(function (sibling) {
					sibling.blur();
					sibling.setAttribute('tabindex', '-1');
					//sibling.classList.remove('focus');
					sibling.setAttribute('aria-selected', 'false');
				});

			el.focus();
			el.setAttribute('tabindex', '0');
			//el.classList.add('focus');
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
		};

		function onClick(event, widget) {

			// Ensure the container is not focusable once an item is focusable
			that._guestList.setAttribute('tabindex', '-1');

			return maybeFocusListItem(
				event, document.getElementById(widget.id));
		};

		newWidget.onAboutToRemove = onAboutToRemove;
		newWidget.onClick = onClick;

		return newWidget;
	}

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

		var widgetEl = document.getElementById(widget.id);

		// Ensure that if any of this widget's toolbar buttons become focused,
		// this widget is properly selected. This may happen if the user mouses down
		// on a button, drags off, then mouses up leaving the button focused- but avoiding
		// our click handler.
		arrayFrom(widgetEl.querySelectorAll('.guest-email-address-toolbar-btn'))
			.forEach(function(el) {
				el.addEventListener(
					'focus',
					function() {
						var isSelected = widgetEl.getAttribute('aria-selected') === 'true';
						if (!isSelected) {
							selectListItem(widgetEl);
						}
					});
			});
	};

	// Returns an event view model from the form's validated input values
	EventFormViewModel.prototype.newEventFrom = function () {

		var start = moment(document.getElementById('new-event-start').value);
		var durationHours = parseFloat(document.getElementById('new-event-duration').value);
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
		document.getElementById('new-event-start').value = start.format('LLLL');
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

	EventFormViewModel.prototype.init = function () {
		var that = this;

		var emailEl = document.getElementById('new-event-guest');
		var startEl = document.getElementById('new-event-start');
		var durationEl = document.getElementById('new-event-duration');
		that._guestList = document.getElementById('new-event-guest-list');

		var minDuration = parseFloat(durationEl.getAttribute('min').value);
		minDuration = minDuration === NaN ? 1 : minDuration;

		var maxDuration = parseFloat(durationEl.getAttribute('max').value);
		maxDuration = maxDuration === NaN ? 24 : maxDuration;

		// SOURCE: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		function validateEmail(email) {

			var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

			return re.test(email);
		}

		// Permit empty, or a valid email
		function updateEmailValidity() {

			var email = emailEl.value;

			if (email && email.length > 0) {

				if (!validateEmail(email))
					emailEl.setCustomValidity('Enter a guest\'s email address.');
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

				emailEl.setCustomValidity('Enter a guest\'s email address.');

				that.updateValidationErrorState(emailEl);

				return false;
			}

			return true;
		}

		// Ensure the event is not in the past
		function updateStartValidity() {

			// Empty value is handled by required attribute
			if (!startEl.value)
				return true;

			var now = moment(); // TODO: inject current time dependency for testability
			var start = moment(startEl.value);

			if (start.isValid()) {

				// Ensure the start date occurs in the future
				if (now.isAfter(start)) {

					startEl.setCustomValidity('The event cannot begin in the past.');

					that.updateValidationErrorState(startEl);

					return false;
				}
			}

			return true;
		}

		// Ensure the event lasts between 1 and 24 hours.
		// Not all browsers (mobile) will respect the min and max attributes on 'number' inputs.
		// Note that we intend to limit the choices to integral hours
		// in the picker (step = 1) for a simpler UX, but non-integral values are not prohibited.
		function updateDurationValidity() {

			// Empty value is handled by required attribute
			if (!durationEl.value)
				return true;

			var hours = parseFloat(durationEl.value);

			// Ensure the user entered a number
			if (hours === NaN) {

				durationEl.setCustomValidity('Please enter a number of hours.');

				that.updateValidationErrorState(durationEl);

				return false;
			}

			// Ensure the user entered a number within the allowed range
			if (hours < minDuration || hours > maxDuration) {

				durationEl.setCustomValidity('Please enter a number of hours not less than 1 nor more than 24.');

				that.updateValidationErrorState(durationEl);

				return false;
			}

			return true;
		}

		// Custom validate the email field on blur
		emailEl.addEventListener(
			'blur',
			updateEmailValidity);

		// Custom validate the start field on blur
		startEl.addEventListener(
			'blur',
			updateStartValidity);

		// Custom validate the duration field on blur
		durationEl.addEventListener(
			'blur',
			updateDurationValidity);

		// Add an icon to the add email button in our standard way
		var addGuestButton = document.getElementById('new-event-guest-add-btn');
		appendGlyph(addGuestButton, 'fa-plus', 'add guest');

		function handleGuestAdd() {

			// Force validation
			emailEl.focus();
			emailEl.blur();
			updateEmailValidity();

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
				updateGuestsValidity();

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

			};

			return res;
		}

		// Wire up keyboard navigation for the guest list
		// TODO: refactor guest list into widget
		that._guestList.addEventListener(
			'keydown',
			handleKeyboardNav);

		that._guestList.addEventListener(
			'keypress',
			function (event) {

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
			'focus',
			function (event) {

				// If there are any list items, make the first focusable, then make the container not focusable
				var firstItem = that._guestList.querySelector('.guest-item');
				if (firstItem) {
					that._guestList.setAttribute('tabindex', '-1');
					return maybeFocusListItem(event, firstItem);
				}

				return true;
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

			// Check the start
			updateStartValidity();

			// Check the duration
			updateDurationValidity();

			// Ensure we have at least one guest's email
			isValid &= updateGuestsValidity();

			return isValid;
		};

	};

	global.EventFormViewModel = EventFormViewModel;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
