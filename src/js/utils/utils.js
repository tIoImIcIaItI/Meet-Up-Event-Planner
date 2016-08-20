/*globals document, scroll, Element */

(function (global) {
	'use strict';

	// SOURCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
	if (!Array.prototype.includes) {
		// ReSharper disable once NativeTypePrototypeExtending
		Array.prototype.includes = function (searchElement /*, fromIndex*/) {
			'use strict';
			if (this == null) {
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
				if (k < 0) { k = 0; }
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
	global.arrayFrom = function (arrayLike) {

		return Array.prototype.slice.call(arrayLike);
	};

	if (!Array.prototype.last) {
		// ReSharper disable once NativeTypePrototypeExtending
		Array.prototype.last = function () {
			return this[this.length - 1];
		};
	};


	// Consolidate steps used to wire up a sub-class's prototype.
	// From what I've gleaned from other's countless online discussions, books, courses, etc.
	// of this matter, this is the most complete set of steps needed to yield sensible answers
	// to all queries about the object's 'identity' and of course provide access
	// to the base class functionality.
	global.subclass = function (sub, base) {

		sub.prototype = Object.create(base.prototype); // inherit a copy of the base class's prototype chain
		sub.prototype.base = base.prototype; // report being derived from the given base class
		sub.prototype.constructor = sub; // report being constructed from this most-specific subclass
	};



	// DOM helper to remove an element from the tree
	// ADAPTED FROM: http://stackoverflow.com/questions/3387427/remove-element-by-id
	Element.prototype.remove = function () {
		this.parentElement.removeChild(this);
	};

	// DOM helper analogous to appendChild()
	// ADAPTED FROM: http://callmenick.com/post/prepend-child-javascript
	Element.prototype.prependChild = Element.prototype.prependChild || function (newChild) {

		this.insertBefore(newChild, this.firstChild);
	};

	// NORMALIZATION for browsers that don't support second argument to classList.toggle()
	Element.prototype.addOrRemoveClass = function (className, add) {

		if (add)
			this.classList.add(className);
		else
			this.classList.remove(className);
	};

	// Add an attribute without a value to this DOM element
	Element.prototype.addAttribute = function (attributeName) {

		this.setAttribute(attributeName, '');
	};

	// DOM helper for creating a new element by tag name and
	// immediately setting its textContent
	global.newTextElement = function (tag, textContent) {

		var elem = document.createElement(tag);
		elem.textContent = textContent;
		return elem;
	};

	// Trivial wrapper in case we want to do more later, ex. animation
	global.scrollToTop = function () {

		scroll(0, 0);
	};

	// Trivial wrapper in case we want to do more later, ex. animation
	global.scrollToId = function (id) {

		document.getElementById(id).scrollIntoView();
	};

	// Creates a fully-configured element from a Font Awesome glyph
	global.newLabelGlyph = function (faName, title) {

		var glyph = newTextElement('i', '');
		glyph.classList.add('fa');
		glyph.classList.add(faName);
		glyph.classList.add('event-label-glyph'); // TODO: make this non-app-specific (argument?)

		if (title)
			glyph.title = title;

		return glyph;
	};

	// Creates and appends a Font Awesome glyph as a child of the given element
	global.appendGlyph = function (parent, faName, title) {

		var glyph = newLabelGlyph(faName, title);
		parent.appendChild(glyph);

		return glyph;
	};

	// Creates and prepends a Font Awesome glyph as a child of the given element
	global.prependGlyph = function (parent, faName, title) {

		var glyph = newLabelGlyph(faName, title);
		parent.insertBefore(glyph, parent.firstChild);

		return glyph;
	};

	// While the internet debates the multitude of ways to accomplish this,
	// we'll choose the simplest solution for now.
	global.removeAllChildren = function (el) {

		el.innerHTML = '';
	}

	// Returns a random-ish integer between min (included) and max (included)
	// Using Math.round() will give you a non-uniform distribution!
	// SOURCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	global.getRandomIntInclusive = function (min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	// Returns a new array filled with integers in the closed range [min, max].
	global.closedRange = function (min, max) {

		var res = [];
		for (var i = min; i <= max; i++) {
			res.push(i);
		}
		return res;
	};

	// Randomly-ish returns one element from the array of possible values
	global.pickFrom = function (choices) {

		return choices[getRandomIntInclusive(0, choices.length - 1)];
	};

	// SOURCE: http://www.oaa-accessibility.org/example/19/
	global.keyCodes = {
		tab: 9,
		enter: 13,
		esc: 27,

		space: 32,
		pageup: 33,
		pagedown: 34,
		end: 35,
		home: 36,

		left: 37,
		up: 38,
		right: 39,
		down: 40
	};


	// APPLICATION-SPECIFIC GLOBALS
	// TODO: put this someplace better
	global.timestampFormat = 'YYYY-MM-DDTHH:mm:ss';


	// ReSharper disable once ThisInGlobalContext
}(this));