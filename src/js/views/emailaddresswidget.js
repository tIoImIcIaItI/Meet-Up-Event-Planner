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

		this.onRemove = null; // return false to cancel the removal
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
		removeBtn.classList.add('btn-link');
		removeBtn.classList.add('btn-in-form');
		appendGlyph(removeBtn, 'fa-trash-o', 'remove guest');

		var guest = newTextElement('li', '');
		guest.id = this.id;
		guest.classList.add('guest-item');
		guest.setAttribute('tabindex', '0');
		guest.setAttribute('title', this.email);

		guest.appendChild(emailAddress);
		guest.appendChild(removeBtn);

		frag.appendChild(guest);

		removeBtn.addEventListener(
			'click', function () {

				if (!that.onRemove || !!!that.onRemove(that))
					that.unrender();
			});

		return frag;
	};

	global.EmailAddressWidget = EmailAddressWidget;

	// ReSharper disable once ThisInGlobalContext
}(this, document));