/* JavaScript include for: Json Object Editor
last updated: CH March 2014
*/

var includes = "",
web_dir = (location.protocol||'http:')+"//webapps-cdn.esri.com/tools/JOE/",
projectName = 'JsonObjectEditor';

if(location && location.hostname){//fix for devices
	switch(location.hostname){
		case 'webapps-cdn-stg.esri.com':
			web_dir = "http://webapps-cdn-stg.esri.com/tools/JOE/";
		break;
		case 'webapps-cdn.esri.com':
			web_dir = "http://webapps-cdn.esri.com/tools/JOE/";
		break;

/*        case 'webnode.esri.com':
            web_dir = "http://ec2-23-23-199-244.compute-1.amazonaws.com/JsonObjectEditor/";
        break;*/

        //NODE TIERS
        case 'webnode.esri.com':
        case 'ec2-23-23-199-244.compute-1.amazonaws.com'://dev
        case 'ec2-54-215-12-204.us-west-1.compute.amazonaws.com'://stg
        case 'ec2-23-23-237-78.compute-1.amazonaws.com'://prd
            web_dir = location.protocol+'//'+location.hostname+"/"+projectName+"/";
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

        case 'cinadapc.esri.com':

                web_dir = 'http://cinadapc.esri.com/'+projectName+'/';

        break;
        case 'corey-bootcamp.esri.com':
                web_dir = 'http://corey-bootcamp.esri.com/'+projectName+'/';
        break;
	}
} else if (location && location.hostname === '') {
    web_dir = "http://ec2-23-23-199-244.compute-1.amazonaws.com/JsonObjectEditor/";
}
if(location && location.origin == 'file://'){
	web_dir = location.href.slice(0,location.href.lastIndexOf('/')+1);
}
var
    joe_web_dir = web_dir,
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
/*	"JsonObjectEditor.jquery.craydent.js",
	"leaflet.js",
	"esri-leaflet-geocoder.js",
	"zebra_datepicker.js",
	*/
    "joe.js",
    "ace/ace.js"
);

var
styles_dir = web_dir+"css/",
styles =[
/*   "leaflet.css",
   "esri-leaflet-geocoder.css",
   "joe-styles.css",
   //"jquery-ui-1.10.4.custom.min.css",
	"jquery-ui.min.css",
    "jif/style.css"*/
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