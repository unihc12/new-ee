window.EE = window.EE || {};

(function($, window, EE) {
	'use strict';

	if (EE.editMode) {
		return;
	}

	EE.cpciTimoutRedirect = true;

	var settings = {
		pageTimeoutDelay: EE.properties.pageTimeoutDelay, // should be in milliseconds,
		redirectUrl: EE.properties.pageTimeoutRedirect
	};

	if (window.localStorage.eeidLastActiveDate) {
		var lastActivityMs = new Date() - new Date(window.localStorage.eeidLastActiveDate);

		if (lastActivityMs < settings.pageTimeoutDelay) {
			// decrease timeout
			settings.pageTimeoutDelay -= lastActivityMs;
		} else {
			// set new Last activity Date
			window.localStorage.eeidLastActiveDate = new Date();
		}
	} else {
		// set new Last activity Date
		window.localStorage.eeidLastActiveDate = new Date();
	}

	resetKSATimers();

	/**
	 * start timer for Time Out on the page
	 * @returns {void}
	 */
	function resetKSATimers() {
		setTimeout(function() {
			$.ajax({
				type: 'POST',
				url: '/id/revoke',
				contentType: 'application/json',
				dataType: 'json',
				encode: true,
				complete: function() {
					EE.Insights.generateInsights('TIMEOUT_VIEW');
					window.location.href = settings.redirectUrl;
				}
			});
		}, settings.pageTimeoutDelay);
	}
})($, window, EE);
