/*
Keep Alive prompt script which is displayed to indicate user will be logged out in 30 secs.

It is updated version of eeid-keepalive.js CPCI Phase2.
This script works in parallel with Session Management CPCI Phase 3.

Links:
- CPCI - Keep session alive integration - https://wiki.intdigital.ee.co.uk/pages/viewpage.action?pageId=35915418
- CPCI Session Management Detail - https://wiki.intdigital.ee.co.uk/pages/viewpage.action?spaceKey=DEV&title=CPCI+Session+Management+Detail
- OIDC session management specification - http://openid.net/specs/openid-connect-session-1_0.html
- CPCI - Session Management integration - https://wiki.intdigital.ee.co.uk/pages/viewpage.action?spaceKey=CP&title=CPCI+-+Session+Management+integration
- RP-session-state - https://wiki.intdigital.ee.co.uk/display/AT/RP-session-state
- Session Status Check - OP_iFrame - Mediation - https://wiki.intdigital.ee.co.uk/display/AT/Session+Status+Check+-+OP_iFrame+-+Mediation
*/

window.EE = window.EE || {};

(function($, window, EE) {
	'use strict';

	var lastActivityField = window.location.origin.slice(8) + '-eeIdLastActivity';

	if (window.EESSOSignIn === 'false' || !hasLocalStorage()) {
		return;
	}

	EE.properties = EE.properties || {};
	EE.keepAlive = EE.keepAlive || {};

	/* reset timeout for login/registration pages(for eeid platform only) */
	window.localStorage.removeItem('eeidLastActiveDate');

	var modalCountdown = 30;
	var	$ksaModal;
	var	$ksaModalLogoutForm;
	var	$ksaModalRevokeForm;
	var	tickerId;
	var	pageAccessDelay = 870000;
	var	isModalOpened = false;
	var	notifierKey = 'eeidStayLoggedInNotifier';
	var	$document = $(document);

	getModalMarkUp();

	function getModalMarkUp() {
		$.ajax({
			type: 'GET',
			// TODO: get this endpoint from server config
			url: EE.keepAlive.originUrl + '/keepalive',
			encode: true,
			success: function(response) {
				setUpMarkup(response);
				setUpTimers();
				startTrackUserActivity();
				preventTab();
				addListener();
			},
			error: function() {
				window.localStorage.removeItem(lastActivityField);
			}
		});
	}

	function findHighestZIndex(elem) {
		var elems = document.getElementsByTagName(elem);
		var highest = Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
		for (var i = 0; i < elems.length; i++)  {
			var zindex = Number.parseInt(
				document.defaultView.getComputedStyle(elems[i], null).getPropertyValue('z-index'),
				10
				);
			if (zindex > highest)    {
				highest = zindex;
			}
		}
		return highest;
	}

	/**
	 *  Event handler for local storage.
	 *  Subscribe to changes when user clicks stay login button in another tab
	 *  to hide keepAliveModal in current tab
	 *  @returns {void}
	 */
	function addListener() {
		window.addEventListener('storage', receiveMessage);
	}

	function receiveMessage(event) {
		if (event.key === notifierKey) {
			hideKeepAliveModal();
		}
	}

	function hasLocalStorage() {
		var test = 'testLocalStorage';
		try {
			window.localStorage.setItem(test, test);
			window.localStorage.removeItem(test);
			return true;
		} catch (e) {
			return false;
		}
	}

	function preventTab() {
		var isShiftPress;
		var	$buttons = $('#ksaKeepLoggedIn, #ksaLogOut');

		$buttons
			.on('keydown', handleKeyDown)
			.on('keyup', handleKeyUp);

		function handleKeyDown(event) {
			if (event.shiftKey) {
				isShiftPress = true;
			}
			if (event.keyCode === 9 || isShiftPress && event.keyCode === 9) {
				event.preventDefault();
				switch (event.target.id) {
				case 'ksaKeepLoggedIn':
					$('#ksaLogOut').focus();
					break;
				case 'ksaLogOut':
					$('#ksaKeepLoggedIn').focus();
					break;
				default:
					return;
				}
			}
		}

		function handleKeyUp(event) {
			if (event.shiftKey) {
				isShiftPress = false;
			}
		}
	}

	function setUpMarkup(response) {
		$('body').append($(response));
		$ksaModal = $('#IMFEKeepAliveModal');
		$ksaModalLogoutForm = $('#ksaModalLogoutForm');
		$ksaModalRevokeForm = $('#ksaModalRevokeForm');
		$ksaModalLogoutForm.attr('action', EE.keepAlive.endpointLogOut);
		$ksaModalRevokeForm.attr('action', EE.keepAlive.endpointTimeout);
		pageAccessDelay = +EE.keepAlive.tFt || +$ksaModal.data('pageAccessDelay') - 30000;
	}

	/**
	 *  If EESSOSignIn is set to true,
	 *  the JS sets a watch to check user activity,
	 *  @returns {void}
	 */
	function setUpTimers() {
		window.localStorage[lastActivityField] = new Date();
		setInterval(checkLastActivity, 1000);
	}

	function startTrackUserActivity() {
		$('body').on('mousemove keydown blur focus touchstart click', updateUserLastActivity);
		$document.on('click keydown', '#ksaLogOut', logoutUser);
		$document.on('click keydown', '#ksaKeepLoggedIn', onKeepLoggedInClick);
	}

	/**
	 * Check if user had activity within page access delay period
	 * @returns {void}
	 */
	function checkLastActivity() {
		var now = new Date();
		var lastActivity = new Date(window.localStorage[lastActivityField]);

		if (now - lastActivity >= +pageAccessDelay && !isModalOpened) {
			showKeepAliveModal();
		}
	}

	function updateUserLastActivity() {
		window.localStorage[lastActivityField] = new Date();
	}

	/**
	 * show KeepAliveModal and update modal ticker
	 * @returns {void}
	 */
	function showKeepAliveModal() {
		var zIndex = findHighestZIndex('div') + 10;
		$ksaModal.css('z-index', zIndex);
		$ksaModal.css('display', 'flex').fadeIn(function() {
			$('#ksaKeepLoggedIn').focus();
		});

		$document.trigger('eeid:SHOW_KEEP_ALIVE_PROMPT');

		isModalOpened = true;
		ticker();
	}

	/**
	 * hide KeepAliveModal and reset ticker
	 * @returns {void}
	 */
	function hideKeepAliveModal() {
		$ksaModal.fadeOut(function() {
			isModalOpened = false;
			clearInterval(tickerId);
			$('#ksaCounter').text(modalCountdown);
		});
	}

	/**
	 * Click handler for keepMeLogin  button.
	 * Hide KeepAliveModal and reset modal ticker
	 * @param {object} event Event object
	 * @returns {void}
	 */
	function onKeepLoggedInClick(event) {
		if (event.keyCode && event.keyCode !== 13) {
			return;
		}
		event.preventDefault();
		hideKeepAliveModal();
		notifyOtherTabs();
	}

	/**
	 * Notify the same origin tabs to hide KeepAliveModal
	 * @returns {void}
	 */
	function notifyOtherTabs() {
		window.localStorage.setItem(notifierKey, '');
		window.localStorage.removeItem(notifierKey);
	}

	/**
	 * Countdown in milliseconds in keep session active modal,
	 * default timer sit in @countdown
	 * @returns {void}
	 */
	function ticker() {
		var startDate = new Date();
		var	counter;
		var	$ksaCounter = $('#ksaCounter');

		tickerId = setInterval(function() {
			var now = new Date();

			counter = modalCountdown - Math.round((now - startDate) / 1000);

			if (counter <= 0) {
				clearInterval(tickerId);
				revokeUserSession();
				$ksaCounter.text('0');
			} else {
				$ksaCounter.text(counter);
			}
		}, 1000);
	}

	/**
	 * logged out of all sessions (i.e. the local channel and the Auth Layer),
	 * and are taken to the Log In page
	 * @param {object} event Event object
	 * @returns {void}
	 */
	function logoutUser(event) {
		if (event && event.keyCode && event.keyCode !== 13) {
			return;
		}

		$document.trigger('eeid:SUCCESS_LOGOUT');
		$ksaModalLogoutForm.submit();
	}

	/**
	 * logged out of the local channel only
	 * @returns {void}
	 */
	function revokeUserSession() {
		$document.trigger('eeid:REVOKE_USER_SESSION');
		$ksaModalRevokeForm.submit();
	}
})(jQuery, window, EE);
