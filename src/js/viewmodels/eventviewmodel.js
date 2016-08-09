/*globals document */
/*globals moment */
/*globals subclass, newTextElement, prependGlyph */
/*globals timestampFormat */

// Encapsulates an event
(function (global) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var EventViewModel = function (model) {
		model = model || {};

		this.id = model.id || undefined;
		this.userId = model.userId || '';
		this.title = model.title || '';
		this.type = model.type || '';
		this.host = model.host || '';
		this.start = model.start || '';
		this.end = model.end || '';
		this.location = model.location || '';
		this.message = model.message || '';
		this.guests = model.guests || [];
	};

	EventViewModel.prototype.constructor = EventViewModel;

	// Returns a new event model from this view model's values
	EventViewModel.prototype.toModel = function () {

		return {
			id: this.id,
			userId: this.userId,
			title: this.title,
			type: this.type,
			host: this.host,
			start: this.start,
			end: this.end,
			location: this.location,
			message: this.message,
			guests: this.guests
		};
	};

	// Returns a new document fragment represeting an event
	EventViewModel.prototype.render = function () {

		function renderTitle(title) {

			var el = newTextElement('h3', title);
			el.classList.add('event-title');

			return el;
		}

		function renderType(type) {

			var el = newTextElement('div', type);
			el.classList.add('event-type');

			return el;
		}

		function renderHost(host) {

			var el = newTextElement('div', host);
			el.classList.add('event-host');
			prependGlyph(el, 'fa-user', 'Host');

			return el;
		}

		function renderLocation(location) {

			var el = newTextElement('div', location);
			el.classList.add('event-location');
			prependGlyph(el, 'fa-map-marker', 'Location');

			return el;
		}

		function renderMessage(message) {

			var el = newTextElement('div', message);
			el.classList.add('event-message');
			prependGlyph(el, 'fa-quote-left', 'Message');

			return el;
		}

		function renderGuests(guestList) {

			var el = newTextElement('ul', '');
			el.classList.add('event-guest-list');
			prependGlyph(el, 'fa-users', 'Guest List');

			(guestList || []).forEach(function (guest) {
				var guestInfo = newTextElement('li', guest);
				guestInfo.classList.add('event-guest-info');
				el.appendChild(guestInfo);
			});

			return el;
		}

		var docFragment = document.createDocumentFragment();

		var li = document.createElement('li');
		li.setAttribute('data-id', this.id);
		li.setAttribute('tabindex', '0'); // make focusable
		li.classList.add('event-list-item');
		li.classList.add('card');
		li.classList.add('card-1');

		var startMoment = moment(this.start, timestampFormat);
		var endMoment = moment(this.end, timestampFormat);
		var when = startMoment.twix(endMoment).format({
			// groupMeridiems: true,
			// spaceBeforeMeridiem: true,
			showDayOfWeek: true,
			hideTime: false,
			hideYear: false,
			implicitMinutes: true,
			implicitDate: false,
			implicitYear: false
				// yearFormat: 'YYYY',
				// monthFormat: 'MMM',
				// weekdayFormat: 'ddd',
				// dayFormat: 'D',
				// meridiemFormat: 'A',
				// hourFormat: momentHourFormat,
				// minuteFormat: 'mm',
				// allDay: 'all day',
				// explicitAllDay: false,
				// lastNightEndsAt: 0,
				// template: Twix.formatTemplate
		});

		var start = newTextElement('time', when);
		// start.classList.add('event-start');
		prependGlyph(start, 'fa-calendar-o', 'When');
		start.setAttribute('datetime', startMoment.format());

		var startAnnotation = newTextElement('div', startMoment.fromNow());
		startAnnotation.classList.add('event-starts-about');
		// startAnnotation.classList.add('event-value-secondary');
		startAnnotation.classList.add('pull-right');

		// var diff = moment(startMoment.diff(endMoment));
		// var duration = moment.duration(diff, timestampFormat);

		// var end = newTextElement('div', endMoment.format('LLLL'));
		// end.classList.add('event-end');
		// prependGlyph(end, 'fa-clock-o', 'End');
		// li.appendChild(end);

		// var durationAnnotation = newTextElement('div', duration.humanize());
		// durationAnnotation.classList.add('event-ends-about');
		// durationAnnotation.classList.add('event-value-secondary');
		// li.appendChild(durationAnnotation);

		li.appendChild(renderTitle(this.title));

		li.appendChild(startAnnotation);
		li.appendChild(renderType(this.type));

		if (this.message)
			li.appendChild(renderMessage(this.message));

		li.appendChild(start);
		li.appendChild(renderLocation(this.location));
		li.appendChild(renderHost(this.host));
		li.appendChild(renderGuests(this.guests));

		docFragment.appendChild(li);

		return docFragment;
	};

	global.EventViewModel = EventViewModel;

// ReSharper disable once ThisInGlobalContext
}(this));
