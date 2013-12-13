//Dev'd By Corey Hadden

function JsonObjectEditor(specs){
	var self = this;
	window._joe = this;
	
/*-------------------------------------------------------------------->
	0 | CONFIG
<--------------------------------------------------------------------*/
	this.specs = $.extend({
		container:'body',
		joeprofile:{
			lockedFields:['joeUpdated'],
			hiddenFields:[]
		},
		profiles:{},
		fields:{},
		schemas:{}
	},
	specs||{})
	
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
		'<div class="joe-overlay">'+
			'<div class="joe-overlay-panel active">'+
				(content || '')+
			'</div>'+
		'</div>';
		return html;
	}
	this.populateFramework = function(data,schema,profile,callback){
		var specs = {};
	//callback
	if(callback){self.current.callback = callback;}
	else{self.current.callback = null;}
	
	
	//setup schema + title
		var schema = schema || '';
		specs.schema = ($.type(schema) == 'object')?schema:self.schemas[schema] || null;
		self.current.schema = specs.schema;
		specs.title = (specs.schema)?(specs.schema.title ||"Editing '"+(schema._Title || schema)+"' Object"):"Editing Object";	
		
	
	//when object passed in
		if($.type(data) == 'object'){
			specs.object = data;
			specs.menu = [{name:'save',label:'Save Object',action:'_joe.updateObject()'}];
			specs.mode="object";
			self.current.object = data;
			
		}
		
	//when array passed in	
		if($.type(data) == 'array'){
			specs.list = data;
			specs.menu = [];
			specs.mode="list";
			self.current.list = data;
			//self.current.object = null;

		}
		
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
		var title = specs.title || 'Json Object Editor';
		action = 'onclick="_joe.toggleOverlay(this)"';
		var html = 
		'<div class="joe-panel-header">'+
			'<div class="joe-panel-title">'+
				(title || 'Json Object Editor')+
			'</div>'+
			'<div class="joe-panel-close" '+action+'>close</div>'+	
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
			case 'html':
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
		var html = specs.html || '';
		return html;
		
	}
//LIST
	this.renderListContent = function(specs){
		specs = specs || {};
		var schema = specs.schema;
		var list = specs.list || [];
		var html = '';
			list.map(function(li){
				html += self.renderListItem(li);
			})
		
		return html;
		
	}
	
//OBJECT
	this.renderObjectContent = function(specs){
		specs = specs || {};
		var object = specs.object;
		var fields = '';
		var propObj;
		
		if(!specs.schema){//no schema use items as own schema
			for( var prop in object){
				propObj = $.extend({
					name:prop,
					type:'text',
					value:object[prop]	
				},self.fields[prop]);
				
				fields += self.renderObjectField(propObj);
			}
		}
		else{
			(specs.schema.fields||[]).map(function(prop){
				propObj = $.extend({
					name:prop,
					type:'text',
					value:object[prop]	
				},self.fields[prop]);
				
				fields += self.renderObjectField(propObj);
			})
			
		}
		var html = '<div class="joe-object-content">'+fields+'</div>';
		return html;
	}

/*----------------------------->
	C | Footer
<-----------------------------*/	
	this.renderEditorFooter = function(specs){
		specs = specs || {};
		var menu = specs.menu || [{name:'save',label:'Save', action:'_joe.upateItem(this);'}]
		var title = specs.title || 'untitled';
		var display,action;
		
		var html = 
		'<div class="joe-panel-footer">'+
			'<div class="joe-panel-menu">';
		
			
			menu.map(function(m){
				display = m.label || m.name;
				action = m.action || 'alert(\''+display+'\')';
				html+= '<div class="joe-footer-button" onclick="'+action+'" data-btnid="'+m.name+'" >'+display+'</div>';
			
			},this);
		
				
		html+=
			__clearDiv__+	
			'</div>'+
		'</div>';
		return html;
	}
/*-------------------------------------------------------------------->
	3 | OBJECT FORM
<--------------------------------------------------------------------*/
	this.renderObjectField = function(prop){
		//requires {name,type}
		var hidden = (prop.hidden)?'hidden':'';
		var html = 
			'<div class="joe-object-field '+hidden+'" data-type="'+prop.type+'" data-name="'+prop.name+'">'+
			'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>';
			
		switch(prop.type){
			case 'select':
				html+= self.renderSelectField(prop);
			break;
			case 'guid':
				html+= self.renderGuidField(prop);
			break;
			case 'number':
				html+= self.renderNumberField(prop);
			break;
			default:
				html+= self.renderTextField(prop);
			break;
		}
		html+='</div>';
		return html;
	}
/*----------------------------->
	A | Text Input
<-----------------------------*/
	this.renderTextField = function(prop){
		var profile = self.current.profile;
		var disabled = (profile.lockedFields.indexOf(prop.name) == -1)?
			'':'disabled';
		
		var html=
		'<input class="joe-text-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+disabled+' />';
		return html;
	}
	

/*----------------------------->
	B | Number Input
<-----------------------------*/
	this.renderNumberField = function(prop){
		var profile = self.current.profile;
		var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';
		var bluraction = 'onblur="$(this).val(parseFloat($(this).val()))"';
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-number-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+bluraction+' '+disabled+' />';
		return html;
	}
/*----------------------------->
	C | Select
<-----------------------------*/	
	this.renderSelectField = function(prop){
		var profile = self.current.profile;
		var values = prop.values || [prop.value];
		var valObjs = [];
		if($.type(values[0]) != 'object'){
			values.map(function(v){
				valObjs.push({name:v});
			});
		}
		else{
			valObjs = values;
		}
		var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';
		
		var selected;
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		
		'<select class="joe-select-field joe-field" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+disabled+'>';
			valObjs.map(function(v){
				selected = (prop.value == v.name)?'selected':'';
				html += '<option value="'+v.name+'" '+selected+'>'+(v.display||v.label||v.name)+'</option>'	
			})
			
		html+='</select>';
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
/*-------------------------------------------------------------------->
	4 | OBJECT LISTS
<--------------------------------------------------------------------*/
	this.renderListItem = function(listItem){
		var idprop = self.current.schema._listID || 'id';
		var id = listItem[idprop] || null;
		var action = 'onclick="_joe.showSchemaObject(\''+id+'\');"';
		
		if(!self.current.schema._listTemplate){
			var title = self.current.schema._listTitle || listItem.name || id || 'untitled';
			var html = '<div class="joe-panel-content-option" '+action+'>'+fillTemplate(title,listItem)+'</div>';
		}
		
		return html;
	}
	
	this.showSchemaObject = function(id){
		var list = self.current.list;
		var idprop = self.current.schema._listID || 'id';
		
		var object = list.filter(function(li){return li[idprop] == id;})[0]||false;
		
		if(!object){
			alert('error finding object');
			return;
		}
		self.populateFramework(object,self.current.schema);
	}
/*-------------------------------------------------------------------->
	5 | MENUS
<--------------------------------------------------------------------*/
/*-------------------------------------------------------------------->
	I | INTERACTIONS
<--------------------------------------------------------------------*/
	this.toggleOverlay = function(dom){
		$(dom).parents('.joe-overlay').toggleClass('active');
	}
	
	this.show = function(data,schema,profile,callback){
		//profile = profile || null
		self.populateFramework(data,schema,profile,callback);
		$('.joe-overlay').addClass('active');
	}
	this.hide = function(data){
		$('.joe-overlay').removeClass('active');
	}
	
	window.goJoe = this.show;
	
	
	$(document).keyup(function(e) {
		if (e.keyCode == 27) { self.hide(); }   // esc
	});


/*-------------------------------------------------------------------->
	D | DATA
<--------------------------------------------------------------------*/
	this.updateObject = function(callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		var newObj = self.constructObjectFromFields();
		var obj = $.extend(self.current.object,newObj);
		logit('object updated');
		self.hide();
		callback(obj);
	}
	
	this.constructObjectFromFields = function(){
		var object = {joeUpdated:new Date()};
		var prop;
		$('.joe-object-field').find('.joe-field').each(function(){
			switch($(this).attr('type')){
				case 'text':
				default:
					prop = $(this).attr('name');
					object[prop] = $(this).val();
				break;
			}
		});
		return object;
	}

/*<------------------------------------------------------------->*/
	return this;
}

__clearDiv__ = '<div class="clear"></div>';