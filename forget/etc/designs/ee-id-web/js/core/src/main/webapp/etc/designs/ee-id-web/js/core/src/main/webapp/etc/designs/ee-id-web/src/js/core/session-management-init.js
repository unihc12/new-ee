/*
Session Management init script

Links:
- CPCI Session Management Detail - https://wiki.intdigital.ee.co.uk/pages/viewpage.action?spaceKey=DEV&title=CPCI+Session+Management+Detail
- OIDC session management specification - http://openid.net/specs/openid-connect-session-1_0.html
- CPCI - Session Management integration - https://wiki.intdigital.ee.co.uk/pages/viewpage.action?spaceKey=CP&title=CPCI+-+Session+Management+integration
- RP-session-state - https://wiki.intdigital.ee.co.uk/display/AT/RP-session-state
- Session Status Check - OP_iFrame - Mediation - https://wiki.intdigital.ee.co.uk/display/AT/Session+Status+Check+-+OP_iFrame+-+Mediation
*/

(function() {
	if (EE && EE.editMode) {
		return;
	}

	(function(window, document, tagName, config) {
		var iframeStyle = 'width: 0; height: 0; position: absolute; visibility: hidden;';

		if (config.init === 'true') {
			prepareFrameOP();
		}

		function prepareFrameOP() {
			var iframe = document.createElement(tagName);
			iframe.src = config.opIframeUrl;
			iframe.id = 'opIframe';
			iframe.style.cssText = iframeStyle;
			document.body.appendChild(iframe);

			var OPiframe = document.getElementById('opIframe');
			OPiframe.onload = function() {
				prepareFrameRP();
			};
		}

		function prepareFrameRP() {
			var iframe = document.createElement(tagName);
			iframe.src = config.rpIframeUrl;
			iframe.id = 'rpIframe';
			iframe.style.cssText = iframeStyle;
			document.body.appendChild(iframe);
		}
	})(window, document, 'iframe', EE.sessionManagement);
})();
