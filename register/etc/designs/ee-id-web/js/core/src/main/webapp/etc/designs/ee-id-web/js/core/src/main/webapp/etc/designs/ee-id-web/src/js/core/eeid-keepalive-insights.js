window.EE = window.EE || {};

(function ($, window) {

  'use strict';

	var $document = $(document);

	$document
		.on('eeid:SHOW_KEEP_ALIVE_PROMPT', function () {
			if(window._satellite){ 
				window._satellite.track('SHOW_KEEP_ALIVE_PROMPT');
			}
		})
		.on('eeid:SUCCESS_LOGOUT', function () {
			if(window._satellite){ 
				window._satellite.track('SUCCESS_LOGOUT');
			}
		})
		.on('eeid:REVOKE_USER_SESSION', function () {
			if(window._satellite){ 
				window._satellite.track('REVOKE_USER_SESSION');
			}
		})
		.on('eeid:SUCCESS_KEEP_SESSION_ALIVE', function () {
			if(window._satellite){ 
				window._satellite.track('SUCCESS_KEEP_SESSION_ALIVE');
			}
		})
		.on('eeid:ERROR_KEEP_SESSION_ALIVE', function () {
			if(window._satellite){ 
				window._satellite.track('ERROR_KEEP_SESSION_ALIVE');
			}
		});

})($, window);
