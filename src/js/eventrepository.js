/*globals deferred */

// Singleton event repository module
(function (global) {
	'use strict';

	global.EventRepository = (function () {

		var events = [{
			id: 1,
			userId: '',
			title: 'Surprise Party for Bob',
			type: 'Birthday Party',
			host: 'Friends of Bob',
			start: '2016-02-03T18:00',
			end: '2016-02-03T23:59',
			location: "Bob's House",
			message: '$20 gift limit BYOB',
			guests: ['adam@lukewarmmail.com', 'baker@lukewarmmail.com', 'charlie@lukewarmmail.com',
				'davis@lukewarmmail.com', 'evie@lukewarmmail.com', 'frank@lukewarmmail.com'
			]
		}, {
			id: 2,
			userId: '',
			title: 'National Night Out',
			type: 'Festival',
			host: 'Town of Applebob',
			start: '2016-10-31T19:30',
			end: '2016-10-31T21:00',
			location: '666 Black Cat Dr, Applebob, TX',
			message: "Boo! The Town of Applebob invites your family to attend this year's fall festivities. With more than thirty food, drink, and entertainment vendors... it's to die for!",
			guests: ['gomez@lukewarmmail.com', 'morticia@lukewarmmail.com',
				'uncle-fester@lukewarmmail.com', 'lurch@lukewarmmail.com', 'grandmama@lukewarmmail.com', 'wednesday@lukewarmmail.com', 'pugsley@lukewarmmail.com', 'thing@lukewarmmail.com'
			]
		}, {
			id: 3,
			userId: '',
			title: 'Manifesto on The Complexities of Meta-physical Transportation Logistics',
			type: 'Seminar',
			host: 'Obfu$cation 4 Prophit, Inc.',
			start: '2016-09-01T08:30',
			end: '2016-09-01T17:00',
			location: 'Marilton Hotel, 123 Main St, Chicago IL 12345, USA',
			message: 'Lorem ipsum dolor sit amet, a urna integer. Et et amet tellus. Eget lobortis dolor eget in id duis, egestas mauris qui id dolor ipsum, senectus tellus felis leo mauris hymenaeos. Tellus sit duis eget, posuere suspendisse mauris, iaculis diam ante praesent et pellentesque vivamus, integer fermentum porttitor sed sed nonummy est.',
			guests: ['there@lukewarmmail.com', 'is@lukewarmmail.com', 'no@lukewarmmail.com', 'spoon@lukewarmmail.com']
		}, {
			id: 4,
			userId: '',
			title: 'Rehersal Dinner',
			type: 'Cocktail Party',
			host: 'Father of the Bride',
			start: '2017-02-07T18:00',
			end: '2017-02-07T21:00',
			location: 'Lared Quintaroof Inn, Mountain Tapwaters, CO',
			message: 'Dearly beloved, we will be gathered there that day to join these two in matrimony. Open bar and mic after 8!',
			guests: ['foo@lukewarmmail.com', 'far@lukewarmmail.com', 'fee@lukewarmmail.com']
		}];

		// Pretend we're getting a unique ID from a data store
		function nextEventId() {

			function max(array) {
				// keep picking the larger value until it is the largest
				return array.reduce(function (lhs, rhs) {
					return rhs > lhs ? rhs : lhs;
				});
			}

			// find the next integer after the largest ID in our store
			return max(events.map(function (evt) {
				return evt.id;
			})) + 1;
		}

		// Pretend we're eventually loading existing a user's events from a data store
		function getAllEventsForUser(userId) {

			return deferred.promiseValue(
				events.filter(function (event) {
					return event.userId === '' || event.userId === userId;
				}));
		}

		// Pretend we're inserting a new event into a data store,
		// which eventually returns the inserted event including it's assigned ID
		function addEvent(event) {

			event.id = nextEventId();

			events.push(event);

			return deferred.promiseValue(event);
		}

		return {

			getAllEventsForUser: getAllEventsForUser,
			addEvent: addEvent
		};

	})();

	// ReSharper disable once ThisInGlobalContext
}(this));