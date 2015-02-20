/* To avoid CSS expressions while still supporting IE 7 and IE 6, use this script */
/* The script tag referencing this file must be placed before the ending body tag. */

/* Use conditional comments in order to target IE 7 and older:
	<!--[if lt IE 8]><!-->
	<script src="ie7/ie7.js"></script>
	<!--<![endif]-->
*/

(function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'joeiconfont\'">' + entity + '</span>' + html;
	}
	var icons = {
		'jif-arrow-right': '&#xe600;',
		'jif-close': '&#xe601;',
		'jif-create': '&#xe603;',
		'jif-delete': '&#xe604;',
		'jif-history': '&#xe605;',
		'jif-object': '&#xe606;',
		'jif-quicksave': '&#xe607;',
		'jif-reload': '&#xe608;',
		'jif-reload2': '&#xe609;',
		'jif-save-go': '&#xe60a;',
		'jif-save-go2': '&#xe60b;',
		'jif-submit': '&#xe60c;',
		'jif-thumbs-down': '&#xe60d;',
		'jif-thumbs-up': '&#xe60e;',
		'jif-arrow-left': '&#xe602;',
		'0': 0
		},
		els = document.getElementsByTagName('*'),
		i, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		c = el.className;
		c = c.match(/jif-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
}());
