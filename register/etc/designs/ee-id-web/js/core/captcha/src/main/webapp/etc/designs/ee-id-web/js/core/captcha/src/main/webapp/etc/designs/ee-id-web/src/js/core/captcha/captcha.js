// TODO: move out Captcha from global scope
var Captcha = {
	baseUrl: 'http://127.0.0.1:8181/captcha/pub/',
	cookieName: 'captchaSessionCookieName',
	clientId: null,
	baseImageUrl: null,
	imageUrl: null,
	baseAudioUrl: null,
	audioUrl: null,
	baseAjaxUrl: null,
	ajaxUrl: null,
	id: null,
	challenge: '',
	question: '',
	theme: 'ouk',
	captchaType: 'image',
	divId: 'captcha_div',
	err: null,
	template: null,
	codeStyle: '',
	formStyle: '',
	isValidCaptcha: 'true',
	errorStyle: 'ee-form-message--hidden',
	content: '',
	captchaInitiallyReloaded: null,

	create: function(divId, theme, baseUrl, isValidCaptcha) {
		if (baseUrl !== null) {
			Captcha.baseUrl = baseUrl;
		}
		if (theme !== null) {
			Captcha.theme = theme;
		}
		if (divId !== null) {
			Captcha.divId = divId;
		}
		if (isValidCaptcha !== null) {
			Captcha.isValidCaptcha = isValidCaptcha;
		}

		Captcha.reset();
		Captcha.reload();
		this.captchaInitiallyReloaded = null;
	},
	getCookie: function() {
		var tC = document.cookie.split('; ');
		for (var i = tC.length - 1; i >= 0; i--) {
			var x = tC[i].split('=');
			if (Captcha.cookieName === x[0]) {
				return decodeURI(x[1]);
			}
		}
		return null;
	},
	setCookie: function() {
		document.cookie = Captcha.cookieName + '=' + encodeURI(Captcha.clientId);
	},
	getClientId: function() {
		if (Captcha.clientId !== null) {
			return Captcha.clientId;
		}
		var cookieId = Captcha.getCookie();
		if (cookieId !== null) {
			Captcha.clientId = cookieId;
		} else {
			Captcha.clientId = Math.random().toString(36).substr(2, 9);
			Captcha.setCookie();
		}
		return Captcha.clientId;
	},
	replaceHeadScript: function(name, script) {
		var docHead = document.getElementsByTagName('head')[0];
		var existingScript = document.getElementById(name);
		if (existingScript !== null) {
			docHead.removeChild(existingScript);
		}
		docHead.appendChild(script);
	},
	help: function() {
		var helpUrl = Captcha.baseUrl + 'help/theme/' + Captcha.theme;
		var helpStyle = 'width=460,height=460,location=no,menubar=no,status=no,toolbar=no,scrollbars=yes,resizable=yes';
		window.open(helpUrl, 'captchaHelp', helpStyle);
	},
	supportsHtml5Audio: function() {
		var audioTagSupport = !!(document.createElement('audio').canPlayType);
		return audioTagSupport;
	},
	createAudioDiv: function() {
		var imageDiv = document.getElementById('captchaContentColumn');
		if (imageDiv === null) {
			Captcha.err = 'oops, could not create audio';
			return;
		}
	},
	swapCaptchaType: function(event) {
		if (event) {
			event.preventDefault(); // prevent scrolling
		}
		if (Captcha.captchaType === null || (Captcha.captchaType !== 'image' && Captcha.captchaType !== 'audio')) {
			Captcha.captchaType = 'image';
		}
		if (Captcha.captchaType === 'image') {
			Captcha.captchaType = 'audio';
		} else {
			Captcha.captchaType = 'image';
		}
		Captcha.reset();
		Captcha.display();
	},
	reset: function() {
		Captcha.baseAjaxUrl = Captcha.baseUrl + 'captchaajax/theme/%theme%/cid/%cid%';
		Captcha.ajaxUrl = Captcha.baseAjaxUrl.replace('%theme%', Captcha.theme);
		Captcha.ajaxUrl = Captcha.ajaxUrl.replace('%cid%', Captcha.getClientId());

		var content;

		if (Captcha.isValidCaptcha === 'false') {
			Captcha.errorStyle = 'ee-form-message-';
			Captcha.formStyle = Captcha.formStyle + ' ee-form-field--invalid';
		}
		if (Captcha.isValidCaptcha === 'true') {
			Captcha.codeStyle = ' validated';
			Captcha.errorStyle = 'ee-form-message--hidden';
			Captcha.formStyle = '';
			Captcha.formStyle = '';
		}
		if (Captcha.captchaType === 'audio') {
			content = Captcha.getAudioCaptcha();
		} else {
			content = Captcha.getImageCaptcha();
		}

		var captchaChallengeField = document.getElementById('captcha_challenge_field');
		captchaChallengeField.value = Captcha.challenge;

		var captchaQuestionField = document.getElementById('captcha_question_field');
		captchaQuestionField.value = Captcha.question;

		var captchaThemeField = document.getElementById('captcha_theme');
		captchaThemeField.value = Captcha.theme;

		var captchaResponseField = document.getElementById('captcha_response_field');
		captchaResponseField.className += Captcha.codeStyle;

		var captchaFormSection = document.getElementById('captcha_form_section');
		captchaFormSection.className = Captcha.formStyle;

		var captchaEeFormMessage = document.getElementById('captcha_ee_form_message');
		if (captchaEeFormMessage !== null) {
			captchaEeFormMessage.className = Captcha.errorStyle;
		}

		var listenCodeLinkText = document.getElementById('listen_code_link_text');
		var viewCodeLinkText = document.getElementById('view_code_link_text');
		var captchaIcon = document.querySelector('#captcha_swap_type use');

		listenCodeLinkText.style.display = 'none';
		viewCodeLinkText.style.display = 'none';

		if (Captcha.captchaType === 'image') {
			listenCodeLinkText.style.display = '';
			captchaIcon.setAttribute('xlink:href', '#eei_headphones');
		} else {
			viewCodeLinkText.style.display = '';
			captchaIcon.setAttribute('xlink:href', '#eei_chevron_right');
		}

		Captcha.content = content;
	},
	getAudioCaptcha: function() {
		// We need to use appendChild instead of innerHTML for IE8
		Captcha.baseAudioUrl = Captcha.baseUrl + 'audiocaptcha/id/%id%/cid/%cid%';
		Captcha.audioUrl = Captcha.baseAudioUrl.replace('%id%', Captcha.id);
		Captcha.audioUrl = Captcha.audioUrl.replace('%cid%', Captcha.getClientId());

		var captchaAudioDiv = document.createElement('div');
		captchaAudioDiv.setAttribute('id', 'captchaAudioDiv');
		captchaAudioDiv.setAttribute('style', 'display:block;height:4.5em;width:auto;');

		var captchaAudioAudio = document.createElement('audio');
		captchaAudioAudio.setAttribute('controls', 'yes');
		captchaAudioAudio.setAttribute('id', 'captchaAudioControl');
		captchaAudioAudio.setAttribute('loop', 'loop');
		captchaAudioAudio.setAttribute('preload', 'auto');
		captchaAudioAudio.setAttribute('height', '4.5em');
		captchaAudioAudio.setAttribute('width', 'auto');

		var captchaAudioSource = document.createElement('source');
		captchaAudioSource.setAttribute('src', Captcha.audioUrl);
		captchaAudioSource.setAttribute('type', 'audio/wav');

		var captchaAudioA = document.createElement('a');
		captchaAudioA.setAttribute('href', Captcha.audioUrl);
		captchaAudioA.setAttribute('class', 'text-cta');
		captchaAudioA.innerHTML = 'Download';

		captchaAudioDiv.appendChild(captchaAudioAudio);
		captchaAudioAudio.appendChild(captchaAudioSource);
		captchaAudioAudio.appendChild(captchaAudioA);

		var captchaImage = document.getElementById('captchaImageDiv');
		if (captchaImage !== null) {
			document.getElementById('captchaContentColumn').removeChild(captchaImage);
		}
		return captchaAudioDiv;
	},
	getImageCaptcha: function() {
		Captcha.baseImageUrl = Captcha.baseUrl + 'imagecaptcha/id/%id%/cid/%cid%';
		Captcha.imageUrl = Captcha.baseImageUrl.replace('%id%', Captcha.id);
		Captcha.imageUrl = Captcha.imageUrl.replace('%cid%', Captcha.getClientId());

		var captchaImage = document.createElement('div');
		captchaImage.setAttribute('id', 'captchaImageDiv');

		var captchaImg = document.createElement('img');
		if (Captcha.id) {
			captchaImg.setAttribute('src', Captcha.imageUrl);
		}
		captchaImg.setAttribute('id', 'captchaImage');
		captchaImg.setAttribute('alt', 'An audio challenge follows if you cannot view this image.');

		var captchaAudio = document.getElementById('captchaAudioDiv');
		if (captchaAudio !== null) {
			document.getElementById('captchaContentColumn').removeChild(captchaAudio);
		}

		captchaImage.appendChild(captchaImg);

		return captchaImage;
	},
	display: function() {
		if (Captcha.err === null || Captcha.err === '') {
			if (document.getElementById('captchaContentColumn').childElementCount === 0) {
				document.getElementById('captchaContentColumn').appendChild(Captcha.content);
			}
			if (Captcha.captchaType === 'audio') {
				document.getElementById('captchaAudioControl').focus();
			}
		} else {
			var captchaCaptchaDiv = document.getElementById('captcha_div');
			captchaCaptchaDiv.style.display = 'none';

			var captchaCaptchaErrorDiv = document.getElementById('captchaErrorDiv');
			if (captchaCaptchaErrorDiv) {
				captchaCaptchaErrorDiv.style.display = 'block';
			}
		}
	},
	refresh: function() {
		Captcha.reset();
		Captcha.display();
	},
	reload: function(event) {
		if (event) {
			event.preventDefault(); // prevent scrolling
		}
		var captchaAudio = document.getElementById('captchaAudioDiv');
		var captchaImage = document.getElementById('captchaImageDiv');
		var captchaContent = document.getElementById('captchaContentColumn');

		if (captchaAudio !== null || captchaImage !== null) {
			while (captchaContent.firstChild) {
				captchaContent.removeChild(captchaContent.firstChild);
			}
		}
		var scriptId = 'blah87263';
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = scriptId;
		if (script.readyState) {
			script.onreadystatechange = function() {
				if (script.readyState === 'loaded' || script.readyState === 'complete') {
					script.onreadystatechange = null;
				}
			};
		} else {
			script.onload = function() {
				// To shutup sonar-qube.
			};
		}
		script.src = Captcha.ajaxUrl;
		Captcha.replaceHeadScript(scriptId, script);
		script.onload = function() {
			if (!Captcha.captchaInitiallyReloaded) {
				Captcha.captchaInitiallyReloaded = true;
			} else {
				$(document).trigger('eeid:CAPTCHA_REFRESH');
			}
		};
	}
};

window.Captcha = Captcha;
