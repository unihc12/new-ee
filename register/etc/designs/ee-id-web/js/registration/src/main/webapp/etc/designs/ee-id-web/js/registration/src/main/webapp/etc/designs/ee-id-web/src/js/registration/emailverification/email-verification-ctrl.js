/* emailVerificationCtrl */

var domElements = require('./dom-elements');

var errorChecker = {
	24: function() {
		domElements.$resendSuccess.hide();
		domElements.$sendEmailNavigation.hide();
		domElements.$resendFailureUnavailable.hide();
		domElements.$resendFailure.fadeIn();
		emailVerificationCtrl.hideCaptcha();
		EE.Insights.generateInsights('API_ERROR_NOT_RECEIVED_EMAIL',
			{
				error: 'api-error-not-received-email',
				event_association: 'API_ERROR_NOT_RECEIVED_EMAIL',
				notificationStatus: 'api-error-not-received-email'
			}
		);
	},
	78: function() {
		window.reCaptcha.reset();
		window.reCaptcha.triggerMessage('invalid_captcha', true);
	},
	77: function() {
		domElements.$resendEmailLink
			.off('click')
			.attr('data-toggle', 'collapse');
		EE.main.toggleCollapse(domElements.$resendEmailLink);
		window.reCaptcha.reset();
	}
};


var responseStatusChecker = {
	200: function() {
		domElements.$verifyEmailContentContainer.fadeOut(function() {
			EE.main.scrollToElement($('.stepper'), 20);
			domElements.$resendFailureUnavailable.fadeOut();
			domElements.$resendFailure.fadeOut();
			domElements.$preloaderInit
				.fadeIn()
				.fadeOut(function() {
					domElements.$preloaderDone
						.fadeIn()
						.delay(800)
						.fadeOut(100)
						.promise()
						.done(emailVerificationCtrl.preloaderHelper);
					emailVerificationCtrl.hideSpinner();
				});
		});
		EE.Insights.generateInsights('ACCOUNT_VERIFICATION_EMAIL_RESENT',
			{
				error: '',
				event_association: 'ACCOUNT_VERIFICATION_EMAIL_RESENT',
				notificationStatus: 'account-verification-email-resent'
			}
		);
	},
	400: function(response) {
		var errorCode = response.code;
		if (errorCode) {
			errorChecker[errorCode]();
		} else {
			errorChecker[24]();
		}
		emailVerificationCtrl.hideSpinner();
	},
	500: function() {
		domElements.$resendSuccess.hide();
		domElements.$sendEmailNavigation.hide();
		domElements.$resendFailureUnavailable.hide();
		domElements.$resendFailure.fadeIn();
		emailVerificationCtrl.hideCaptcha();
		emailVerificationCtrl.hideSpinner();
		EE.Insights.generateInsights('API_ERROR_NOT_RECEIVED_EMAIL',
			{
				error: 'api-error-not-received-email',
				event_association: 'API_ERROR_NOT_RECEIVED_EMAIL',
				notificationStatus: 'api-error-not-received-email'
			}
		);
	},
	503: function() {
		domElements.$resendSuccess.hide();
		domElements.$sendEmailNavigation.hide();
		domElements.$resendFailure.hide();
		domElements.$resendFailureUnavailable.fadeIn();
		emailVerificationCtrl.hideCaptcha();
		emailVerificationCtrl.hideSpinner();
		EE.Insights.generateInsights('API_ERROR_NOT_RECEIVED_EMAIL',
			{
				error: 'api-error-not-received-email',
				event_association: 'API_ERROR_NOT_RECEIVED_EMAIL',
				notificationStatus: 'api-error-not-received-email'
			}
		);
	}
};

var emailVerificationCtrl = (function() {
	var emailPlaceHolder = '{{email}}';
	var email = $('#userEmail').val();
	var csrfValue = $('#csrf').val();
	var $resendEmailBtn = $('#email-verification__submit');

	function checkStatus(status, response) {
		if (status && responseStatusChecker[status]) {
			responseStatusChecker[status](response);
		} else {
			responseStatusChecker[400](response);
		}
	}

	function submitResendEmail(event) {
		event.preventDefault();

		EE.main.showSpinner($resendEmailBtn, true);
		var requestData = {
			username: email,
			'g-recaptcha-response': $('#g-recaptcha-response').val(),
			csrf: csrfValue
		};

		if (!EE.EEIDvalidation.validateForm(domElements.$resendEmailForm, true)) {
			EE.main.hideSpinner($resendEmailBtn, true);
			return;
		}

		EE.userService.resendEmail(requestData).always(function(response) {
			checkStatus(response.status, response);
		});
	}

	function resendEmailLinkHandler(event) {
		event.preventDefault();
		var requestData = {
			username: email,
			csrf: csrfValue
		};

		EE.userService.resendEmail(requestData).always(function(response) {
			checkStatus(response.status, response);
		});
	}

	function preloaderHelper() {
		replaceNotificationContent();
		hideCaptcha();
		domElements.$sendEmailNavigation.show();
		domElements.$resendSuccess.show();
	}

	function replaceNotificationContent() {
		var currentEmail = $('#emailAddress').val();
		var html = domElements.$resendSuccess.html();

		if (currentEmail) {
			domElements.$resendSuccess.html(
				html.replace(
					new RegExp(emailPlaceHolder, 'g'),
					currentEmail
				)
			);
			emailPlaceHolder = currentEmail;
		}
		domElements.$resendSuccess.removeClass('is-hidden');
	}

	function hideCaptcha() {
		$('#captchaWrapper, [data-target="#captchaWrapper"]')
			.removeClass('is-active');
		window.reCaptcha.reset();
		$('#notificationDefault').hide();
		domElements.$sendEmailNotificationDefault.hide();
		domElements.$verifyEmailContentContainer.fadeIn();
	}

	function hideSpinner() {
		EE.main.hideSpinner($resendEmailBtn, true);
	}

	return {
		submitResendEmail: submitResendEmail,
		resendEmailLinkHandler: resendEmailLinkHandler,
		preloaderHelper: preloaderHelper,
		hideCaptcha: hideCaptcha,
		hideSpinner: hideSpinner
	};
})();

module.exports = emailVerificationCtrl;
