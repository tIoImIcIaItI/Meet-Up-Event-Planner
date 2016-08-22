/*globals document */
/*globals subclass, newTextElement, appendGlyph */
/*globals Widget */

// Encapsulates the guest email widget in the new event form
(function (global, document) {
	'use strict';

	// Constructor
	// ReSharper disable once InconsistentNaming
	var EmailAddressWidget = function (id, email) {

		Widget.call(this, id);

		this.email = email;

		this.onClick = null;
		this.onSelect = null;
		this.onAboutToRemove = null; // return false to cancel the removal
	};

	subclass(EmailAddressWidget, Widget);

	EmailAddressWidget.prototype.render = function () {
		var that = this;

		var frag = document.createDocumentFragment();

		var emailAddress = newTextElement('span', this.email);
		emailAddress.classList.add('guest-email-address');

		var removeBtn = newTextElement('button', '');
		removeBtn.setAttribute('type', 'button');
		removeBtn.classList.add('btn');
		removeBtn.classList.add('btn-in-form');
		removeBtn.classList.add('guest-email-address-toolbar-btn');
		removeBtn.setAttribute('tabindex', '-1');
		appendGlyph(removeBtn, 'fa-trash-o', 'remove guest');

		var guest = newTextElement('li', '');
		//guest.id = this.id;
		//guest.classList.add('guest-item');
		//guest.setAttribute('tabindex', '-1');
		//guest.setAttribute('title', this.email);

		var wrapper = newTextElement('div', '');
		wrapper.id = this.id;
		wrapper.classList.add('guest-item');
		wrapper.setAttribute('tabindex', '-1');
		wrapper.setAttribute('title', this.email);
		wrapper.appendChild(emailAddress);
		wrapper.appendChild(removeBtn);

		guest.appendChild(wrapper);

		frag.appendChild(guest);

		removeBtn.addEventListener(
			'click', function (event) {

				if (!that.onAboutToRemove || that.onAboutToRemove(event, that)) {
					that.unrender();
				}
				return false;
			});

		guest.addEventListener(
			'click', function (event) {

				if (that.onClick)
					return that.onClick(event, that);
				return true;
			});

		// Ensure that if any of this widget's toolbar buttons become focused,
		// this widget is properly selected. This may happen if the user mouses down
		// on a button, drags off, then mouses up leaving the button focused- but avoiding
		// our click handler.
		arrayFrom(wrapper.querySelectorAll('.guest-email-address-toolbar-btn'))
			.forEach(function (el) {
				el.addEventListener(
					'focus',
					function () {
						if (that.onSelect)
							return that.onSelect(that, wrapper);
						return true;
					});
			});

		return frag;
	};

	EmailAddressWidget.prototype.unrender = function () {

		var el = document.getElementById(this.id);

		if (el && el.parentNode)
			el.parentNode.remove();
	};

	global.EmailAddressWidget = EmailAddressWidget;

	// ReSharper disable once ThisInGlobalContext
}(this, document));
