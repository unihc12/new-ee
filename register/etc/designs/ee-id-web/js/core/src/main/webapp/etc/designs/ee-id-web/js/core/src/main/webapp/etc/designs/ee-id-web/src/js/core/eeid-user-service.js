window.EE = window.EE || {};

EE.userService = (function($) {
	return {
		registerUser: function(requestData) {
			return $.ajax({
				type: 'POST',
				url: EE.properties.registrationEndpoint,
				contentType: 'application/json',
				data: JSON.stringify(requestData),
				crossDomain: true,
				xhrFields: { withCredentials: true },
				dataType: 'json',
				encode: true
			});
		},

		getNetworkSession: function() {
			return $.ajax({
				type: 'POST',
				url: EE.properties.getNetworkSessionEndpoint,
				contentType: 'application/json',
				crossDomain: true
			});
		},

		getMSISDN: function() {
			return this.getNetworkSession().then(function(sessionId) {
				return $.get(EE.properties.getMsISDNEndpoint, sessionId);
			});
		},

		requestNewVerificationPin: function() {
			// TODO: remove props object from here and get it from parameter
			var props = {
				getNewPin: true,
				csrf: $('#csrf').val()
			};

			if (EE.personalDetailsflow.isCaptchaVisible) {
				props['g-recaptcha-response'] = $('#g-recaptcha-response').val();
			}
			// TODO: get endpoint from EE.properties
			return $.post('/id/change-mobile-number', props);
		},

		changeUserPassword: function(url, requestData) {
			return $.ajax({
				type: 'POST',
				url: url,
				contentType: 'application/json',
				data: JSON.stringify(requestData),
				crossDomain: true,
				dataType: 'json',
				xhrFields: { withCredentials: true },
				encode: true
			});
		},

		resendEmail: function(requestData) {
			return $.ajax({
				type: 'POST',
				url: EE.properties.resendEmailStep,
				crossDomain: true,
				data: requestData,
				dataType: 'json',
				encode: true
			});
		}
	};
})(jQuery);
