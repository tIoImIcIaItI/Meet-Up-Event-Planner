// Provides simple property-like objects supporting change notification
// somewhat like INotifyPropertyChanged, or KO's observables.
//
// Example:
//		// Declare an observable property somewhere
//		var MyViewModel = { this.myObservableBooleanProperty: new observable(false); }
//		var vm = new MyViewModel();
//
//		// Get the property value
//		var currentValue = vm.myObservableBooleanProperty();
//
//		// Set the property value
//		vm.myObservableBooleanProperty(true);
//
//		// Subscribe to property value changes
//		vm.myObservableBooleanProperty.subscribe(function(newValue){ console.log('new property value' + newValue); });
//
(function (global) {
	'use strict';

	global.observable = function (initialValue) {

		var res = function () {
			// called as getter
			if (arguments.length === 0)
				return res._value;

			// called as setter
			var value = arguments[0];

			if (res._value !== value) {

				res._value = value;
				res._notifyListeners(value);
			}

			return res._value;
		};

		res._value = initialValue;
		res._subscriptions = [];

		res._notifyListeners = function (newValue) {
			res._subscriptions.forEach(function (listener) {
				listener(newValue);
			});
		};

		res._addListener = function (listener) {
			res._subscriptions.push(listener);
		};

		// Call this method to register a callback for property value change notifications.
		// The callback will receive the property's new value as the only argument.
		// The callback will NOT be called if the setter is called with strictly the same value as the current value.
		res.subscribe = function (listener) {
			res._addListener(listener);
		};

		return res;
	};

	// ReSharper disable once ThisInGlobalContext
}(this));
