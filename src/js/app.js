/*globals document */
/*globals moment */
/*globals observable, scrollToId, scrollToTop */
/*globals EventRepository, EventViewModel */
/*globals AccountFormViewModel, LoginFormViewModel, EventFormViewModel */
/*globals LoadErrorWidget, SaveErrorWidget */
/*globals timestampFormat */

// TODO: find, use an accessible 'toast' library for success/error notifications.
// TODO: keyboard navigation needs to see event list, and guest list, as 'one thing' (i.e. tab nav should skip over list items, unless list widgets are navigated into).

// Singleton application module
(function (global, document) {
	'use strict';

	var app = {

		user: {
			// convenience for dev testing, rather than persisting and retrieving  user account info
			loggedIn: false, // set to true for testing event form without having to log in
			name: 'test user',
			email: 'test@user.com',
			avatar: null
		},

		event: null,
		events: [],

		isEditingNewEvent: observable(false),
		isUserLoggedIn: observable(false)
	};

	app.logUserIn = function (newUser) {

		// convenience for dev testing, rather than persisting and retrieving  user account info
		newUser.name = newUser.name || 'Test User';

		newUser.loggedIn = true;

		app.user = newUser;

		app.isUserLoggedIn(true);
	};

	app.logoutUser = function () {

		app.stopEditingEvent();

		if (!app.user || !app.user.loggedIn)
			return;

		app.user.loggedIn = false;

		app.isUserLoggedIn(false);
	};

	app.addNewEvent = function (event) {

		// Save the event
		return EventRepository.addEvent(event.toModel()).then(function (insertedEvent) {

			var insertedEventVm =
				new EventViewModel(insertedEvent);

			// Add the event to our local cache
			app.events.push(insertedEventVm);

			// Render the event to the DOM
			app.prependEventToList(insertedEventVm);
		});
	};

	app.startEditingEvent = function (event) {

		app.saveError.unrender();

		if (app.isEditingNewEvent())
			return;

		app.event = event;

		app.isEditingNewEvent(true);
	};

	app.startEditingNewEvent = function () {

		app.startEditingEvent(
			new EventViewModel());
	};

	app.stopEditingEvent = function () {

		if (!app.isEditingNewEvent())
			return;

		app.event = null;

		app.isEditingNewEvent(false);
	};

	app.prependEventToList = function (event) {

		document.getElementById('event-list').
			prependChild(event.render());
	};

	app.addEventToList = function (event) {

		document.getElementById('event-list').
			appendChild(event.render());
	};

	app.showLoginForm = function (dontScroll) {

		document.getElementById('prompt-login').classList.add('hidden');
		document.getElementById('prompt-register').classList.remove('hidden');

		app.loginFormVm.reset();

		app.accountCreateForm.classList.add('hidden');

		app.userLoginForm.classList.remove('hidden');
		app.loginFormVm.setInitialFocus();

		if (!dontScroll)
			scrollToId(app.userLoginForm.id);
		else
			scrollToTop();
	};

	app.showRegisterForm = function (dontScroll) {

		document.getElementById('prompt-login').classList.remove('hidden');
		document.getElementById('prompt-register').classList.add('hidden');

		app.accountFormVm.reset();

		app.userLoginForm.classList.add('hidden');

		app.accountCreateForm.classList.remove('hidden');
		app.accountFormVm.setInitialFocus();

		if (!dontScroll)
			scrollToId(app.accountCreateForm.id);
		else
			scrollToTop();
	};

	// Handle user authentication state changes
	app.onUserIsLoggedinChanged = function (isLoggedIn) {

		if (isLoggedIn) {

			// Start loading this user's events
			app.clearAllEvents();
			app.loadEvents();

			// Ensure the user name is set
			document.getElementById('user-name').textContent =
				app.user.name;

			// Ensure the user avatar image source is set
			document.getElementById('user-avatar-img').src =
				app.user.avatar || 'http://placekitten.com/g/64/64';
		} else {

			// Ensure all forms are clean and ready for input after logging out
			app.accountFormVm.reset();
			app.loginFormVm.reset();
			app.eventFormVm.reset();

			app.clearAllEvents();
		}

		// Show the authentication UI only when the user is logged out
		document.getElementById('authentication-section').
		addOrRemoveClass('hidden', isLoggedIn);

		// Hide the events UI only when the user is logged out
		document.getElementById('events-section').
		addOrRemoveClass('hidden', !isLoggedIn);

		// Hide the user info only when the user is logged out
		document.getElementById('user-info').
		addOrRemoveClass('hidden', !isLoggedIn);

		app.showLoginForm(true);
	};

	// Handle event editing state changes
	app.isEditingNewEventChanged = function (isEditing) {

		if (isEditing) {
			app.eventFormVm.populateFrom(app.event);
			app.eventFormVm.reset();
		}

		document.getElementById('event-new-btn').
			addOrRemoveClass('hidden', isEditing);

		document.getElementById('event-create-form').
			addOrRemoveClass('hidden', !isEditing);

		document.getElementById('event-list-container').
			addOrRemoveClass('hidden', isEditing);

		if (isEditing)
			app.eventFormVm.setInitialFocus();
		else
			scrollToTop();
	};

	// Leave the event editing app state
	app.closeEventEditor = function () {

		// Close the event editor
		app.stopEditingEvent();

		// Clear the form for next time
		app.eventFormVm.reset();

		scrollToTop();
	};

	app.clearAllEvents = function () {

		// Remove event DOM renderings
		removeAllChildren(
			document.getElementById('event-list'));

		// Remove event view models
		app.events = [];
	};

	// Start loading the user's events
	app.loadEvents = function () {

		// Clear any existing error
		app.loadError.unrender();

		return EventRepository.getAllEventsForUser(app.user.email).then(function (events) {

			// Turn the models into view models and sort them
			app.events = events.
			map(function (model) {
				return new EventViewModel(model);
			}).
			sort(function (lhs, rhs) {
				var x = moment(rhs.start, timestampFormat);
				var y = moment(lhs.start, timestampFormat);
				return x < y ? -1 : x > y ? 1 : 0;
			});

			// Add each view model to our list and render it
			app.events.
			forEach(function (event) {
				app.addEventToList(event);
			});

			scrollToTop();

		}).fail(function () {

			document.getElementById('event-list').appendChild(
				app.loadError.render());

			scrollToId(app.loadError.id);
		});
	};

	// Monitor app for state changes

	app.isUserLoggedIn.subscribe(app.onUserIsLoggedinChanged);

	app.isEditingNewEvent.subscribe(app.isEditingNewEventChanged);


	// This method should be called only after the DOM has been loaded
	app.init = function () {

		// Create and initialize all our components/widgets

		app.userLoginForm = document.getElementById('user-login-form');
		app.accountCreateForm = document.getElementById('account-create-form');
		app.eventCreateForm = document.getElementById('event-create-form');

		app.loginFormVm = new LoginFormViewModel(app.userLoginForm);
		app.accountFormVm = new AccountFormViewModel(app.accountCreateForm);
		app.eventFormVm = new EventFormViewModel(app.eventCreateForm);

		app.loadError = new LoadErrorWidget('event-list-load-error');
		app.saveError = new SaveErrorWidget('event-save-error');

		app.accountFormVm.init();
		app.eventFormVm.init();

		// Handle form submissions

		app.accountFormVm.onSubmitValid = function () {

			// Extract the new user account info from the form
			var newUser = app.accountFormVm.newUserFrom();

			// Log the new user in as if account creation was successful
			app.logUserIn(newUser);
			newUser.password = null;

			// Clear the form for next time
			app.accountFormVm.reset();

			scrollToTop();

			return false; // prevent actual form submit
		};

		app.loginFormVm.onSubmitValid = function () {

			// Extract the existing user's login info from the form
			var user = app.loginFormVm.newUserFrom();

			// Log the existing user in as if authentication was successful
			app.logUserIn(user);
			user.password = null;

			// Clear the form for next time
			app.loginFormVm.reset();

			scrollToTop();

			return false; // prevent actual form submit
		};

		app.eventFormVm.onSubmitValid = function () {

			// Clear any existing error
			app.saveError.unrender();

			// Extract the new event's data from the form
			var event = app.eventFormVm.newEventFrom();

			// Save the new event
			app.addNewEvent(event).then(function () {

				app.closeEventEditor();

			}).fail(function () {

				app.eventCreateForm.appendChild(
					app.saveError.render());

				scrollToId(app.saveError.id);
			});

			return false; // prevent actual form submit
		};


		// Wire up the buttons to their handlers

		document.getElementById(
			'logout-btn').addEventListener(
			'click', app.logoutUser);

		document.getElementById(
			'event-new-btn').addEventListener(
			'click', app.startEditingNewEvent);

		document.getElementById(
			'btn-event-create-cancel').addEventListener(
			'click', app.closeEventEditor);

		document.getElementById(
			'btn-login').addEventListener(
			'click', app.showLoginForm);

		document.getElementById(
			'btn-register').addEventListener(
			'click', app.showRegisterForm);

		// Clicking on an event gives it focus
		arrayFrom(document.getElementsByClassName(
			'event-list-item')).forEach(function (el) {
				el.addEventListener(
					'click', function (evt) {
						evt.target.focus();
					});
			});


		// Put the app into its initial state

		if (app.user && app.user.loggedIn) {
			// convenience for testing
			app.logUserIn(app.user);
		} else {
			app.onUserIsLoggedinChanged(false);
		}

		app.isEditingNewEventChanged(false);

		scrollToTop();
	};

	global.app = app;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
