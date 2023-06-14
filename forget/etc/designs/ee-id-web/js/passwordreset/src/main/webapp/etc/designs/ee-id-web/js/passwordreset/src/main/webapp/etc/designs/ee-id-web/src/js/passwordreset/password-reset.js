window.EE = window.EE || {};
window.reCaptcha = window.reCaptcha || {};

(function($, window, EE) {
	'use strict';

	if (EE.editMode) {
		return;
	}

	var passwordResetSuccessfulUrl;
	if (EE.properties.features.VERIFY_EMAIL_RESULT_PAGE){
		passwordResetSuccessfulUrl = '/id/verify-email-result';
	}else{
		passwordResetSuccessfulUrl = '/id/password-reset-successful';
	}

	// TODO: get endpoint from config
	var settings = {
		resendEmailUrl: '/id/reset-password',
		passwordResetSuccessfulUrl: passwordResetSuccessfulUrl
	};

	var $emailInput = $('#email-address__input');

	EE.passwordResetflow = {
		pageInit: function() {
			if (!EE.Utils.MobileView.Any) {
				$emailInput.focus();
			}
			EE.main.addSpinnerAndDisableAllBtnsWhenSubmitForm($('#password-reset__form'), $('#password-reset__submit'));
		},

		resendEmail: function() {
			var $resendEmailForm = $('#resendEmailForm');
			var $resendEmailBtn = $('#resendEmailForm__submit');
			var resendEmailNotification = document.getElementById('js-email-sent-notification');
			var apiErrorNotification = document.getElementById('password-email--api-error');
			$resendEmailForm.submit(function(e) {
				e.preventDefault();
				if (!EE.EEIDvalidation.validateForm($resendEmailForm)) {
					return;
				}

				var el = $(this).data('preloader');

				var requestData = {
					csrf: $('#csrf').val(),
					'g-recaptcha-response': $('#g-recaptcha-response').val(),
					email: $('#emailInput').val(),
					resendEmail: true
				};

				EE.main.showSpinner($resendEmailBtn, true).done(function() {
					$.ajax({
						type: 'POST',
						url: settings.resendEmailUrl,
						crossDomain: true,
						dataType: 'json',
						data: requestData,
						encode: true,
						complete: function(response) {
							if (response.status === 200) {
								EE.main.scrollToElement($('.container--send-email'), 20);
								$('#accordion-change-email').trigger('click');
								EE.main.showSendEmailLoader(el).done(function() {
									apiErrorNotification.classList.add('display-none');
									resendEmailNotification.classList.remove('display-none');
									$("#captchaWrapper, [data-target='#captchaWrapper']").removeClass('is-active');
									var $resendEmailInput = $('#emailInput');
									$resendEmailInput.val('');
									$resendEmailInput.parent().removeClass('form__group-element--valid');
									$resendEmailInput.siblings('.form__icon--valid').addClass('hidden-important');
									if (document.getElementById('check-email-notification__email')) {
										document.getElementById('check-email-notification__email').innerHTML = requestData.email;
									}
									window.reCaptcha.reset();
									EE.main.hideSpinner($resendEmailBtn, true);
								});
								EE.Insights.generateInsights({
									event: 'ForgotPasswordEmailResend',
									notificationStatus: 'password-reset-email-sent-resend',
									event_email_verification: 'RESEND_EMAIL_VERIFICATION'
								});
							} else {
								var errorMessage = JSON.parse(response.responseText).message;
								var errorCode =  JSON.parse(response.responseText).code;
								if (errorMessage === 'invalid_captcha') {
									window.reCaptcha.reset();
									window.reCaptcha.triggerMessage(errorMessage, true);
								}
								if (errorCode === '01' || errorCode === '05' || errorCode === '100') {
									apiErrorNotification.classList.remove('display-none');
									resendEmailNotification.classList.add('display-none');
								}
								EE.Insights.generateInsights('RESEND_EMAIL_VERIFICATION_FAILED', {
									event_email_verification: ''
								});
								EE.main.hideSpinner($resendEmailBtn, true);
							}
						}
					});
				});
			});
		},

		newPassword: function() {
			$('#newPasswordForm').submit(function(event) {
				event.preventDefault();
				if (EE.EEIDvalidation.validateForm($('#newPasswordForm'))) {
					var stateName = $('#stateName').val();
					var $passwordInput = $('#new_password');
					var password = $passwordInput.val();
					var resetPwdKey = $('#resetPwdKey').val();
					var applyPwdKey = $('#applyPwdKey').val();
					var url;
					var completeCallBack;

					var data = {
						newPassword1: password,
						newPassword2: password
					};

					if (stateName === 'set-password') {
						data.applyPwdKey = applyPwdKey;
						url = EE.properties.setPasswordEndpoint;
						completeCallBack = setPasswordComplete;
					} else {
						data.resetPwdKey = resetPwdKey;
						url = EE.properties.passwordResetEndpoint;
						completeCallBack = resetPasswordComplete;
					}

					var formData = JSON.stringify(data);
					var newPasswordButton;
					var newPasswordCancelButton;
					if ($('#confirmChangePasswordBtn').length) {
						newPasswordButton = $('#confirmChangePasswordBtn');
						newPasswordCancelButton = document.getElementById('edit-password-cancel-link');
						disableCancelButton(newPasswordCancelButton);
					} else if ($('#save-password-button').length) {
						newPasswordButton = $('#save-password-button');
						newPasswordCancelButton = document.getElementById('password-reset__cancel');
						disableCancelButton(newPasswordCancelButton);
					}
					EE.main.showSpinner(newPasswordButton, true).done(function() {
						$.ajax({
							url: url,
							dataType: 'json',
							contentType: 'application/json',
							type: 'POST',
							data: formData,
							complete: completeCallBack
						});
					});
				}

				function disableCancelButton(cancelButton) {
					cancelButton.classList.add('disabled');
					cancelButton.style.pointerEvents = 'none';
					cancelButton.style.cursor = 'default';
				}

				function resetPage() {
					newPasswordCancelButton.classList.remove('disabled');
					newPasswordCancelButton.style.pointerEvents = 'auto';
					newPasswordCancelButton.style.cursor = 'pointer';
					EE.main.hideSpinner(newPasswordButton, true);
					disableCancelButton(newPasswordCancelButton);
					EE.main.resetPasswordCheck($('.pw-check'));
					$('#new_password').val('');
				}

				function setPasswordComplete(response) {
					if (response.status === 200) {
						window.location.href = settings.passwordResetSuccessfulUrl + '?setPassword';
					} else {
						resetPage();
						$('.eeid-error').removeClass('eeid-error--visible');
						$('.error-notification').hide();
						if (response && response.responseText) {
							var errorCode = JSON.parse(response.responseText).code;
							switch (errorCode) {
							case '01':
							case '61':
							case '100':
							case '23':
							case '24':
								$('#passwordSetWentWrong').fadeIn();
								break;
							case '103':
								$('#passwordSetLocked').fadeIn();
								break;
							case '05':
							case '68':
								$('#passwordSetBadContent').fadeIn();
								break;
							case '60':
								$('#passwordSetAccountNotFound').fadeIn();
								break;
							case '106':
								$('#passwordFormatInvalid').fadeIn();
								break;
							default:
								$('#passwordSetWentWrong').fadeIn();
								break;
							}
						}
					}
				}

				function resetPasswordComplete(response) {
					var errorCode = response.responseText ? JSON.parse(response.responseText).code : null;

					hideNotifications();

					switch (response.status) {
					case 200:
						handle200Errors();
						break;
					case 400:
						handle400Errors();
						break;
					case 401:
						handle401Errors();
						break;
					case 500:
						handle500Errors();
						break;
					default:
						handle500Errors();
						break;
					}

					function handle200Errors() {
						EE.Insights.generateInsights('PASSWORD_RESET_SUCCESS', {
							event_email_verification: ''
						});
						$('.container--small').hide();
						$('.preloader').show();
						setTimeout(function() {
							window.location.href = settings.passwordResetSuccessfulUrl + '?newPassword';
						}, EE.properties.resetPasswordAsyncDelay);
					}

					function handle400Errors() {
						resetPage();
						$('.page-body-info').hide();

						switch (errorCode) {
						case '24':
							$('#validPasswordError').fadeIn();
							break;
						case '100':
							window.location.href = settings.resendEmailUrl + '?error=expiredPwdKey';
							break;
						case '101':
							$('#duplicatedPasswordError').fadeIn();
							EE.Insights.generateInsights('FORGOTTEN_PASSWORD_EXISTING_MATCH', {
								event_password: 'FORGOTTEN_PASSWORD_EXISTING_MATCH',
								error: 'forgotten_password_password_previously_used',
								notificationStatus: 'forgotten_password_password_previously_used',
								event_email_verification: ''
							});
							break;
						case '106':
							$('#securePasswordError').fadeIn();
							break;
						default:
							break;
						}
					}

					function handle401Errors() {
						EE.Insights.generateInsights('PASSWORD_RESET_FAILURE', {
							event_email_verification: ''
						});
						resetPage();
						switch (errorCode) {
						case '102':
						case '103':
							$('#contentWrapper').hide();
							$('#userblockErrorNotification').fadeIn();
							break;
						default:
							break;
						}
					}

					function handle500Errors() {
						resetPage();
						$('#somethingsWrong').fadeIn();
					}


					function hideNotifications() {
						$('#passwordSetWentWrong').hide();
						$('#duplicatedPasswordError').hide();
						$('#userblockErrorNotification').hide();
						$('#validPasswordError').hide();
						$('#securePasswordError').hide();
						$('#passwordFormatInvalid').hide();
						$('#somethingsWrong').hide();
						$('#passwordSetLocked').hide();
						$('#passwordSetBadContent').hide();
						$('#passwordSetAccountNotFound').hide();
					}
				}
			});
		}
	};

	EE.passwordResetflow.newPassword();
	EE.passwordResetflow.pageInit();
	EE.passwordResetflow.resendEmail();
})($, window, EE);
