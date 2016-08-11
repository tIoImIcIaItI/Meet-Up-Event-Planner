/*globals jQuery */

// A trivial facade over (and extremely leaky abstraction of)
// a particular promise/deferred implementation,
// in this case jQuery's implementation.
(function (global, $) {
	'use strict';

	var newDeferred = function () {
		return $.Deferred();
	};

	var getPromise = function (deferred) {
		return deferred.promise();
	};

	var resolve = function (deferred, value) {
		deferred.resolve(value);
	};

	var reject = function (deferred, value) {
		deferred.reject(value);
	};

	// Resolve or rejest a deferred based on a binary predicate
	var settle = function (deferred, predicate, resolvedValue, rejectedValue) {
		if (predicate())
			resolve(deferred, resolvedValue);
		else
			reject(deferred, rejectedValue);
	};

	var promiseValue = function (value) {
		var deferred = newDeferred();
		resolve(deferred, value);
		return getPromise(deferred);
	};

	global.deferred = {
		newDeferred: newDeferred,
		getPromise: getPromise,
		resolve: resolve,
		reject: reject,
		settle: settle,
		promiseValue: promiseValue
	};

	// ReSharper disable once ThisInGlobalContext
}(this, jQuery));