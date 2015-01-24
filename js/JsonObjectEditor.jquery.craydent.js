/*/---------------------------------------------------------
    Craydent LLC
	Copyright 2014 (http://craydent.com/joe)
    Dual licensed under the MIT or GPL Version 2 licenses.
	(http://craydent.com/license)                       
---------------------------------------------------------/*/

/*TODO:

	-merge specs (profile,schema,object,call?)
	-required fields

	
*/

function JsonObjectEditor(specs){
	var self = this;
	var listMode = false;
	this.VERSION = '1.0.1';
	window._joes = window._joes || [];
	this.joe_index = window._joes.length;
	if(!window._joes.length){window._joe = this;} 
	 
	window._joes.push(this);	
	
	this.history = [];
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
		useControlEnter:true,
		autoInit:false,
        dynamicDisplay:30,

        listSubMenu:true
	};
	
	this.specs = $.extend({},defaults,specs||{});
	
	this.current = {};
	//TODO: check for class/id selector
	this.container = $(this.specs.container);
	this.fields = this.specs.fields;

    //configure schemas
    this.schemas = this.specs.schemas;
/*
    this.schemas._function = {
        idprop:'name'
    };*/

    for(var s in _joe.schemas){
        _joe.schemas[s].__schemaname = s;
    }

	this.defaultProfile = this.specs.defaultProfile || this.specs.joeprofile;
	this.current.profile = this.defaultProfile;

	this.ace_editors = {};
/*-------------------------------------------------------------------->
	1 | INIT
<--------------------------------------------------------------------*/
	this.init = function() {
        self.current = {};
        var html = self.renderFramework(
                self.renderEditorHeader() +
                self.renderEditorContent() +
                self.renderEditorFooter()
        );
        self.container.append(html);
        self.overlay = $('.joe-overlay[data-joeindex=' + self.joe_index + ']');
        self.panel = self.overlay.find('.joe-overlay-panel');
        if (self.specs.useBackButton) {
            window.onkeydown = function (e) {
                var nonBackElements = ['input','select','textarea'];
                if (e.keyCode == 8) {
                    if(self.history.length) {
                        //if in editor fields, don't go back
                        if (nonBackElements.indexOf(e.target.tagName.toLowerCase()) != -1) {
                            //logit('t');
                            //return false;
                        } else {
                            //otherwise, go back.
                            self.goBack();
                            return false;
                        }
                    }else{//no history
                        var leavePage = confirm('Are you sure you want to leave the project dashboard?');
                        if(!leavePage){
                            return false;
                        }
                    }
                }
            }
        }
        self.readHashLink();
	};



/*-------------------------------------------------------------------->
	2 | FRAMEWORK START
<--------------------------------------------------------------------*/
	this.renderFramework = function(content){
		var html = 
		'<div class="joe-overlay '+((self.specs.compact && ' compact ') || '')+'" data-joeindex="'+this.joe_index+'">'+
			'<div class="joe-overlay-panel">'+
				(content || '')+
			'</div>'+
		//mini	
			'<div class="joe-mini-panel">'+
			'</div>'+
		'</div>';
		return html;
	};
	
	
	this.populateFramework = function(data,setts){
		self.overlay.removeClass('multi-edit');
		var joePopulateBenchmarker = new Benchmarker();
		joePopulateBenchmarker.start;
		logit('------Beginning joe population');
		var specs = setts || {};
		self.current.specs = setts; 
		self.current.data = data;
	//clean copy for later;
		self.current.userSpecs = $.extend({},setts);
	
	//update history 1/2	
		if(!self.current.specs.noHistory){
			self.history.push({
	/*			_joeHistoryTitle:self.overlay.find('.joe-panel-title').html(),
	*/			specs:self.current.userSpecs,
				data:self.current.data
			});
		}
		
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
        (specs.schema && specs.schema.preformat) ||
		specs.preformat ||
		function(d){return d;};
	
	data = specs.preformat(data);	
/*-------------------------
	Object
-------------------------*/	
	//when object passed in
		if($.type(data) == 'object' || datatype =='object'){
			specs.object = data;
			specs.menu = specs.menu || (specs.schema && specs.schema.menu) || self.specs.menu || (specs.multiedit && __defaultMultiButtons) || __defaultObjectButtons;

			specs.mode="object";
			self.current.object = data;
			
		}
		
/*-------------------------
	Lists (Arrays)
-------------------------*/			
	
	//when array passed in	
		listMode = false;
		if($.type(data) == 'array' || datatype =='array'){
			listMode = true;
			specs.list = data;
			specs.menu = specs.listMenu || (specs.schema && specs.schema.listMenu )|| __defaultButtons;//__defaultMultiButtons;
			specs.mode="list";
			//TODO: filter list items here.
			self.current.list = data;

/*-------------------------
 Subsets
 -------------------------*/
			//setup subsets
			self.current.subsets = setts.subsets || (specs.schema && specs.schema.subsets)||null;
			if(typeof self.current.subsets == 'function'){
				self.current.subsets = self.current.subsets(); 
			}
        //a current subset selected
            if(self.current.specs.subset && self.current.subsets.where({name:specs.subset}).length){
                    self.current.subset = self.current.subsets.where({name:specs.subset})[0]||false;
            }else{
                //select deaulf subset if it exists
                self.current.subset =
                    (self.current.subsets &&  self.current.subsets.where({default:true})[0])||null;
            }



/*-------------------------
 Sorting
 -------------------------*/
            //setup sorting
            self.current.sorter = setts.sorter || (self.current.subset && self.current.subset.sorter)||(specs.schema && specs.schema.sorter)|| 'name';
            if($.type(self.current.sorter) == 'string'){self.current.sorter = [self.current.sorter];}

            //self.current.object = null;

		}

/*-------------------------
 Submenu
 -------------------------*/
    if(specs.mode == 'list') {
        self.current.submenu =
            self.current.specs.listsubmenu ||
            self.current.specs.submenu ||
            (specs.schema && specs.schema.listSubMenu) ||
            self.specs.listSubMenu;
    }else{
        self.current.submenu =
            self.current.specs.submenu ||
            (specs.schema && specs.schema.subMenu) ||
            self.specs.subMenu;
    }

        if(self.current.submenu == 'none'){
            self.current.submenu = null;
        }

/*-------------------------
	Rendering
-------------------------*/	
	//when rendering passed in
		if($.type(data) == 'string' && datatype == 'rendering'){
			specs.rendering = data;
			
			specs.menu = [__replaceBtn__];
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
		specs.listWindowTitle = (
            specs.list
            && (
                specs._listMenuTitle || specs._listWindowTitle
                || (specs.schema && (specs.schema._listMenuTitle || specs.schema._listWindowTitle))
            )
            );
        specs.title =(
			title 
			|| specs.listWindowTitle
			|| (specs.schema && specs.schema._title)  || "Viewing "+specs.mode.capitalize());		
	//setup profile
		specs.profile = (profile)? 
			(self.specs.profiles[profile]||self.specs.joeprofile):
			self.specs.joeprofile;	
			
		self.current.profile = specs.profile;


	//cleanup variables
		self.cleanUp();
		var html = 
			self.renderEditorHeader(specs)+
            self.renderEditorSubmenu(specs)+
            self.renderEditorContent(specs)+
			self.renderEditorFooter(specs)+
			self.renderMessageContainer();
		    self.overlay.find('.joe-overlay-panel').html(html);
		//$('.joe-overlay-panel').html(html);
	
	//update history 2/2	
		if(!self.current.specs.noHistory && self.history.length){
			$.extend({_joeHistoryTitle:self.overlay.find('.joe-panel-title').html()},self.history[self.history.length-1]);
		}



    //update hashlink
        self.updateHashLink();
		logit('Joe Populated in '+joePopulateBenchmarker.stop()+' seconds');
		return html;
	};
/*-------------------------------------------------------------------->
 2e | FRAMEWORK END
 <--------------------------------------------------------------------*/


/*----------------------------->
	A | Header
<-----------------------------*/	
	this.renderEditorHeader = function(specs){
		specs = specs || {};
		var titleObj = self.current.object;
		if(specs.list){
            var lcount = specs.list.length;
            if(self.current.subset){
             lcount = specs.list.where(self.current.subset.filter).length;
            }
			titleObj = $.extend({},self.current.object,{_listCount:lcount||'0'});
		}
        self.current.title = specs.title || 'Json Object Editor';
		var title = fillTemplate(self.current.title,titleObj);

		action = specs.action||'onclick="getJoe('+self.joe_index+').closeButtonAction()"';
		
		function renderHeaderBackButton(){
			var html = '';
			if(self.history.length > 1){
				html+= '<div class="joe-header-back-btn" onclick="getJoe('+self.joe_index+').goBack();"> < </div>';
			}
			return html;
		}
		//.replace(/(<([^>]+)>)/ig,"");
		var html = 
		'<div class="joe-panel-header">'+
			((specs.schema && specs.schema.subsets && self.renderSubsetselector(specs.schema)) || (specs.subsets && self.renderSubsetselector(specs)) || '')+
			renderHeaderBackButton()+
			'<div class="joe-panel-title">'+
				(('<div>'+title+'</div>').toDomElement().innerText || title || 'Json Object Editor')+
			'</div>'+
			'<div class="joe-panel-close" '+action+'></div>'+	
			'<div class="clear"></div>'+
		'</div>';
		return html;
	};
	this.closeButtonAction = function(){
		self.history = [];
        self.panel.addClass('centerscreen-collapse');
        self.hide(500);

        self.clearAuxiliaryData();
	};
	this.goBack = function(){
		self.history.pop();
		var joespecs = self.history.pop();
		if(!joespecs){
			self.hide();
            self.clearAuxiliaryData();
			return;
		}
		//[self.history.length];
		self.show(joespecs.data,joespecs.specs);
	};

    this.clearAuxiliaryData = function(){

        self.current.list = null;
        self.current.subsets = null;
        self.current.subset = null;

    };
	this.cleanUp = function(){
		for (var p in _joe.ace_editors){
			_joe.ace_editors[p].destroy();
		}
		_joe.ace_editors = {};
	};
/*----------------------------->
 B | SubMenu
 <-----------------------------*/
    this.renderEditorSubmenu = function(specs) {
        if(!self.current.submenu){
            return '';
        }
        var subSpecs = {
            search:true
        };
        var userSubmenu = ($.type(self.current.submenu) != 'object')?{}:self.current.submenu;
        $.extend(subSpecs,userSubmenu);

        var submenu =
        '<div class="joe-panel-submenu">'
            +((subSpecs.search && self.renderSubmenuSearch(subSpecs.search))||'')
        +'</div>';
        return submenu;
    };

    this.renderSubmenuSearch = function(s){
        var action =' onkeyup="_joe.filterListFromSubmenu(this);" ';
        var submenusearch =
            "<div class='joe-submenu-search'>"
            +'<input class="joe-submenu-search-field" '+action+' placeholder="find" />'
            +"</div>";
        return submenusearch;
    };
    this.searchTimeout;
    this.filterListFromSubmenu = function(dom){

        clearTimeout(self.searchTimeout );
        self.searchTimeout = setTimeout(function(){searchFilter(dom);},400);
        function searchFilter(dom){
            var searchBM = new Benchmarker();
            var value=dom.value.toLowerCase();

            var testable;
            var listables = (self.current.subset)?self.current.list.where(self.current.subset.filter):self.current.list;
            var searchables = self.current.schema && self.current.schema.searchables;
            logit('search where in '+searchBM.stop()+' seconds');
            currentListItems = listables.filter(function(i){
                testable = '';
                if(searchables){//use searchable array
                    searchables.map(function(s){
                        testable+=i[s]+' ';
                    });
                    return (testable.toLowerCase().indexOf(value) != -1);
                }
                    testable = self.renderListItem(i,true);
                    return (__removeTags(testable).toLowerCase().indexOf(value) != -1);


            });

            logit('search filter in '+searchBM.stop()+' seconds');
            self.panel.find('.joe-panel-content').html(self.renderListItems(currentListItems,0,self.specs.dynamicDisplay));
            var titleObj = $.extend({},self.current.object,{_listCount:currentListItems.length||'0'});
            self.panel.find('.joe-panel-title').html(fillTemplate(self.current.title,titleObj));

        }

    };
/*----------------------------->
	C | Content
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
				content = self.renderObjectContent(specs);
			break;
	
			
		}
        var submenu = (self.current.submenu)?' with-submenu ':'';
        var scroll = 'onscroll="getJoe('+self.joe_index+').onListContentScroll(this);"'
		var html = 
		'<div class="joe-panel-content joe-inset '+submenu+'" '+((listMode && scroll)||'')+'>'+
			content+
		'</div>';
		return html;
	};

	this.renderTextContent = function(specs){
		specs = specs || {};
		var text = specs.text || specs.object || '';
		var html = '<div class="joe-text-content">'+text+'</div>';
		return html;
		
	};
	
	this.renderHTMLContent = function(specs){
		specs = specs || {};
		var html = '<textarea class="joe-rendering-field">'+(specs.rendering || '')+'</textarea>';
		return html;
		
	};

/*--
//LIST
--*/

    var currentListItems;
	this.renderListContent = function(specs){
		var wBM = new Benchmarker();

        currentListItems = [];
		self.current.selectedListItems=[];
		self.current.anchorListItem=null;
		
		specs = specs || {};
		var schema = specs.schema;
		var list = specs.list || [];
		var html = '';
        var filteredList;
        list = list.sortBy(self.current.sorter);
		logit('list sort complete in '+wBM.stop()+' seconds');
		var numItemsToRender;
        if(!self.current.subset){
            currentListItems = list;
		}
		else{
            filteredList = list.where(self.current.subset.filter);
            currentListItems = filteredList;
			logit('list where complete in '+wBM.stop()+' seconds');
		}

        numItemsToRender = self.specs.dynamicDisplay || currentListItems.length;
        html+= self.renderListItems(currentListItems,0,numItemsToRender);


		logit('list complete in '+wBM.stop()+' seconds');
		return html;
		
	};

    this.renderListItems = function(items,start,stop){
        var html = '';
        var listItem;
        var items = items || currentListItems;
        var start = start || 0;
        var stop = stop || currentListItems.length -1;

        for(var i=start;i <stop;i++){
            listItem = items[i];
            if(listItem) {
                html += self.renderListItem(listItem);
            }
        }

        return html;
    };

    this.onListContentScroll = function(domObj){
     // logit(domObj);
        var listItem = self.panel.find('.joe-panel-content-option').last()[0];
        var currentItemCount = self.panel.find('.joe-panel-content-option').length;
        if( currentItemCount== currentListItems.length){
           // logit('all items showing');
            return;
        }
            //$('.app-list-group-content').not('.events-group').not('.collapsed').find('.app-list-divider-count').prev('.app-list-item');
        //var listItem;
        var viewPortHeight = self.panel.find('.joe-panel-content').height();
        var html = '';
        try {
                if (listItem.getBoundingClientRect().bottom - 500 < viewPortHeight) {
                    //self.generateGroupContent(groupIndex);
                   // logit('more content coming');
                    html +=self.renderListItems(null,currentItemCount,currentItemCount+self.specs.dynamicDisplay);
                    self.panel.find('.joe-panel-content').append(html);
                }
        }catch(e){
            alert('error scrolling for more content: \n'+e);
        }
    };
/*--
     //OBJECT
 --*/
	//TODO: Add configed listeneres via jquery not strings
	this.renderObjectContent = function(specs){
		specs = specs || {};
		var object = specs.object;
		var fields = '';
		var propObj;
		var fieldProp;
		if(!specs.schema || !specs.schema.fields){//no schema use items as own schema
			for( var prop in object){
				if(object.hasOwnProperty(prop)){
					propObj = $.extend({
						name:prop,
						type:'text',
                        //type:($.type(object[prop]) == 'object')?'rendering':'text',
						value:object[prop]	
					},
					self.fields[prop],				
					//overwrite with value
					{value:object[prop]}
					);
					
					fields += self.renderObjectField(propObj);
				}
			}
		}
		else{
			(specs.schema.fields||[]).map(function(prop){

				fields += self.renderObjectPropFieldUI(prop,specs);
				//prop is the property name

		/*		if($.type(prop) == "string") {
                    fieldProp = self.fields[prop] || {};
                    //merge all the items
                    propObj = $.extend(
                        {
                            name: prop,
                            type: 'text'
                        },
                        {
                            onblur: specs.schema.onblur,
                            onchange: specs.schema.onchange,
                            onkeypress: specs.schema.onkeypress,
                            onkeyup: specs.schema.onkeyup

                        },
                        fieldProp,
                        //overwrite with value
                        {value: object[prop]}
                    );

                    fields += self.renderObjectField(propObj);
                } else if($.type(prop) == "object"){
                    if(prop.label){
                        fields += self.renderContentLabel(prop);
                    }
                }
		*/
			}); //end map
			
		}
		var html = '<div class="joe-object-content">'+fields+'<div class="clear"></div></div>';
		return html;
	};

	this.rerenderField = function(fieldname){
		var fields = self.renderObjectPropFieldUI(fieldname);
		$('.joe-object-field[data-name='+fieldname+']').replaceWith(fields);
	};

	self.renderObjectPropFieldUI = function(prop,specs){
		//var prop = fieldname;
		var fields = '';

		var schemaspec = specs || self.current.schema;
		if($.type(prop) == "string") {
			//var fieldProp = self.fields[prop] || {};
			var fieldProp = $.extend({},self.fields[prop] || {});
			//merge all the items
			var propObj = $.extend(
				{
					name: prop,
					type: 'text'
				},
				{
					onblur: schemaspec.onblur,
					onchange: schemaspec.onchange,
					onkeypress: schemaspec.onkeypress,
					onkeyup: schemaspec.onkeyup

				},
				fieldProp,
				//overwrite with value
				{value: self.current.object[prop]}
			);

			if(self.constructObjectFromFields()[prop] !== undefined){

				fieldProp.value = self.constructObjectFromFields()[prop]
			}
			fields += self.renderObjectField(propObj);
		}else if($.type(prop) == "object"){
			if(prop.label){
				fields += self.renderContentLabel(prop);
			}
		}

		return fields;

	};
//PROP LABELS
    self.renderContentLabel = function(specs){
        var html="<div class='joe-content-label'>"+fillTemplate(specs.label,self.current.object)+"</div>";
        return html;
    };




/*----------------------------->
	D | Footer
<-----------------------------*/	
	this.renderEditorFooter = function(specs){
		specs = specs || this.specs || {};
		var menu = (listMode && (specs.schema && specs.schema.listmenu)||specs.listmenu) ||//list mode
		specs.menu ||  (specs.multiedit && __defaultMultiButtons) || __defaultObjectButtons;
		if(typeof menu =='function'){
			menu = menu();
		}
		
		var title = specs.title || 'untitled';
		var display,action;
		
		var html = 
		'<div class="joe-panel-footer">'+
			'<div class="joe-panel-menu">';

			menu.map(function(m){
				html+= self.renderFooterMenuItem(m);
			
			},this);
			if(self.current.list && $.type(self.current.data) == 'array'){
				html+= self.renderFooterMenuItem(__selectAllBtn__);
				html+= self.renderFooterMenuItem(
				{	label:'Multi-Edit', 
					name:'multiEdit', 
					css:'joe-multi-only', 
					action:'getJoe('+self.joe_index+').editMultiple()'}
				);
			}
				
		html+=
			__clearDiv__+	
			'</div>'+
		'</div>';
		return html;
	};
	
	this.renderFooterMenuItem=function(m){//passes a menu item
		var display,action,html='';
        if(m.condition && !m.condition(m,self.current.object)){
            return '';
        };
		display = m.label || m.name;
		action = m.action || 'alert(\''+display+'\')';
		html+= '<div class="joe-button joe-footer-button '+(m.css ||'')+'" onclick="'+action+'" data-btnid="'+m.name+'" >'+display+'</div>';
		return html;
	};
/*-------------------------------------------------------------------->
	3 | OBJECT FORM
<--------------------------------------------------------------------*/
	var preProp;
	var prePropWidths = 0;
	this.renderObjectField = function(prop){
		//field requires {name,type}

		//set default value
		if(prop.value == undefined && prop.default != undefined){
			prop.value = prop.default;
		}
        if($.type(prop.value) == "function"){
			try {
				prop.value = prop.value(self.current.object);
			}catch(e){
				logit('error with propoerty "'+(prop.name||'')+'": '+e);
				prop.value= prop.value;
			}
		}
		var hidden = (prop.hidden)?'hidden':'';
		
		var html ='';
		
	//add clear div if the previous fields are floated.
		if(preProp){
		//TODO:deal with 50,50,50,50 four way float
			//prePropWidths
			if(preProp.width && !prop.width){
			//if((preProp.width && !prop.width)||){
				html+='<div class="clear"></div>';
			}
		}
		if(prop.width){
			html+='<div class="joe-field-container" style="width:'+prop.width+';">';
		}

		html+=	
			'<div class="joe-object-field '+hidden+' '+prop.type+'-field " data-type="'+prop.type+'" data-name="'+prop.name+'">'+
			'<label class="joe-field-label">'
                +fillTemplate((prop.display||prop.label||prop.name),self.current.object)
				+self.renderFieldTooltip(prop)
            +'</label>';

	//add multi-edit checkbox	
		if(self.current.userSpecs.multiedit){
			html+='<div class="joe-field-multiedit-toggle" onclick="$(this).parent().toggleClass(\'multi-selected\')"></div>';	
		}

		html += self.selectAndRenderFieldType(prop);

		html+='</div>';
		if(prop.width){
			html+='</div>';
		}
		
		preProp = prop;
		
		return html;
	};

	this.renderFieldTooltip = function(prop){
		if(!prop.tooltip){
			return '';
		}
		//var tooltip_html = '<p class="joe-tooltip">'+prop.tooltip+'</p>';
		var tooltip_html = '<span class="joe-field-tooltip" title="'+__removeTags(prop.tooltip)+'">i</span>';

		return tooltip_html;
	};

	this.selectAndRenderFieldType = function(prop){
		var joeFieldBenchmarker = new Benchmarker();
		joeFieldBenchmarker.start;
		var html = '';
		switch(prop.type){
			case 'select':
				html+= self.renderSelectField(prop);
				break;
			case 'multisort':
			case 'multisorter':
				html+= self.renderMultisorterField(prop);
				break;
			case 'sorter':
				html+= self.renderSorterField(prop);
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

			/*            case 'textarea':
			 prop.type = 'rendering';*/
			case 'code':
				html+= self.renderCodeField(prop);
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

			case 'image':
			case 'img':
				html+= self.renderImageField(prop);
				break;

			case 'buckets':
				html+= self.renderBucketsField(prop);
				break;

			case 'content':
				html+= self.renderContentField(prop);
				break;

			case 'url':
				html+= self.renderURLField(prop);
				break;

			case 'objectList':
				html+= self.renderObjectListField(prop);
				break;

			case 'tags':
				html+= self.renderTagsField(prop);
				break;

			default:
				html+= self.renderTextField(prop);
				break;
		}

		logit('Joe rendered '+(prop.name||"a field")+' in '+joeFieldBenchmarker.stop()+' seconds');
		return html;

	};
/*----------------------------->
	0 | Event Handlers
<-----------------------------*/
	this.getActionString = function(evt,prop){
        var evt = prop[evt];
        if(!evt){ return '';}
        if($.type(evt) == "string"){
           return evt;
        }
		var str = (prop[evt])? ' '+self.functionName(prop[evt])+'(this); ' : '' ;
		return str;
	};
	
	
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
	
	};
	
/*----------------------------->
	A | Text Input
<-----------------------------*/
	this.renderTextField = function(prop){
		var autocomplete;
		if(prop.autocomplete && prop.values){

            if(typeof prop.values == "function"){
                prop.values = prop.values(self.current.object);
            }
            if($.type(prop.values) != 'array'){
                prop.values = [prop.values];
            }
            autocomplete =true;
		}

		//TODO: Use jquery ui autocomplete
		var html=
		'<input class="joe-text-field joe-field" type="text"  name="'+prop.name+'" value="'+(prop.value || '')+'" '
			+self.renderFieldAttributes(prop)
			+((autocomplete && 
				' onblur="getJoe('+self.joe_index+').hideTextFieldAutoComplete($(this));"'
				+' onkeyup="getJoe('+self.joe_index+').showTextFieldAutoComplete($(this));"'
				) 
			||''
			)
		+' />';
		
		if(autocomplete){
			html+='<div class="joe-text-autocomplete">';
            var ac_opt;
			for(var v = 0, len = prop.values.length; v < len; v++){
                ac_opt = ($.type(prop.values[v]) == "object")?
                    prop.values[v]:
                    {id:prop.values[v],name:prop.values[v]};
				html+='<div class="joe-text-autocomplete-option" '
					+'onclick="getJoe('+self.joe_index+').autocompleteTextFieldOptionClick(this);" '
                    +'data-value="'+(ac_opt._id||ac_opt.id||ac_opt.name)+'">'+ac_opt.name+'</div>';
			}
			
			html+='</div>';	
		}
		//add onblur: hide panel

		return html;
	};
	
	this.showTextFieldAutoComplete = function(dom){
		var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.find('.joe-text-autocomplete-option').each(function(i,obj){
			self.checkAutocompleteValue(dom.val(),obj.innerHTML,obj);
		});
		autocomplete.addClass('active');
	};
	this.hideTextFieldAutoComplete = function(dom){
		var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.removeClass('active');
	};
	
	this.autocompleteTextFieldOptionClick = function(dom){
		$(dom).parent().prev('.joe-text-field').val($(dom).html());
		$(dom).parent().removeClass('active');
		//$(dom).previous('.joe-text-field').val($(dom).html());
	};
	
	this.checkAutocompleteValue = function(needle,haystack,dom){
		var d = $(dom);
		if(haystack.indexOf(needle) != -1 || !needle){
			d.addClass('visible');
		}else{
			d.removeClass('visible');	
		}
	};
	

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
			self.renderFieldAttributes(prop,{onblur:'getJoe('+self.joe_index+').returnNumber(this);'})+
		' />';
		return html;
	};

	this.returnNumber = function(dom){
		if(!$(dom).val()){return;}
		$(dom).val(parseFloat($(dom).val()));
	};
		
	this.renderIntegerField = function(prop){
		
		/*var disabled = (profile.lockedFields.indexOf(prop.name) != -1 || prop.locked)?
			'disabled':'';
	*/
	//bluraction
		//var bluraction = 'onblur="_joe.returnInt(this); '+self.getActionString('onblur',prop)+'"';
		
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-int-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+
			self.renderFieldAttributes(prop,{onblur:'getJoe('+self.joe_index+').returnInt(this);'})+
		' />';
		return html;
	};
	
	this.returnInt = function(dom){
		if(!$(dom).val()){return;}
		$(dom).val(parseInt($(dom).val()));
	
	};

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
		var selectSize = prop.size || ((valObjs.length*.5) > 10)? 10 : valObjs.length/2;
		
		if(!prop.size && !prop.multiple){
			selectSize = 1;
		}
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<select class="joe-select-field joe-field" name="'+prop.name+'" value="'+(prop.value || '')+'" size="'+selectSize+'"'+
			self.renderFieldAttributes(prop)+
			multiple+
		' >';


        var template = prop.template || '';
		var val;
        var optionVal;
			valObjs.map(function(v){
                optionVal = (template)?fillTemplate(template,v):(v.display||v.label||v.name);
				val = (prop.idprop && v[prop.idprop])||v.value||v.name||'';
				if($.type(prop.value) == 'array'){
					selected = '';
					selected = (prop.value.indexOf(val) != -1)?'selected':'';
					
					/*prop.value.map(function(pval){
						if(pval.indexOf)
					});*/
				}else{
					selected = (prop.value == val)?'selected':'';
				}
				html += '<option value="'+val+'" '+selected+'>'+optionVal+'</option>'
			});
			
		html+='</select>';
		return html;
	};

/*----------------------------->
	D | Date Field
<-----------------------------*/
	this.renderDateField = function(prop){
				var html=
		'<input class="joe-date-field joe-field" type="text"  name="'+prop.name+'" value="'+(prop.value || '')+'" '+
			self.renderFieldAttributes(prop)+
		' />';
		
		return html;
	};
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
			+'onload="getJoe('+self.joe_index+').initGeoMap(this);"></div>'
		+'<input class="joe-geo-field joe-field" type="text" value="'+val+'" name="'+prop.name+'"/>'
		+'<script type="text/javascript">setTimeout(function(){getJoe('+self.joe_index+').initGeoMap("'+mapDiv+'");},100)</script>'
		;
		
		return html;
	};
	
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
		
		map.on('click', self.onMapClick);
		map.prop = $('#'+id).attr('name');
		if(mapspecs.value){
			//var ll = eval(mapspecs.value);
			self.addMapIcon(map,mapspecs.value);
		}
	};
	
	this.onMapClick = function(e){
		var map = (e.type=="click")?e.target : this.map;
		
		//map.setView(e.latlng);
		var ll = (e && e.latlng) || this.getLatLng();
		map.setView(ll);
		
		if(e.type=="dragend"){
			
		}else if(map.marker){
			map.marker.setLatLng(ll);
		}else{
			self.addMapIcon(map,ll);
		}
		$('input[name='+map.prop+']').val('['+ll.lat+','+ll.lng+']');
	};
	
	this.addMapIcon = function(map,latlng,specs){
		specs = specs || {};
		var myIcon = L.icon({
			iconUrl: specs.icon||'/JsonObjectEditor/img/mapstar.png',
			iconSize: [30, 30]
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
		map.marker.on('dragend', self.onMapClick);
	};
/*----------------------------->
	F | Boolean
<-----------------------------*/
	this.renderBooleanField = function(prop){
		var profile = self.current.profile;
		
		var html=
		//'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'
            '<label for="joe_checkbox-'+prop.name+'">'
		+'<input class="joe-boolean-field joe-field" type="checkbox" name="'+prop.name+'" id="joe_checkbox-'+prop.name+'" '
			+(prop.value == true&&'checked' || '')
			+self.renderFieldAttributes(prop)
		+' /> <small>'
            +(prop.label ||'') +'</small></label>';
		return html;
	};


/*----------------------------->
	G | Guid
<-----------------------------*/
	this.renderGuidField = function(prop){
		var profile = self.current.profile;
		
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-guid-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || cuid())+'"  disabled />';
		return html;
	};
	
/*----------------------------->
	H | Sorter
<-----------------------------*/
this.renderSorterField = function(prop){
	/*	
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
	
		
		var val;
		var opt=[];
		var sel = [];
			valObjs.map(function(v){
				val = v.value||v.name||'';
				if($.type(prop.value) == 'array'){
					selected = '';
					selected = (prop.value.indexOf(val) != -1)?'selected':'';

				}else{
					selected = (prop.value == val)?'selected':'';
				}
				html += '<option value="'+val+'" '+selected+'>'+(v.display||v.label||v.name)+'</option>'	
			});
		var selected;
		
		var html=
		'<div class="joe-multisorter-field joe-field" name="'+prop.name+'">'+
		'<ul class="joe-multisorter-bin options-bin"></ul>'+
		'<ul class="joe-multisorter-bin selections-bin"></ul>'+
		
		'<ul class="joe-multisorter-field joe-field" name="'+prop.name+'" '+
			//self.renderFieldAttributes(prop)+
		' >';

		
		
			
		html+='</div>';
		return html;*/
	};
/*----------------------------->
	I | Image
<-----------------------------*/
	this.renderImageField = function(prop){
		var html=
		'<input class="joe-image-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'" '
		+	self.renderFieldAttributes(prop)
		+' onkeyup="_joe.updateImageFieldImage(this);"/>'
		+'<img class="joe-image-field-image" src="'+(prop.value||'')+'"/>'
		+'<span class="joe-image-field-size"></span>';

		return html;
	};
	
	this.updateImageFieldImage = function(dom){
		var src = $(dom).val();
		//var img = $(dom).next('.joe-image-field-image');
		var img = $(dom).parent().find('.joe-image-field-image');
		img.attr('src',src);
		$(dom).next('.joe-image-field-size').html(img.width() + 'w x '+img.height()+'h');
		
	};
		
/*----------------------------->
	J | Multisorter
<-----------------------------*/
	this.renderMultisorterField = function(prop){
		
		var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
		var valObjs = [];
		
		
	//sort values into selected or option	
		var val;
		var optionsHtml ='';
		var selectionsHtml ='';
		
		
		var idprop = prop['idprop'] ||'id'||'_id';
		var template = prop.template || '${name} (${'+idprop+'})'; 
		var value = prop.value || [];
		var selectionsArray = Array(value.length);
		var li;
		
		
		function renderMultisorterOption(v){
			var html = '<li data-id="'+v[idprop]+'" ondblclick="_joe.toggleMultisorterBin(this);">'+fillTemplate(template,v)+'</li>';
			return html;
		}
		
	//render selected list
	/*	values.map(function(v){
		//li = renderMultisorterOption(v);//'<li data-id="'+v[idprop]+'" onclick="_joe.toggleMultisorterBin(this);">'+fillTemplate(template,v)+'</li>';
		selectionsHtml += renderMultisorterOption(v);
		});*/
		
		var val_index;
	//render options list
		if(!values){
			values = [];
			//todo: do some error reporting here.
		}
		values.map(function(v){
			li = renderMultisorterOption(v);//'<li data-id="'+v[idprop]+'" onclick="_joe.toggleMultisorterBin(this);">'+fillTemplate(template,v)+'</li>';
			val_index = value.indexOf(v[idprop]);
			if(val_index != -1){//currently selected
				//selectionsHtml += li;
				selectionsArray[val_index] = li;

			}else{
				optionsHtml += li;
			}
		});
		
		var selectionsHtml = selectionsArray.join('');
		
		var html=
		'<div class="joe-multisorter-field joe-field" name="'+prop.name+'" data-ftype="multisorter" data-multiple="'+(prop.allowMultiple||'false')+'">'+

			'<div class="joe-filter-field-holder"><input type="text"class="" onkeyup="_joe.filterSorterOptions(this);"/></div>'+
			'<p class="joe-tooltip"> double click or drag item to switch columns.</p>'+
			'<ul class="joe-multisorter-bin options-bin">'+optionsHtml+'</ul>'+
			'<ul class="joe-multisorter-bin selections-bin">'+selectionsHtml+'</ul>'+
			__clearDiv__
	
		+'</div>';
		return html;
	};
	this.filterSorterOptions = function(dom){
		var query = $(dom).val().toLowerCase();
		$(dom).parent().next('.joe-multisorter-bin').find('li').each(function(){$(this).toggle($(this).html().toLowerCase().indexOf(query) != -1 );});
		logit(query);
		
	};
	this.toggleMultisorterBin = function(dom) {
        var id = $(dom).data('id');
        var parent = $(dom).parents('.joe-multisorter-bin');
        var multisorter = parent.parents('.joe-multisorter-field');
        var target = parent.siblings('.joe-multisorter-bin');

        var newDom = parent.find('li[data-id=' + id + ']').detach();

    //detach if no multiples allowed.
       /* if (!multisorter.data('multiple')) {
            newDom
        }*/

		target.prepend(newDom);

/*	//reset divs
	var opts = $.unique($('.joe-multisorter-bin.options-bin').find('li'))	
	$('.joe-multisorter-bin.options-bin').empty();
	$('.joe-multisorter-bin.options-bin').html(opts);*/
	
		
	};
/*----------------------------->
	K | Buckets
<-----------------------------*/
	//TODO: progressively render bucket options.
	this.renderBucketsField = function(prop){

		var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
		var valObjs = [];
		
	

	//sort values into selected or option	
		var val;
		var bucketCount = (typeof prop.bucketCount =="function")?prop.bucketCount():prop.bucketCount || 3;
		var optionsHtml ='';
		var bucketsHtml =[];
		var value = prop.value || [[],[],[]];
	
	//add arrays to values
		for(var i = 0; i < bucketCount; i++){
			bucketsHtml.push('');
			if(!value[i]){
				value.push([]);
			}
		}
		
		var idprop = prop[idprop] ||'id'||'_id';
		var template = prop.template || '${name} <br/><small>(${'+idprop+'})</small>'; 
		
		
		var lihtml;
		var selected;
		
		//populate selected buckets
		var foundItem;
		var bucketItem;
		var selectedIDs=[];
			for(var i = 0; i < bucketCount; i++){
				for(var li = 0; li < value[i].length; li++){
					bucketItem = value[i][li];
					//find object in values
					foundItem = values.filter(function(v){
						return v[idprop] == bucketItem;
					})[0]||false;
					if(!foundItem){
						foundItem = {};
						foundItem[idprop] = li;
					}
					selectedIDs.push(bucketItem);
					lihtml = '<li data-id="'+foundItem[idprop]+'" >'+fillTemplate(template,foundItem)+'<div class="joe-bucket-delete cui-block joe-icon" onclick="$(this).parent().remove()"></div></li>';
					bucketsHtml[i] += lihtml;
				}
			}

			values.map(function(v){
				lihtml = '<li data-id="'+v[idprop]+'" >'+fillTemplate(template,v)+'<div class="joe-bucket-delete cui-block joe-icon" onclick="$(this).parent().remove()"></div></li>';
				selected = false;
			//loop over buckets	
				/*if(!prop.allowMultiple){
					for(var i = 0; i < bucketCount; i++){
						if(value[i].indexOf(v[idprop]) != -1){//currently selected
							bucketsHtml[i] += lihtml;
						}
					}
				}*/
				if(selectedIDs.indexOf(v) ==-1 || prop.allowMultiple){
					optionsHtml += lihtml;
				}
			});
		
		function renderBucket(id){
			return '<ul class="joe-buckets-bin selections-bin">'+bucketsHtml[id]+'</ul>';
		}
	//renderHTML
		var html=
		'<div class="joe-buckets-field joe-field" name="'+prop.name+'" data-ftype="buckets">'
			+'<div class="joe-filter-field-holder"><input type="text"class="" onkeyup="_joe.filterBucketOptions(this);"/></div>'
			+'<div class="joe-buckets-field-holder" style="width:25%;">'
				+'<ul class="joe-buckets-bin options-bin '+(prop.allowMultiple && 'allow-multiple' || '')+'">'+optionsHtml+'</ul>'
			+'</div>'
			+'<div class="joe-buckets-field-holder" style="width:75%;">';
				bucketsHtml.map(function(b,i){
					html+=renderBucket(i);
				});
				//+'<ul class="joe-buckets-bin selections-bin">'+bucketsHtml+'</ul>'
				
			
		html+=	__clearDiv__
			+'</div>'//end buckets field holder
			+__clearDiv__
		+'</div>';
		

		return html;
	};
	this.filterBucketOptions = function(dom){
		var query = $(dom).val().toLowerCase();
		$(dom).parents('.joe-buckets-field').find('.options-bin').find('li').each(function(){$(this).toggle($(this).html().toLowerCase().indexOf(query) != -1 );});
		logit(query);
		
	};


/*----------------------------->
 L | Content
 <-----------------------------*/
    this.renderContentField = function(prop){
        var html = '';
		var itemObj = self.current.object;
		var idProp = self.getIDProp();
		var constructedItem = self.constructObjectFromFields();
		if(!self.current.object[idProp] ||(constructedItem[idProp] && constructedItem[idProp] == self.current.object[idProp])){
			itemObj = constructedItem;
		}
        if(prop.run){
            html+= prop.run(itemObj,prop)||'';
        }else if(prop.template){
            html += fillTemplate(prop.template,itemObj);
        }
        return html;

    };
/*----------------------------->
 M | URL
 <-----------------------------*/
    this.renderURLField = function(prop){
        var profile = self.current.profile;
            var disabled = (prop.locked &&'disabled')||'';
        var html=
            '<div class="joe-button" onclick="_joe.gotoFieldURL(this);">view</div>'
            +'<input class="joe-url-field joe-field" type="text" name="'+prop.name+'" value="'+(prop.value || '')+'"  '+disabled+' />'
       + __clearDiv__;
        return html;
    };
    this.gotoFieldURL = function(dom){
        var url = $(dom).siblings('.joe-url-field').val();
        window.open(url);
    };


/*----------------------------->
 O | Object List Field
 <-----------------------------*/

    this.renderObjectListField = function(prop){
        var html ="<table class='joe-objectlist-table'>"
            +self.renderObjectListProperties(prop)
            +self.renderObjectListObjects(prop)
        //render a (table/divs) of properties
        //cross reference with array properties.
        //make sortable ?
        +"</table>";
        return html;
    };
    this.objectlistdefaultproperties = ['name','_id'];
//render headers
    this.renderObjectListProperties = function(prop){
        var properties = prop.properties || self.objectlistdefaultproperties;
        var property;
        var subprop;
        var html = '<thead><tr><th class="joe-objectlist-object-row-handle-header"></th>';
        for(var p = 0,tot = properties.length; p<tot;p++){
            subprop = properties[p];
            subprop = ($.type(properties[p]) == "string")?{name:properties[p]}:subprop;
            property = {
                name: subprop.display||subprop.name,
                type: subprop.type||'text'
            };

            html+="<th data-subprop='"+subprop.name+"'>"
                +(subprop.label || subprop.name)+"</th>";
        }

        html+="</tr></thead>";
        return html;
    };

//render objects
    this.renderObjectListObjects = function(prop){
        var objects = self.current.object[prop.name] || [];
        var properties = prop.properties || self.objectlistdefaultproperties;

        var html = '<tbody id="joe-objectist-table">';
        var objHtml = '';
        var obj;
        for(var o = 0,objecttot = objects.length; o<objecttot;o++){
            obj = objects[o];
            html+=self.renderObjectListObject(obj,properties);
        //parse across properties

        }
        html+="</tbody>";
        return html;
    };
    this.renderObjectListObject = function(object,objectListProperties){
        var properties = objectListProperties || self.objectlistdefaultproperties;
        var prop,property;
        var html = "<tr><td class='joe-objectlist-object-row-handle'>|||</td>";

        function renderTextInput(prop){
            var html = '<input type="text" class="joe-objectlist-object-input" style="width:auto;" value="'+prop.value+'"/>';
            return html;
        }

        var renderInput = {
         //   'text':renderTextInput,
            'text':self.renderTextField,
            select:self.renderSelectField
        };

        //show all properties
        //TODO:create template in previous function and then use that to show values?
        for(var p = 0,tot = properties.length; p<tot;p++){
            prop = properties[p];
            prop = ($.type(properties[p]) == "string")?{name:properties[p]}:prop;
            property = $.extend({
                name: prop.name,
                type:prop.type||'text',
                value:object[prop.name] || ''
            },prop);

            html+="<td>"+renderInput[property.type](property)+"</td>";

        }
        html+= '</tr>';



        return html;
    };
/*----------------------------->
 Q | Code Field
 <-----------------------------*/
	this.renderCodeField = function(prop){

		var profile = self.current.profile;
		var height = (prop.height)?'style="height:'+prop.height+';"' : '';
		var code_language = prop.language||'html';
		var editor_id = cuid();
		var html=
			'<div class="joe-ace-holder joe-rendering-field joe-field" '
			+height+' data-ace_id="'+editor_id+'" data-ftype="ace" name="'+prop.name+'">'+
			'<textarea class=""  id="'+editor_id+'"  >'
			+(prop.value || "")
			+'</textarea>'+
			'</div>'+
		'<script>'+
			'var editor = ace.edit("'+editor_id+'");\
			editor.setTheme("ace/theme/tomorrow");\
			editor.getSession().setUseWrapMode(true);\
			editor.getSession().setMode("ace/mode/'+code_language+'");\
			editor.setOptions({\
				enableBasicAutocompletion: true,\
				enableLiveAutocompletion: false\
			});\
			_joe.ace_editors["'+editor_id+'"] = editor;'
		+' </script>';
		return html;
	};
/*----------------------------->
	R | Rendering Field
<-----------------------------*/
	this.renderRenderingField = function(prop){
		var profile = self.current.profile;
        var height = (prop.height)?'style="height:'+prop.height+';"' : '';
		var html=
			'<textarea class="joe-rendering-field joe-field" '+height+' name="'+prop.name+'" >'+(prop.value || "")+'</textarea>';
		return html;
	};
/*----------------------------->
 T | Tags Field
 <-----------------------------*/
	this.renderTagsField = function(prop){
		var profile = self.current.profile;
		var height = (prop.height)?'style="height:'+prop.height+';"' : '';
		var specs = $.extend({},prop,{onblur:'_joe.showMessage($(this).val());'})
		var html= '<div class="joe-tags-container">'
			+self.renderTextField(specs)
			+'<div class="joe-text-input-button">add</div>'
		+'</div>'

		return html;
	};




/*-------------------------------------------------------------------->
	4 | OBJECT LISTS
<--------------------------------------------------------------------*/
	this.renderListItem = function(listItem,quick){
		var listSchema  = $.extend(
			{
				_listID:'id',
                stripeColor:null
			},
			self.current.schema,
			self.current.specs
		);
		
		var idprop = self.getIDProp() // listSchema._listID;
		var id = listItem[idprop] || null;
		//var action = 'onclick="_joe.editObjectFromList(\''+id+'\');"';
		var action = 'onclick="getJoe('+self.joe_index+').listItemClickHandler({dom:this,id:\''+id+'\'});"';

    //add stripe color
        var stripeColor = ($.type(listSchema.stripeColor)=='function')?listSchema.stripeColor(listItem):fillTemplate(listSchema.stripeColor,listItem);
        var stripeHTML ='';
        if(stripeColor){
            stripeHTML = 'style="background-color:'+stripeColor+';"';
        }

    //add background color
        var bgColor = ($.type(listSchema.bgColor)=='function')?listSchema.bgColor(listItem):fillTemplate(listSchema.bgColor,listItem);
        var bgHTML ='';
        if(bgColor){
            bgHTML = 'style="background-color:'+bgColor+';"';
        }

        if(quick){

            var quicktitle = listSchema._listTemplate || listSchema._listTitle || '';
            return fillTemplate(quicktitle,listItem);
        }
        if(!listSchema._listTemplate){
			var title = listSchema._listTitle || listItem.name || id || 'untitled';
            var listItemButtons = '';//<div class="joe-panel-content-option-button fleft">#</div><div class="joe-panel-content-option-button fright">#</div>';
            //list item content
            title="<div class='joe-panel-content-option-content' "+action+">"+title+"<div class='clear'></div></div>";
			var html = '<div class="joe-panel-content-option joe-no-select '+((stripeColor && 'striped')||'')+'"  data-id="'+id+'" >'

                +'<div class="joe-panel-content-option-bg" '+bgHTML+'></div>'
                +'<div class="joe-panel-content-option-stripe" '+stripeHTML+'></div>'
                +listItemButtons
                +fillTemplate(title,listItem)
                +'</div>';
		}
		//if there is a list template
		else{
            var dup = $c.duplicate(listItem);
            dup.action = action;
			html = fillTemplate(listSchema._listTemplate,dup);
		}
		
		return html;
	};
	
	this.listItemClickHandler=function(specs){
		self.current.selectedListItems = [];
		if(!window.event){//firefox fix
			self.editObjectFromList(specs);
		}
		if(!window.event.shiftKey && !window.event.ctrlKey){
			self.editObjectFromList(specs);
		}else if(window.event.ctrlKey){

            if($(specs.dom).hasClass('joe-panel-content-option')){
                $(specs.dom).toggleClass('selected');
            }else{
                $(specs.dom).parents('.joe-panel-content-option').toggleClass('selected');
            }

			$('.joe-panel-content-option.selected').map(function(i,listitem){
				self.current.selectedListItems.push($(listitem).data('id'));
			})
			
		}
		if(self.current.selectedListItems.length){
			$(specs.dom).parents('.joe-overlay-panel').addClass('multi-edit');
		}else{
			$(specs.dom).parents('.joe-overlay-panel').removeClass('multi-edit');
		}
	};
	
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
		/*self.populateFramework(object,setts);
		self.overlay.addClass('active');*/
		goJoe(object,setts);
	};
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
				$.extend(protoItem,i);
				items.push(i);
			}
		});
		
		goJoe(protoItem,{title:'Multi-Edit '+(self.current.schema._title||'')+': '+items.length+' items',schema:(self.current.schema||null),multiedit:true});
		//buttons
			//delete multiple
			//save multiple
		
		//combine object on save	
	};
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
		
	};
/*----------------------------->
	List Subsets
<-----------------------------*/		
	this.renderSubsetselector = function(specs){
		if(!listMode){
			return '';
		}
		var html=
		'<div class="joe-subset-selector" >'
			+self.renderSubsetSelectorOptions(specs)
		+'</div>';
		return html;
	};
	
	this.renderSubsetSelectorOptions = function(specs){
		var subsets = self.current.subsets;
		if(typeof subsets == 'function'){
			subsets = subsets();
		}
		function renderOption(opt){
			var html='<div class="selector-option" onclick="getJoe('+self.joe_index+').selectSubset(\''+(opt.id||opt.name||'')+'\');">'+opt.name+'</div>';
			return html;
		}
		if(self.current.specs.subset){
			self.current.subset = subsets.filter(function(s){
				s.id = s.id || s.name;
				return s.id == self.current.specs.subset;
			})[0]||false;
		}
		var subsetlabel = (self.current.subset && self.current.subset.name) || 'All';
		var html=
		'<div class="selector-label selector-option" onclick="$(this).parent().toggleClass(\'active\')">'+subsetlabel+'</div>'
		+'<div class="selector-options">'
			+renderOption({name:'All',filter:{}});
			subsets.map(function(s){html += renderOption(s);});
		html+='</div>';
		return html;
	};
	
	this.selectSubset=function(subset){
		//if (!e) var e = window.event;
		//e.cancelBubble = true;
		//if (e.stopPropagation) e.stopPropagation();
		self.hide();
		goJoe(self.current.list,$c.merge(self.current.userSpecs,{subset:subset}));
	};
	
/*-------------------------------------------------------------------->
	5 | HTML Renderings
<--------------------------------------------------------------------*/
	this.replaceRendering = function(dom,specs){
		var rendering = dom.toString();
		//var data = {rendering:html};
		var specs = {datatype:'rendering', compact:false,dom:dom};
		self.show(rendering,specs);
	};
	
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
	};
/*-------------------------------------------------------------------->
	MENUS
<--------------------------------------------------------------------*/

/*-------------------------------------------------------------------->
	MUTATE - Adding Properties
<--------------------------------------------------------------------*/
	this.showPropertyEditor = function(prop){
		self.current.mutant = prop;
		
		
	};
	
	this.addPropertyToEditor = function(prop){
		
	};

	this.minis = {};
/*-------------------------------------------------------------------->
	MINIJOE WIndow
<-------------------------------------------------------------------*/
	this.showMiniJoe = function(specs){
		var mini = {};
		if(!(specs && specs.props)){
			return;
		}
		title=specs.title || 'Object Focus';
		//mini.name=specs.prop.name||specs.prop.id || specs.prop._id;
		mini.id = cuid();
		
		//var html = '<div class="joe-mini-panel joe-panel">';

		var html = 
			self.renderEditorHeader({title:title,action:'onclick="getJoe('+self.joe_index+').hideMini()"'})
			//+'<div class="joe-panel-content joe-inset">'
				//+self.renderObjectContent({object:specs.props})
                +self.renderEditorContent({object:specs.props,mode:specs.mode||'object'})
			//	+JSON.stringify(specs.props)
			//+'</div>'
			+self.renderEditorFooter(specs);
			
		$('.joe-mini-panel').addClass('active').html(html);
		
		self.minis[mini.id] = mini;
	};
	
	this.hideMini = function(){
		$('.joe-mini-panel').removeClass('active')
	};
	
	this.constructObjectFromMiniFields = function(){
		var object = {};
		var prop;
		$('.joe-mini-panel.active .joe-object-field').find('.joe-field').each(function(){

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
	};
/*-------------------------------------------------------------------->
	SCHEMAS
<--------------------------------------------------------------------*/
	this.setSchema = function(schemaName){
		if(!schemaName){return false;}
		//setup schema


		var schema = ($.type(schemaName) == 'object')? schemaName : self.schemas[schemaName] || null;


		self.current.schema = schema;
        return schema;
	};
	this.resetSchema = function(schemaName){
		var newObj = self.constructObjectFromFields(self.joe_index);
		//var obj = $.extend(self.current.object,newObj);
		self.show(
			$.extend(self.current.object,newObj),
			$c.merge(self.current.userSpecs,{noHistory:true,schema:self.setSchema(schemaName) || self.current.schema})
		)
		
	};

/*-------------------------------------------------------------------->
	I | INTERACTIONS
<--------------------------------------------------------------------*/
	this.toggleOverlay = function(dom){
		$(dom).parents('.joe-overlay').toggleClass('active');
	};
	
	//this.show = function(data,schema,profile,callback){
	this.show = function(data,specs){
        clearTimeout(self.hideTimeout);
    //handle transition animations.
		/*self.overlay.removeClass('fade-out');
        if(!self.overlay.hasClass('active')){
            self.overlay.
        }
        self.overlay.addClass('fade-in');
        setTimeout(function(){
            self.overlay.removeClass('fade-in');
        },500);*/

		var data = data || '';
		//profile = profile || null
		var specs=specs || {};
		self.panel.attr('class', 'joe-overlay-panel');
		if(specs.compact === true){self.overlay.addClass('compact');}
		if(specs.compact === false){self.overlay.removeClass('compact');}
		
		self.populateFramework(data,specs);

        self.overlay.removeClass('hidden');
		self.overlay.addClass('active');
		setTimeout(self.onPanelShow(),0);
	};
	this.hide = function(timeout){
        timeout = timeout || 0;
       // self.overlay.removeClass('fade-in');
        self.overlay.addClass('hidden');
        self.hideTimeout = setTimeout(function(){
            self.overlay.removeClass('active');

            self.overlay.removeClass('hidden');
            //self.overlay.removeClass('fade-out');
        },timeout);
	};
	
	this.compactMode = function(compact){
		if(compact === true){self.overlay.addClass('compact');}
		if(compact === false){self.overlay.removeClass('compact');}
	
	
	};
	
	this.printObject = function(obj){
		goJoe('<pre>'+JSON.stringify(obj,'  ','    ')+'</pre>');
	};
	
	if(self.joe_index == 0){
		window.joeMini = this.showMiniJoe;
		window.goJoe = this.show;
		window.listJoe = this.editObjectFromList;
	}
	window.getJoe = function(index){
		return (window._joes[index] || false)
	};
	$(document).keyup(function(e) {
		if (e.keyCode == 27) { self.closeButtonAction(); }   // esc
        //TODO:if the joe is also current main joe.
	//ctrl + enter
		else if(e.ctrlKey && e.keyCode == 13 && self.specs.useControlEnter){
			self.overlay.find('.joe-confirm-button').click();
		}
	});

	var sortable_index;
	this.onPanelShow = function(){
		//init datepicker
		self.overlay.find('.joe-date-field').Zebra_DatePicker({offset:[5,20],format:'m/d/Y'});
        try {
            self.overlay.find('.joe-multisorter-bin').sortable({connectWith: '.joe-multisorter-bin'});
            self.overlay.find('.joe-buckets-bin').sortable({
                connectWith: '.joe-buckets-bin',
                start: function (event, ui) {
                    sortable_index = ui.item.index();
                    ui.item.parents();
                },
                update: function (event, ui) {
                    if (ui.sender && ui.sender.hasClass('options-bin') && ui.sender.hasClass('allow-multiple')) {
                        //add the element back into the list.
                        ui.sender.find('li').eq(sortable_index).before(ui.item.clone());
                        //ui.item.parents('.joe-buckets-bin');
                    }

                }
            });
        }catch(e){
            logit('Error creating sortables:\n'+e);
        }
		self.overlay.find('input.joe-image-field').each(function(){_joe.updateImageFieldImage(this);});
	    self.overlay.find('.joe-objectlist-table').each(function(){
            $(this).find('tbody').sortable(
                {   axis:'y',
                handle:'.joe-objectlist-object-row-handle',
                    helper: function (e, tr) {
                        var $originals = tr.children();
                        var $helper = tr.clone();
                        $helper.children().each(function (index) {
                            // Set helper cell sizes to match the original sizes
                            $(this).width($originals.eq(index).width());
                        });
                        return $helper;
                    }
                }
            )

        });

        self.overlay.find('.joe-submenu-search-field').focus();
    };
/*-------------------------------------------------------------------->
 J | MESSAGING
 <--------------------------------------------------------------------*/
	this.renderMessageContainer = function(){
		var mhtml = '<div class="joe-message-container left"></div>';
		return mhtml;
	};
	this.showMessage = function(message,specs){
		var mspecs = $.extend({
			timeout:3,
			message_class:''
		},(specs||{}));
		var message = message || 'JOE Message';
		var attr = 'class';
		var transition_time = 400;
		self.overlay.find('.joe-message-container').html('<div class="joe-message-content">'+message+'</div>').attr('class','joe-message-container active left');
			//TODO: don't toggle hidden class if no timeout.
		var target = "getJoe("+self.joe_index+").overlay.find('.joe-message-container')";

		setTimeout(target+".attr('class','joe-message-container active')",50);
		setTimeout(target+".attr('class','joe-message-container active show-message')",transition_time);
		if(mspecs.timeout){//only hide if timer is running.
			setTimeout(target+".attr('class','joe-message-container active ')",(mspecs.timeout*1000)+transition_time-250);
			setTimeout(target+".attr('class','joe-message-container active right')",(mspecs.timeout*1000)+transition_time);
			setTimeout(target+".attr('class','joe-message-container')",(mspecs.timeout*1000)+(2*transition_time)+50);

		}

/*
		.delay(50)
			.attr(attr,'joe-message-container active')
			.delay(mspecs.timeout*1000)
			.attr(attr,'joe-message-container right')
			.delay(50)
			.attr(attr,'joe-message-container');*/
	};

/*-------------------------------------------------------------------->
	D | DATA
<--------------------------------------------------------------------*/
	this.createObject = function(specs){
		//takes fields to be deleted
		specs = specs || {};
		goJoe({},{schema:self.current.schema});
	};

	this.updateObject = function(dom,callback,stayOnItem){
		function defaultCallback(data){
			self.showMessage(data.name +' updated successfully');
		}
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || defaultCallback; //logit;
		var newObj = self.constructObjectFromFields(self.joe_index);
		newObj.joeUpdated = new Date();
		var obj = $.extend(self.current.object,newObj);


    //update object list
        var index = (self.current.list && self.current.list.indexOf(obj));
        if(self.current.list && (index == -1 || index == undefined)){
          //  object not in current list
            self.current.list.push(obj);
        }


/*FROM CLARK
        var index = (self.current.list && self.current.list.indexOf(obj));
        if(index == -1 || index == undefined){
            //  object not in current list
            self.current.list = self.current.list || [];
            self.current.list.push(obj);
        }
*/


    //run callback

		logit('object updated');

		if(!stayOnItem){self.goBack();}
		callback(obj);
	};
	
	this.deleteObject = function(callback){
		var callback = self.current.callback || (self.current.schema && self.current.schema.callback) || logit;
		var obj = self.current.object;
		if(!self.current.list || !obj || self.current.list.indexOf(obj) == -1){
		//no list or no item
			alert('object or list not found');

            callback(obj);
			self.goBack();
			return;
		}
		var index = self.current.list.indexOf(obj);
		
		self.current.list.removeAt(index);
		logit('object deleted');

        callback(obj);
		self.goBack();
	};
	
	this.duplicateObject = function(specs){
		//takes fields to be deleted
		specs = specs || {};
		var deletes = specs.deletes || [];
		var itemobj = $.extend({},self.current.object);
		delete itemobj.joeUpdated;
		itemobj.name = itemobj.name +' copy';
		deletes.map(function(d){
			delete itemobj[d];
		});
		
		self.goBack();
		goJoe(itemobj,self.current.userSpecs);
	};
	this.constructObjectFromFields = function(index){
		var object = {joeUpdated:new Date()};
		var prop;
		
		//var parentFind = $('.joe-object-field');
		var parentFind = $('.joe-overlay.active');
		
		if(index){
		parentFind = self.overlay.find('.joe-object-field');
		
		}
		//var parentFind = $('.joe-overlay.active');
		
		parentFind.find('.joe-field').each(function(){
            if($(this).parents('.objectList-field').length){
                return true;
            }
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
					
					switch($(this).data('ftype')){
					//ace editor
						case 'ace':
							var editor = _joe.ace_editors[$(this).data('ace_id')];
							//$(this).find('.ace_editor');
							object[prop] = editor.getValue();
							break;


						case 'multisorter':
							var vals = [];
							$(this).find('.selections-bin').find('li').each(function(){
								vals.push($(this).data('id'));
							});
							object[prop] = vals;
						break;
						case 'buckets':
							var vals = [];
							$(this).find('.selections-bin').each(function(){
								vals.push([]);
								$(this).find('li').each(function(){
									vals[vals.length-1].push($(this).data('id'));
								});
							});
							/*
							$(this).find('.selections-bin').find('li').each(function(){
								vals.push($(this).data('id'));
							});*/
							object[prop] = vals;
						break;
						default:
						object[prop] = $(this).val();
						break;
					}
				break;
			}
		});


    //OBJECT LISTS
        parentFind.find('.objectList-field').each(function(){
            var ol_property = $(this).data('name');
            var ol_array = [];
        //get table header rows
            var subprops = [];
            $(this).find('thead').find('th').each(function(i){
               // if($(this).data('subprop')) {//skip handle
                    subprops.push($(this).data('subprop'));
              //  }
            });

        //parse all trs and tds and match values to subprops array
            $(this).find('tbody').find('tr').each(function(){
            //find all tds
                var ol_array_obj = {};
                $(this).find('td').each(function(i){
                  //  if($(this).data('subprop')) {//skip row handle
                        ol_array_obj[subprops[i]] = $(this).find('input,select').val();
                   // }
                });
            //store to ol_array
                delete ol_array_obj.undefined;
                ol_array.push(ol_array_obj);
            });


            object[ol_property] = ol_array;
        });

		return object;
	};
	
	this.exportJSON = function(object,specs){
		var minify =specs.minify || null;
		var objvar = specs.objvar || '';
		var obobj = (minify)?JSON.stringify(object):JSON.stringify(object,'','    ');
		
		goJoe('<b>'+((objvar && 'var '+objvar +' = ')|| 'JSON Object')+'</b><br/><pre>'+obobj+'</pre>');
		console.log(obobj);
	};

/*-------------------------------------------------------------------->
    MULTI FUNCTIONS
 <--------------------------------------------------------------------*/

	this.updateMultipleObjects = function(dom,multipleCallback, callback){
		var callback = callback || self.current.onUpdate || self.current.callback || (self.current.schema && (self.current.schema.onUpdate || self.current.schema.callback)) || logit;
		var multipleCallback = multipleCallback || self.current.onMultipleUpdate || self.current.multipleCallback
            || (self.current.schema && (self.current.schema.onMultipleUpdate || self.current.schema.multipleCallback)) || logit;
		var idprop = self.getIDProp();
		var newObj = self.constructObjectFromFields(self.joe_index);
        if(Object && Object.keys && Object.keys(newObj).length == 1 && Object.keys(newObj)[0] == "joeUpdated"){
            self.showMessage('please select at least one property to update.');
            return;
        }
		//newObj.joeUpdated = new Date();
	
	//clear id from merged object	
		delete newObj[idprop];
		delete newObj['id'];
		delete newObj['_id'];
		
		var haystack = self.current.list;

		var needles = self.current.selectedListItems;
		//var items = [];
        var updatedItems = [];
		haystack.map(function(i){
			
			if(needles.indexOf(i[idprop]) == -1){//not selected
				return;
			}else{//make updates to items
				//protoItem = merge(protoItem,i);
				$.extend(i,newObj);
				//logit('object updated');
                //itemsUpdated++;
				callback(i);
                updatedItems.push(i);
                //self.showMessage(updatedItems.length +' item(s) updated');
			}
		});

		logit(updatedItems.length +' item(s) updated');
        multipleCallback(updatedItems);

		self.goBack();
        self.showMessage(updatedItems.length +' item(s) updated');
	};
	
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
	};
	
	this.selectAllItems = function(){
        var itemsRendered = self.panel.find('.joe-panel-content-option').length;
        self.panel.find('.joe-panel-content').append(self.renderListItems(currentListItems,itemsRendered,currentListItems.length));
        self.renderListItems(currentListItems.length-1);
		self.overlay.find('.joe-panel-content-option').filter(':visible').addClass('selected');
		self.overlay.addClass('multi-edit');
		self.overlay.find('.joe-panel-content-option.selected')
            .map(function(i,listitem){
			    self.current.selectedListItems.push($(listitem).data('id'));
		})
	};

/*-------------------------------------------------------------------->
ANALYSIS, IMPORT AND MERGE
 <--------------------------------------------------------------------*/
    this.analyzeImportMerge = function(newArr,oldArr,idprop,specs){
        var aimBM = new Benchmarker();
        var idprop = idprop || '_id';
        var defs = {
            callback:printResults,
            deleteOld:false
            };
        specs = $.extend(defs,specs);
        var data = {
            add:[],
            update:[],
            same:[],
            delete:[]
        };

        var newObj, oldObj,matchObj, i = 0,query={};
        while(newObj = newArr[i++]){
            matchObj = oldArr.where(newObj);//is it currently in there in the same form

            if(matchObj.length){//currently there and the same
                data.same.push(newObj);
            }else{
                query[idprop] = newObj[idprop];
                matchObj = oldArr.where(query);
                if(matchObj.length){//is there, not the same
                    data.update.push(newObj);
                }else{//not there
                    data.add.push(newObj);
                }
            }
        }
        data.results = {
            add: data.add.length,
            update: data.update.length,
            same: data.same.length

        };
        self._mergeAnalyzeResults = data;

        logit('Joe Analyzed in '+aimBM.stop()+' seconds');
        specs.callback(data);
        function printResults(data){
            _joe.showMiniJoe({title:'Merge results',props:JSON.stringify(data.results,null,'\n'),mode:'text'})
        }
    };

        this.analyzeClassObject = function(object,ref){
            var data ={
                functions:[],
                properties:[]
            };
            var pReg = /function[\s*]\(([_a-z,A-Z0-9]*)\)/;
            var curProp;
            var params
            for(var p in object){
                curProp = object[p];
                try {
                    if ($.type(curProp) == "function") {
                        params = pReg.exec(object[p])[1] || 'none';
                        data.functions.push({
                            code: object[p],
                            name: p,
                            global_function: false,
                            ref: ref,
                            parameters:params
                        })
                    }
                }catch(e){
                    logit(e);
                }
            }

            return data;
        };

/*-------------------------------------------------------------------->
	H | HELPERS
<--------------------------------------------------------------------*/
	this.functionName = function(func){
		var name=func.toString();
		var reg=/function ([^\(]*)/;
		return reg.exec(name)[1];
	};
	
	this.getIDProp = function(){
		var prop = (self.current.schema && (self.current.schema.idprop || self.current.schema._listID)) || 'id' || '_id';
		return prop;
	};

/*-------------------------------------------------------------------->
 I | Hashlink
 <--------------------------------------------------------------------*/
    this.renderHashlink = function(){
        var hlink = fillTemplate();
    };

    this.updateHashLink = function(){
        if(!specs.useHashlink){
            return;
        }
        var hashInfo ={};

        hashInfo.schema_name =self.current.schema && self.current.schema.__schemaname;
        if(listMode){
            hashInfo.object_id = '';
        }else{

            hashInfo.object_id = (self.current.object && self.current.object[self.getIDProp()])||'';
        }

        var hashtemplate = ($.type(specs.useHashlink) == 'string')?specs.useHashlink:'${schema_name}:::${object_id}';
        //$SET({'@!':fillTemplate(hashtemplate,hashInfo)},{noHistory:true});
        $SET({'@!':fillTemplate(hashtemplate,hashInfo)});
    };

    this.readHashLink = function(){
        try {
            var useHash = $GET('!');
            if (!useHash || self.joe_index != 0) {
                return;
            }
            var hashBreakdown = useHash.split(':::');
            var hashSchema = self.schemas[hashBreakdown[0]];
            var hashItemID = hashBreakdown[1];
            if (hashSchema && (hashSchema.dataset || (!$.isEmptyObject(NPC.Data) && NPC.Data[hashSchema.__schemaname]))) {
                var dataset;
                if(hashSchema.dataset) {
                    dataset = (typeof(hashSchema.dataset) == "function") ? hashSchema.dataset() : hashSchema.dataset;
                }else{
                    dataset =  NPC.Data[hashSchema.__schemaname] || [];
                }
                //SINGLE ITEM
                if(!$.isEmptyObject(NPC.Data)) {
                    if(hashItemID ){
                        var collectionName = hashSchema.__collection || hashSchema.__schemaname;
                        if(collectionName){
                            var collectionItem = getNPCDataItem(hashItemID,collectionName);
                            if(collectionItem){
                                goJoe(collectionItem, {schema: hashSchema});
                            }
                        }
                    }else {//SHOW LIST, NO item
                        goJoe(dataset, {schema: hashSchema});
                    }
                }
            }
        }catch(e){
            logit('error reading hashlink:'+e);
        }
    };

/*<------------------------------------------------------------->*/

	if(self.specs.autoInit){
		self.init();
	}
	return this;
}

var __clearDiv__ = '<div class="clear"></div>';

var __createBtn__ = {name:'create',label:'Create', action:'_joe.createObject();', css:'joe-orange-button'};
var __quicksaveBtn__ = {name:'quicksave',label:'QuickSave', action:'_joe.updateObject(this,null,true);', css:'joe-save-button joe-confirm-button'};
var __saveBtn__ = {name:'save',label:'Save', action:'_joe.updateObject(this);', css:'joe-save-button joe-confirm-button'};
var __deleteBtn__ = {name:'delete',label:'Delete',action:'_joe.deleteObject(this);', css:'joe-delete-button'};
var __multisaveBtn__ = {name:'save_multi',label:'Multi Save', action:'_joe.updateMultipleObjects(this);', css:'joe-save-button joe-confirm-button'};
var __multideleteBtn__ = {name:'delete_multi',label:'Multi Delete',action:'_joe.deleteMultipleObjects(this);', css:'joe-delete-button'};
var __selectAllBtn__ = {name:'select_all',label:'select all',action:'_joe.selectAllItems();', css:'joe-left-button'};

var __replaceBtn__ = {name:'replace',label:'Replace', action:'_joe.updateRendering(this);', css:'joe-replace-button joe-confirm-button'};
var __duplicateBtn__ = {name:'duplicate',label:'Duplicate', action:'_joe.duplicateObject();', css:'joe-left-button'};


var __defaultButtons = [];
var __defaultObjectButtons = [__deleteBtn__,__saveBtn__];
var __defaultMultiButtons = [__multisaveBtn__,__multideleteBtn__];

function __removeTags(str){
    return str.replace(/<(?:.|\n)*?>/gm, '');
}

function _COUNT(array){
	if(typeof array == 'array') {
		return array.length;
	}
	return 0;
};

