/* JavaScript include for: Json Object Editor
last updated: CH March 2014
*/

var includes = "",
web_dir = "//webapps-cdn.esri.com/tools/JOE/",
projectName = 'JsonObjectEditor';

if(location && location.hostname){//fix for devices
	switch(location.hostname){
		case 'webapps-cdn-stg.esri.com':
			web_dir = "http://webapps-cdn-stg.esri.com/tools/JOE/";
		break;
		case 'webapps-cdn.esri.com':
			web_dir = "http://webapps-cdn.esri.com/tools/JOE/";
		break;

        //NODE DEV
        case 'ec2-23-23-199-244.compute-1.amazonaws.com':
            web_dir = "//ec2-23-23-199-244.compute-1.amazonaws.com/"+projectName+'/';
        break;

		case 'localhost':
		case 'localhost:81':
			if(location && location.port < 1000) {
				web_dir = 'http://' + location.hostname + ':' + location.port + "/" + projectName + '/';
			}
			break;
		case 'coreyh.esri.com':
			web_dir = 'http://coreyh.esri.com:81/'+projectName+'/';
		break;
		case 'corey-bootcamp.esri.com':
			web_dir = 'http://corey-bootcamp.esri.com/'+projectName+'/';
		break;
	}
}
if(location && location.origin == 'file://'){
	web_dir = location.href.slice(0,location.href.lastIndexOf('/')+1);
}
var
    joe_web_dir = web_dir,
scripts_dir = web_dir+"js/",
scripts = [];
if (typeof jQuery == 'undefined') {  
	scripts.push("libs/jquery-1.11.2.min.js");
	scripts.push("libs/jquery-ui.min.js");
	
}

if (typeof Craydent == 'undefined' || (!Craydent.VERSION || Craydent.VERSION < '1.7.35')) {
   scripts.push("libs/craydent-1.7.34.js");
}
scripts.push(
	"JsonObjectEditor.jquery.craydent.js",
	"leaflet.js",
	"esri-leaflet-geocoder.js",
	"zebra_datepicker.js",
	"ace/ace.js"
	
);

var
styles_dir = web_dir+"css/",
styles =[
   "leaflet.css",
   "esri-leaflet-geocoder.css",
   "joe-styles.css",
   //"jquery-ui-1.10.4.custom.min.css",
	"jquery-ui.min.css"
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