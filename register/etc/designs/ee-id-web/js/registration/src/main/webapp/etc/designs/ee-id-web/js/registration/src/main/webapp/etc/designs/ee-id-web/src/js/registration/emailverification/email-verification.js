/* email verification main functionality */
window.EE = window.EE || {};

var domElements = require('./dom-elements');
var ctrl = require('./email-verification-ctrl');


var emailVerification = (function() {
	var instance;

	function init() {
		domElements.$document.on('eeid-collapse-closed', function() {
			window.reCaptcha.reset();
			EE.EEIDvalidation.setAsValid(domElements.$captchaInput);
		});
		domElements.$resendEmailForm.submit(ctrl.submitResendEmail);
		domElements.$resendEmailLink.on('click', ctrl.resendEmailLinkHandler);
	}

	return {
		getInstance: function() {
			if (!instance) {
				instance = init();
			}

			return instance;
		}
	};
})();


module.exports = emailVerification;
