(function(window) {
	'use strict';

	var reCaptcha = {
		loaded: false,
		hideCallback: function() {
			var callbackTextarea = document.getElementById('g-recaptcha-response');
			if (callbackTextarea) {
				callbackTextarea.setAttribute('aria-hidden', true);
				callbackTextarea.setAttribute('aria-readonly', true);
			}
		},
		expiredCallback: function() {
			reCaptcha.triggerMessage('timeout-or-duplicate', true);
			document.getElementById('captchaClicked').value = false;
		},
		errorCallback: function() {
			reCaptcha.triggerMessage('bad-request', true);
			document.getElementById('captchaClicked').value = false;
		},
		validCallback: function(success) {
			window.grecaptcha.ready(function() {
				if (success) {
					reCaptcha.triggerMessage('required', false);
					document.getElementById('captchaClicked').value = true;
				}
			});
		},
		reset: function() {
			// eslint-disable-next-line no-undefined
			if (window.reCaptchaRenderId !== undefined) {
				window.grecaptcha.reset(window.reCaptchaRenderId);
				reCaptcha.triggerMessage('required', false);
			}
		},
		getMessage: function(type) {
			switch (type) {
			case 'timeout-or-duplicate':
				return 'Ah, time\'s up. Click the little box above';
			case 'invalid_captcha':
				return 'Well, that didn\'t work. Click the little box above';
			case 'bad-request':
				return 'Well, that didn\'t work. Please refresh the page and try again';
			default:
				return 'Let us know you\'re not a robot. Click the little box above';
			}
		},
		triggerMessage: function(type, show) {
			var box = document.querySelector('.recaptcha-error-message');
			box.innerText = reCaptcha.getMessage(type);
			if (show) {
				box.classList.remove('hidden-important');
			} else {
				box.classList.add('hidden-important');
			}
		}
	};

	window.reCaptcha = reCaptcha;

	var onloadCallback = function() {
		reCaptcha.loaded = true;
		if (reCaptcha.renderReCaptcha) {
			reCaptcha.renderReCaptcha();
			reCaptcha.hideCallback();
		}
	};

	window.onloadCallback = onloadCallback;
})(window);
