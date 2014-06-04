//Dev'd By Corey Hadden
/*TODO:
	-conditional fields
	-merge specs (profile,schema,object,call?)
	-required fields
	
	!make rendering a field type as well as a datatype
	
*/
function JsonObjectEditor(specs){
	var self = this;
	window._joe = this;
	
/*-------------------------------------------------------------------->
	0 | CONFIG
<--------------------------------------------------------------------*/
	var defaults = {
		
		container:'body',
		joeprofile:{
			lockedFields:['joeUpdated'],
			hiddenFields:[]
		},
		profiles:{},
		fields:{},
		schemas:{
			'rendering':	{
				_title:'HTML Rendering',
				callback:function(){alert('yo');}
				//fields:['id','name','thingType','legs','species','weight','color','gender'],
				//_listID:'id',
				//_listTitle:'${name} ${species}'
		
		}},
		compact:false,
		useControlEnter:true
	}
	
	this.specs = $.extend({},defaults,specs||{})
	
	this.current = {};
	//TODO: check for class/id selector
	this.container = $(this.specs.container);
	this.fields = this.specs.fields;
	this.schemas = this.specs.schemas;
	
	this.defaultProfile = this.specs.defaultProfile || this.specs.joeprofile;
	this.current.profile = this.defaultProfile;
/*-------------------------------------------------------------------->
	1 | INIT
<--------------------------------------------------------------------*/
	this.init = function(){
		self.current = {};
		var html = self.renderFramework(
			self.renderEditorHeader()+
			self.renderEditorContent()+
			self.renderEditorFooter()		
		);
		self.container.append(html);
	}



/*-------------------------------------------------------------------->
	2 | FRAMEWORK
<--------------------------------------------------------------------*/
	this.renderFramework = function(content){
		var html = 
		'<div class="joe-overlay '+((self.specs.compact && ' compact ') || '')+'">'+
			'<div class="joe-overlay-panel">'+
				(content || '')+
			'</div>'+
		//mini	
			'<div class="joe-mini-panel">'+
			'</div>'+
		'</div>';
		return html;
	}
	
	
	this.populateFramework = function(data,setts){

		var specs = setts || {};
		self.current.specs = setts; 
		
	//clean copy for later;
		self.current.userSpecs = $.extend({},setts);
		
		var schema = setts.schema || '';
		var profile = setts.profile || null;
		var callback = setts.callback || null;
		var datatype = setts.datatype || '';
		var title = setts.title || '';
		
		//callback
		if(callback){self.current.callback = callback;}
		else{self.current.callback = null;}
	
	
	//setup schema 
		specs.schema = this.setSchema(schema);
	//	specs.schema = ($.type(schema) == 'object')? schema : self.schemas[schema] || null;
	//	self.current.schema = specs.schema;
		
/*-------------------------
	Preformat Functions
-------------------------*/	
	specs.preformat = 
		specs.schema.preformat ||
		specs.preformat ||
		function(d){return d;}
	
	data = specs.preformat(data);	
/*-------------------------
	Object
-------------------------*/	
	//when object passed in
		if($.type(data) == 'object' || datatype =='object'){
			specs.object = data;
			specs.menu = specs.menu || specs.schema.menu || self.specs.menu || (specs.multiedit && __defaultMutliButtons) || __defaultObjectButtons;
			//[
			//	{name:'delete',label:'Delete Object',action:'_joe.deleteObject()'},
			//	{name:'save',label:'Save Object',action:'_joe.updateObject()'}];
			specs.mode="object";
			self.current.object = data;
			
		}
		
/*-------------------------
	Arrays 
-------------------------*/			
	//when array passed in	
		if($.type(data) == 'array' || datatype =='array'){
			specs.list = data;
			specs.menu = __defaultButtons;
			specs.mode="list";
			self.current.list = data;
			//self.current.object = null;

		}
		
/*-------------------------
	Rendering
-------------------------*/	
	//when rendering passed in
		if($.type(data) == 'string' && datatype == 'rendering'){
			specs.rendering = data;
			
			specs.menu = [__replaceBtn__];
			//specs.menu = [{name:'save',label:'Save Object',action:'_joe.updateObject()'}];
			specs.mode="rendering";
			self.current.rendering = specs.rendering;
			//specs.schema
			
		}

/*-------------------------
	String
-------------------------*/	
	//when string passed in
		else if($.type(data) == 'string' || datatype == 'string'){
			specs.text = data;
			specs.menu = __defaultButtons;
			//specs.menu = [{name:'save',label:'Save Object',action:'_joe.updateObject()'}];
			specs.mode="text";
			self.current.text = specs.text;
			
		}


		
	//setup window title	
		//specs.title = title || (specs.schema)? specs.schema._title : "Viewing "+specs.mode.capitalize();	
		specs.title =(title || (specs.schema && specs.schema._title)  || "Viewing "+specs.mode.capitalize());		
	//setup profile
		specs.profile = (profile)? 
			(self.specs.profiles[profile]||self.specs.joeprofile):
			self.specs.joeprofile;	
			
		self.current.profile = specs.profile;
		
		var html = 
			self.renderEditorHeader(specs)+
			self.renderEditorContent(specs)+
			self.renderEditorFooter(specs)
		$('.joe-overlay-panel').html(html);
		
		return html;
	}
/*----------------------------->
	A | Header
<-----------------------------*/	
	this.renderEditorHeader = function(specs){
		specs = specs || {}
		var title = fillTemplate(specs.title || 'Json Object Editor',_joe.current.object);
		action = specs.action||'onclick="_joe.toggleOverlay(this)"';
		var html = 
		'<div class="joe-panel-header">'+
			((specs.subsets && self.renderSubsetselector(specs)) || '')+
			'<div class="joe-panel-title">'+
				(title || 'Json Object Editor')+
			'</div>'+
			'<div class="joe-panel-close" '+action+'></div>'+	
			'<div class="clear"></div>'+
		'</div>';
		return html;
	}

/*----------------------------->
	B | Content
<-----------------------------*/
	this.renderEditorContent = function(specs){
		//specs = specs || {};
		var content;

		if(!specs){
			specs = {
				mode:'text', //text,list,single
				text:'No object or list selected'
			};
		}
		var mode = specs.mode;
		
		switch(mode){
			case 'text':
				content = self.renderTextContent(specs);
			break;
			case 'rendering':
				content = self.renderHTMLContent(specs);
			break;
			case 'list':
				content = self.renderListContent(specs);
			break;
			case 'object':
				content = self.renderObjectContent(specs)
			break;
	
			
		}
		var html = 
		'<div class="joe-panel-content joe-inset">'+
			content+
		'</div>';
		return html;
	}

	this.renderTextContent = function(specs){
		specs = specs || {};
		var text = specs.text || '';
		var html = '<div class="joe-text-content">'+text+'</div>';
		return html;
		
	}
	
	this.renderHTMLContent = function(specs){
		specs = specs || {};
		var html = '<textarea class="joe-rendering-field">'+(specs.rendering || '')+'</textarea>';
		return html;
		
	}
//LIST
	this.renderListContent = function(specs){
		self.current.selectedListItems=[];
		self.current.anchorListItem=null;
		
		specs = specs || {};
		var schema = specs.schema;
		var list = specs.list || [];
		var html = '';
		if(!self.current.subset){
			list.map(function(li){
				html += self.renderListItem(li);
			})
		}
		else{
			self.filterList(list,self.current.subset.filter).map(function(li){
				html += self.renderListItem(li);
			})
		}
		return html;
		
	}
	
//OBJECT
	this.renderObjectContent = function(specs){
		specs = specs || {};
		var object = specs.object;
		var fields = '';
		var propObj;
		
		if(!specs.schema || !specs.schema.fields){//no schema use items as own schema
			for( var prop in object){
				if(object.hasOwnProperty(prop)){
					propObj = $.extend({
						name:prop,
						type:'text',
						value:object[prop]	
					},
					self.fields[prop]);
					
					fields += self.renderObjectField(propObj);
				}
			}
		}
		else{
			(specs.schema.fields||[]).map(function(prop){
				
				//if(object.hasOwnProperty(prop)){
					
				//merge all the items	
					propObj = $.extend(
						{
							name:prop,
							type:'text'
						},
						{
							onblur:specs.schema.onblur,
							onchange:specs.schema.onchange,
							onkeypress:specs.schema.onkeypress,
							onkeyup:specs.schema.onkeypress
						
						},
						self.fields[prop],
						//overwrite with value
						{value:object[prop]}
					);
					
					fields += self.renderObjectField(propObj);
				//}
			
			})//end map
			
		}
		var html = '<div class="joe-object-content">'+fields+'</div>';
		return html;
	}

/*----------------------------->
	C | Footer
<-----------------------------*/	
	this.renderEditorFooter = function(specs){
		specs = specs || this.specs || {};
		var menu = specs.menu || (specs.multiedit && __defaultMutliButtons) || __defaultObjectButtons;
		
		var title = specs.title || 'untitled';
		var display,action;
		
		var html = 
		'<div class="joe-panel-footer">'+
			'<div class="joe-panel-menu">';

			menu.map(function(m){
				html+= self.renderFooterMenuItem(m);
			
			},this);
			if(self.current.list){
				html+= self.renderFooterMenuItem(__selectAllBtn__);
				html+= self.renderFooterMenuItem({label:'Multi-Edit', name:'multiEdit', css:'joe-multi-only', action:'_joe.editMultiple()'});
			}
				
		html+=
			__clearDiv__+	
			'</div>'+
		'</div>';
		return html;
	}
	
	this.renderFooterMenuItem=function(m){//takes a menuitem
		var display,action,html='';
		display = m.label || m.name;
		action = m.action || 'alert(\''+display+'\')';
		html+= '<div class="joe-button joe-footer-button '+(m.css ||'')+'" onclick="'+action+'" data-btnid="'+m.name+'" >'+display+'</div>';
		return html;
	}
/*-------------------------------------------------------------------->
	3 | OBJECT FORM
<--------------------------------------------------------------------*/
	this.renderObjectField = function(prop){
		//requires {name,type}
		
	//set default value
		//prop.value = (prop.value != undefined || prop.default || null;
		if(prop.value == undefined && prop.default != undefined){
			prop.value = prop.default;
		}
		
		var hidden = (prop.hidden)?'hidden':'';
		var html = 
			'<div class="joe-object-field '+hidden+' '+prop.type+'-field " data-type="'+prop.type+'" data-name="'+prop.name+'">'+
			'<label class="joe-field-label">'+(prop.display||prop.label||prop.name)+'</label>';
	
	//add multi-edit checkbox	
		if(self.current.userSpecs.multiedit){
			html+='<div class="joe-field-multiedit-toggle" onclick="$(this).parent().toggleClass(\'multi-selected\')"></div>';	
		}
		
		switch(prop.type){
			case 'select':
				html+= self.renderSelectField(prop);
			break;
/*			case 'multi-select':
				html+= self.renderMultiSelectField(prop);*/
			break;
			case 'guid':
				html+= self.renderGuidField(prop);
			break;
			case 'number':
				html+= self.renderNumberField(prop);
			break;
			case 'int':
				html+= self.renderIntegerField(prop);
			break;
			
			case 'rendering':
				html+= self.renderRenderingField(prop);
			break;
			
			case 'date':
				html+= self.renderDateField(prop);
			break;
			
			case 'boolean':
				html+= self.renderBooleanField(prop);
			break;
			
			case 'geo':
			case 'map':
				html += self.renderGeoField(prop);
			break;
			
			default:
				html+= self.renderTextField(prop);
			break;
		}
		html+='</div>';
		return html;
	}
/*----------------------------->
	0 | Event Handlers
<-----------------------------*/
	this.getActionString = function(evt,prop){
		var str = (prop[evt])? ' '+self.functionName(prop[evt])+'(this); ' : '' ;
		return str;
	}
	
	
	this.renderFieldAttributes = function(prop, evts){
		evts = evts ||{};
		var bluraction = '';
		//var updateaction = '';
		var changeaction = '';
		
		var keypressaction = '';
		var keyupaction = '';
		
		var profile = self.current.profile;
		
		var disabled = (profile.lockedFields.indexOf(prop.name) == -1)?
			'':'disabled';
		
		if(evts.onblur || prop.onblur){
			bluraction = 'onblur="'+(evts.onblur||'')+' '+self.getActionString('onblur',prop)+'"';
		}
		if(evts.onchange || prop.onchange){
			changeaction = 'onchange="'+(evts.onchange||'')+' '+self.getActionString('onchange',prop)+'"';
		}
		if(evts.onkeypress || prop.onkeypress){
			keypressaction = 'onkeypress="'+(evts.onkeypress||'')+' '+self.getActionString('onkeypress',prop)+'"';
		}
		if(evts.onkeyup || prop.onkeyup){
			keyupaction = 'onkeyup="'+(evts.onkeyup||'')+' '+self.getActionString('onkeyup',prop)+'"';
		}
		return ' '+keyupaction+' '+keypressaction+' '+bluraction+' '+changeaction+' '+disabled+' ';
	
	}
	
/*----------------------------->
	A | Text Input
<-----------------------------*/
	this.renderTextField = function(prop){
		var autocomplete;
		if(prop.autocomplete && prop.values && $.type(prop.values) == 'array'){
		autocomplete =true;
		}
	/*	var disabled = (profile.lockedFields.indexOf(prop.name) == -1)?
			'':'disabled';
		
	*/	
		//var bluraction = 'onblur="'+self.getActionString('onblur',prop)+'"';
			//show autocomplete
		
		var html=
		'<input class="joe-text-field joe-field" type="text"  name="'+prop.name+'" value="'+(prop.value || '')+'" '
			+self.renderFieldAttributes(prop)
			+((autocomplete && 
				' onblur="_joe.hideTextFieldAutoComplete($(this));"'
				+' onkeyup="_joe.showTextFieldAutoComplete($(this));"'
				) 
			||''
			)
		+' />';
		
		if(autocomplete){
			html+='<div class="joe-text-autocomplete">';
			for(var v = 0, len = prop.values.length; v < len; v++){
				html+='<div class="joe-text-autocomplete-option" '
					+'onclick=" _joe.autocompleteTextFieldOptionClick(this);">'+prop.values[v]+'</div>';	
			}
			
			html+='</div>';	
		}
		//add onblur: hide panel

		return html;
	} 
	
	this.showTextFieldAutoComplete = function(dom){
		var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.find('.joe-text-autocomplete-option').each(function(i,obj){
			_joe.checkAutocompleteValue(dom.val(),obj.innerHTML,obj);
		});
		autocomplete.addClass('active');
	}
	this.hideTextFieldAutoComplete = function(dom){
		var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.removeClass('active');
	}
	
	this.autocompleteTextFieldOptionClick = function(dom){
		$(dom).parent().prev('.joe-text-field').val($(dom).html());
		$(dom).parent().removeClass('active');
		//$(dom).previous('.joe-text-field').val($(dom).html());
	}
	
	this.checkAutocompleteValue = function(needle,haystack,dom){
		var d = $(dom);
		if(haystack.indexOf(needle) != -1 || !needle){
			d.addClass('visible');
		}else{
			d.removeClass('visible');	
		}
	}
	

/*----------------------------->
	B | Number/Int Input
<-----------------------------*/
	this.renderNumberField = function(prop){
		
		/*var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';
	*/
	//bluraction	
		//var bluraction =  (prop.onblur)? ' '+self.functionName(prop.onblur)+'(this); ' : '' ;
		//var bluraction = 'onblur=" '+self.getActionString('onblur',prop)+' "';
		
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-number-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+
			self.renderFieldAttributes(prop,{onblur:'_joe.returnNumber(this);'})+
		' />';
		return html;
	}

	this.returnNumber = function(dom){
		if(!$(dom).val()){return;}
		$(dom).val(parseFloat($(dom).val()));
	}
		
	this.renderIntegerField = function(prop){
		
		/*var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';
	*/
	//bluraction
		//var bluraction = 'onblur="_joe.returnInt(this); '+self.getActionString('onblur',prop)+'"';
		
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-int-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+
			self.renderFieldAttributes(prop,{onblur:'_joe.returnInt(this);'})+
		' />';
		return html;
	}
	
	this.returnInt = function(dom){
		if(!$(dom).val()){return;}
		$(dom).val(parseInt($(dom).val()));
	
	}

/*----------------------------->
	C | Select
<-----------------------------*/	
	this.renderSelectField = function(prop){
		
		var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values || [prop.value];
		var valObjs = [];
		if($.type(values[0]) != 'object'){
			values.map(function(v){
				valObjs.push({name:v});
			});
		}
		else{
			valObjs = values;
		}
	
	//bluraction
//		var bluraction = 'onblur="'+self.getActionString('onblur',prop)+'"';
/*		
		var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';*/
		
		var selected;
		var multiple =(prop.multiple)?' multiple ':'';
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		
		'<select class="joe-select-field joe-field" name="'+prop.name+'" value="'+(prop.value || '')+'" '+
			self.renderFieldAttributes(prop)+
			multiple+
		' >';
		
		var val;
			valObjs.map(function(v){
				val = v.value||v.name||'';
				if($.type(prop.value) == 'array'){
					selected = '';
					selected = (prop.value.indexOf(val) != -1)?'selected':'';
					
					/*prop.value.map(function(pval){
						if(pval.indexOf)
					});*/
				}else{
					selected = (prop.value == val)?'selected':'';
				}
				html += '<option value="'+val+'" '+selected+'>'+(v.display||v.label||v.name)+'</option>'	
			})
			
		html+='</select>';
		return html;
	}

/*----------------------------->
	D | Date Field
<-----------------------------*/
	this.renderDateField = function(prop){
				var html=
		'<input class="joe-date-field joe-field" type="text"  name="'+prop.name+'" value="'+(prop.value || '')+'" '+
			self.renderFieldAttributes(prop)+
		' />';
		
		return html;
	}
/*----------------------------->
	E | Geo Field
<-----------------------------*/
	this.renderGeoField = function(prop){
		var center = (prop.value && eval(prop.value)) || prop.center || [40.513,-96.020];
		var zoom = prop.zoom || 4;
	//map.setView([37.85750715625203,-96.15234375],3)	
	//var map = L.map('map').setView(center, zoom);
	var mapDiv = 'joeGEO_'+prop.name;
	var val = prop.value||'';
	var html=
		'<div class="joe-geo-map joe-field" name="'+prop.name+'" id="'+mapDiv+'" '
			+'data-center="'+JSON.stringify(center)+'" data-zoom="'+zoom+'" '
			+'data-value="'+val+'" '
			+'data-hideattribution="'+(prop.hideAttribution||'')+'" '
			+'onload="_joe.initGeoMap(this);"></div>'
		+'<input class="joe-geo-field joe-field" type="text" value="'+val+'" name="'+prop.name+'"/>'
		+'<script type="text/javascript">setTimeout(function(){_joe.initGeoMap("'+mapDiv+'");},100)</script>'
		;
		
		return html;
	}	
	
	this.initGeoMap = function(id){

		var mapspecs = $('#'+id).data();
		var map = L.map(id).setView(mapspecs.center,mapspecs.zoom);
		//var map = L.map(id).setView([51.505, -0.09], 13);
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
   			//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
	
	//add geocoder	
		var searchControl = new L.esri.Controls.Geosearch().addTo(map);
	
	//hide leaflet and esri attribution	
		if(mapspecs.hideattribution){
			$('.leaflet-control-attribution').hide();
		}
		
		map.on('click', _joe.onMapClick);
		map.prop = $('#'+id).attr('name');
		if(mapspecs.value){
			//var ll = eval(mapspecs.value);
			self.addMapIcon(map,mapspecs.value);
		}
	}
	
	this.onMapClick = function(e){
		var map = (e.type=="click")?e.target : this.map;
		
		//map.setView(e.latlng);
		var ll = (e && e.latlng) || this.getLatLng()
		map.setView(ll);
		
		if(e.type=="dragend"){
			
		}else if(map.marker){
			map.marker.setLatLng(ll);
		}else{
			self.addMapIcon(map,ll);
		}
		$('input[name='+map.prop+']').val('['+ll.lat+','+ll.lng+']');
	}
	
	this.addMapIcon = function(map,latlng,specs){
		specs = specs || {};
		var myIcon = L.icon({
			iconUrl: specs.icon||'/JsonObjectEditor/img/mapstar.png',
			iconSize: [30, 30],
			//iconAnchor: [22, 94],
			//popupAnchor: [-3, -76],
			//shadowUrl: 'my-icon-shadow.png',
			//shadowRetinaUrl: 'my-icon-shadow@2x.png',
			//shadowSize: [68, 95],
			//shadowAnchor: [22, 94]
		});
		map.marker = L.marker(latlng,{
			draggable:true,
			icon:myIcon
		}).addTo(map);
		map.marker.map = map;
		map.marker.on('dragend', _joe.onMapClick);
	}
/*----------------------------->
	F | Boolean
<-----------------------------*/
	this.renderBooleanField = function(prop){
		var profile = self.current.profile;
		
		var html=
		//'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'
		'<input class="joe-boolean-field joe-field" type="checkbox" name="'+prop.name+'" '
			+(prop.value == true&&'checked' || '')
		+' />';
		return html;
	}


/*----------------------------->
	G | Guid
<-----------------------------*/
	this.renderGuidField = function(prop){
		var profile = self.current.profile;
		
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-guid-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || cuid())+'"  disabled />';
		return html;
	}
/*----------------------------->
	R | Rendering Field
<-----------------------------*/
	this.renderRenderingField = function(prop){
		var profile = self.current.profile;
		
		var html=
			'<textarea class="joe-rendering-field joe-field" name="'+prop.name+'" >'+(prop.value || "")+'</textarea>';
		return html;
	}
/*-------------------------------------------------------------------->
	4 | OBJECT LISTS
<--------------------------------------------------------------------*/
	this.renderListItem = function(listItem){
		var listSchema  = $.extend(
			{
				_listID:'id'	
			},
			self.current.schema,
			self.current.specs
		);
		
		var idprop = listSchema._listID;
		var id = listItem[idprop] || null;
		//var action = 'onclick="_joe.editObjectFromList(\''+id+'\');"';
		var action = 'onclick="_joe.listItemClickHandler({dom:this,id:\''+id+'\'});"';
		if(!listSchema._listTemplate){
			var title = listSchema._listTitle || listItem.name || id || 'untitled';
			var html = '<div class="joe-panel-content-option joe-no-select" '+action+' data-id="'+id+'">'+fillTemplate(title,listItem)+'</div>';
		}
		//if there is a list template
		else{
			html = fillTemplate(listSchema._listTemplate,listItem);
		}
		
		return html;
	}
	
	this.listItemClickHandler=function(specs){
		self.current.selectedListItems = [];
		if(!window.event.shiftKey && !window.event.ctrlKey){
			self.editObjectFromList(specs);
		}else if(window.event.ctrlKey){
			
			$(specs.dom).toggleClass('selected');
			$('.joe-panel-content-option.selected').map(function(i,listitem){
				self.current.selectedListItems.push($(listitem).data('id'));
			})
			
		}
		if(self.current.selectedListItems.length){
			$(specs.dom).parents('.joe-overlay-panel').addClass('multi-edit');
		}else{
			$(specs.dom).parents('.joe-overlay-panel').removeClass('multi-edit');
		}
	}
	
	this.editObjectFromList = function(specs){
		specs = specs || {};
		
		self.current.schema = specs.schema || self.current.schema || null;
		var list = specs.list || self.current.list;
		var id = specs.id;
		var idprop = self.getIDProp();//(self.current.schema && self.current.schema._listID) || 'id';
		
		var object = list.filter(function(li){return li[idprop] == id;})[0]||false;
		
		if(!object){
			alert('error finding object');
			return;
		}
		
		var setts ={schema:self.current.schema,callback:specs.callback};
		self.populateFramework(object,setts);
		$('.joe-overlay').addClass('active');
	}
/*----------------------------->
	List Multi Select
<-----------------------------*/	
	this.editMultiple = function(){
		//create object from shared properties of multiple
		var haystack = self.current.list;
		var idprop = self.getIDProp();
		var needles = self.current.selectedListItems;
		
		var items = [];
		var protoItem ={};
		haystack.map(function(i){
			
			if(needles.indexOf(i[idprop]) == -1){//not selected
				return;
			}else{
				protoItem = merge(protoItem,i);
				items.push(i);
			}
		});
		
		goJoe(protoItem,{title:'Multi-Edit '+(self.current.schema._title||'')+': '+items.length+' items',schema:(self.current.schema||null),multiedit:true})
		//buttons
			//delete multiple
			//save multiple
		
		//combine object on save	
	}
/*----------------------------->
	List Filtering
<-----------------------------*/	
	this.filterList = function(list,props,specs){
		//var list = list || self.current.list;
		specs = specs || {};
		var arr = list || self.current.list;
		var found = arr.filter(function(arrobj){
			for(var p in props){
				if(arrobj[p] != props[p]){
					return false;
				}
			}
			return true;
		});
		if(found.length){
			if(specs.single){
				return found[0];
			}
			return found;
		}else{
			return false;
		}
		
	}
/*----------------------------->
	List Subsets
<-----------------------------*/		
	this.renderSubsetselector = function(specs){
		
		var html=
		'<div class="joe-subset-selector" >'
			+self.renderSubsetSelectorOptions(specs)
		+'</div>';
		return html;
	}
	
	this.renderSubsetSelectorOptions = function(specs){
		function renderOption(opt){
			var html='<div class="selector-option" onclick="_joe.selectSubset(\''+opt.name+'\');">'+opt.name+'</div>';
			return html;
		}
		if(specs.subset){
			self.current.subset = specs.subsets.filter(function(s){
				return s.name == specs.subset;
			})[0]||false;
		}
		var subsetlabel = (self.current.subset && self.current.subset.name) || 'All';
		var html=
		'<div class="selector-label selector-option" onclick="$(this).parent().toggleClass(\'active\')">'+subsetlabel+'</div>'
		+'<div class="selector-options">'
			+renderOption({name:'All',filter:{}})
			+specs.subsets.map(renderOption)
		+'</div>';
		return html;
	}
	
	this.selectSubset=function(subset){
		//if (!e) var e = window.event;
		//e.cancelBubble = true;
		//if (e.stopPropagation) e.stopPropagation();
		_joe.hide();
		goJoe(self.current.list,merge(self.current.userSpecs,{subset:subset}));
	}
	
/*-------------------------------------------------------------------->
	5 | HTML Renderings
<--------------------------------------------------------------------*/
	this.replaceRendering = function(dom,specs){
		var rendering = dom.toString();
		//var data = {rendering:html};
		var specs = {datatype:'rendering', compact:false,dom:dom};
		self.show(rendering,specs);
	}
	
	this.updateRendering = function(dom, callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		if(!self.current.specs.dom){
			return false;
		}
		var newVal = $('.joe-rendering-field').val();
		$(self.current.specs.dom).replaceWith(newVal);
		logit('dom updated');
		self.hide();
		callback(newVal);
	}
/*-------------------------------------------------------------------->
	MENUS
<--------------------------------------------------------------------*/

/*-------------------------------------------------------------------->
	MUTATE - Adding Properties
<--------------------------------------------------------------------*/
	this.showPropertyEditor = function(prop){
		self.current.mutant = prop;
		
		
	}
	
	this.addPropertyToEditor = function(prop){
		
	}

	this.minis = {};
/*-------------------------------------------------------------------->
	MINIJOE WIndow
<-------------------------------------------------------------------*/
	this.showMiniJoe = function(specs){
		var mini = {};
		if(!(specs && specs.prop)){
			return;
		}
		mini.name=specs.prop.name||specs.prop.id || specs.prop._id;
		mini.id = "mini-"+mini.name;
		
		//var html = '<div class="joe-mini-panel joe-panel">';

		var html = 
			self.renderEditorHeader({title:mini.name,action:'onclick="_joe.hideMini()"'})
			+'<div class="joe-panel-content joe-inset"></div>'
			+self.renderEditorFooter();
		//html+=	'</div>';
		$('.joe-mini-panel').addClass('active').html(html);
		
		self.minis[mini.id] = mini;
	}
	
	this.hideMini = function(){
		$('.joe-mini-panel').removeClass('active')
	}
/*-------------------------------------------------------------------->
	SCHEMAS
<--------------------------------------------------------------------*/
	this.setSchema = function(schemaName){
		if(!schemaName){return false;}
		//setup schema 
		var schema = ($.type(schemaName) == 'object')? schemaName : self.schemas[schemaName] || null;
		self.current.schema = schema;
		return schema;
	}
	this.resetSchema = function(schemaName){
		var newObj = self.constructObjectFromFields();
		//var obj = $.extend(self.current.object,newObj);
		self.show(
			$.extend(self.current.object,newObj),
			merge(self.current.userSpecs,{schema:self.setSchema(schemaName) || self.current.schema})
		)
	}

/*-------------------------------------------------------------------->
	I | INTERACTIONS
<--------------------------------------------------------------------*/
	this.toggleOverlay = function(dom){
		$(dom).parents('.joe-overlay').toggleClass('active');
	}
	
	//this.show = function(data,schema,profile,callback){
	this.show = function(data,specs){
		
		var data = data || '';
		//profile = profile || null
		var specs=specs || {};
		$('.joe-overlay-panel').attr('class', 'joe-overlay-panel');
		if(specs.compact === true){$('.joe-overlay').addClass('compact');}
		if(specs.compact === false){$('.joe-overlay').removeClass('compact');}
		
		self.populateFramework(data,specs);
		
		$('.joe-overlay').addClass('active');
		setTimeout(self.onPanelShow(),0);
	}
	this.hide = function(data){
		$('.joe-overlay').removeClass('active');
	}
	
	this.compactMode = function(compact){
		if(compact === true){$('.joe-overlay').addClass('compact');}
		if(compact === false){$('.joe-overlay').removeClass('compact');}
	
	
	}
	
	window.joeMini = this.showMiniJoe;
	window.goJoe = this.show;
	window.listJoe = this.editObjectFromList;
	
	$(document).keyup(function(e) {
		if (e.keyCode == 27) { self.hide(); }   // esc
	//ctrl + enter
		else if(e.ctrlKey && e.keyCode == 13 && self.specs.useControlEnter){
			$('.joe-confirm-button').click();
		}
	});

	this.onPanelShow = function(){
		//init datepicker
		$('.joe-date-field').Zebra_DatePicker();
	}

/*-------------------------------------------------------------------->
	D | DATA
<--------------------------------------------------------------------*/
	this.updateObject = function(dom,callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		var newObj = self.constructObjectFromFields();
		newObj.joeUpdated = new Date();
		var obj = $.extend(self.current.object,newObj);
		logit('object updated');
		self.hide();
		callback(obj);
	}
	
	this.deleteObject = function(callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		var obj = self.current.object;
		if(!self.current.list || !obj || self.current.list.indexOf(obj) == -1){
		//no list or no item
			alert('object or list not found');
			self.hide();
			callback(obj);	
			return;
		}
		var index = self.current.list.indexOf(obj);
		
		self.current.list.removeAt(index);
		logit('object deleted');
		self.hide();
		callback(obj);
	}
	
	this.duplicateObject = function(specs){
		//takes fields to be deleted
		specs = specs || {};
		var deletes = specs.deletes || [];
		var itemobj = $.extend({},self.current.object);
		delete itemobj.joeUpdated;
		itemobj.name = itemobj.name +' copy';
		deletes.map(function(d){
			delete itemobj[d];
		})
		
		self.hide();
		goJoe(itemobj,self.current.userSpecs);
	}
	this.constructObjectFromFields = function(){
		var object = {joeUpdated:new Date()};
		var prop;
		$('.joe-object-field').find('.joe-field').each(function(){
			if(self.current.userSpecs.multiedit){
				if(!$(this).parent().hasClass('multi-selected')){
					return;
				}
			}
			switch($(this).attr('type')){
				case 'checkbox':
					prop = $(this).attr('name');
					if($(this).is(':checked')){
						object[prop] = true;
					}else{
						object[prop] = false;
					
					}
				break;
				case 'text':
				default:
					prop = $(this).attr('name');
					object[prop] = $(this).val();
				break;
			}
		});
		return object;
	}
	
	this.exportJSON = function(object,specs){
		var minify =specs.minify || null;
		var objvar = specs.objvar || '';
		var obobj = (minify)?JSON.stringify(object):JSON.stringify(object,'','    ');
		
		goJoe('<b>'+((objvar && 'var '+objvar +' = ')|| 'JSON Object')+'</b><br/><pre>'+obobj+'</pre>')
		console.log(obobj);
	}
	
/*-------------------------
	Multi Functions
-------------------------*/		
	this.updateMultipleObjects = function(dom,callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		
		var idprop = self.getIDProp();
		var newObj = self.constructObjectFromFields();
		newObj.joeUpdated = new Date();
	
	//clear id from merged object	
		delete newObj[idprop];
		delete newObj['id'];
		delete newObj['_id'];
		
		var haystack = self.current.list;

		var needles = self.current.selectedListItems;
		//var items = [];
		haystack.map(function(i){
			
			if(needles.indexOf(i[idprop]) == -1){//not selected
				return;
			}else{//make updates to items
				//protoItem = merge(protoItem,i);
				$.extend(i,newObj);
				logit('object updated');
				callback(i);
				//items.push(i);
			}
		});
		
			
		
		self.hide();
	}
	
	this.deleteMultipleObjects = function(callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		var obj = self.current.object;
		if(!self.current.list || !obj || self.current.list.indexOf(obj) == -1){
		//no list or no item
			alert('object or list not found');
			self.hide();
			callback(obj);	
			return;
		}
		var index = self.current.list.indexOf(obj);
		
		self.current.list.removeAt(index);
		logit('object deleted');
		self.hide();
		callback(obj);
	}
	
	this.selectAllItems = function(){
		$('.joe-panel-content-option').addClass('selected');
		$('.joe-overlay-panel').addClass('multi-edit');
		$('.joe-panel-content-option.selected').map(function(i,listitem){
			self.current.selectedListItems.push($(listitem).data('id'));
		})
	}
/*-------------------------------------------------------------------->
	H | HELPERS
<--------------------------------------------------------------------*/
	this.functionName = function(func){
		var name=func.toString();
		var reg=/function ([^\(]*)/;
		return reg.exec(name)[1];
	}
	
	this.getIDProp = function(){
		var prop = (self.current.schema && self.current.schema._listID) || 'id' || '_id';
		return prop;
	}
/*<------------------------------------------------------------->*/
	return this;
}

var __clearDiv__ = '<div class="clear"></div>';

var __saveBtn__ = {name:'save',label:'Save', action:'_joe.updateObject(this);', css:'joe-save-button joe-confirm-button'};
var __deleteBtn__ = {name:'delete',label:'Delete',action:'_joe.deleteObject(this);', css:'joe-delete-button'};
var __multisaveBtn__ = {name:'save_multi',label:'Multi Save', action:'_joe.updateMultipleObjects(this);', css:'joe-save-button joe-confirm-button'};
var __multideleteBtn__ = {name:'delete_multi',label:'Multi Delete',action:'_joe.deleteMultipleObjects(this);', css:'joe-delete-button'};
var __selectAllBtn__ = {name:'select_all',label:'select all',action:'_joe.selectAllItems();', css:'joe-left-button'};

var __replaceBtn__ = {name:'replace',label:'Replace', action:'_joe.updateRendering(this);', css:'joe-replace-button joe-confirm-button'};
var __duplicateBtn__ = {name:'duplicate',label:'Duplicate', action:'_joe.duplicateObject();', css:'joe-left-button'};


var __defaultButtons = [];
var __defaultObjectButtons = [__deleteBtn__,__saveBtn__];
var __defaultMutliButtons = [__multisaveBtn__,__multideleteBtn__];

