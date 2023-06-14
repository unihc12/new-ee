window.EE = window.EE || {};

(function($, window, EE) {
	'use strict';

	var eventsToNotRename = ['FORGOTTEN_PASSWORD_ID_LOCKED', 'FORGOTTEN_PASSWORD_24HR_BLOCK', 'FORGOTTEN_PASSWORD_ID_UNVERIFIED',
		'MCN_OTP_RESEND_ATTEMPT_EXCEEDED', 'MCN_INCORRECT_OTP', 'MCN_NOT_MATCH_RAN_DETECTED', 'ForgotPasswordEmailFailed'];

	function isNotInArray(value, array) {
		return array.indexOf(value) < 0;
	}

	EE.Insights = {
		create: function(insights) {
			if (insights.event) {
				insights.event = this.getEvent(insights.event, insights.error);
			}
			this.transferInsightProps(insights);
			return insights;
		},
		generateInsights: function(prop, additionalProperties) {
			var newTrackingId;
			if (typeof prop === 'string') {
				newTrackingId = $.extend(true, {}, EE.eeIdTracking);
				newTrackingId.event = prop;
				if (additionalProperties) {
					for (var propertyName in additionalProperties) {
						if (additionalProperties.hasOwnProperty(propertyName)) {
							newTrackingId[propertyName] = additionalProperties[propertyName];
						}
					}
				}
			} else if (typeof prop === 'object') {
				newTrackingId = $.extend(true, {}, EE.eeIdTracking, prop);
			}

			EE.eeIdTracking = newTrackingId;
			this.transferInsightProps(newTrackingId);
            /* eslint-disable */
			try {
				if (typeof (utag.insights) === 'function') {
					utag.insights();
				}
			} catch (e) {
				console.log('tag isn\'t initiated');
			}
            /*eslint-enable */
		},

		// if there is error on page load, suffix the event name with 'FAILED'
		getEvent: function(event, error) {
			if (error && event && isNotInArray(event, eventsToNotRename)) {
				var parts = event.split('_');
				return event.replace(parts[parts.length - 1], 'FAILED');
			}
			return event;
		},
		propsInsightMapping: function(insightsData) {
		// this function return the remapped object
			return {
				flow: insightsData.flow
			};
		},
		transferInsightProps: function(data) {
			// this function allows to remap specific insights props in specific utag_data props
			this.transferObject(this.propsInsightMapping(data));
		},
		transferObject: function(data) {
			// this function transfers all the objects to the utag_data
			var utag = $.extend(true, {}, window.utag_data || {}, data);
			window.utag_data = utag;
		}
	};
})($, window, EE);

