/* registration main functionality */
var emailVerification = require('./emailverification/email-verification');
window.EE = window.EE || {};

(function($, window, EE) {
	'use strict';

	if (EE.editMode) {
		return;
	}

	var waitingServerResponse = false;
	var state = window.currentState ? window.currentState.current : {};
	var emailPlaceHolder = '{{email}}';
	var $document = $(document);
	var firstRegistrationAttempt = true;
	var captchaRequired = state.captchaRequired;
	var captchaClone;
	var captchaDisplayedRefresh = 'REGISTRATION_CONDITIONAL_CAPTCHA_DISPLAYED_REFRESH';
	var captchaDisplayedAccepted = 'REGISTRATION_CONDITIONAL_CAPTCHA_DISPLAYED_ACCEPTED';
	var captchaAttemptsExceeded = 'REGISTRATION_CONDITIONAL_CAPTCHA_DISPLAYED_ATTEMPTS_EXCEEDED';
	var captchaAttemptsNotExceeded = 'REGISTRATION_CONDITIONAL_CAPTCHA_NOT_DISPLAYED_ATTEMPTS_NOT_EXCEEDED';

	var settings = {
		$passwordCheckPanel: $('#tooltip-password'),
		$messagePanelContainer: $('.message-panel-container'),
		$registrBtn: $('#registerBtn'),
		$confirmationPopup: $('#confirmationPopup'),
		$emailExistsNotification: $('#emailExistsNotification'),
		$emailAddressInput: $('#emailAddressInput'),
		$serverErrorWarning: $('#serverErrorWarning'),
		$serviceUnavailableErrorWarning: $('#serviceUnavailableErrorWarning'),
		$passwordInput: $('#passwordInput'),
		$successMessage: $('#successMessage')
	};

	EE.registrationflow = {
		pageInit: function() {
			var self = this;
			emailVerification.getInstance();
			captchaClone = $('.captcha').clone();
			self.hideCaptcha();

			$document
				.on('input_tooltip_show', self.inputTooltipShow)
				.on('input_tooltip_hide', self.inputTooltipHide)
				.on('blur', '#emailAddressInput', self.showWhyRegisterPanel)
				.on('click', '#changeEmailLink', $.proxy(self.changeEmailLinkHandler, self))
				.on('focus', '#registrationForm input', self.hideConfirmationPopup)
				.on('keydown', '#registrationForm input', $.proxy(self.validateBeforeSubmit, self))
				.on('keydown click', '#registerBtn', $.proxy(self.validateBeforeSubmit, self))
				.on('click', '#captchaTryAnotherCode', self.captchaRefreshInsight)
				.on('submit', '#registrationForm', $.proxy(self.handleFormSubmit, self));

			var $spoofRegistration = $('#userRegistrationSpoofForm');
			$spoofRegistration.bind('submit', self.formSpinner);

			if (state.stateName === 'registration-association-pending') {
				self.recheckAssociationStatus();
			}

			if (window.isFlex) {
				self.passwordCheckList();
			} else {
				EE.main.targetToggle('PASSWORD_STRENGTH_METER', $.proxy(self.passwordCheckList, self));
			}
		},
		passwordCheckList: function() {
			var self = this;
			$document.on('focus', '[data-pw-check]', self.showPasswordCheckPanel);
			if (window.isFlex) {
				$document.on('blur', '[data-pw-check]', self.hidePasswordCheckPanel);
			} else {
				$document.on('blur', '[data-pw-check], #showHidePassword', self.hidePasswordCheckPanel);
			}
		},
		recheckAssociationStatus: function() {
			var requestData = {
				csrf: $('#csrf').val()
			};

			setTimeout(function() {
				$.ajax({
					type: 'POST',
					url: '/id/add-product?fa=checkForPendingRequest',
					data: requestData,
					encode: true,
					success: function(response) {
						if (response && response.success) {
							handleAssociationSuccess();
						} else {
							handleAssociationFailure();
						}
					},
					error: function() {
						handleAssociationFailure();
					}
				});
			}, EE.properties.associationAsyncDelay);

			function handleAssociationSuccess() {
				$('#completeAssociationForm').submit();
			}

			function handleAssociationFailure() {
				$('.preloader--init').hide();
				$('#pageWithTiles').show();
				$('#addProductsFailureErr').show();
			}
		},

		validateBeforeSubmit: function(e) {
			if ((EE.Utils.isEnterKeyPressed(e) && e.target.id !== 'createAccountBtn') || e.type === 'click') {
				e.preventDefault();
				$('#registerBtn').focus();
				if (EE.EEIDvalidation.validateForm($('#registrationForm'), true)) {
					this.updateEmailInMessages();
					if (!window.isFlex) {
						this.showConfirmMsg();
					} else {
						var $confirmBtn = $('#createAccountBtn');
						$confirmBtn.click();
					}
				}
			}
		},

		updateEmailInMessages: function() {
			var currentEmail = $('#emailAddressInput').val();
			var $confirmEmail = $('#confirmEmailContent');
			var html = $confirmEmail.html();

			$confirmEmail.html(html.replace(new RegExp(emailPlaceHolder, 'g'), currentEmail));

			$('.notification__text').each(function() {
				var htmlNotification = $(this).html();
				$(this).html(htmlNotification.replace(new RegExp(emailPlaceHolder, 'g'), currentEmail));
			});

			emailPlaceHolder = currentEmail;
		},

		inputTooltipShow: function(e, data) {
			if (data === 'emailAddressInput') {
				settings.$messagePanelContainer.hide();
			}
		},

		inputTooltipHide: function(e, data) {
			if (data === 'emailAddressInput') {
				settings.$emailExistsNotification.hide(); // in fact it gets hidden only when unhovered, see _message-panel.scss (Ln 73)
			}
		},

		showConfirmMsg: function() {
			if (window.isFlex) {
				EE.main.showSpinner($('#registerBtn[type="button"]'), true).done(function() {
					EE.main.fadeInElement($('#confirmationPopup'));
				});
			} else {
				$('#registerBtn[type="button"]').prop('disabled', true);
				$('#confirmationPopup').css('display', 'block');
				EE.main.scrollToElement($('#registerBtn'), 250);
				$('#changeEmailLink').focus();
				$('#information-help-panels-mobile').hide();
			}
		},

		changeEmailLinkHandler: function(event) {
			event.preventDefault();
			if (window.isFlex) {
				EE.main.fadeOutElement($('#confirmationPopup'), $('#registerBtn[type="button"]'), true).done(function() {
					$('#emailAddressInput').focus();
				});
			} else {
				$('#confirmationPopup').css('display', 'none');
				$('#registerBtn[type="button"]').prop('disabled', false);
				$('#emailAddressInput').focus();
			}
		},

		showPasswordCheckPanel: function() {
			settings.$messagePanelContainer.hide();
			settings.$emailExistsNotification.fadeOut();
			settings.$passwordCheckPanel.show();
			if (window.isFlex) {
				var relatedInput =  settings.$passwordInput.get(0);
				if (relatedInput.t) {
					clearTimeout(relatedInput.t);
				}
				if (!relatedInput.touched) {
					window.setTimeout(function() {
						var indent;
						if (window.isFlex) {
							var scale = window.visualViewport.scale;
							var indentDefault = window.EE.isIos ? (80 / scale) : 50;
							indent = (scale > 1) ? 5 : indentDefault;
						}
						window.EE.EEIDvalidation.scrollAndFocus(settings.$passwordInput, indent);
					}, 100);
				}
				relatedInput.touched = true;
			}
		},

		hidePasswordCheckPanel: function(e) {
			if (!window.isFlex && e.relatedTarget && e.relatedTarget.id !== 'passwordInput' && e.relatedTarget.id !== 'showHidePassword') {
				settings.$messagePanelContainer.show();
				settings.$passwordCheckPanel.hide();
			}
			if (window.isFlex) {
				var relatedInput =  settings.$passwordInput.get(0);
				relatedInput.t = window.setTimeout(function() {
					settings.$passwordCheckPanel.hide();
				}, 5);
				relatedInput.touched = false;
			}
		},

		hideConfirmationPopup: function() {
			settings.$confirmationPopup.hide();
			settings.$registrBtn.prop('disabled', false);
		},

		formSpinner: function(e) {
			e.preventDefault();
			if (EE.EEIDvalidation.validateForm($('#userRegistrationSpoofForm'))) {
				var self = this;
				var $spoofSubmitButton = $('#spoofSubmitButton');
				EE.main.showSpinner($spoofSubmitButton, true).done(function() {
					$(self).unbind('submit', EE.registrationflow.formSpinner);
					$(self).submit();
				});
			}
		},

		handleFormSubmit: function(event) {
			var self = this;
			var $confirmBtn = $('#createAccountBtn');

			event.preventDefault();

			if (waitingServerResponse) {
				return;
			}

			waitingServerResponse = true;

			EE.main.setLastActiveDate();
			if (EE.EEIDvalidation.validateForm($('#registrationForm'))) {
				$confirmBtn.prop('disabled', true);
				EE.Insights.generateInsights({
					event: 'REGISTRATION_INITIATED',
					event_registration: '',
					notificationStatus: ''
				});

				self.disableFormFields(true);
				settings.$serverErrorWarning.hide();
				EE.main.showSpinner($confirmBtn, true).done(function() {
					self.submitRegistration();
				});
			}
		},

		submitRegistration: function() {
			var self = this;

			var requestData = {
				requestId: $('#requestId').val(),
				email: $('#emailAddressInput').val(),
				password: $('#passwordInput').val(),
				firstName: $('#firstNameInput').val(),
				lastName: $('#lastNameInput').val(),
				rememberFlag: $('#rememberMeCheckbox').prop('checked')
			};

			if ($('#contactNumberInput') && $('#contactNumberInput').val()) {
				requestData.contactNo = $('#contactNumberInput').val().replace(/^07/, '447');
			}

			if (captchaRequired === true) {
				requestData.captchaExpectedAns = $('#captcha_question_field').val();
				requestData.captchaInput = $('#captcha_response_field').val();
			}

			EE.userService.registerUser(requestData).always(function(response) {
				switch (response.status) {
				case 0:
					handleServerError();
					break;
				case 200:
					handleRegistrationSuccess();
					break;
				case 400:
					handleRegistrationFailure(response);
					break;
				case 405:
					handleServerError();
					break;
				case 503:
					handleServiceUnavailableError();
					break;
				case (response.status <= 599 && response.status >= 500 ? response.status : false):
					handleServerError();
					break;
				default:
				}
			});


			function handleRegistrationSuccess() {
				if (window.isFlex) {
					self.showSuccessMessage();
				}

				var $sessionForm = $('#registrationSessionForm');
				var captchaEvent = self.generateCaptchaInsight();

				if (firstRegistrationAttempt) {
					var orderRoute = '';
					var eventLogin = 'LOGIN_SUCCESS_ID_DASHBOARD';
					if (EE.eeIdTracking && EE.eeIdTracking.destination === 'hbb-sales') {
						orderRoute = 'authenticated_id';
						eventLogin = 'LOGIN_SUCCESS';
					}

					var notificationStatus = 'registration-success';
					if (window.isFlex) {
						notificationStatus = 'flex-registration-is-success';
					}

					EE.Insights.generateInsights({
						event: 'REGISTRATION_SUCCESS',
						event_captcha: captchaEvent,
						event_login: eventLogin,
						event_registration: 'REGISTRATION_SUCCESS',
						loginStatus: 'LoggedIn',
						notificationStatus: notificationStatus,
						orderRoute: orderRoute
					});
				} else {
					var notificationStatusResend = 'registration-success-resend';
					if (window.isFlex) {
						notificationStatusResend = 'flex-registration-is-success';
					}

					EE.Insights.generateInsights({
						event: 'REGISTRATION_SUCCESS',
						event_captcha: captchaEvent,
						event_registration: 'REGISTRATION_SUCCESS',
						event_login: 'LOGIN_SUCCESS_ID_DASHBOARD',
						notificationStatus: notificationStatusResend,
						loginStatus: 'LoggedIn'
					});
				}


				if (!window.isFlex) {
					$sessionForm.submit();
				} else {
					setTimeout(function() {
						$sessionForm.submit();
					}, 1600);
				}
			}

			function handleRegistrationFailure(res) {
				var response = res.responseJSON;
				var errorCode = response.code;
				var captchaMessage = self.generateCaptchaInsight(response);
				self.generateRegistrationFailureInsight(captchaMessage, errorCode === '100');
				self.prepareFormToNextAttempt();
				self.hideCaptcha();
				handleErrorCode();
				EE.main.scrollToFirstErrorField();

				function handleErrorCode() {
					switch (errorCode) {
					case '23':
					case '102':
					case '104':
					case '105':
						handleServerError();
						break;
					case '24':
						handleInvalidFieldError();
						break;
					case '100':
						handleEmailInUseError();
						break;
					case '103':
						handleCaptchaError();
						break;
					case '106':
						handleCaptchaRequiredError();
						break;
					default:
						return;
					}
				}


				function handleInvalidFieldError() {
					var errorField = response.message && response.message.split('Invalid body field: ')[1];
					if (window.isFlex) {
						EE.main.hideSpinner(settings.$registrBtn, true);
					}
					var fieldWrappers = {
						firstName: $('#firstNameInput'),
						lastName: $('#lastNameInput'),
						email: $('#emailAddressInput'),
						password: $('#passwordInput'),
						captchaInput: $('#captcha_response_field')
					};

					var ruleWrappers = {
						firstName: 'name',
						lastName: 'name',
						email: 'email',
						password: 'password'
					};

					if ($('#contactNumberInput')) {
						requestData.contactNo = $('#contactNumberInput');
						ruleWrappers.contactNo = 'contactNumber';
					}

					if (errorField === 'captchaInput') {
						handleCaptchaError();
					} else {
						EE.EEIDvalidation.setAsInvalid(fieldWrappers[errorField], ruleWrappers[errorField]);
					}
					fieldWrappers[errorField].val('');
				}

				function handleCaptchaError() {
					self.captchaRefreshInsight();
					EE.main.reloadCaptcha();
					EE.EEIDvalidation.setAsInvalid(
						$('#captcha_response_field'),
						'required'
					);
				}

				function handleCaptchaRequiredError() {
					$(captchaClone).insertAfter('.ee-checkbox');
					if (window.Captcha) {
						Captcha.create('captcha_div', EE.captchaProps.theme, EE.captchaProps.url);
					}

					captchaRequired = true;
					self.captchaExceededAttemptsInsight();
					EE.main.reloadCaptcha();
				}

				function handleEmailInUseError() {
					settings.$messagePanelContainer.hide();
					if (captchaRequired) {
						EE.main.reloadCaptcha();
					}
					if (window.isFlex) {
						EE.main.fadeInElement(settings.$emailExistsNotification);
					} else {
						settings.$emailExistsNotification.show();
						EE.main.scrollToElement($('#emailExistsNotification'), 10);
					}
				}
			}

			function handleServerError() {
				settings.$emailExistsNotification.hide();
				var captchaMessage = self.generateCaptchaInsight();
				self.generateRegistrationFailureInsight(captchaMessage);
				self.prepareFormToNextAttempt();
				self.showServerError();
				EE.main.reloadCaptcha();
			}

			function handleServiceUnavailableError() {
				var captchaMessage = self.generateCaptchaInsight();
				self.generateRegistrationFailureInsight(captchaMessage);
				self.prepareFormToNextAttempt();
				self.showServiceUnavailableError();
				EE.main.reloadCaptcha();
			}
		},

		disableFormFields: function(isReadOnly) {
			$('#registrationForm :input').prop('readonly', isReadOnly);
			$('#rememberMeCheckbox').prop('disabled', isReadOnly);
		},

		hideConfirmationPopUp: function() {
			var $confirmationEmailPopup = $('#confirmationPopup');
			var $registerBtn = $('#registerBtn');
			var $confirmBtn = $('#createAccountBtn');
			EE.main.hideSpinner($confirmBtn);
			$confirmBtn.prop('disabled', false);
			$confirmationEmailPopup.hide();
			$registerBtn.prop('disabled', false);
		},

		generateRegistrationFailureInsight: function(captchaEvent, isExistingEmail) {
			var notificationStatus = 'registration-js-failure';
			if (window.isFlex) {
				if (isExistingEmail) {
					notificationStatus = 'flex-existing-email-found';
				} else {
					notificationStatus = 'flex-registration-is-failure';
				}
			}

			EE.Insights.generateInsights({
				event: 'REGISTRATION_FAILURE',
				event_captcha: captchaEvent,
				event_registration: 'REGISTRATION_FAILURE',
				notificationStatus: notificationStatus}
			);
			firstRegistrationAttempt = false;
		},

		prepareFormToNextAttempt: function() {
			this.disableFormFields(false);
			waitingServerResponse = false;
			this.hideConfirmationPopUp();
		},

		showServerError: function() {
			if (window.isFlex) {
				EE.main.fadeInElement(settings.$serverErrorWarning);
			} else {
				settings.$serverErrorWarning.fadeIn();
				EE.main.scrollToElement(settings.$serverErrorWarning, 100);
			}
		},

		showServiceUnavailableError: function() {
			if (window.isFlex) {
				EE.main.fadeInElement(settings.$serviceUnavailableErrorWarning);
			} else {
				settings.$serviceUnavailableErrorWarning.fadeIn();
				EE.main.scrollToElement(settings.$serviceUnavailableErrorWarning, 100);
			}
		},

		showSuccessMessage: function() {
			EE.main.fadeInElement(settings.$successMessage);
		},

		hideCaptcha: function() {
			// eslint-disable-next-line no-undefined
			if (captchaRequired === false || captchaRequired === undefined) {
				$('.captcha').remove();
			} else if (window.Captcha) {
				Captcha.create('captcha_div', EE.captchaProps.theme, EE.captchaProps.url);
			}
		},

		captchaRefreshInsight: function() {
			EE.Insights.generateInsights({
				event_captcha: captchaDisplayedRefresh
			});
		},

		captchaExceededAttemptsInsight: function() {
			EE.Insights.generateInsights({
				event_captcha: captchaAttemptsExceeded
			});
		},

		generateCaptchaInsight: function(response) {
			if (EE.eeIdTracking) {
				var captchaEvent = EE.eeIdTracking.event_captcha;
				var code = response ? response.code : 0;

				if (captchaRequired && code !== 103) {
					captchaEvent = captchaDisplayedAccepted;
				} else {
					captchaEvent = captchaAttemptsNotExceeded;
				}

				return captchaEvent;
			}
			return null;
		},

		showWhyRegisterPanel: function() {
			settings.$messagePanelContainer.show();
		}
	};

	EE.registrationflow.pageInit();
})($, window, EE);
