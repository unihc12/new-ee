/*
	This function should be used to add icons to links, so that they cannot be changed/deleted in AEM.
	To try how it works, you need to add a link to any file in _jcr_content folder.
	Choose the icon, that you want to see and set it as 'data-icon-type' attribute for this link's wrapper.
	All links in this wrapper will become links with icon.
	Remember, that icon should be used as it indicated in style guide!
	Example:
		<div data-icon-type="#eei_disability_awareness">
			<a href="#">TEST1</a>
			<a href="#">TEST2</a>
		</div>
*/

(function($) {
	function addLinkIcons() {
		var wrappers = $('[data-icon-type]');
		wrappers.each(function(i, el) {
			var iconType = $(el).data('iconType');
			var link = $(el).find('a');
			var svg = $('<svg focusable="false" class="icon-link__icon"><use xlink:href="' + iconType + '"></use></svg>');
			$(link).addClass('icon-link');
			$(link).prepend(svg);
			$(el).removeAttr('data-icon-type');
		});
	}

	document.addEventListener('DOMContentLoaded', function() {
		addLinkIcons();
	});
})($);
