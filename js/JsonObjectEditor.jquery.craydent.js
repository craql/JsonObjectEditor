/*/---------------------------------------------------------
    Craydent LLC
	Copyright 2014 (http://craydent.com/joe)
    Dual licensed under the MIT or GPL Version 2 licenses.
	(http://craydent.com/license)                       
---------------------------------------------------------/*/
//render field - self.renderObjectPropFieldUI
/*TODO:

	-merge specs (profile,schema,object,call?)
	-required fields

	
*/
var _webworkers = false;
var _joeworker;
if (!!window.Worker) {
    _webworkers = true


}
function JsonObjectEditor(specs){
	var self = this;

	var listMode = false;
    var multiEdit = false;
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
        self.current = {filters:{}};
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
                var code = e.keyCode
                var nonBackElements = ['input','select','textarea'];
                if (code == 8) {
                    if(self.history.length) {
                        //if in editor fields, don't go back
                        if (nonBackElements.indexOf(e.target.tagName.toLowerCase()) != -1) {
                            //logit('t');
                            //return false;
                            if(e.target.className.indexOf('joe-submenu-search-field') != -1){
                                //self.goBack();
                                //return false;
                            }
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
                }else if([38,40,13,16,17].indexOf(code) == -1){//set focus for alphanumeric keys
                    if(!listMode)return;
                    var inSearchfield = false;
                    if ($(document.activeElement) && $(document.activeElement)[0] != $('.joe-submenu-search-field')[0]) {
                        self.overlay.find('.joe-submenu-search-field').focus();
                        inSearchfield = true;
                        $('.joe-panel-content-option.keyboard-selected').removeClass('keyboard-selected');
                    }
                }else{
                    if(!listMode)return;
                    var keyboardSelectedIndex = ($('.joe-panel-content-option.keyboard-selected').length)?
                        $('.joe-panel-content-option.keyboard-selected').index():-1;
                    logit(keyboardSelectedIndex);

                    switch(code){
                        case 38://up
                            keyboardSelectedIndex--;
                            if(keyboardSelectedIndex > -1) {
                                keyboardSelectOption();
                            }
                        break;
                        case 40://down
                            keyboardSelectedIndex++;
                            if(keyboardSelectedIndex < currentListItems.length) {
                                keyboardSelectOption();
                            }
                        break;
                        case 13://enter
                            if(keyboardSelectedIndex != -1){
                                $('.joe-panel-content-option.keyboard-selected').find('.joe-panel-content-option-content').click();
                            }
                        break;
                    }
                    function keyboardSelectOption(){
                        $('.joe-panel-content-option.keyboard-selected').toggleClass('keyboard-selected');
                        var el = $('.joe-panel-content-option').eq(keyboardSelectedIndex);
                        el.addClass('keyboard-selected');
                        self.overlay.find('.joe-submenu-search-field').blur();
                       // $('.joe-panel-content').scrollTop($('.joe-panel-content-option.keyboard-selected').offset().top);
                        el[0].scrollIntoView(true);
                        //var panel_content = self.overlay.find('.joe-panel-content');
                        //panel_content.animate({ scrollTop: panel_content.scrollTop()-10 });

                        //panel_content.scrollTop(panel_content.scrollTop()-10);
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
 MultiEdit (Arrays)
 -------------------------*/
        self.toggleMultiEditMode(specs,data);
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
            var currentSubsets;
			//setup subsets
            currentSubsets = setts.subsets || (specs.schema && specs.schema.subsets)||null;
			if(typeof currentSubsets == 'function'){
                currentSubsets = currentSubsets();
			}

        //a current subset selected
            if(self.current.specs.subset && currentSubsets.where({name:specs.subset}).length){
                    self.current.subset = currentSubsets.where({name:specs.subset})[0]||false;
            }else{
                //all selected
                if(self.current.specs.subset == "All"){
                    self.current.subset = {name:"All",filter:{}}
                }else {
                    //select default subset if it exists
                    self.current.subset =
                        (currentSubsets && currentSubsets.where({'default': true})[0]) || null;
                }
            }

            self.current.subsets = currentSubsets;

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
    /*-------------------------------------------------------------------->
     Framework Rendering
     <--------------------------------------------------------------------*/
        var content =
            self.renderEditorContent(specs);
		var html = 
			self.renderEditorHeader(specs)+
            self.renderEditorSubmenu(specs)+
            content+
			self.renderEditorFooter(specs)+
			self.renderMessageContainer();
		    self.overlay.find('.joe-overlay-panel').html(html);
		//$('.joe-overlay-panel').html(html);
	
	//update history 2/2	- add title
		if(!self.current.specs.noHistory && self.history.length){
			$.extend(self.history[self.history.length-1],
                {_joeHistoryTitle:self.overlay.find('.joe-panel-title').html()}
            );
		}



    //update hashlink
        self.updateHashLink();
		//logit('Joe Populated in '+joePopulateBenchmarker.stop()+' seconds');
        _bmResponse(joePopulateBenchmarker,'----Joe Populated');
		return html;
	};
/*-------------------------------------------------------------------->
 2e | FRAMEWORK END
 <--------------------------------------------------------------------*/

    this.toggleMultiEditMode = function(specs, data){
        multiEdit =self.current.userSpecs.multiedit|| false;

    };

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

		var close_action = specs.close_action||'onclick="getJoe('+self.joe_index+').closeButtonAction()"';
        var reload_action = specs.reload_action||'onclick="getJoe('+self.joe_index+').reload()"';
		function renderHeaderBackButton(){
			var html = '';
			if(self.history.length > 1){
				//html+= '<div class="joe-header-back-btn joe-panel-header-button" onclick="getJoe('+self.joe_index+').goBack();" title="go back">&nbsp;</div>';
                html+= '<div class="jif-header-back-btn jif-panel-header-button" onclick="getJoe('+self.joe_index+').goBack();" title="go back"><span class="jif-arrow-left"></span></div>';
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
        //'<div class="joe-panel-reload joe-panel-header-button" title="reload" '+reload_action+'></div>'+
        '<div class="jif-panel-header-button joe-panel-reload" title="reload" '+reload_action+'><span class="jif-reload"></span></div>'+
        '<div class="jif-panel-header-button joe-panel-close" title="close" '+close_action+'>' +//joe-panel-close
        '<span class="jif-close"></span>'+
        '</div>'+
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
    var goingBackFromID;
    var goingBackQuery;
	this.goBack = function(obj){
        //go back to last item and highlight
        if(self.current.object) {
            var gobackItem = self.current.object[self.getIDProp()];
            if (gobackItem) {
                goingBackFromID = gobackItem;
               // logit(goingBackFromID);
            }
        }
        //clearTimeout(self.searchTimeout );
		self.history.pop();
		var joespecs = self.history.pop();
		if(!joespecs){
            self.closeButtonAction();
			return;
		}else{
            if(obj && $c.isArray(joespecs.data)){
                var objid = obj[self.getIDProp()];
                if(objid){
                    var query = {};
                    query[self.getIDProp()] = objid;
                    var found = joespecs.data.where(query)
                    found.length && $.extend(found[0],obj);
                }
            }
            if(joespecs.keyword){
                goingBackQuery = joespecs.keyword;
            }
        }
		//[self.history.length];
		self.show(joespecs.data,joespecs.specs);
	};

    this.clearAuxiliaryData = function(){

        self.current.list = null;
        self.current.subsets = null;
        self.current.subset = null;
        self.current.filters = {};
        self.current.fields = [];

    };
	this.cleanUp = function(){

        self.current.fields = [];
        self.shiftSelecting = false;
        self.allSelected = false;
		for (var p in _joe.ace_editors){
			_joe.ace_editors[p].destroy();
		}
		_joe.ace_editors = {};
        if(self.current.userSpecs.multiedit){
            self.overlay.addClass('multi-edit');

        }else{
            self.overlay.removeClass('multi-edit');
        }

	};
/*----------------------------->
 B | SubMenu
 <-----------------------------*/
    this.renderEditorSubmenu = function(specs) {
        var sectionAnchors =renderSectionAnchors();
        if(!self.current.submenu && !sectionAnchors.count){
            return '';
        }
        var showFilters =
            $c.getProperty(self.current,'userSpecs.filters') ||
            $c.getProperty(self.current,'schema.filters') ||
            $c.getProperty(self.current,'schema.subsets')||
            false;
        var subSpecs = {
            search:true,
            itemcount:true,
            filters:showFilters
        };
        var userSubmenu = ($.type(self.current.submenu) != 'object')?{}:self.current.submenu;
        $.extend(subSpecs,userSubmenu);

        if(specs.mode == 'list') {
            var submenu =
                '<div class="joe-panel-submenu">'

                    //+self.renderViewModeButtons(subSpecs)
                + ((subSpecs.itemcount && self.renderSubmenuItemcount(subSpecs.itemcount)) || '')
                + ((subSpecs.filters && self.renderSubmenuFilters(subSpecs.filter)) || '')
                + ((subSpecs.search && self.renderSubmenuSearch(subSpecs.search)) || '')

                + '</div>'
                + "<div class='joe-filters-holder'>"
                + renderSubsetsDiv()
                + (self.current.schema && (self.propAsFuncOrValue(self.current.schema.filters) && renderFiltersDiv()) || '')
                    // +'<span class="jif-arrow-left"></span>'
                + "</div>";
        }else{
            var submenu =
                '<div class="joe-panel-submenu">'
                    + ((sectionAnchors.count && sectionAnchors.code) || '')

                + '</div>';/*
                + "<div class='joe-filters-holder'>"
               // + renderSubsetsDiv()
                //+ (self.current.schema && (self.propAsFuncOrValue(self.current.schema.filters) && renderFiltersDiv()) || '')
                    // +'<span class="jif-arrow-left"></span>'
                + "</div>";*/
        }

        //TODO:move to subsets filter rendering function
        function renderSubsetsDiv(){
            var sh = '<div><h4>Subsets</h4>';
            var act;
            [{name:'All',filter:{}}].concat(_joe.current.subsets||[]).map(function(opt){
                //if(!opt.condition || (typeof opt.condition == 'function' && opt.condition(self.current.object)) || (typeof opt.condition != 'function' && opt.condition)) {
                if(!opt.condition || self.propAsFuncOrValue(opt.condition)) {
                    act = ((self.current.subset && self.current.subset.name == opt.name) || !self.current.subset && opt.name =="All") ? ' active ' : '';
                    sh += '<div class="joe-subset-option ' + act + '" onclick="getJoe(' + self.joe_index + ').selectSubset(\'' + (opt.id || opt.name || '') + '\');">' + opt.name + '</div>'
                }
            });
                //+fillTemplate('<div class="joe-filters-subset">${name}</div>',_joe.current.subsets||[])
                sh+='</div>';
            return sh;
        }
        function renderFiltersDiv(){
            var fh = '<div><h4>Filters</h4>';
            var filters = self.current.schema.filters;
            filters = self.propAsFuncOrValue(filters);
            (filters||[]).map(function(opt){
                var idval = opt.id || opt.name || '';
                if(!opt.condition || self.propAsFuncOrValue(opt.condition)) {
                    act = (self.current.filters && self.current.filters[idval])?'active':'';
                    fh += '<div class="joe-filter-option ' + act + '" onclick="getJoe(' + self.joe_index + ').toggleFilter(\'' + idval + '\',this);"><span class ="joe-option-checkbox"></span>' + opt.name + '</div>'
                }
            });
            fh+='</div>';
            return fh;
        }
        return submenu;
    };
    function renderSectionAnchors(){
        var anchorhtml = '<div class="joe-submenu-section-anchors">';
        anchorhtml+='<div class="joe-submenu-section" onclick="$(\'.joe-overlay[data-joeindex='+self.joe_index+']\').find(\'.joe-panel-content\').scrollTop(0)">^ top</div>';
        var scount = 0;
        var template =
            '<div class="joe-submenu-section" onclick="$(\'.joe-content-section[data-section=${id}]\').removeClass(\'collapsed\')[0].scrollIntoView()">${name}</div>';
        var section;
        for(var secname in self.current.sections){
            section = _getSection(secname);
            if(!section.hidden) {
                anchorhtml += fillTemplate(template, section);
                scount++;
            }
        }
        anchorhtml+="</div>";
        return {count:scount,code:anchorhtml};
    }
/*------------------>
    Filter
<------------------*/
    this.renderSubmenuFilters = function(s){

        if(!(s || self.current.subsets)){
           return '';
        }

        var action =' onclick="_joe.toggleFiltersMenu();" ';
        var html =
            "<div class='jif-panel-submenu-button joe-filters-toggle ' "+action+">"
                +"</div>";



        return html;
    };

    this.toggleFiltersMenu = function(){
        self.panel.toggleClass('show-filters');
    };

    this.generateFiltersQuery = function(){//comgine all active fitlers into a query
        var query = {};
        var filterobj;
        //var qval, fval;
        for(var f in self.current.filters){
            filterobj = (
            (self.propAsFuncOrValue(self.current.schema.filters)||[]).where({name:f})[0]|| {}).filter;
            for(var ff in filterobj) {
                if (query[ff]) {

                    //TODO: do crazy smart stuff here.
                    switch($.type(filterobj[ff])){
                        case 'number':
                        case 'string':
                            if($.type(query[ff]) == 'string' || $.type(query[ff]) == 'number'){
                                query[ff]={
                                    $in:[query[ff],filterobj[ff]]
                                };
                            }else if($.type(query[ff]) == 'object'){
                                if(query[ff].hasOwnProperty('$in')){
                                    query[ff]['$in'] = query[ff]['$in'].concat(filterobj[ff]);
                                }
                            }
                            break;
                    }
                }else{//not there, add it
                    query[ff] = filterobj[ff];

                }
            }
        }
        return query;
    };
/*------------------>
 Search
 <------------------*/

    this.renderSubmenuSearch = function(s){
        var action =' onkeyup="_joe.filterListFromSubmenu(this.value);" ';
        var submenusearch =
            "<div class='joe-submenu-search '>"
            +'<input class="joe-submenu-search-field" '+action+' placeholder="find" />'
            +"</div>";
        return submenusearch;
    };

    this.searchTimeout;
    this.filterListFromSubmenu = function(keyword,now){

        clearTimeout(self.searchTimeout );
        self.overlay.removeClass('.multi-edit');
        if(!now) {
            self.searchTimeout = setTimeout(function () {
                searchFilter(keyword);
            }, 300);
        }else{
            searchFilter(keyword);
        }
        function searchFilter(keyword){
            var searchBM = new Benchmarker();
            keyword = keyword || $('.joe-submenu-search-field').val();
            var value=keyword.toLowerCase();
            var filters = self.generateFiltersQuery()

            _joe.history[_joe.history.length-1].keyword = value;
            _joe.history[_joe.history.length-1].filters = filters;


            var testable;
            var idprop = self.getIDProp();
            var id;
            var listables = (self.current.subset)?self.current.list.where(self.current.subset.filter):self.current.list;
            var searchables = self.current.schema && self.current.schema.searchables;
            logit('search where in '+searchBM.stop()+' seconds');
            currentListItems = listables.where(filters).filter(function(i){
                id = i[idprop];
                testable = '';
                if(searchables){//use searchable array
                    searchables.map(function(s){
                        testable+=i[s]+' ';
                    });
                    return (testable.toLowerCase().indexOf(value) != -1);
                    //return (testable+' '+i[idprop].toLowerCase().indexOf(value) != -1);
                }
                    testable = self.renderListItem(i,true);
                    //return (__removeTags(testable).toLowerCase().indexOf(value) != -1);
                    return ((__removeTags(testable)+id).toLowerCase().indexOf(value) != -1);

            });

            logit('search filter found '+currentListItems.length+' items in '+searchBM.stop()+' seconds');
            self.overlay.find('.joe-submenu-itemcount').html(currentListItems.length+' item'+((currentListItems.length > 1 &&'s') ||''));
            self.panel.find('.joe-panel-content').html(self.renderListItems(currentListItems,0,self.specs.dynamicDisplay));
            var titleObj = $.extend({},self.current.object,{_listCount:currentListItems.length||'0'});
            self.panel.find('.joe-panel-title').html(fillTemplate(self.current.title,titleObj));

        }

    };


/*------------------>
 Count
 <------------------*/

    this.renderSubmenuItemcount = function(s){

        var submenuitem =
            "<div class='joe-submenu-itemcount'>items</div>";
        return submenuitem;
    };

/*------------------>
View Mode Buttons
<------------------*/

    this.renderViewModeButtons = function(subspecs){
        var gridspecs = self.current.schema && self.current.schema.grid || {};
        var submenuitem =
            "<div class='joe-submenu-viewmodes'>views</div>";
        return submenuitem;
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

            default:
            content = content || '';
            break;
			
		}
        var submenu = '';
        if(mode == 'list' && self.current.submenu){
            submenu=' with-submenu ';
        }
        submenu=(self.current.submenu || renderSectionAnchors().count)?' with-submenu ':'';
        var scroll = 'onscroll="getJoe('+self.joe_index+').onListContentScroll(this);"';
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
        if(self.current.sorter &&(($.type(self.current.sorter) != 'array') || self.current.sorter.length) ){
            list = list.sortBy(self.current.sorter);
        }
        //list = list.sortBy(self.current.sorter);
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
                html += self.renderListItem(listItem,false,i+1);
               // html += $GET('table')?self.renderGridItem(listItem,false,i+1):self.renderListItem(listItem,false,i+1);
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
        self.current.fields = [];
        self.current.sections = {};
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
			var propObj =extendField();

			if(self.constructObjectFromFields()[prop] !== undefined){

				fieldProp.value = self.constructObjectFromFields()[prop]
			}
			fields += self.renderObjectField(propObj);
		}else if(prop && prop.extend){
            var fieldProp = $.extend({},self.fields[prop.extend] || {},prop.specs||{});
            var propObj =extendField(prop.extend);
            if(self.constructObjectFromFields()[prop.extend] !== undefined){
                fieldProp.value = self.constructObjectFromFields()[prop.extend]
            }
            fields += self.renderObjectField(propObj);
        }else if($.type(prop) == "object"){

            if(prop.type){
               //TODO:render field from custom object
               // fields += self.renderContentLabel(prop);
            }
			else if(prop.label){
				fields += self.renderContentLabel(prop);
			}
            else if(prop.section_start){
                fields += self.renderPropSectionStart(prop);
            }
            else if(prop.section_end){
                fields += self.renderPropSectionEnd(prop);
            }

		}

        function extendField(propname){
            var propname = propname || prop;
            return $.extend(
                {
                    name: propname,
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
                {value: self.current.object[propname]}
            );
        }
		return fields;

	};
//PROP LABELS
    self.renderContentLabel = function(specs){
        var html="<div class='joe-content-label'>"+fillTemplate(specs.label,self.current.object)+"</div>";
        return html;
    };

//prop sections
    self.renderPropSectionStart = function(prop){
        var show = '';
        var hidden = false;
        if(prop.condition && !prop.condition(self.current.object)){
            show =  ' no-section ';
            hidden=true;
        }
        var secname = fillTemplate((prop.section_label||prop.section_start),self.current.object);
        var secID = prop.section_start;
        if(!secname || !secID){
         return '';
        }
        var collapsed = (prop.collapsed)?'collapsed':'';
        var toggle_action = "onclick='$(this).parent().toggleClass(\"collapsed\")'";
        var section_html = '<div class="joe-content-section '+show+' '+collapsed+'" data-section="'+secID+'">' +
            '<div class="joe-content-section-label" '+toggle_action+'>'+secname+'</div>'+
            '<div class="joe-content-section-content">';
        //add to current sections
        self.current.sections[secID]={open:true,name:secname,id:secID,hidden:hidden};
        return section_html;
    };
    self.renderPropSectionEnd = function(prop){
        var secID = prop.section_end;
        var section = _getSection(secID)
        if(!secID || !(section && section.open)){
            return '';
        }
        var section_html = '</div></div>';
        section.open = false;
        return section_html;
    };

    function _getSection(secname){
        return self.current.sections[secname];
    }

/*----------------------------->
	D | Footer
<-----------------------------*/	
	this.renderEditorFooter = function(specs){
        var fBM = new Benchmarker();
		specs = specs || this.specs || {};
		var menu = specs.minimenu || (listMode && (specs.schema && specs.schema.listmenu)||specs.listmenu) ||//list mode
		 (multiEdit && (specs.multimenu ||  (specs.schema && specs.schema.multimenu) || __defaultMultiButtons)) ||
        specs.menu
        || __defaultObjectButtons;
		if(typeof menu =='function'){
			menu = menu();
		}

		
		var html = 
		'<div class="joe-panel-footer">'+
			'<div class="joe-panel-menu">';

			menu.map(function(m){
				html+= self.renderFooterMenuItem(m);
			
			},this);
        //add default list buttons.
			if(!specs.minimenu && self.current.list && $.type(self.current.data) == 'array'){
				html+= self.renderFooterMenuItem(__selectAllBtn__);
                html+= '<div class="joe-selection-indicator"></div>';
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

        logit('joe footer generated in '+fBM.stop()+' secs');
		return html;
	};
	
	this.renderFooterMenuItem=function(m){//passes a menu item
        if(!m){
            logit('error loading footer menu button');
            return '';
        }
		var display,action,html='';
        if(m.condition && !m.condition(self.current.object,m)){
            return '';
        };
		display = m.label || m.name;
		action = m.action || 'alert(\''+display+'\')';
		html+= '<div class="joe-button joe-footer-button '+(m.css ||'')+'" onclick="'+action+'" data-btnid="'+m.name+'" title="'+ (m.title||'')+'">'+display+'</div>';
		return html;
	};
/*-------------------------------------------------------------------->
	3 | OBJECT FORM
<--------------------------------------------------------------------*/
	var preProp;
	var prePropWidths = 0;
	this.renderObjectField = function(prop){
        if(prop.hasOwnProperty('condition') && !self.propAsFuncOrValue(prop.condition)){
            return '';
        }
		//field requires {name,type}
        self.current.fields.push(prop);
		//set default value
		if(prop.value == undefined && prop['default'] != undefined){
			prop.value = prop['default'];
		}
        if($.type(prop.value) == "function"){
			try {
				prop.value = prop.value(self.current.object);
			}catch(e){
				logit('error with propoerty "'+(prop.name||'')+'": '+e);
				prop.value= prop.value;
			}
		}
    //hidden
		var hidden = '';
        //if(prop.hidden && (typeof prop.hidden != 'function' && prop.hidden) || (typeof prop.hidden == 'function' && prop.hidden())){
        if(self.propAsFuncOrValue(prop.hidden)){
            hidden = 'hidden';
        }

    //required
        var required = '';
        //if(prop.required && (typeof prop.required != 'function' && prop.required) || (typeof prop.required == 'function' && prop.required(self.current.object))){
        if(self.propAsFuncOrValue(prop.required)){
            required = 'joe-required';
        }

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
			html+='<div class="joe-field-container joe-fleft" style="width:'+prop.width+';">';
		}else{
            html+='<div class="joe-field-container">';
        }

		html+=	
			'<div class="joe-object-field '+hidden+' '+required+' '+prop.type+'-field " data-type="'+prop.type+'" data-name="'+prop.name+'">'+
			'<label class="joe-field-label">'
                +fillTemplate((prop.display||prop.label||prop.name),self.current.object)
				+self.renderFieldTooltip(prop)
            +'</label>';
        //render comment
        html+= self.renderFieldComment(prop);
        //add multi-edit checkbox
		if(self.current.userSpecs.multiedit){
			html+='<div class="joe-field-multiedit-toggle" onclick="$(this).parent().toggleClass(\'multi-selected\')"></div>';	
		}

		html += self.selectAndRenderFieldType(prop);

		html+='</div>';
		//if(prop.width){
        //close field container
			html+='</div>';
	//	}
		
		preProp = prop;
		
		return html;
	};
    this.renderFieldComment = function(prop){
        if(!prop.comment){return '';}
        var comment = ($.type(prop.comment) == "function")?prop.comment():prop.comment;
        var comment_html = '<div class="joe-field-comment">'+comment+'</div>';

        return comment_html;
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

		var html = '';
		switch(prop.type.toLowerCase()){
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

			case 'objectlist':
				html+= self.renderObjectListField(prop);
				break;

            case 'objectreference':
                html+= self.renderObjectReferenceField(prop);
                break;

			case 'tags':
				html+= self.renderTagsField(prop);
				break;
            case 'color':
                html+= self.renderColorField(prop);
                break;

            case 'group':
                html+= self.renderCheckboxGroupField(prop);
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

    function _disableField(prop){
        return ((prop.hasOwnProperty('locked') && self.propAsFuncOrValue(prop.locked)&&' disabled ')||'');
    }
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
            autocomplete =prop.autocomplete;
		}

		//TODO: Use jquery ui autocomplete
        var disabled = _disableField(prop);//(prop.locked &&'disabled')||'';
        var fieldtype = (prop.ftype && "data-ftype='"+prop.ftype+"'")||'';
		var html=
            ((autocomplete && '<div class="joe-text-autocomplete-label"></div>')||'')+
		'<input class="joe-text-field joe-field '+((prop.skip && 'skip-prop')||'')+'" ' +
            'type="text"  '+disabled+' name="'+prop.name+'" value="'+(prop.value || '')+'" '
			+self.renderFieldAttributes(prop)
			+((autocomplete && 
				//' onblur="getJoe('+self.joe_index+').hideTextFieldAutoComplete($(this));"'
				' onkeyup="getJoe('+self.joe_index+').showTextFieldAutoComplete($(this));"'
				) 
			||''
			)
		+' '+fieldtype+'/>';

		if(autocomplete){
			html+='<div class="joe-text-autocomplete">';
            var ac_opt;
            var ac_template = autocomplete.template||'${name}';
            var ac_id, ac_title;
			for(var v = 0, len = prop.values.length; v < len; v++){
                ac_opt = ($.type(prop.values[v]) == "object")?
                    prop.values[v]:
                    {id:prop.values[v],name:prop.values[v]};
                ac_title = fillTemplate(ac_template,ac_opt);
                ac_id = (autocomplete.idprop && ac_opt[autocomplete.idprop])||ac_opt._id||ac_opt.id||ac_opt.name;
				html+='<div class="joe-text-autocomplete-option" '
					+'onclick="getJoe('+self.joe_index+').autocompleteTextFieldOptionClick(this);" '
                    +'data-value="'+ac_id+'">'+ac_title+'</div>';
			}
			
			html+='</div>';	
		}
		//add onblur: hide panel

		return html;
	};
	var textFieldAutocompleteHandler = function(e){
        var dom = e.target;
        //if($(e.target).parents('.joe-text-autocomplete'));
        $('.joe-text-autocomplete').removeClass('active');
        $('body').unbind( "click", textFieldAutocompleteHandler );
    };

	this.showTextFieldAutoComplete = function(dom){
        $('body').unbind( "click", textFieldAutocompleteHandler ).bind( "click", textFieldAutocompleteHandler );

        var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.find('.joe-text-autocomplete-option').each(function(i,obj){
			self.checkAutocompleteValue(dom.val().toLowerCase(),obj.innerHTML,obj);
		});
		autocomplete.addClass('active');
	};
	this.hideTextFieldAutoComplete = function(dom){
		var autocomplete = dom.next('.joe-text-autocomplete');
		autocomplete.removeClass('active');
	};
	
	this.autocompleteTextFieldOptionClick = function(dom){
        var value = ($(dom).data('value'));
		$(dom).parent().prev('.joe-text-field').val(value);
		$(dom).parent().removeClass('active');
		//$(dom).previous('.joe-text-field').val($(dom).html());
	};
	
	this.checkAutocompleteValue = function(needle,haystack,dom){
		var d = $(dom);
		if(haystack.toLowerCase().indexOf(needle) != -1 || !needle){
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
        var disabled = _disableField(prop); //(prop.locked &&'disabled')||'';
		var html=/*
		'<label class="joe-field-label">'+(prop.display||prop.name)+'</label>'+*/
		'<input class="joe-number-field joe-field" type="text" '+disabled+' name="'+prop.name+'" value="'+(prop.value || '')+'"  '+
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
        var disabled = _disableField(prop);
        //(prop.hasOwnProperty(prop.locked) && self.propAsFuncOrValue(prop.locked) &&'disabled')||'';
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
		'<select '+disabled+' class="joe-select-field joe-field" name="'+prop.name+'" value="'+(prop.value || '')+'" size="'+selectSize+'"'+
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
		'<input class="joe-date-field joe-field" type="text"  '+_disableField(prop)+' name="'+prop.name+'" value="'+(prop.value || '')+'" '+
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
		+'<input class="joe-geo-field joe-field" type="text" value="'+val+'" name="'+prop.name+'" '+_disableField(prop)+'/>'
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
		+' '+_disableField(prop)+'/> <small>'
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
		+' onkeyup="_joe.updateImageFieldImage(this);" '+_disableField(prop)+'/>'
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
		var height = (prop.height && "style='max-height:"+prop.height+";'")||'';
		var html=
		'<div class="joe-multisorter-field joe-field"  name="'+prop.name+'" data-ftype="multisorter" data-multiple="'+(prop.allowMultiple||'false')+'">'+

			'<div class="joe-filter-field-holder"><input type="text"class="" onkeyup="_joe.filterSorterOptions(this);"/></div>'+
			'<p class="joe-tooltip"> double click or drag item to switch columns.</p>'+
			'<ul class="joe-multisorter-bin options-bin" '+height+'>'+optionsHtml+'</ul>'+
			'<ul class="joe-multisorter-bin selections-bin" '+height+'>'+selectionsHtml+'</ul>'+
			__clearDiv__
	
		+'</div>';
		return html;
	};
	this.filterSorterOptions = function(dom){
        var sorterBM = new Benchmarker();
		var query = $(dom).val().toLowerCase();
		//$(dom).parent().next('.joe-multisorter-bin').find('li').each(function(){$(this).toggle($(this).html().toLowerCase().indexOf(query) != -1 );});
        $(dom).parents('.joe-field').find('.joe-multisorter-bin.options-bin').find('li').each(function(){$(this).toggle($(this).html().toLowerCase().indexOf(query) != -1 );});
        logit('found results for: '+query+' in '+sorterBM.stop()+' secs');
		
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
            var disabled = _disableField(prop);// (prop.locked &&'disabled')||'';
        var html=
            '<div class="joe-button" onclick="_joe.gotoFieldURL(this);">view</div>'
            +'<input class="joe-url-field joe-field" type="text" ' +
            self.renderFieldAttributes(prop)+
            'name="'+prop.name+'" value="'+(prop.value || '')+'"  '+disabled+' />'
       + __clearDiv__;
        return html;
    };
    this.gotoFieldURL = function(dom){
        var url = $(dom).siblings('.joe-url-field').val();
        window.open(url);
    };
/*----------------------------->
 N | Color
 <-----------------------------*/
    this.renderColorField = function(prop){

        var html=
            '<input class="joe-color-field joe-field" type="text"  name="'+prop.name+'" value="'+(prop.value || '')+'" '
            +self.renderFieldAttributes(prop)
            +' />'+


        //add onblur: hide panel
        '<script>' +
            '_joe._colorFieldListener($(\'input.joe-color-field[name='+prop.name+']\')[0]);'+
        '$(\'input.joe-color-field[name='+prop.name+']\').keyup(_joe._colorFieldListener);' +
        '</script>';
        return html;
    };
    this._colorFieldListener = function(e){
        var field = e.delegateTarget||e;
        var color = field.value;
        $(field).parents('.joe-object-field').css('background-color',color);

    };
/*----------------------------->
 O | Object List Field
 <-----------------------------*/

    this.renderObjectListField = function(prop){
        var hiddenHeading = (prop.hideHeadings)?" hidden-heading " :'';
        var html ="<table class='joe-objectlist-table "+hiddenHeading+"'>"
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
        var objects = self.current.object[prop.name] || prop.default || [];
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
            select:self.renderSelectField,
            'date':self.renderDateField
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
 P | Render Checkbox Group
 <-----------------------------*/
    this.renderCheckboxGroupField = function(prop){
        //var profile = self.current.profile;
        var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
        var html= '';
        var checked;
        var itemid;
        var idprop = prop.idprop || '_id';
        values.map(function(value){
            if($.type(value) != 'object'){
                var tempval = {name:value};
                tempval[idprop]=value;
                value = tempval;
            }
            itemid = 'joe_checkbox-'+prop.name;
            checked = (prop.value.indexOf(value[idprop]) != -1)?' checked ':'';
            html+= '<div class="joe-group-item"><label >'
            +'<div class="joe-group-item-checkbox">' +
            '<input class="joe-field" type="checkbox" name="'+prop.name+'" '
            +checked
            +self.renderFieldAttributes(prop)
            +'value="'+value[idprop]+'" '+_disableField(prop)+'/></div> '
            +((prop.template && fillTemplate(prop.template,value))||value.label ||value.name || '') +'</label></div>';
        });
        html+= __clearDiv__;
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
        var locked = self.propAsFuncOrValue(prop.locked)?' disabled ':'';
		var profile = self.current.profile;
        var height = (prop.height)?'style="height:'+prop.height+';"' : '';
		var html=
			'<textarea class="joe-rendering-field joe-field" '+height+' '+locked+'name="'+prop.name+'" >'
            +(prop.value || "")+'</textarea>';
		return html;
	};
/*----------------------------->
 T | Tags Field
 <-----------------------------*/
	this.renderTagsField = function(prop){
		var profile = self.current.profile;
		var height = (prop.height)?'style="height:'+prop.height+';"' : '';
		var specs = $.extend({},prop,{autocomplete:true}); //,{onblur:'_joe.showMessage($(this).val());'})
		var html= '<div class="joe-tags-container">'
			+self.renderTextField(specs)
			+'<div class="joe-text-input-button">add</div>'
		+'</div>';

		return html;
	};


/*----------------------------->
 U | Object Reference
 <-----------------------------*/
    this.renderObjectReferenceField = function(prop){
        var values = self.propAsFuncOrValue(prop.values) || [];
        var value = self.current.object[prop.name] ||
            prop.value ||
            (!self.current.object.hasOwnProperty(prop.name) && prop.default) ||
            [];
        if($.type(value) != 'array'){
            value = (value != null)?[value]:[];
        }
        var idprop =prop.idprop || self.getIDProp();
        var template = "<div>${name}</div><span class='subtext'>${"+idprop+"}</span>";//prop.template ||
        //var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
        var html = "Object Reference";
        var specs = $.extend(
            {},{
                autocomplete:{idprop:prop.idprop,template:template},
                values:values,
                skip:true,
                name:prop.name,
                ftype:'objectReference'

            }
        ); //,{onblur:'_joe.showMessage($(this).val());'})
        var sortable = true;
        if(prop.hasOwnProperty('sortable')){sortable = prop.sortable;}
        var html= '<div class="joe-tags-container">'
            +self.renderTextField(specs)
            +'<div class="joe-text-input-button " data-fieldname="'+prop.name+'"' +
                'onclick="getJoe('+self.joe_index+').addObjectReferenceHandler(this);">add</div>'
            +'</div>'
            +'<div class ="joe-object-references-holder '+(sortable&&'sortable'||'')+'" data-field="'+prop.name+'">';

        //html+= fillTemplate(template,values);
       // html += self.createObjectReferenceItem(null,value,prop.name);
        value.map(function(v){
            html += self.createObjectReferenceItem(null,v,prop.name);
        });
        html +='</div>';
        //html+= self.renderTextField(specs);
        return html;
    };

    this.addObjectReferenceHandler = function(btn){
        var id = $(btn).siblings('input').val()
        var field = $(btn).data().fieldname;
        $('.joe-object-references-holder[data-field='+field+']').append(self.createObjectReferenceItem(null,id,field));

    };

    this.createObjectReferenceItem = function(item,id,fieldname){
        if(!item) {
            logit('adding ' + id + ' from ' + fieldname);
            var field = _getField(fieldname);
            var values = self.propAsFuncOrValue(field.values);
            var idprop = field.idprop||'_id';
            var item;
 /*           values.filter(function(i){
                return
            });*/
            for(var i = 0,tot = values.length; i <tot; i++){
                if(values[i][idprop] == id){
                    item = values[i];
                    break;
                }
            }
        }
        var deleteButton = '<div class="joe-delete-button joe-block-button left" ' +
            'onclick="$(this).parent().remove();">&nbsp;</div>';
        var template = field.template || "<div>${name}</div><span class='subtext'>"+id+"</span>";
        return '<div class="joe-field-item" data-value="'+id+'">'+deleteButton+fillTemplate(template,item)+'</div>';
    };

    function _getField(fieldname){
        var fieldobj;
        for(var f = 0,tot= self.current.fields.length; f<tot; f++){
            fieldobj = self.current.fields[f]
            if(fieldobj.name == fieldname){
                return fieldobj;
            }
        }
        return false;

    }
    this.getField = _getField;
/*-------------------------------------------------------------------->
	4 | OBJECT LISTS
<--------------------------------------------------------------------*/
    this.renderTableItem = function(listItem,quick,index) {
        var ghtml = '<tr>';
        ghtml +='</tr>';
    return ghtml;
    };
    this.renderListItem = function(listItem,quick,index){
		var listSchema  = $.extend(
			{
				_listID:'id',
                stripeColor:null
			},
			self.current.schema,
			self.current.specs
		);
		
		var idprop = self.getIDProp();// listSchema._listID;
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
        var numberHTML = '';
        if(index){
            numberHTML = index;
        }
        if(!listSchema._listTemplate){
			var title = listSchema._listTitle || listItem.name || id || 'untitled';
            var listItemButtons = '';//<div class="joe-panel-content-option-button fleft">#</div><div class="joe-panel-content-option-button fright">#</div>';
            var listItemIcon = (listSchema._icon && renderIcon(listSchema._icon,listItem)) || '';
            //list item content
            title="<div class='joe-panel-content-option-content ' "+action+">"+title+"<div class='clear'></div></div>";
			var html = '<div class="'+(self.allSelected && 'selected' ||'')+' joe-panel-content-option '+((numberHTML && 'numbered') || '' )+' joe-no-select '+((stripeColor && 'striped')||'')+'"  data-id="'+id+'" >'

                +'<div class="joe-panel-content-option-bg" '+bgHTML+'></div>'
                +'<div class="joe-panel-content-option-stripe" '+stripeHTML+'></div>'
                +'<div class="joe-panel-content-option-number" >'+numberHTML+'</div>'
                    +listItemIcon
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


        function renderIcon(icon,listItem){
            var iconURL = fillTemplate(icon,listItem);
            var iconhtml = '<div style=" background-image:url(\''+iconURL+'\'); " class="joe-panel-content-option-icon fleft"  >' +
                '<img src="'+iconURL+'"/>' +
                '</div>'
            return iconhtml;
        }
		return html;
	};
	this.shiftSelecting = false;
    var goBackListIndex;
	this.listItemClickHandler=function(specs){
        goBackListIndex = null;
        if(specs && specs.dom){//store index
            goBackListIndex = $(specs.dom).parents('.joe-panel-content-option').index();
            //logit('clicked index: '+goBackListIndex);
        }
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

        /*    if(!window.event.shiftKey){
                self.shiftSelecting = false;
            }*/
			
		}else if(window.event.shiftKey){
            var shiftIndex;
            var domItem;
            if($(specs.dom).hasClass('joe-panel-content-option')){
               /* if(!self.shiftSelecting){
                    $(specs.dom).toggleClass('selected');}
                else{

                }*/
                $(specs.dom).addClass('selected');
                shiftIndex = $(specs.dom).index();

            }else{
                $(specs.dom).parents('.joe-panel-content-option').addClass('selected');
                shiftIndex = $(specs.dom).parents('.joe-panel-content-option').index();
               /* if($(specs.dom).parents('.joe-panel-content-option').hasClass('selected')) {
                    shiftIndex = $(specs.dom).parents('.joe-panel-content-option').index();
                }*/
            }

            if(self.shiftSelecting !== false){
                if(shiftIndex < self.shiftSelecting){
                    var t = shiftIndex;
                    var p = self.shiftSelecting;
                    self.shiftSelecting = t;
                    shiftIndex = p;
                }
                $('.joe-panel-content-option').slice(self.shiftSelecting,shiftIndex+1).addClass('selected');
                $('.joe-panel-content-option').slice(shiftIndex+1).removeClass('selected');
                $('.joe-panel-content-option').slice(0,self.shiftSelecting).removeClass('selected');
            }
            else{
                self.shiftSelecting = shiftIndex;
            }



            $('.joe-panel-content-option.selected').map(function(i,listitem){
                self.current.selectedListItems.push($(listitem).data('id'));
            })

        }


        self.updateSelectionVisuals();

	};

    this.updateSelectionVisuals=function(){

        if(self.current.selectedListItems.length){
          //  $(specs.dom).parents('.joe-overlay-panel').addClass('multi-edit');
            self.overlay.addClass('multi-edit');
            self.overlay.find('.joe-selection-indicator').html(self.current.selectedListItems.length +' selected');
        }else{
          //  $(specs.dom).parents('.joe-overlay-panel').removeClass('multi-edit');
            self.overlay.removeClass('multi-edit');
            self.overlay.find('.joe-selection-indicator').html('');
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
		
		goJoe(protoItem,{title:'Multi-Edit '+(self.current.schema.__schemaname||'')+': '+items.length+' items',schema:(self.current.schema||null),multiedit:true});
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
            var html = '';
            //if(!opt.condition || (typeof opt.condition == 'function' && opt.condition(self.current.object)) || (typeof opt.condition != 'function' && opt.condition)) {
                if(!opt.condition || self.propAsFuncOrValue(opt.condition)){
                var html = '<div class="selector-option" onclick="getJoe(' + self.joe_index + ').selectSubset(\'' + (opt.id || opt.name || '') + '\');">' + opt.name + '</div>';
            }
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
		goJoe(self.current.list,
    //        $c.merge(self.current.userSpecs,{subset:subset})
            $.extend({},self.current.userSpecs,{subset:subset})

        );
	};
    this.toggleFilter=function(filtername,dom){
        var filter = ((self.current.schema && self.propAsFuncOrValue(self.current.schema.filters))||[])
                .where({name:filtername})[0] || false;
        if(!filter){
            logit('issue finding filter: '+filtername);
            return;
        }
        if(self.current.filters[filtername]){
            delete self.current.filters[filtername];
        }else{
            self.current.filters[filtername] = filter;
        }
        if(dom){$(dom).toggleClass('active')}
        self.filterListFromSubmenu(null,true);
        //self.reload();
        //self.hide();
        //goJoe(self.current.list,$c.merge(self.current.userSpecs,{subset:subset}));
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
        specs = specs || {};
        var object =specs.props || specs.object ||specs.list||specs.content;
		if(!object){
			return;
		}

		var title=specs.title || 'Object Focus';
		//mini.name=specs.prop.name||specs.prop.id || specs.prop._id;
		mini.id = cuid();
		
		//var html = '<div class="joe-mini-panel joe-panel">';

        var html =
            self.renderEditorHeader({title: title, action: 'onclick="getJoe(' + self.joe_index + ').hideMini()"'});

            html += self.renderEditorContent({object: object, mode: specs.mode || 'object'})
            html += self.renderEditorFooter({minimenu: specs.menu});

		$('.joe-mini-panel').addClass('active').html(html);
        if(!$('.joe-mini-panel .joe-panel-footer').find('.joe-button:visible').length){
            $('.joe-mini-panel').addClass('no-footer-menu');
        }
        if(specs.height){
            $('.joe-mini-panel').css('height',specs.height);
        }
		
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
        self.showBM = new Benchmarker();
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

    this.reload = function(hideMessage){
        var reloadBM = new Benchmarker();
        var info = self.history.pop();
        self.show(info.data,info.specs);
        if(!hideMessage){self.showMessage('reloaded in '+reloadBM.stop()+' secs');}
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
		self.overlay.find('.joe-date-field').Zebra_DatePicker({offset:[5,20],format:'m/d/Y',first_day_of_week:0});

        //itemcount
        if(currentListItems){
            if(goingBackQuery){
                self.overlay.find('.joe-submenu-search-field').val(goingBackQuery);
                self.filterListFromSubmenu(self.overlay.find('.joe-submenu-search-field')[0].value,true);
                goingBackQuery = '';
            }

            self.overlay.find('.joe-submenu-itemcount').html(currentListItems.length+' item'+((currentListItems.length != 1 &&'s') ||''));

        }
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
        //object reference
        self.overlay.find('.joe-object-references-holder.sortable').sortable();
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

        //go back to previous item
        if(goingBackFromID){
            if(goBackListIndex != null){
                //logit('rendering until '+goBackListIndex);

                //self.overlay.find('.joe-submenu-itemcount').html(currentListItems.length+' item'+((currentListItems.length > 1 &&'s') ||''));
                if(goBackListIndex > self.specs.dynamicDisplay) {
                    self.panel.find('.joe-panel-content').html(self.renderListItems(currentListItems, 0, goBackListIndex+1));
                }
                goBackListIndex = null;
            }
            try {
                self.overlay.find('.joe-panel-content-option[data-id="' + goingBackFromID + '"]')
                    .addClass('keyboard-selected')[0].scrollIntoView(true);
            }catch(e){
                logit('go back to item not ready yet:'+goingBackFromID);
                //TODO:'render all necessary items to go back'
            }
            //self.overlay.find('.joe-panel-content').scrollTop(self.overlay.find('.joe-panel-content').scrollTop()-20);
            //$('.joe-panel-content').scrollTop($('.joe-panel-content-option.keyboard-selected').offset().top);[0].scrollIntoView(true);

            goingBackFromID = null;
        }
        self._currentListItems = currentListItems;
/*        if($(window).height() > 700) {
            self.overlay.find('.joe-submenu-search-field').focus();
        }*/

        _bmResponse(self.showBM,'----Joe Shown')
    };
/*-------------------------------------------------------------------->
 J | MESSAGING
 <--------------------------------------------------------------------*/
	this.renderMessageContainer = function(){
		var mhtml = '<div class="joe-message-container left"></div>';
		return mhtml;
	};
    var messageTimeouts = Array(4);
	this.showMessage = function(message,specs){
		var mspecs = $.extend({
			timeout:3,
			message_class:''
		},(specs||{}));
		var message = message || 'JOE Message';
		var attr = 'class';
		var transition_time = 400;
        if(self.overlay.find('.joe-message-container').hasClass('active')){
            self.overlay.find('.joe-message-container')
                .html('<div class="joe-message-content">'+message+'</div>').attr('class','joe-message-container active show-message');
        }else{
            self.overlay.find('.joe-message-container')
                .html('<div class="joe-message-content">'+message+'</div>').attr('class','joe-message-container active left');
        }
            //TODO: don't toggle hidden class if no timeout.
		var target = "getJoe("+self.joe_index+").overlay.find('.joe-message-container')";

		//setTimeout(target+".attr('class','joe-message-container active')",50);
        clearTimeout(messageTimeouts[0]);
        clearTimeout(messageTimeouts[1]);
        clearTimeout(messageTimeouts[2]);
        clearTimeout(messageTimeouts[3]);
        messageTimeouts[0] = setTimeout(target+".attr('class','joe-message-container active show-message')",transition_time);
		if(mspecs.timeout){//only hide if timer is running and active

            messageTimeouts[1] = setTimeout(target+".attr('class','joe-message-container active ')",(mspecs.timeout*1000)+transition_time-250);
            messageTimeouts[2] = setTimeout(target+".attr('class','joe-message-container active right')",(mspecs.timeout*1000)+transition_time);
            messageTimeouts[3] = setTimeout(target+".attr('class','joe-message-container')",(mspecs.timeout*1000)+(2*transition_time)+50);

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

	this.updateObject = function(dom,callback,stayOnItem,overwrites,skipValidation){
        var oldObj = $.extend({},self.current.object);
		function defaultCallback(data){
			self.showMessage(data.name +' updated successfully');
		}
		var callback = callback || self.current.callback || (self.current.schema && self.current.schema.callback) || defaultCallback; //logit;
		var newObj = self.constructObjectFromFields(self.joe_index);
		newObj.joeUpdated = new Date();
        overwrites = overwrites || {};
		var obj = $.extend(newObj,overwrites);

//check required fields()
        var skipVal = _joe.propAsFuncOrValue(skipValidation);
        if(!skipVal) {
            var req_fields = [];

            //_joe.current.fields.where({required:true});
            req_fields = _joe.current.fields.filter(function (prop) {

                if (prop.required && (typeof prop.required != 'function' && prop.required) || (typeof prop.required == 'function' && prop.required(self.current.object))) {
                    return true;
                }
                return false;
            });

            function olistVal(olistObj) {
                var vals = '';
                for (var i in olistObj) {
                    vals += olistObj[i];
                }
                vals.replace(/ /g, '');
                return vals;
            }

            var required_missed = [];
            req_fields.map(function (f) {
                if (!obj[f.name] ||
                    ($.type(obj[f.name] == "array") && f.type != "objectList" && obj[f.name].length == 0 ) ||
                    (f.type == "objectList" && obj[f.name].filter(olistVal).length == 0)
                ) {

                    required_missed.push(f);
                    return false;
                }
            });
            $('.joe-object-field').removeClass('joe-highlighted');
            if (required_missed.length) {
                //f.display|| f.label|| f.name

                self.showMessage("There are <b>" + required_missed.length + "</b> required fields currently missing.");//<br/>"+required_missed.join(', ')
                required_missed.map(function (of) {
                    $('.joe-object-field[data-name=' + of.name + ']').addClass('joe-highlighted');
                });
                // self.panel.addClass('show-required');
                return false;
            }
        }
    //end validation

        obj = $.extend(self.current.object,newObj);
    //update object list
        var index = (self.current.list && self.current.list.indexOf(obj));
        if(self.current.list && (index == -1 || index == undefined)){
          //  object not in current list
            self.current.list.push(obj);
        }

    //run callback

		logit('object updated');
        callback(obj,oldObj,oldObj.changes(obj));
		if(!stayOnItem){self.goBack(obj);}

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
        var groups = {};
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
				if(!$(this).parents('.joe-object-field').hasClass('multi-selected')){
					return;
				}
			}
			switch($(this).attr('type')){

                case 'checkbox':
                    //IF multiple with same name, add them to array
					prop = $(this).attr('name');
                    if(groups[prop] || $('input[name='+prop+']').length > 1){//checkbox groups
                        groups[prop] = groups[prop] || [];
                        if ($(this).is(':checked')) {
                            groups[prop].push($(this).val());

                        }
                        object[prop] = groups[prop];
                    }else {//single checkboxes
                        if ($(this).is(':checked')) {
                            object[prop] = true;
                        } else {
                            object[prop] = false;

                        }
                    }
				break;

				case 'text':
				default:
					
					prop = $(this).attr('name');
					if(prop && prop != 'undefined') {//make sure it's suppoesed to be a prop field
                        switch ($(this).data('ftype')) {
                            //ace editor
                            case 'ace':
                                var editor = _joe.ace_editors[$(this).data('ace_id')];
                                //$(this).find('.ace_editor');
                                object[prop] = editor.getValue();
                                break;


                            case 'multisorter':
                                var vals = [];
                                $(this).find('.selections-bin').find('li').each(function () {
                                    vals.push($(this).data('id'));
                                });
                                object[prop] = vals;
                                break;
                            case 'buckets':
                                var vals = [];
                                $(this).find('.selections-bin').each(function () {
                                    vals.push([]);
                                    $(this).find('li').each(function () {
                                        vals[vals.length - 1].push($(this).data('id'));
                                    });
                                });
                                /*
                                 $(this).find('.selections-bin').find('li').each(function(){
                                 vals.push($(this).data('id'));
                                 });*/
                                object[prop] = vals;
                                break;
                            case 'objectReference':
                                var vals = [];
                                object[prop] = 'objectReference';
                                $('.objectReference-field[data-name="'+prop+'"]').find('.joe-field-item')
                                    .each(function(){
                                        vals.push($(this).data().value);
                                    });
                                object[prop] = vals;
                                break;
                            default:
                                object[prop] = $(this).val();
                                break;
                        }
                        break;
                    }
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
        self.current.selectedListItems = [];
        var currentItemIDs =
            currentListItems.map(function(item){return item[self.getIDProp()]})
        self.overlay.addClass('multi-edit');
        self.current.selectedListItems =  currentItemIDs;
        self.overlay.find('.joe-panel-content-option').addClass('selected');
        self.allSelected = true;
/*

        var itemsRendered = self.panel.find('.joe-panel-content-option').length;
        self.panel.find('.joe-panel-content').append(self.renderListItems(currentListItems,itemsRendered,currentListItems.length));
        //self.renderListItems(currentListItems.length-1);
		self.overlay.find('.joe-panel-content-option').filter(':visible').addClass('selected');
		self.overlay.addClass('multi-edit');
		self.overlay.find('.joe-panel-content-option.selected')
            .map(function(i,listitem){
			    self.current.selectedListItems.push($(listitem).data('id'));
		});
*/
        self.updateSelectionVisuals();

	};

/*-------------------------------------------------------------------->
ANALYSIS, IMPORT AND MERGE
 <--------------------------------------------------------------------*/
    this.analyzeImportMerge = function(newArr,oldArr,idprop,specs){
            self.showMessage('Beginning Merge Analysis of '+(newArr.length + oldArr.length),{timeout:0});
        if(_webworkers){
            //_joeworker = new Worker("../JsonObjectEditor/js/joe-worker.js");
            _joeworker = new Worker(joe_web_dir+"js/joe-worker.js");
            _joeworker.onmessage = function(e){
                //logit(e.data);
                if(!e.data.worker_update) {
                    self.showMessage('Analysis Completed in '+e.data.time+' secs',{timeout:0});
                    var analysisOK = confirm('Run Merge? \n' + JSON.stringify(e.data.results, null, '\n'));
                    if (analysisOK) {
                        specs.callback(e.data);
                    }else{
                        self.showMessage('next step cancelled');
                    }
                }else{
                    if(e.data.worker_update.message){
                        self.showMessage(e.data.worker_update.message, {timeout: 0});
                    }else {
                        self.showMessage('Merged ' + e.data.worker_update.current + '/' + e.data.worker_update.total + ' in ' + e.data.worker_update.time + ' secs', {timeout: 0});
                    }
                    logit('Merged '+e.data.worker_update.current+'/'+e.data.worker_update.total+' in '+e.data.worker_update.time+' secs');
                }
            };
            var safespecs = $.extend({},specs);
            delete safespecs.icallback;
            delete safespecs.callback;
            _joeworker.postMessage({action:'analyzeMerge',data:{
                newArr:newArr,
                oldArr:oldArr,
                idprop:idprop,
                specs:safespecs
            }});

            return;
        }


        var aimBM = new Benchmarker();
        var idprop = idprop || '_id';
        var defs = {
            callback:printResults,
            deleteOld:false,
            dateProp:null,
            icallback:null
            };
        specs = $.extend(defs,specs);
        var data = {
            add:[],
            update:[],
            same:[],
            'delete':[]
        };
        var oldArr = oldArr.sortBy(idprop);
        var newArr = newArr.sortBy(idprop);

        var newObj, oldObj,matchObj,testObj, i = 0,query={};
        var oldIDs = [];
        var newIDs = [];
//create an array of old object ids
        oldArr.map(function(s){oldIDs.push(s[idprop]);});
        newArr.map(function(s){newIDs.push(s[idprop]);});

        var query = {};
        query[idprop] = {$nin:oldIDs};
        //adds
        data.add = newArr.where(query);

        //updates||same
        query[idprop] = {$in:newIDs};
        var existing = oldArr.where(query);

        //for one-to-one, new items in the old array
        query[idprop] = {$in:oldIDs};
        var onetoone = newArr.where(query);


        for(var i = 0, len = existing.length; i < len; i++ ){
            newObj = onetoone[i], oldObj = existing[i];

            if(specs.dateProp && newObj[specs.dateProp] == oldObj[specs.dateProp]) {
                data.same.push(newObj);

            }else {
                data.update.push(newObj);
            }

        }

/*        var newObj, oldObj,matchObj, i = 0,query={};
        while(newObj = newArr[i++]){
            matchObj = oldArr.where(newObj);//is it currently in there in the same form

            if(matchObj.length){//currently there and the same
                data.same.push(newObj);
            }else{
                query[idprop] = newObj[idprop];

                matchObj = oldArr.where(query);
                if(matchObj.length){//is there, not the same
                    if(specs.dateProp ) {
                        if(matchObj[0][specs.dateProp] == newObj[specs.dateProp]) {
                            data.same.push(newObj);
                        }
                    }else {
                        data.update.push(newObj);
                    }
                }else{//not there
                    data.add.push(newObj);

                   }
            }
            if(specs.icallback){
                specs.icallback(i);
            }
        }*//*if(specs.dateProp){
            query[specs.dateProp] = newObj[specs.dateProp];
        }*/
        data.results = {
            add: data.add.length,
            update: data.update.length,
            same: data.same.length

        };
        self._mergeAnalyzeResults = data;

        logit('Joe Analyzed in '+aimBM.stop()+' seconds');
        var analysisOK = confirm('Run Merge? \n'+JSON.stringify(data.results,null,'\n'));
        if(analysisOK) {
            specs.callback(data);
        }
        function printResults(data){
            self.showMiniJoe({title:'Merge results',props:JSON.stringify(data.results,null,'\n'),mode:'text',menu:[]})
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

    this.propAsFuncOrValue = function(prop, toPass, defaultTo){
        var toPass = toPass || self.current.object;

/*        if(!toPass.hasOwnProperty(prop)){
            return defaultTo || false;
        }*/
        if(prop && typeof prop == 'function'){
            return prop(toPass);
        }
        return prop;
    };
/*-------------------------------------------------------------------->
 I | Hashlink
 <--------------------------------------------------------------------*/
    this.renderHashlink = function(){
        var hlink = fillTemplate();
    };

    var hash_delimiter = '/';
    if(location.href && location.href.indexOf(':::') != -1){
        hash_delimiter = ':::';
    }
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

        var hashtemplate = ($.type(specs.useHashlink) == 'string')?specs.useHashlink:'${schema_name}'+hash_delimiter+'${object_id}';
        //$SET({'@!':fillTemplate(hashtemplate,hashInfo)},{noHistory:true});
        $SET({'@!':fillTemplate(hashtemplate,hashInfo)});
    };

    this.readHashLink = function(){
        try {
            var useHash = $GET('!');
            if (!useHash || self.joe_index != 0) {
                return;
            }
            var hashBreakdown = useHash.split(hash_delimiter);
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
                    var section = $GET('section');
                    $DEL('section');
                    gotoSection(section);


                }
            }
        }catch(e){
            logit('error reading hashlink:'+e);
        }
        function gotoSection(section){
            if (section){
                $('.joe-content-section[data-section='+section+']').removeClass('collapsed')[0].scrollIntoView();
            }
        }
    };

    this.isNewItem = function(){

        if(!self.current.object || !self.current.object[self.getIDProp()]){
            return true;
        }
        return false;
    };
/*<------------------------------------------------------------->*/

	if(self.specs.autoInit){
		self.init();
	}
	return this;
}

var __clearDiv__ = '<div class="clear"></div>';

var __createBtn__ = {name:'create',label:'Create', action:'_joe.createObject();', css:'joe-orange-button'};
var __quicksaveBtn__ = {name:'quicksave',label:'QuickSave', action:'_joe.updateObject(this,null,true);', css:'joe-quicksave-button joe-confirm-button joe-iconed-button'};
var __saveBtn__ = {name:'save',label:'Save', action:'_joe.updateObject(this);', css:'joe-save-button joe-confirm-button joe-iconed-button'};
var __deleteBtn__ = {name:'delete',label:'Delete',action:'_joe.deleteObject(this);', css:'joe-delete-button joe-iconed-button', condition:function(){return (self.isNewItem && !self.isNewItem());}};
var __multisaveBtn__ = {name:'save_multi',label:'Multi Save', action:'_joe.updateMultipleObjects(this);', css:'joe-save-button joe-confirm-button joe-multi-only'};
var __multideleteBtn__ = {name:'delete_multi',label:'Multi Delete',action:'_joe.deleteMultipleObjects(this);', css:'joe-delete-button joe-multi-only'};
var __selectAllBtn__ = {name:'select_all',label:'select all',action:'_joe.selectAllItems();', css:'joe-left-button joe-multi-always'};

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

function _bmResponse(benchmarker,message){
    logit(message +' in '+benchmarker.stop()+' secs');
}

/*-------------------------------------------------------------------->
 CRAYDENT UPDATES
 <--------------------------------------------------------------------*/

/*
 * object.watch polyfill
 *
 * 2012-04-03
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// object.watch
if (!Object.prototype.observeProp && Object.defineProperty) {
    Object.defineProperty(Object.prototype, "watch", {
        enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop, handler) {
            var
                oldval = this[prop]
                , newval = oldval
                , getter = function () {
                    return newval;
                }
                , setter = function (val) {
                    oldval = newval;
                    handler = handler || logit;
                    var specs = {object:this, prop:prop, oldval:oldval, val:val};
                    handler(specs);
                    return newval = val;
                    //return
                }
                ;

            if (delete this[prop]) { // can't watch constants
                Object.defineProperty(this, prop, {
                    get: getter
                    , set: setter
                    , enumerable: true
                    , configurable: true
                });
            }
        }
    });
}

// object.unwatch
if (!Object.prototype.observeProp && Object.defineProperty) {
    Object.defineProperty(Object.prototype, "unwatch", {
        enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop) {
            var val = this[prop];
            delete this[prop]; // remove accessors
            this[prop] = val;
        }
    });
}
/*-------------------------------------------------------------------->
CRAYDENT UPDATES
 <--------------------------------------------------------------------*/

//UNTIL VERBOSE IS REMOVED

function logit(){
    try {

/*      var location = "\t\t\t\t    " + (new Error()).stack.split('\n')[2];
        for (var i = 0, len = arguments.length; i < len; i++) {
            arguments[i] = arguments[i] + location;
        }*/

        cout.apply(this, arguments);
        //cout.apply(arguments[0])
    } catch (e) {
        error('logit', e);
    }
}


//until sortBy is updated
_ext(Array, 'sortBy', function(props, rev, primer, lookup, options){
    try {
        options = ($c.isString(options) && options in {"i":1,"ignoreCase":1}) ? {i:1} : {};
        if($c.isString(props)){props=[props];}
        var key = function (x) {return primer ? primer(x[prop]) : x[prop]};
        primer = primer || function(x){return x;}
        var tmpVal;
        var reverseProp;
        var prop_sort = function (a,b,p) {
            p = p||0,
                prop = props[p];
            reverseProp = false;

            if(!prop){return -1;}
            if(prop[0] == "!"){
                prop = prop.replace('!','');
                reverseProp = true;
            }
            var aVal = primer((lookup && lookup[a][prop]) || a[prop]),
                bVal =primer( (lookup && lookup[b][prop]) || b[prop] );

            if (options.i && aVal && bVal) {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            //            tmpVal = aVal;
            //            aVal = (parseInt(aVal) && aVal.toString() == tmpVal && tmpVal) || tmpVal;
            //            tmpVal = bVal;
            //            bVal = (parseInt(bVal) && bVal.toString() == tmpVal && tmpVal) || tmpVal;
            tmpVal = aVal;
            aVal = (parseInt(aVal) && aVal.toString() == tmpVal && parseInt(tmpVal)) || tmpVal;
            tmpVal = bVal;
            bVal = (parseInt(bVal) && bVal.toString() == tmpVal && parseInt(tmpVal)) || tmpVal;



            if (aVal == bVal) {
                return prop_sort(a,b,p+1);
            }

            if(!reverseProp) {
                if (aVal > bVal) {
                    return 1;
                }
                return -1;
            }else{
                if (aVal < bVal) {
                    return 1;
                }
                return -1;
            }
        };
        this.sort(prop_sort);
        if (rev) {
            this.reverse();
        }

        return this;
    } catch (e) {
        error('Array.sortBy', e);
    }
}, true);