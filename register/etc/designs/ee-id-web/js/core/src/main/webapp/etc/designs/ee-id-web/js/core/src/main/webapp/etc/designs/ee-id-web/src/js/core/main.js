
/* bootstrap main functions and utils */

var $ = require('./vendor/jquery/jquery.min.js');

window.$ = $;
window.jQuery = $;
window.EE = window.EE || {};

require('./recaptcha/recaptcha');
require('./ui-helpers');
require('./utils');
require('./eeid-user-service');
require('./add-icons');
require('./target-setup');

var EEIDvalidation = require('./eeid-validation');
window.EE.EEIDvalidation = EEIDvalidation;
window.EE.EEIDvalidation.init();

window.onload = function() {
	window.EESG.form.password();
	EE.main.clearValidationForCurrentInput();
};
