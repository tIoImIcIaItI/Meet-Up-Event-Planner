﻿/*globals Array */

(function(global) {
	'use strict';

	// SOURCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
	if (!Array.prototype.includes) {
		// ReSharper disable once NativeTypePrototypeExtending
		Array.prototype.includes = function(searchElement /*, fromIndex*/) {

			if (this === undefined || this === null) {
				throw new TypeError('Array.prototype.includes called on null or undefined');
			}

			// ReSharper disable once InconsistentNaming
			var O = Object(this);
			var len = parseInt(O.length, 10) || 0;
			if (len === 0) {
				return false;
			}
			var n = parseInt(arguments[1], 10) || 0;
			var k;
			if (n >= 0) {
				k = n;
			} else {
				k = len + n;
				if (k < 0) {
					k = 0;
				}
			}
			var currentElement;
			while (k < len) {
				currentElement = O[k];
				if (searchElement === currentElement ||
					// ReSharper disable SimilarExpressionsComparison
					(searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
					// ReSharper restore SimilarExpressionsComparison
					return true;
				}
				k++;
			}
			return false;
		};
	}

	// Trivial wrapper for the array slice hack in pre-ES6 environments
	global.arrayFrom = function(arrayLike) {

		return Array.prototype.slice.call(arrayLike);
	};

	// Trivial wrapper for arr[arr.length-1] pattern
	if (!Array.prototype.last) {
		// ReSharper disable once NativeTypePrototypeExtending
		Array.prototype.last = function() {
			return this[this.length - 1];
		};
	}

	// ReSharper disable once ThisInGlobalContext
}(this));
