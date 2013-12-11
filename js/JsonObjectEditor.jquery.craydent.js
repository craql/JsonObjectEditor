//Dev'd By Corey Hadden

function JsonObjectEditor(specs){
	var self = this;
	window._joe = this;
	
/*-------------------------------------------------------------------->
	0 | CONFIG
<--------------------------------------------------------------------*/
	this.specs = $.extend({
		container:'body'
	},
	specs||{})
	
	//TODO: check for class/id selector
	this.container = $(this.specs.container);

/*-------------------------------------------------------------------->
	1 | INIT
<--------------------------------------------------------------------*/
	this.init = function(){
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
		'<div class="joe-overlay active">'+
			'<div class="joe-overlay-panel active">'+
				(content || '')+
			'</div>'+
		'</div>';
		return html;
	}
	this.populateFramework = function(data){
		if($.type(data) == 'object'){
			
		}
		var html = 
			self.renderEditorHeader()+
			self.renderEditorContent()+
			self.renderEditorFooter()
		$('.joe-overlay-panel').html();
		
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
	this.renderListContent = function(specs){
		specs = specs || {};
		var html = 'LIST';
		return html;
		
	}
	
	this.renderObjectContent = function(specs){
		specs = specs || {};
		var object = specs.object;
		var fields = '';
		var propObj;
		for( var prop in object){
			propObj = {
				name:prop,
				type:'text',
				value:object[prop]	
			};
			
			fields += self.renderObjectField(propObj);
		}
		
		var html = '<div class="joe-object-content">'+fields+'</div>';
		return html;
	}

/*----------------------------->
	C | Footer
<-----------------------------*/	
	this.renderEditorFooter = function(specs){
		specs = specs || {};
		var menu = specs.menu || [{name:'save',label:'Save'}]
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
	3 | FORM
<--------------------------------------------------------------------*/
	this.renderObjectField = function(prop){
		//requires {name,type}
		var html = '<div class="joe-form-field" data-type="'+prop.type+'" data-name="'+prop.name+'">';
		switch(prop.type){
			default:
				self.renderTextField(prop)
			break;
		}
		html+='</div>';
		return html;
	}
/*----------------------------->
	* | Text Input
<-----------------------------*/	
	var html=
	
	
/*-------------------------------------------------------------------->
	I | INTERACTIONS
<--------------------------------------------------------------------*/
	this.toggleOverlay = function(dom){
		$(dom).parents('.joe-overlay').toggleClass('active');
	}
	
	this.show = function(data){
		$('.joe-overlay').addClass('active');
	}
	this.hide = function(data){
		$('.joe-overlay').removeClass('active');
	}
	
	window.goJoe = this.show;
	
	
	$(document).keyup(function(e) {
		if (e.keyCode == 27) { self.hide(); }   // esc
	});


	return this;
}

__clearDiv__ = '<div class="clear"></div>';