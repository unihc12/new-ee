/* eeid ui-helper */

(function($, window, EE) {
	'use strict';

	var $document = $(document);

	// fox for NO TRANSPORT ERROR for IE9
	$.support.cors = true;

	EE.main = {
		makeStickyFooter: function() {
			var $main = $('main');
			var meganavHeight;
			var footerHeight;

			setMainHeight();

			$(window).on('resize', EE.Utils.throttle(setMainHeight, 1000));

			function setMainHeight() {
				var mainHeight;

				meganavHeight = $('header').outerHeight(true);
				footerHeight = $('footer').outerHeight(true);

				mainHeight = 'calc(100vh - ' + (meganavHeight + footerHeight) + 'px)';
				$main.css('min-height', mainHeight);
			}
		},

		makeStickyTabs: function() {
			var $tabs = $('.eeid-header-tabs');
			var $tabsHolder = $('.eeid-header-tabs-holder');
			var fixedTab = 'eeid-header-tabs--fixed';
			var topOfTabs;

			function setTabsHolderHeight() {
				var tabsHolderHeight = $tabs.outerHeight(true);
				$tabsHolder.css('min-height', tabsHolderHeight);
			}
			function setTopOfTabs() {
				topOfTabs = $tabsHolder.offset().top;
			}
			function toggleStickyTabs() {
				if (window.scrollY >= topOfTabs) {
					$tabs.addClass(fixedTab);
				} else {
					$tabs.removeClass(fixedTab);
				}
			}
			if ($tabs.length) {
				setTopOfTabs();
				setTabsHolderHeight();
				$(document).on('scroll', toggleStickyTabs);
				$(window).on('resize', function() {
					EE.Utils.throttle(setTabsHolderHeight, 500)();
					EE.Utils.throttle(setTopOfTabs, 500)();
				});
			}
		},

		addChevronToLinks: function() {
			if (EE.editMode) {
				return;
			}
			$('.eeid-js-arrow').each(function() {
				var $this = $(this);

				// check for inner html tags
				if ($this.html().match(/<.*?>/g)) {
					return;
				}

				var text = $this.text().trim();
				var wordArr = text.split(' ');
				var lastWord;

				lastWord = wordArr.pop();
				var textToReturn = wordArr.join(' ');

				$this.html(
					textToReturn + "<span class='no-wrap'>" + ' ' + lastWord + "<span class='eeid-js-arrow__chevron'>></span></span>"
				);
			});
		},

		toggleCollapse: function($link) {
			var activeClassName = 'is-active';
			var $target = getTargetFromTrigger($link);

			if (!$link.hasClass(activeClassName)) {
				this.scrollToElement($link, 5);
				$(document).trigger('eeid-collapse-opened');
			} else {
				$(document).trigger('eeid-collapse-closed');
			}

			$link.toggleClass(activeClassName);
			$target.toggleClass(activeClassName);

			function getTargetFromTrigger($trigger) {
				return $($trigger.attr('data-target'));
			}
		},

		collapse: function() {
			var self = this;

			$document.on('click', '[data-toggle="collapse"]', function(e) {
				e.preventDefault();
				self.toggleCollapse($(this));
			});
		},

		toggleContent: function() {
			$document.on('click', '[data-toggle="content"]', function(e) {
				e.preventDefault();
				$document.trigger('eeid:toggle-content');
				$($(this).attr('data-target')).toggle();
			});
		},
		isValidPassword: function(e) {
			var $input = $(e.target);
			var password = $input.val();
			var passwordLowerCase = password.toLowerCase();
			var email = $('[data-pw-check-email]').val();
			var emailLowerCase;

			if (email) {
				emailLowerCase = email.toLowerCase();
			}

			var length = password.length >= 8 && password.length <= 30;
			var containsDigit = /[0-9]/.test(password);
			var containsUpper = /[A-Z]/.test(password);
			var containsLower = /[a-z]/.test(password);
			var containsSpace = /[\s]/.test(password);
			var eqToEmail = emailLowerCase && passwordLowerCase === emailLowerCase;

			var pwCheck = [
				{
					test: length,
					elemId: '#pw-length'
				},
				{
					test: containsDigit,
					elemId: '#pw-digit'
				},
				{
					test: containsUpper,
					elemId: '#pw-upper'
				},
				{
					test: containsLower,
					elemId: '#pw-lower'
				},
				{
					test: !containsSpace,
					elemId: '#pw-space'
				},
				{
					test: !eqToEmail,
					elemId: '#pw-eqToEmail'
				}
			];

			pwCheck.forEach(function(item) {
				if (item.test) {
					$(item.elemId).addClass('form__tooltip-valid');
				} else {
					$(item.elemId).removeClass('form__tooltip-valid');
				}
			});
		},

		StrengthOMeter: function($password) {
			this.strengthId = 'strength' + $password.attr('id');
			this.validationRules = $password.data('validation');
			this.defaultText = 'No password yet';
			this.skipExtraPoints = !!$password.data('skip-extra-points');
			this.length = 0;
			this.wasInvalid = false;
			// eslint-disable-next-line no-undefined
			this.messageDelay = $password.data('edits-delay') !== undefined ? $password.data('edits-delay') : 3;
			this.reset = function() {
				var root = this;
				var $element = root.element;
				$element.val('');
				root.length = 0;
				root.renderMeter(false, '', 0, 0, [], false);
				root.wasInvalid = false;
				window.EE.EEIDvalidation.setAsValid($element);
			};
			this.validation = this.validationRules ? this.validationRules.split(',').reduce(function(acc, item) {
				var keyValue = item.split('=');
				acc[keyValue[0]] = keyValue[1] || true;
				return acc;
			}, {}) : {};
			this.filterCriteria = function(criteria) {
				var root = this;
				return criteria.filter(function(criterium) {
					return root.validation[criterium.rule];
				});
			};
			this.comparingCriteria = this.filterCriteria([{
				rule: 'sameValues',
				match: false,
				message: 'Can\'t use your email here',
				elemId: 'pw-eqToEmail',
				minLength: 0
			}, {
				rule: 'samePassword',
				match: false,
				message: 'You\'ve used this password before',
				elemId: 'pw-eqToPassword',
				minLength: 0
			}, {
				rule: 'repeatPassword',
				match: true,
				message: 'Your passwords don\'t match',
				elemId: 'pw-eqRepeatPassword',
				minLength: 7
			}]);
			this.renderMeterLayout = function(isActive, passwordVal, percentageComplete, averageSwitch) {
				var root = this;
				var poorPassword = root.length <= 4 ? 'Keep going' : 'Nearly there';
				if (!isActive) {
					return {
						text: root.defaultText,
						class: null
					};
				} if (isActive && passwordVal === '') {
					return {
						text: root.skipExtraPoints ? poorPassword : 'Poor password',
						class: (root.skipExtraPoints && !root.wasInvalid) ? '' : 'poor'
					};
				} else if (percentageComplete >= 100
				) {
					return {
						text: 'Strong password: nice and secure',
						class: 'good'
					};
				} else if (percentageComplete >= averageSwitch && percentageComplete < 100) {
					return {
						text: 'Okay password: could be better',
						class: 'average'
					};
				}
				return {
					text: root.skipExtraPoints ? poorPassword : 'Poor password: easy to crack',
					class: 'poor'
				};
			};
			this.renderMeter = function(isActive, passwordVal, percentageComplete, averageSwitch, errors, hasFocus) {
				var root = this;
				var $strengthMeter = root.meterWrapper;
				var $strengthMeterDescr = $strengthMeter.find('.strengthValue').eq(0);
				var $strengthMeterValue = $strengthMeter.find('.strengthMeterValue').eq(0);
				$strengthMeter.removeClass('poor average good');
				var ariaLive = (percentageComplete > 0) ? 'polite' : 'off';
				var meter = root.renderMeterLayout(isActive, passwordVal, percentageComplete, averageSwitch);
				var meterClass = meter.class;
				var meterText = meter.text;

				if (meterClass) {
					$strengthMeter.addClass(meterClass);
					if (hasFocus && meterClass === 'poor') {
						$password.addClass('poorStrength');
					}
				}

				$strengthMeterDescr.text(meterText);
				$strengthMeterValue.css('width', percentageComplete + '%');
				$strengthMeter.attr('aria-live', ariaLive);
				var tipText = '';
				var nextTip = errors.filter(function(error) {
					return error.activeMessage;
				})[0];
				if (nextTip && isActive && hasFocus) {
					tipText = nextTip.message;
				}
				$strengthMeter.find('.tip').eq(0).text(tipText);
			};
			this.validate = function(event) {
				var root = this;
				var passwordValue = $password.val();
				var length = passwordValue.length;
				root.length = length;
				var length9 = length >= 9;
				var length10 = length >= 10;
				var extraPoints = root.skipExtraPoints ? [] : [{
					test: length9
				},
				{
					test: length10
				}];
				$password.removeClass('poorStrength');
				var comparingCriteria = root.comparingCriteria;
				var hasFocus = document.activeElement === $password.get(0);
				if (event.type === 'focus') {
					root.wasInvalid = $password.closest('.form__group-element--error').length !== 0;
				}
				var preventSetValid = root.skipExtraPoints && length === 0 && root.wasInvalid;
				if ((!event || (event.originalEvent && event.type !== 'blur')) && !preventSetValid) {
					window.EE.EEIDvalidation.setAsValid($password);
				}
				var passwordLowerCase = passwordValue.toLowerCase();
				var numberOfCriteria = 7 + extraPoints.length + comparingCriteria.length;
				var criteriaPoints = 100 / numberOfCriteria;
				var averageSwitch = criteriaPoints * (numberOfCriteria - extraPoints.length);
				var activateMeter = hasFocus || length > 0;
				var lengthGeneral = length >= 8 && length <= 30;
				var containsDigit = /[0-9]/.test(passwordValue);
				var containsUpper = /[A-Z]/.test(passwordValue);
				var containsLower = /[a-z]/.test(passwordValue);
				var containsSpace = /[\s]/.test(passwordValue);

				var characterLabel = (length === 7 || (length - 30) === 1) ? ' character' :  ' characters';
				var positiveCharacterLabel = 'At least ' + (8 - length) + ' more ' + characterLabel + ' to go';
				var negativeCharacterLabel = 'At least ' + (Math.abs(30 - length)) + ' less ' + characterLabel + ' to go';
				var increment = 1;
				function getDelay() {
					if (root.messageDelay === 'incremental') {
						var currentIncrement = increment;
						increment += 1;
						return length > currentIncrement;
					}
					return length > root.messageDelay;
				}

				function getLengthMessage(delay) {
					if ((!delay && length === 0) && !root.skipExtraPoints) {
						return 'Let\'s create a password';
					} else if (!delay) {
						return '';
					}
					return (length > 30) ? negativeCharacterLabel : positiveCharacterLabel;
				}

				var pwCheck = [];

				comparingCriteria.forEach(function(criteria) {
					pwCheck.push({
						test: (passwordLowerCase === criteria.element.val().toLowerCase()) === criteria.match,
						elemId: criteria.elemId,
						value: criteriaPoints,
						message: criteria.message,
						activePoints: length > criteria.minLength,
						activeMessage: length > criteria.minLength
					});
				});

				var pwCheckDefault = [
					{
						test: !containsSpace,
						elemId: 'pw-space',
						value: criteriaPoints,
						message: 'Let\'s lose the spaces in there',
						activePoints: length > 0,
						activeMessage: true
					},
					{
						test: containsUpper,
						elemId: 'pw-upper',
						value: criteriaPoints,
						message: 'Let\'s add an uppercase letter',
						activePoints: true,
						activeMessage: getDelay()
					},
					{
						test: containsLower,
						elemId: 'pw-lower',
						value: criteriaPoints,
						message: 'Let\'s add a lowercase letter',
						activePoints: true,
						activeMessage: getDelay()
					},
					{
						test: containsDigit,
						elemId: 'pw-digit',
						value: criteriaPoints,
						message: 'Needs a number in there',
						activePoints: true,
						activeMessage: getDelay()
					},
					{
						test: lengthGeneral,
						elemId: 'pw-length',
						message: getLengthMessage(getDelay()),
						activePoints: false,
						activeMessage: true
					}
				];

				pwCheck = pwCheck.concat(pwCheckDefault);

				extraPoints.forEach(function(criteria) {
					criteria.value = criteriaPoints;
				});

				var limitBonus = length > 8 ? 8 : length;
				var lengthBonus = (!activateMeter) ? 0 : limitBonus / 8;
				var percentageComplete = (length >= 8) ? criteriaPoints * 3 : criteriaPoints * 3 * lengthBonus;
				var errors = [];
				pwCheck.forEach(function(item) {
					if (item.test) {
						if (activateMeter && item.activePoints) {
							percentageComplete += item.value;
						}
					} else {
						errors.push(item);
					}
				});

				if (errors.length === 0) {
					extraPoints.forEach(function(item) {
						if (item.test) {
							percentageComplete += item.value;
						}
					});
				}

				root.renderMeter(activateMeter, $password.val(), percentageComplete, averageSwitch, errors, hasFocus);
			};
			this.revalidate = function(event) {
				this.validate(event);
				if ($password.val() !== '') {
					window.EE.EEIDvalidation.validateElement($password, true);
				}
			};
			this.init = function() {
				var root = this;
				var revalidate = root.revalidate;
				$password.attr('autocomplete', 'off');
				var $fieldContainer = $password.closest('.form__group-element');
				var getDestription = $fieldContainer.parent().find('.form__label_description');
				var $description = getDestription.length ? getDestription.eq(0) : null;
				var attrDescription = $password.attr('aria-describedby') || '';
				var defaultAriaDescription = $description ? $description.attr('id') : attrDescription;
				$password.attr('aria-describedby', defaultAriaDescription ? defaultAriaDescription + ' ' + root.strengthId : root.strengthId);
				$password.attr('maxlength', 30);
				$password.removeClass('js-tooltip-cta');
				$password.removeAttr('data-tooltip-id');
				root.meterWrapper = $('<div class="form__strengthMeter" id="' + root.strengthId + '"></div>');
				root.meterWrapper.css({overflow: 'hidden', height: 0, opacity: 0});
				var meterTips = $('<div class="tip"></div>');
				var meterContainer = $('<div></div>');
				var meterValue = $('<span class="strengthValue">' + root.defaultText + '</span>');
				var meterIndicator = $('<div class="strengthMeter"><div class="strengthMeterValue"></div></div>');
				meterContainer.append(meterTips).append(meterValue).append(meterIndicator);
				root.meterWrapper.append(meterContainer);
				$fieldContainer.append(root.meterWrapper);
				if ($description) {
					var contentHeight = $description.innerHeight();
					if (contentHeight && $description.is(':hidden')) {
						$description.css({overflow: 'hidden', height: 0, opacity: 0, display: 'block'});
						$description.animate({
							height: contentHeight,
							opacity: 1,
							easing: 'ease-in'
						}, 300, function() {
							$description.removeAttr('style');
							$description.show();
						});
						root.description = $description;
					}
				}

				root.meterWrapper.animate({
					height: meterContainer.innerHeight(),
					opacity: 1,
					easing: 'ease-in'
				}, 300, function() {
					root.meterWrapper.removeAttr('style');
				});

				if (EE.registrationflow) {
					// fix for the registration behaviour
					$document.off('focus', '[data-pw-check]', EE.registrationflow.showPasswordCheckPanel);
				}

				$password.on('input focus blur click', $.proxy(root.validate, this));
				var validation = root.validation;
				var comparingCriteria = root.comparingCriteria;

				comparingCriteria.forEach(function(criteria) {
					$('#' + validation[criteria.rule]).on('input', $.proxy(revalidate, root));
					criteria.element = $('#' + validation[criteria.rule]);
				});

				$password.init.prototype.validate = function() {
					$.proxy(root.validate, root);
				};
				$password.init.prototype.reset = function() {
					$(this).data('strengthMeter').reset();
				};
				root.element = $password;
			};

			this.destroy = function() {
				var root = this;
				var revalidate = root.revalidate;
				$password.removeAttr('data-strength-id');
				$password.removeAttr('aria-describedby');
				root.wasInvalid = false;
				$('#' + root.strengthId).remove();
				$password.off('input focus blur click', $.proxy(root.validate, this));
				var validation = root.validation;
				var comparingCriteria = root.comparingCriteria;
				window.EE.EEIDvalidation.setAsValid($password);
				$password.removeAttr('maxlength');
				if (root.description) {
					root.description.hide();
				}
				comparingCriteria.forEach(function(criteria) {
					$('#' + validation[criteria.rule]).off('input', $.proxy(revalidate, root));
				});
				$password.init.prototype.validate = function() {};
				$password.init.prototype.reset = function() {};
				$password.removeData('strengthMeter');
			};
		},
		createPasswordStrength: function() {
			var self = this;
			$('[data-pw-check]').each(function() {
				self.initPasswordStrength($(this));
			});
		},
		initPasswordStrength: function($element) {
			var self = this;
			if (!$element.data('strengthMeter')) {
				var strengthOMeter = new self.StrengthOMeter($element);
				strengthOMeter.init();
				$element.data('strengthMeter', strengthOMeter);
			}
		},
		destroyPasswordStrength: function($element) {
			if ($element.data('strengthMeter')) {
				$element.data('strengthMeter').destroy();
			}
		},
		validatePassword: function() {
			var self = this;
			$document.on('input focus', '[data-pw-check]', $.proxy(self.isValidPassword, this));
		},

		resetPasswordCheck: function() {
			$('[data-pw-check]').each(function() {
				if ($(this).data('strengthMeter')) {
					$(this).reset();
				}
			});
			$('.pw-check__list')
				.find('.pw-check__list__item')
				.each(function() {
					var $this = $(this);
					if (!$this.is('#pw-space')) {
						$this.removeClass('pw-check__list__item--valid');
					}
				});
		},

		showSendEmailLoader: function(el) {
			var dfd = $.Deferred(); // eslint-disable-line
			$('.' + el)
				.fadeOut()
				.promise()
				.done(animate);

			function animate() {
				$('.preloader--init')
					.fadeIn(100)
					.delay(800)
					.fadeOut(100)
					.promise()
					.done(preloadDone);
			}

			function preloadDone() {
				$('.preloader--done')
					.fadeIn()
					.delay(800)
					.fadeOut()
					.promise()
					.done(showNotification);
			}

			function showNotification() {
				$('.' + el).fadeIn(200);
				dfd.resolve();
			}

			return dfd.promise();
		},
		disableCTA: function($button) {
			$button.addClass('btn--expandable btn--expanded');
			$button.prop('disabled', true);
		},

		enableCTA: function($button) {
			$button.removeClass('btn--expandable btn--expanded');
			$button.prop('disabled', false);
		},
		showSpinner: function($button, addDelayAndDisabling) {
			var dfd;
			$button.addClass('btn--expandable btn--expanded');
			$button.append("<svg class='btn__spinner' viewBox='0 0 50 50'><circle class='btn__spinner-path' r='20' cy='25' cx='25'></circle></svg>");
			if (addDelayAndDisabling && $button) {
				$button.prop('disabled', true);
				dfd = $button.find('.btn__spinner').fadeIn()
					.delay(400)
					.promise();
			}
			return dfd;
		},

		hideSpinner: function($button, removeDisabling) {
			$button.removeClass('btn--expanded');
			$button.find('.btn__spinner').remove();
			if (removeDisabling && $button) {
				$button.prop('disabled', false);
			}
		},

		addSpinnerAndDisableBtnWhenSubmitForm: function($form, $button, skipValidation) {
			$form.on('submit', function(e) {
				e.preventDefault();
				if (skipValidation || EE.EEIDvalidation.validateForm($(e.currentTarget))) {
					EE.main.showSpinner($button, true).done(function() {
						$(e.currentTarget).off('submit').submit();
					});
				}
			});
		},

		addSpinnerAndDisableAllBtnsWhenSubmitForm: function($form, $button, skipValidation) {
			$form.on('submit', function(e) {
				e.preventDefault();
				if (skipValidation || EE.EEIDvalidation.validateForm($(e.currentTarget))) {
					EE.main.showSpinner($button, true).done(function() {
						$(e.currentTarget).off('submit').submit();
					});
					var inputs = document.getElementById($form[0].id).elements;
					for (var i = 0; i < inputs.length; i++) {
						if (inputs[i].id !== $button && (inputs[i].type === 'button' || inputs[i].type === 'a')) {
							$(inputs[i]).prop('disabled', true);
						}
					}
					var anchorTagsInForm = $form[0].getElementsByTagName('a');
					if (anchorTagsInForm) {
						for (var loopIndex = 0; loopIndex < anchorTagsInForm.length; loopIndex++) {
							anchorTagsInForm[loopIndex].classList.add('disabled');
							anchorTagsInForm[loopIndex].style.pointerEvents = 'none';
							anchorTagsInForm[loopIndex].style.cursor = 'default';
						}
					}
				}
			});
		},

		scrollToElement: function(el, indent) {
			var _indent = indent || 0;
			var dfd = $.Deferred(); // eslint-disable-line
			if (el[0]) {
				$('html, body').animate(
					{
						scrollTop: el.offset().top - _indent
					},
					300,
					function() {
						dfd.resolve();
					}
				);
			}

			return dfd;
		},

		scrollToFirstErrorField: function() {
			var $firstErrorField = $('.capture_error:first');
			if ($firstErrorField.length) {
				EE.main.scrollToElement($firstErrorField, $('.eeid-header-tabs').outerHeight(true));
				$firstErrorField.find('.form-control__field.eeid-input').focus();
			}
		},

		readErrorSummary: function(form) {
			var $summaryError = form.find('#summaryError');

			if (!$summaryError.length) {
				form.append('<div id="summaryError" role="alert"></div>');
				$summaryError = form.find('#summaryError');
			} else {
				$summaryError.hide();
			}

			$summaryError.html('');

			$('.eeid-error:visible').each(function() {
				$summaryError.append('<p>' + $(this).text() + '</p>');
			});

			$summaryError.show();
		},

		setLastActiveDate: function() {
			if (EE.Utils.hasLocalStorage()) {
				window.localStorage.eeidLastActiveDate = new Date();
			}
		},

		reloadCaptcha: function() {
			if (window.Captcha) {
				var $captchaInput = $('#captcha_response_field');
				$captchaInput.val('');
				Captcha.reload(); // jshint ignore:line
			}
		},


		inputTooltip: function() {
			var tooltips = $('[data-input-tooltip]');
			tooltips.each(function() {
				var $tooltip = $(this);
				var inputID = $tooltip.data('inputTooltip');
				var $input = $('#' + inputID);

				$input
					.on('focus', function() {
						$tooltip.show();
						$document.trigger('input_tooltip_show', [inputID]);
					})
					.on('blur', function() {
						$tooltip.hide();
						$document.trigger('input_tooltip_hide', [inputID]);
					});
			});
		},
		clearValidationForCurrentInput: function() {
			$('input').on('keypress', function() {
				var input = $(this);
				var formGroup = input.closest('.form__group-element');

				formGroup.removeClass('form__group-element--error');
				formGroup.find('.form__icon').addClass('hidden-important');

				if (input.attr('type') === 'password') {
					input.closest('.hideShowPassword-wrapper').siblings('.error').hide();
				} else if (input.attr('id') === 'captcha_response_field') {
					input.closest('.capture_form_item').removeClass('form__group-element--error');
					input.siblings('.error').hide();
				} else {
					input.siblings('.error').hide();
				}
			});
		},
		targetSetup: function() {
			var $main = $('#main');
			$main.addClass('testTarget');
		},
		targetToggle: function(feature, defaultFeature) {
			var self = this;
			var targetCallback;
			if (self.targetConfiguration && self.targetConfiguration[feature]) {
				targetCallback = self.targetConfiguration[feature];
			}
			if ((document.cookie.indexOf('testTarget') !== -1 || EE.properties.features[feature]) && targetCallback) {
				self.targetSetup();
				targetCallback();
			} else if (defaultFeature) {
				defaultFeature();
			}
		}
	};

	$document.ready(function() {
		EE.main.makeStickyFooter();
		EE.main.makeStickyTabs();
		EE.main.addChevronToLinks();
		EE.main.validatePassword();
		EE.main.collapse();
		EE.main.toggleContent();
		EE.main.inputTooltip();
		EE.main.clearValidationForCurrentInput();
	});
})(jQuery, window, EE);
