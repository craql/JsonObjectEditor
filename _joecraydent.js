/* JavaScript include for: Json Object Editor on Craydent.com
last updated: CH December 2015
*/
var includes = "", web_dir = '//www.craydent.com/jsonobjecteditor/';
var joe_web_dir = web_dir,
scripts_dir = web_dir+"js/",
scripts = [];
if (typeof jQuery == 'undefined') {
	scripts.push("libs/jquery-1.11.3.min.js");
	scripts.push("libs/jquery-ui.min.js");
}
scripts.push("libs/jquery.ui.touch-punch.min.js");
if (typeof Craydent == 'undefined' || (!Craydent.VERSION || Craydent.VERSION < '1.7.37')) {
   scripts.push("libs/craydent-1.8.0.js");
}
scripts.push(

    "joe.js",
    "ace/ace.js",
    'plugins/tinymce.min.js'
);

var
styles_dir = web_dir+"css/",
styles =[
    "joe.css"
],
script,style,sc,st,
sc_len = scripts.length,st_len = styles.length;

//scripts
for(sc = 0; sc < sc_len; sc++){
	script = scripts[sc];
	includes+='<script type="text/javascript" src="'+scripts_dir+script+'"></script>';
}
//styles
for(st = 0; st < st_len; st++){
	style = styles[st];
	includes+='<link href="'+styles_dir+style+'" rel="stylesheet" type="text/css">';
}

includes+='';
document.write(includes);