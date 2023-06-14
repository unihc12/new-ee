
/* validation service */

window.EE = window.EE || {};

var EEIDvalidation = (function($, EE) {
	'use strict';

	var validationInstance;
	var validatorState = {
		isValidated: false
	};

	var _settings = {
		form: '[data-validation-eeidform]',
		field: '[data-validation-field]',
		input: '[data-validation]',
		error: '[data-validation-error-{{ruleName}}]'
	};

	var validationClasses = {
		invalid: 'form__group-element--error',
		valid: 'form__group-element--valid',
		animated: 'eeid-error--animated'
	};

	/**
	 * All validation rules, new rules can be added here
	 * @type {{email: email, name: name, sameValues: sameValues, required: required, repeatPassword: repeatPassword}}
	 * @private
	 */
	var _validator = {
		base: function($element, regExp) {
			$element.val($element.val().replace(/[\u2019]/g, '\'').trim());
			return $element.val().match(regExp);
		},
		email: function($element) {
			if ($element.val()) return this.base($element, EE.properties.emailValidationPattern || /^([a-zA-Z0-9!$%&'*+=?_`{|}~-]+(?:\.[a-zA-Z0-9!$%&'*=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/);
			return true;
		},
		password: function($element) {
			if ($element.val()) return this.base($element, EE.properties.passwordValidationPattern || /^(?=[A-Za-z\d!"£$%^&*()<>?{}\[\]:;'#:@~¬`<>\/\\|\.\-=_,+]{8,30}$)(?=.*?\d)(?=.*?[A-Z])(?=.*?[a-z]).*/);
			return true;
		},
		name: function($element) {
			if ($element.val()) return this.base($element, EE.properties.nameValidationPattern || /^[a-zA-Z\'\-\ ]{2,64}$/);
			return true;
		},
		contactNumber: function($element) {
			if ($element.val()) return this.base($element, EE.properties.contactNumberValidationPattern);
			return true;
		},
		otp: function($element) {
			if ($element.val()) return this.base($element, new RegExp('^[0-9]{' + EE.properties.otpLengthRange + '}$'));
			return true;
		},
		minlength: function($element, minLength) {
			if ($element.val()) return $element.val().length >= minLength;
			return true;
		},
		sameValues: function($element, comparedElemId) {
			if ($element.val()) {
				return $element.val().toLowerCase() !== (
					$('#' + comparedElemId).val().toLowerCase() || $('#' + comparedElemId).html().toLowerCase()
				);
			}
			return true;
		},
		samePassword: function($element, comparedElemId) {
			if ($element.val()) return $element.val() !== $('#' + comparedElemId).val();
			return true;
		},
		repeatPassword: function($element, comparedElemId) {
			if ($element.val()) return $element.val() === $('#' + comparedElemId).val();
			return true;
		},
		legacyDomains: function($element) {
			var legacyDomains = EE.properties.legacyEmailDomains.split(',');
			var emailDomain = $element.val().split('@')[1];
			if ($element.val()) return legacyDomains.indexOf(emailDomain) === -1;
			return true;
		},
		required: function($element) {
			$element.val($element.val().trim());
			return $element.val();
		}
	};

	var _eventsHandler = {
		onfocusout: function(event, $element) {
			if (!validatorState.isValidated) {
				if (!$element.val()) {
					setAsValid($element);
				} else {
					validateElement($element, true);
				}
			}
		},
		onsubmit: function(event, $element) {
			if (!validateForm($element, true)) {
				event.preventDefault();
			}
		}
	};

	function init() {
		var initMethods = {
			delegate: function(event) {
				var eventType = 'on' + event.type;

				if (_eventsHandler[eventType]) {
					_eventsHandler[eventType](event, $(this));
				}
			},
			setUpForms: function() {
				var $forms = $(_settings.form);
				var that = this;
				$forms.each(function() {
					var $form = $(this);

					$form.attr('novalidate', 'novalidate');

					if (!EE.editMode) {
						$form
							.on('focusin.validate focusout.validate keyup.validate',
								':text, [type="password"], [type="file"], select, textarea, [type="number"], [type="search"], ' +
								'[type="tel"], [type="url"], [type="email"], [type="datetime"], [type="date"], [type="month"], ' +
								'[type="week"], [type="time"], [type="datetime-local"], [type="range"], [type="color"], ' +
								'[type="radio"], [type="checkbox"], [contenteditable], [type="button"]', that.delegate)

							// Support: Chrome, oldIE
							// "select" is provided as event.target when clicking a option
							.on('click.validate', 'select, option, [type="radio"], [type="checkbox"]', that.delegate)
							.on('submit', that.delegate);
					}
				});
				return {};
			}
		};

		return initMethods.setUpForms();
	}

	/**
	 *
	 * @param {object} $element - input jQuery object
	 * @param {boolean} showErrors - show validation errors on web page can be true or false
	 * @returns {number} - amount of errors in single input
	 */
	function validateElement($element, showErrors) {
		var state = {
			errorsCount: 0,
			validityObj: {},
			element: $element
		};
		if (state.element.length) {
			var rules = state.element.data('validation');
			if (!rules) {
				return state.errorsCount;
			}
			if (state.element.val() === '' && rules.indexOf('required') === -1) {
				return state.errorsCount;
			}
			var rulesArr = rules.split(',');
			for (var i = 0; i < rulesArr.length; i++) {
				var rule = rulesArr[i].split('=')[0];
				var args = rulesArr[i].split('=')[1];
				state = upDateValidateElementState(state, rule, args);
			}

			if (showErrors) {
				toggleInputErrors(state);
			}
		}
		return state.errorsCount;
	}

	/**
	 * Checks whether an element is valid or not based on the errorCount returned from
	 * validateElement($element, showErrors)
	 * @param {object} $element - input field to validate
	 * @returns {boolean} true if the errorsCount eqauls to 0
	 */
	function isValidElement($element) {
		return validateElement($element, false) === 0;
	}

	function upDateValidateElementState(state, rule, args) {
		var newState = $.extend( {}, state );
		if (!_validator[rule]) {
			newState.validityObj[rule] = true;
		} else {
			var validatorRes = _validator[rule](newState.element, args);
			if (!validatorRes) {
				newState.errorsCount++;
			}
			newState.validityObj[rule] = validatorRes;
		}
		return newState;
	}

	/**
	 *  Set input to valid state
	 * @param {object} $element - input field to validate
	 * @returns {void}
	 */
	function setAsValid($element) {
		var dataValidation = $element.data('validation');
		if ($element.length && dataValidation) {
			var rules = dataValidation.split(',');
			for (var i = 0; i < rules.length; i++) {
				var rule = rules[i].split('=')[0];
				_hideErrorsForField($element, rule, false);
			}
		}
	}

	function setAsInvalid($element, ruleName) {
		_showErrorsForField($element, ruleName);
		$element.focus();
	}

	/**
	 * @param {object} state - all rules for single input with validated state
	 * @returns {void}
	 */
	function toggleInputErrors(state) {
		var validityArray = sortObjectByValues(state.validityObj);

		for (var i = 0; i < validityArray.length; i++) {
			if (validityArray[i].value) {
				_hideErrorsForField(state.element, validityArray[i].key, state.errorsCount);
			}
		}
		for (var j = 0; j < validityArray.length; j++) {
			if (!validityArray[j].value) {
				_showErrorsForField(state.element, validityArray[j].key);
				break;
			}
		}
	}

	/**
	 * Sort object by values: first true values, then false values
	 * Helper to sort validation state to avoid issue about displaying of multiple errors
	 * @param {Object} param - object to sort
	 * @returns {Array} - array, each item represents passed object key/value pair
	 */
	function sortObjectByValues(param) {
		var obj = $.extend({}, param);
		var arr = [];
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				arr.push({
					'key': prop,
					'value': obj[prop]
				});
			}
		}
		return arr.sort(function(a) {
			return !a.value;
		});
	}

	/**
	 * Helper to get input data validation attribute
	 * @param {string} ruleName - rule for validation, was defined in element attribute
	 * @returns {string} - selector for appropriate [data-validation-error-...] element with error
	 */
	function fieldAttrName(ruleName) {
		return _settings.error.replace('{{ruleName}}', ruleName);
	}

	function _showErrorsForField($element, ruleName) {
		var $field = $element.closest(_settings.field);
		var $errorMsq = $field.find(fieldAttrName(ruleName));

		markFieldAsInvalid($field);
		$errorMsq.show()
			.removeClass(validationClasses.animated)
			.removeClass('hidden-important');
		triggerInvalidFieldEvent($element);
	}

	function _hideErrorsForField($element, ruleName, errorsCount) {
		var $field = $element.closest(_settings.field);
		var $errorMsq = $field.find(fieldAttrName(ruleName));

		$errorMsq.removeClass(validationClasses.animated);

		markFieldAsValid($field, errorsCount);

		$errorMsq.addClass(validationClasses.animated)
			.addClass('hidden-important');
	}

	function markFieldAsValid($field, errorsCount) {
		var $errorIcon = $field.find($('.form__icon--error'));
		var $validIcon = $field.find($('.form__icon--valid'));
		var $input = $field.find('input');

		if ($input.val() !== '' && !errorsCount && $input.attr('id') !== 'captcha_challenge_field') {
			toggleIcon($validIcon, 'show');
		} else {
			toggleIcon($validIcon, 'hide');
		}

		toggleIcon($errorIcon, 'hide');
		$field.addClass(validationClasses.valid);
		$field.removeClass(validationClasses.invalid);
	}

	function markFieldAsInvalid($field) {
		var $errorIcon = $field.find($('.form__icon--error'));
		var $validIcon = $field.find($('.form__icon--valid'));

		toggleIcon($validIcon, 'hide');
		toggleIcon($errorIcon, 'show');
		$field.removeClass(validationClasses.valid);
		$field.addClass(validationClasses.invalid);
	}

	function toggleIcon($icon, $showHide) {
		if ($showHide === 'show') {
			$icon.removeClass('hidden-important');
		} else {
			$icon.addClass('hidden-important');
		}
	}

	function _scrollToFirstErrorAndFocus(input) {
		if (input.length) {
			if (window.isFlex) {
				input.focus();
				EE.main.scrollToElement(input.closest(_settings.field), 50);
			} else {
				EE.main.scrollToElement(input.closest(_settings.field))
					.done(function() {
						input.focus();
					});
			}
		}
	}

	function triggerInvalidFieldEvent($element) {
		var $elementId = $element[0].id;
		$(document).trigger('eeid:INVALID_FIELD_' + $elementId);
	}

	/**
	 *
	 * @param {object} $form - jQuery obj
	 * @param {boolean} showErrors - show errors on web page after validation
	 * @returns {boolean} - has error or not
	 */
	function validateForm($form, showErrors) {
		validatorState.isValidated = true;
		var inputs = $form.find(_settings.input);
		var errorsCount = 0;
		var firstErrorElement = null;
		inputs.each(function() {
			var errors = validateElement($(this), showErrors);
			if (errors && !firstErrorElement) {
				firstErrorElement = $(this);
			}
			errorsCount += errors;
		});
		var reCaptcha = window.reCaptcha;
		var grecaptcha = window.grecaptcha;
		var $captcha = $form.find('#g-recaptcha-response')[0];
		if ($captcha) {
			var response = grecaptcha.getResponse();
			if (!response.length) {
				reCaptcha.triggerMessage('required', true);
				errorsCount += 1;
				var currentCaptcha = reCaptcha.element;
				if (currentCaptcha && !firstErrorElement) {
					currentCaptcha.setAttribute('tabindex', 0);
					currentCaptcha.setAttribute('aria-labelledby', 'recaptchaError');
					currentCaptcha.setAttribute('role', 'group');
					document.getElementById('recaptchaError').removeAttribute('role', 'alert');
					firstErrorElement = $('#g-recaptcha');
				}
			}
		}

		if (errorsCount && firstErrorElement) {
			_scrollToFirstErrorAndFocus(firstErrorElement);
		}
		validatorState.isValidated = false;

		return !errorsCount;
	}


	return {
		init: function() {
			if (!validationInstance) {
				validationInstance = init();
			}
			return validationInstance;
		},
		isValidElement: isValidElement,
		validateElement: validateElement,
		validateForm: validateForm,
		setAsValid: setAsValid,
		setAsInvalid: setAsInvalid,
		scrollAndFocus: _scrollToFirstErrorAndFocus
	};
})(window.jQuery, window.EE);

module.exports = EEIDvalidation;
