/* -------------------------------------------------------- 
 * 
 *  JOE - v1.5.0 
 *  Created by: Corey Hadden 
 * 
 * -------------------------------------------------------- */
/*/---------------------------------------------------------
    Craydent LLC
	Copyright 2014 (http://craydent.com/joe)
    Dual licensed under the MIT or GPL Version 2 licenses.
	(http://craydent.com/license)
---------------------------------------------------------/*/
//render field - self.renderObjectPropFieldUI
//render list item - self.renderListItems()
//single field list item -renderFieldListItem()
/*TODO:

    -make autoinit true
    -make grid into table functions
    -

*/
var _webworkers = false;
var _joeworker;
if (!!window.Worker) {
    _webworkers = true


}

$c.TEMPLATE_VARS.push(
    {variable:'/textarea',value:'</textarea>'},
    {variable:'textarea',value:'<textarea>'},
    {variable:'SERVER',value:'//'+$c.SERVER}

);


var __joeFieldTypes = [
    'text',
    'select',
    'code',
    'rendering',
    'date',
    'boolean',
    'geo',
    'image',
    'url',
    'objectList',
    'objectReference',
    'group',
    'content'
];

function JsonObjectEditor(specs){
	var self = this;
    initialized = false;
    var colCount = 1;
	var listMode = false;

    var gridMode = false;
    var tableMode = false,tableSpecs;
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
				title:'HTML Rendering',
				callback:function(){alert('yo');}
				//fields:['id','name','thingType','legs','species','weight','color','gender'],
				//_listID:'id',
				//_listTitle:'${name} ${species}'

		}},
		compact:false,
		useControlEnter:true,
		autoInit:false,
        dynamicDisplay:30,
        sans:false,
        listSubMenu:true,
        documentTitle:false
	};

	this.specs = $.extend({},defaults,specs||{});
    this.Data = {};
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
        if(initialized){return false;}

        beginLogGroup('JOE init');
        self.current = {filters:{}};
        var html = self.renderFramework(
                self.renderEditorHeader() +
                self.renderEditorContent() +
                self.renderEditorFooter()
        );
        self.container.append(html);
        self.overlay = $('.joe-overlay[data-joeindex=' + self.joe_index + ']');
        self.panel = self.overlay.find('.joe-overlay-panel');
        self.initKeyHandlers();
        self.readHashLink();
/*        $(window).on('hashChange',function(h,i,c){
            logit(h,i,c);

        });*/
        window.addEventListener("hashchange", function(newH,oldH){
            logit(newH);
            logit(oldH);
            var useHash = $GET('!') || location.hash;
            if (!useHash || self.joe_index != 0) {
                return false;
            }
            var useHash = useHash.replace('#','');
            var hashBreakdown = useHash.split(hash_delimiter).condense();
            console.log('hash',hashBreakdown);

        }, false);
        var respond_timeout;
        //self.respond();
        $(window).on('resize',function(){
            clearTimeout(respond_timeout);
            respond_timeout = setTimeout(self.respond,200);
            //self.respond
        });
        initialized = true;
        endLogGroup();
	};

/*-------------------------------------------------------------------->
     INIT KEY HANDLERS
 <--------------------------------------------------------------------*/
    this.initKeyHandlers = function(){
        if (self.specs.useBackButton) {
            window.onkeydown = function (e) {
                var code = e.keyCode
                var nonBackElements = ['input','select','textarea'];
                var isInputElement = nonBackElements.indexOf(e.target.tagName.toLowerCase()) != -1;
                if (code == 8) {//BACKBUTTON PRESSED
                    if(isInputElement){
                        //return false;
                    }
                    else{
                        self.goBack();
                        return false;
                    }
                }else if([37,39,38,40,13,16,17].indexOf(code) == -1){//set focus for alphanumeric keys
                    if(listMode) {
                        var inSearchfield = false;
                        if ($(document.activeElement) && $(document.activeElement)[0] != $('.joe-submenu-search-field')[0]) {
                            self.overlay.find('.joe-submenu-search-field').focus();
                            inSearchfield = true;
                            $('.joe-panel-content-option.keyboard-selected').removeClass('keyboard-selected');
                        }
                    }else{//NOT LIST MODE, DETAILS MODE
                        //is control key down
                        if(e.ctrlKey) {
                            switch (code) {
                                case 83://look for control save
                                    if(self.container.find('.joe-button.joe-quicksave-button').length) {
                                        self.updateObject(null, null, true);
                                        if (e.stopPropagation) e.stopPropagation();
                                        if (e.preventDefault) e.preventDefault();
                                    }
                                break;
                            }
                        }
                    }
                }else{
                    //38 up, 40 dn,13 enter,37 left, 39 right
                    var autocompleteField = $('.joe-text-autocomplete.active').length;

                    if(autocompleteField){
                        var sel = '.joe-text-autocomplete-option.visible'+'.keyboard-selected';
                        //$('.joe-text-autocomplete-option.visible').length();
                        var keyboardSelectedIndex = ($(sel).length)? $(sel).index():-1;
                        switch(code){
                            case 38://up
                                keyboardSelectedIndex--;
                                if(keyboardSelectedIndex > -1) {
                                    keyboardSelectOption('.joe-text-autocomplete-option.visible');
                                }
                                break;
                            case 40://down
                                keyboardSelectedIndex++;
                                if(keyboardSelectedIndex < $('.joe-text-autocomplete-option.visible').length) {
                                    keyboardSelectOption('.joe-text-autocomplete-option.visible');
                                }
                                break;
                            case 13://enter
                                if(keyboardSelectedIndex != -1){
                                    $(sel).click();
                                }
                                break;
                        }
                    }
                    if(listMode){
                        var keyboardSelectedIndex = ($('.joe-panel-content-option.keyboard-selected').length)?
                            $('.joe-panel-content-option.keyboard-selected').index():-1;
                        //logit(keyboardSelectedIndex);

                        switch(code) {
                            case 38://up
                                keyboardSelectedIndex--;
                                if (keyboardSelectedIndex > -1) {
                                    keyboardSelectOption('.joe-panel-content-option', top);
                                }
                                break;
                            case 40://down
                                keyboardSelectedIndex++;
                                if (keyboardSelectedIndex < currentListItems.length) {
                                    keyboardSelectOption('.joe-panel-content-option', top);
                                }
                                break;
                            case 13://enter
                                if (keyboardSelectedIndex != -1) {
                                    $('.joe-panel-content-option.keyboard-selected').find('.joe-panel-content-option-content').click();
                                }
                                break;
                        }
                    }else{
                        if(e.ctrlKey) {
                            switch(code) {
                                case 37://left
                                case 39://right
                                    var sside = (code ==37)?'left':'right';
                                    if(self.current.sidebars[sside].content){
                                        self.toggleSidebar(sside)
                                    }
                                break;

                            }
                        }

                    }
                    function keyboardSelectOption(selector,top){
                        $(selector+'.keyboard-selected').toggleClass('keyboard-selected');
                        var el = $(selector).eq(keyboardSelectedIndex);
                        el.addClass('keyboard-selected');
                        self.overlay.find('.joe-submenu-search-field').blur();
                        // $('.joe-panel-content').scrollTop($('.joe-panel-content-option.keyboard-selected').offset().top);
                        el[0].scrollIntoView(top);
                        //var panel_content = self.overlay.find('.joe-panel-content');
                        //panel_content.animate({ scrollTop: panel_content.scrollTop()-10 });

                        //panel_content.scrollTop(panel_content.scrollTop()-10);
                    }
                }
            }
        }
    };
/*-------------------------------------------------------------------->
	2 | FRAMEWORK START
<--------------------------------------------------------------------*/
    this.getMode = function(){
        if(listMode){return 'list';}
        return 'details';
    };
	this.renderFramework = function(content){
		var style = 'style-variant1';
        var html =
		'<div class="joe-overlay sans cols-'+colCount+' '+style+' '
            +((self.specs.compact && ' compact ') || '')
            +((self.specs.sans && ' sans ') || '')
            +'" data-joeindex="'+this.joe_index+'">'+
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
        beginLogGroup('JOE population');
		//logit('------Beginning joe population');
		var specs = setts || {};
		self.current.specs = setts;
		self.current.data = data;
	//clean copy for later;
		self.current.userSpecs = $.extend({},setts);
        gridMode = (self.current.specs.viewMode == 'grid')?true:false;
        tableMode = (self.current.specs.viewMode == 'table')?true:false;
        colCount = self.current.specs.colCount || colCount || 1;

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
 String
 -------------------------*/
    if($.type(data) == 'string' && datatype != "string" && self.getDataset(data,{boolean:true})){
        data = self.getDataset(data);
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
                specs._listMenuTitle || specs._listWindowTitle || getProperty('specs.list.windowTitle')
                || (specs.schema &&
                    (specs.schema._listMenuTitle || specs.schema._listWindowTitle)
                ))

            );
        specs.title =(
			title
			|| specs.listWindowTitle
			|| (specs.schema && (specs.schema.title||specs.schema._title))  || "Viewing "+specs.mode.capitalize());
	//setup profile
		specs.profile = (profile)?
			(self.specs.profiles[profile]||self.specs.joeprofile):
			self.specs.joeprofile;

		self.current.profile = specs.profile;


	//cleanup variables
		self.cleanUp();

/*-------------------------------------------------------------------->
 Set global view mode specs
 <--------------------------------------------------------------------*/
        if(self.current.schema &&(self.current.schema.table||self.current.schema.tableView)){
            tableSpecs = $.extend({cols:['name',self.getIDProp()]},
                (self.current.schema
                    &&(self.current.schema.table||self.current.schema.tableView)
                    // &&(self.current.schema.table||self.current.schema.tableView).cols
                ) ||{});
        }else{
            tableSpecs = null;
        }
    /*-------------------------------------------------------------------->
     Framework Rendering
     <--------------------------------------------------------------------*/
        var contentBM = new Benchmarker();
        beginLogGroup('Content');
        var content = self.renderEditorContent(specs);
        endLogGroup();
        _bmResponse(contentBM,'JOE Content');
        var chromeBM = new Benchmarker();
		var html =

			self.renderEditorHeader(specs)+
            self.renderEditorSubmenu(specs)+
            content+
			self.renderEditorFooter(specs)+
			self.renderMessageContainer();

        _bmResponse(chromeBM,'JOE Chrome');
		    self.overlay.find('.joe-overlay-panel').html(html);
		//$('.joe-overlay-panel').html(html);

	//update history 2/2	- add title
		if(!self.current.specs.noHistory && self.history.length){
			$.extend(self.history[self.history.length-1],
                {_joeHistoryTitle:self.overlay.find('.joe-panel-title').html()}
            );
		}
    //clear ace_editors
/*        for (var p in _joe.ace_editors){
            _joe.ace_editors[p].destroy();
        }
        _joe.ace_editors = {};*/

    //update hashlink
        self.updateHashLink();
		//logit('Joe Populated in '+joePopulateBenchmarker.stop()+' seconds');
        _bmResponse(joePopulateBenchmarker,'----Joe Populated');
        endLogGroup();
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
    function createTitleObject(specs){
        var titleObj = $.extend({},self.current.object);
        if(specs.list){
            var lcount = specs.list.length;
            if(self.current.subset){
                lcount = specs.list.where(self.current.subset.filter).length;
            }
            titleObj._listCount =(lcount||'0');
        }
        self.current.title = specs.title || 'Json Object Editor';
        var title = fillTemplate(self.current.title,titleObj);
        titleObj.docTitle = title;
        return titleObj;
    }
	this.renderEditorHeader = function(specs){
        var BM = new Benchmarker();
		var specs = specs || {};
		var titleObj = /*createTitleObject(specs);*/$.extend({},self.current.object)
		if(specs.list){
            var lcount = specs.list.length;
            if(self.current.subset){
             lcount = specs.list.where(self.current.subset.filter).length;
            }
			titleObj._listCount =(lcount||'0');
		}
        self.current.title = specs.title || 'Json Object Editor';
		var title = fillTemplate(self.current.title,titleObj);
        titleObj.docTitle = title;
        //show doctitle
        if(self.specs.documentTitle){
            var doctitle = (self.specs.documentTitle === true)?
                self.current.title:self.propAsFuncOrValue(self.specs.documentTitle,self.current.title);
            document.title = fillTemplate(doctitle,titleObj);
        }
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

        var reload_button = (specs.minimode)?'':
        '<div class="jif-panel-header-button joe-panel-reload" title="reload" '+reload_action+'><span class="jif-reload"></span></div>';

		var html =
		'<div class="joe-panel-header">'+
			((specs.schema && specs.schema.subsets && self.renderSubsetselector(specs.schema)) || (specs.subsets && self.renderSubsetselector(specs)) || '')+
        (!specs.minimode && renderHeaderBackButton() || '')+
			'<div class="joe-vcenter joe-panel-title-holder"><span class="joe-panel-title">'+
				(('<div>'+title+'</div>').toDomElement().innerText || title || 'Json Object Editor')+
			'</span></div>'+
        //'<div class="joe-panel-reload joe-panel-header-button" title="reload" '+reload_action+'></div>'+
        reload_button+
        '<div class="jif-panel-header-button joe-panel-close" title="close" '+close_action+'>' +//joe-panel-close
        '<span class="jif-close"></span>'+
        '</div>'+
			'<div class="clear"></div>'+
		'</div>';
        _bmResponse(BM,'[Header] rendered');
		return html;
	};

    //What happens when the user clicks the close button.
	this.closeButtonAction = function(){
		self.history = [];
        self.panel.addClass('centerscreen-collapse');
        self.hide(500);

        self.clearAuxiliaryData();
        $(self.container).trigger({
            type: "hideJoe",
            index:self.joe_index/*,
            schema: self.current.specs.schema,
            subset: self.current.specs.subset*/
        });
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
                    var found = joespecs.data.where(query);
                    found.length && $.extend(found[0],obj);
                }
            }
            if(joespecs.keyword){
                goingBackQuery = joespecs.keyword;
            }
        }

        var specs = $.extend({},joespecs.specs);
        specs.filters = joespecs.filters;
		self.show(joespecs.data,specs);
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
/*        for (var p in _joe.ace_editors){
            _joe.ace_editors[p].destroy();
        }
        _joe.ace_editors = {};*/
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
        var BM = new Benchmarker();
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
            filters:showFilters,
            numCols:['1','2','3']
        };
        var userSubmenu = ($.type(self.current.submenu) != 'object')?{}:self.current.submenu;
        $.extend(subSpecs,userSubmenu);

        if(specs.mode == 'list') {
            var submenu =
                '<div class="joe-panel-submenu">'
            //right side
                + self.renderViewModeButtons(subSpecs)
                + self.renderColumnCountSelector(subSpecs.numCols)
                + self.renderSorter()

                    //left side
                + ((subSpecs.filters && self.renderSubmenuFilters(subSpecs.filter)) || '')
                + ((subSpecs.search && self.renderSubmenuSearch(subSpecs.search)) || '')
                + ((subSpecs.itemcount && self.renderSubmenuItemcount(subSpecs.itemcount)) || '')

                + '</div>'
                + "<div class='joe-filters-holder'>"
                + renderSubsetsDiv()
                + (self.current.schema && (self.propAsFuncOrValue(self.current.schema.filters,self.current.list) && renderFiltersDiv()) || '')
                    // +'<span class="jif-arrow-left"></span>'
                + "</div>";
        }else{
            var submenu =
                '<div class="joe-panel-submenu">'
                    + ((sectionAnchors.count && sectionAnchors.code) || '')
                    + renderSidebarToggle('left')+ renderSidebarToggle('right')
                + '</div>';/*
                + "<div class='joe-filters-holder'>"
               // + renderSubsetsDiv()
                //+ (self.current.schema && (self.propAsFuncOrValue(self.current.schema.filters) && renderFiltersDiv()) || '')
                    // +'<span class="jif-arrow-left"></span>'
                + "</div>";*/
        }

        //TODO:move to subsets filter rendering function
        function renderSubsetsDiv(){
            var sh = '<div><div class="joe-menu-label">Subsets</div>';
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
            var fh = '<div><div class="joe-menu-label">Filters</div>';
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

        _bmResponse(BM,'[Submenu] rendered');
        return submenu;
    };
    function renderSectionAnchors(){
        var anchorhtml = '<div class="joe-submenu-section-anchors">';
        anchorhtml+='<div class="joe-submenu-section" onclick="$(\'.joe-overlay[data-joeindex='+self.joe_index+']\').find(\'.joe-panel-content\').scrollTop(0)">^ top</div>';
        var scount = 0;
        var template =
            //'<div class="joe-submenu-section" onclick="$(\'.joe-content-section[data-section=${id}]\').removeClass(\'collapsed\')[0].scrollIntoView()">${name}</div>';
            '<div class="joe-submenu-section f${renderTo}" onclick="getJoe('+self.joe_index+').gotoSection(\'${id}\');">${name}</div>';

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

    self.gotoSection =function(section,closeSiblings,index){
        if (section){
            var i = index || self.joe_index;
            var sectionDom = $('.joe-overlay[data-joeindex='+i+']')
                .find('.joe-content-section[data-section=\''+section+'\']');
            sectionDom.removeClass('collapsed')[0].scrollIntoView();

            var sidebar = sectionDom.parents('.joe-content-sidebar');
            if(sidebar && sidebar.length){
                var s = sidebar.data('side');
                self.toggleSidebar(s,true);
                sectionDom.siblings('.joe-content-section').addClass('collapsed');
            }else if(self.sizeClass == "small-size"){
                self.toggleSidebar('left',false);
                self.toggleSidebar('right',false);
            }

        }
    };
/*------------------>
    Filter
<------------------*/
    this.renderSubmenuFilters = function(s){

        if(!(s || self.current.subsets)){
           return '';
        }

        var action =' onclick="getJoe('+self.joe_index+').toggleFiltersMenu();" ';
        var html =
            "<div class='jif-panel-submenu-button joe-filters-toggle ' "+action+">"
                +"</div>";



        return html;
    };

    var leftMenuShowing = false;
    this.toggleFiltersMenu = function(){
        leftMenuShowing = !leftMenuShowing;
        self.panel.toggleClass('show-filters',leftMenuShowing);
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
            var keywords = value.replace(/,/g,' ').split(' ');
            var filters = self.generateFiltersQuery();

            _joe.history[_joe.history.length-1].keyword = value;
            _joe.history[_joe.history.length-1].filters = self.current.filters;


            var testable;
            var idprop = self.getIDProp();
            var id;
            var listables = (self.current.subset)?self.current.list.where(self.current.subset.filter):self.current.list;
            var searchables = self.current.schema && self.current.schema.searchables;
            //logit('search where in '+searchBM.stop()+' seconds');
            _bmResponse(searchBM,'search where');
            currentListItems = listables.where(filters).filter(function(i){
                id = i[idprop];
                testable = '';
                if(searchables){//use searchable array
                    searchables.map(function(s){
                        testable+=i[s]+' ';
                    });
                    testable = testable.toLowerCase()+id;
                    for(var k = 0,tot = keywords.length; k<tot;k++){
                        if(testable.indexOf(keywords[k]) == -1){
                            return false;
                        }
                    }
                    //return (testable.toLowerCase().indexOf(value) != -1);

                    //return (testable+' '+i[idprop].toLowerCase().indexOf(value) != -1);
                }else {
                    if (tableMode) {
                        testable = self.renderTableItem(i, true);
                    } else if (gridMode) {
                        //testable = self.renderListItem(i,true);
                    } else {
                        testable = self.renderListItem(i, true);
                    }
                    testable = testable.toLowerCase()+id;
                    for (var k = 0, tot = keywords.length; k < tot; k++) {

                        if (testable.indexOf(keywords[k]) == -1) {
                            return false;
                        }
                    }
                    //return ((__removeTags(testable)+id).toLowerCase().indexOf(value) != -1);
                }
                return true;
            });

            //logit('search filter found '+currentListItems.length+' items in '+searchBM.stop()+' seconds');
            _bmResponse(searchBM,'search filter found '+currentListItems.length+' items')
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

/*------------------------------------------------------>
    //SUBMENU SELECTORS
 <-----------------------------------------------------*/
    function renderSubmenuSelectors(specs){
        var specs = $.extend({
                options:[],
                content:'',
                action:'nothing',
                buttonTemplate: "<div class='selection-label'>${label}</div>${name}",
                label:'label',
                value:'v'
            },(specs||{}));

        var selectionTemplate =
            "<div data-colcount='${name}' " +
                "onclick='getJoe("+self.joe_index+")" + "."+specs.action+"(${name});' "
                +"class='jif-panel-button selector-button-${name} joe-selector-button " +
                //"${RUN{checkSubmenuSelector;${name}}}" +
                "'>"
                +specs.buttonTemplate
            +'</div>';


        var content = specs.content ||
            "<div class='joe-selector-button selector-label'>"+specs.label+"</div>"+
            fillTemplate(selectionTemplate,specs.options);

        var html="<div class='joe-submenu-selector opts-"+specs.options.length+"' >"+ content+ "</div>";

        /*function checkSubmenuSelector(value){
            var submenuValue = value || this.value;
            return ''
        }*/
        return html;
    }
    this.nothing = function(nothing){
        alert(value);
    };
/*------------------>
View Mode Buttons
<------------------*/
    this.renderViewModeButtons = function(subspecs){
        var gridspecs = self.current.schema && self.current.schema.grid;
        var tablespecs = tableSpecs; //self.current.schema && (self.current.schema.table||self.current.schema.tableView);

        if(!gridspecs && !tablespecs){return '';}
        var modes = [
            {name:'list'}
        ];
        if(gridspecs){modes.push({name:'grid'})}
        if(tablespecs){modes.push({name:'table'})}

        var modeTemplate="<div data-view='${name}' " +
            "onclick='getJoe("+self.joe_index+")" + ".setViewMode(\"${name}\");' " +
            "class='jif-panel-button joe-viewmode-button ${name}-button joe-selector-button'>&nbsp;</div>";
        var submenuitem =
            "<div class='joe-submenu-selector opts-"+modes.length+"' >"+//onhover='$(this).toggleClass(\"expanded\")'
                "<div class='joe-selector-button selector-label'>view</div>"+
                fillTemplate(modeTemplate,modes)+
            "</div>";
        //return '';
        return submenuitem;
    };

    this.setViewMode = function(mode){
        self.reload(true,{viewMode:mode});
    };



/*------------------------------------------------------>
 Column Count Buttons
 <-----------------------------------------------------*/
    this.renderColumnCountSelector = function(subspecs){
        if(!subspecs){
            return '';
        }
        var modes = [
            {name:'1'},
            {name:'2'},
            {name:'3'}
        ];

/*        var modeTemplate="<div data-colcount='${name}' " +
            "onclick='getJoe("+self.joe_index+")" + ".setColumnCount(${name});' " +
            "class='jif-panel-button selector-button-${name} joe-selector-button'>" +
            "<div class='selection-label'>cols</div>${name}</div>";
        var submenuitem =
            "<div class='joe-submenu-selector opts-"+modes.length+"'' >"+
            fillTemplate(modeTemplate,modes)+
            "</div>";*/

        var h = renderSubmenuSelectors({
            options:modes,
            //buttonTemplate:"<div class='selection-label'>cols</div>${name}",
            label:'cols',
            value:colCount,
            action:'setColumnCount'
        });
        return h;
        //return submenuitem;
    };
    this.setColumnCount = function(mode){
        self.overlay[0].className = self.overlay[0].className.replace(/cols-[0-9]/,'cols-'+mode);
        if(mode){colCount = mode;}
        //self.reload(true,{colCount:mode});
    };


/*------------------------------------------------------>
    Submenu Sorter
 <-----------------------------------------------------*/


 this.renderSorter = function(subspecs){
     var sorter = (self.current.subset && self.current.subset.sorter)
         ||(self.current.schema && self.current.schema.sorter)|| 'name';
     if($.type(sorter) == 'string'){sorter = sorter.split(',');}
     if(sorter.indexOf('name') == -1 && sorter.indexOf('!name') == -1){
         sorter.push('name');
     }
     var newsorter = subspecs;
     var current;
     return '<label for="joe-'+self.joe_index+'-sorter" class="joe-list-sorter">sort ' +
         '<select name="joe-'+self.joe_index+'-sorter" onchange="getJoe('+self.joe_index+').resort(this.value);">' +
         sorter.map(function(s){
             current = (s == self.current.sorter[0]) ?'selected':'';
             /* if(self.current.sorter[0] == s){
              return '<option value="!'+s+'">!'+s+'</option>';
              }*/
             return '<option '+current+' value="'+s+'">'+s+'</option>';
         })+
         '</select></label>';
 };

this.resort = function(sorter){
    self.reload(false,{sorter:sorter})
};
    /*----------------------------->
        C | Editor Content
    <-----------------------------*/
	this.renderEditorContent = function(specs){

        self.current.sidebars = {left:{collapsed:false},right:{collapsed:false}};
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
        if(!specs.minimode) {
            if ((mode == 'list' && self.current.submenu) || (self.current.submenu || renderSectionAnchors().count)) {
                submenu = ' with-submenu '
            }
        }
        //submenu=(self.current.submenu || renderSectionAnchors().count)?' with-submenu ':'';
        var scroll = 'onscroll="getJoe('+self.joe_index+').onListContentScroll(this);"';
        var rightC = content.right||'';
        var leftC = content.left||'';
        var content_class='joe-panel-content joe-inset ' +submenu;// +(rightC && ' right-sidebar '||'')+(leftC && ' left-sidebar '||'');
		var html =


		'<div class="'+content_class+'" ' +((listMode && scroll)||'')+'>'
        +(content.main||content)
		+'</div>'
        +self.renderSideBar('left',leftC,{css:submenu})
        +self.renderSideBar('right',rightC,{css:submenu});
        self.current.sidebars.left.content = leftC;
        self.current.sidebars.right.content = rightC;
		return html;
	};

    this.renderSideBar = function(side,content,specs){
        var side = side || 'right';
        var expanded='';//(content && ' expanded ') ||'';
        var specs = specs || {};
        var addCss = specs.css || '';
        var html="<div class='joe-content-sidebar joe-absolute "+side+"-side "+expanded+ addCss+"' data-side='"+side+"'>"+(content||'')+__clearDiv__+"</div>";
        return html;
    };
    this.toggleSidebar = function(side,hardset){
        if(['right','left'].indexOf(side) == -1){
            return false;
        }
        self.panel.toggleClass(side+'-sidebar',hardset);
        /*        $('.joe-panel-content').toggleClass(side+'-sidebar',hardset)
         $('.joe-content-sidebar.'+side+'-side').toggleClass('expanded',hardset)*/
    };

    function renderSidebarToggle(side){
        var html='<div class="jif-panel-submenu-button joe-sidebar-button joe-sidebar_'+side+'-button" ' +
            'title="toggle sidebar (ctrl + '+side+' arrow)" onclick="getJoe('+self.joe_index+').toggleSidebar(\''+side+'\')"></div>';

        return html;
    }

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

        if(specs.minimode) {
            return self.renderMiniListContent(specs);
        }
            currentListItems = [];
            self.current.selectedListItems = [];
            self.current.anchorListItem = null;


		specs = specs || {};
		var schema = specs.schema;
		var list = specs.list || [];
		var html = '';
        var filteredList;

        if(self.current.sorter &&(($.type(self.current.sorter) != 'array') || self.current.sorter.length) ){
            list = list.sortBy(self.current.sorter);
        }
        //list = list.sortBy(self.current.sorter);
		//logit('list sort complete in '+wBM.stop()+' seconds');
        _bmResponse(wBM,'list sort complete');
		var numItemsToRender;
        if(!self.current.subset){
            currentListItems = list;
		}
		else{
            filteredList = list.where(self.current.subset.filter);
            currentListItems = filteredList;
            _bmResponse(wBM,'list where complete');
			//logit('list where complete in '+wBM.stop()+' seconds');
		}
        _bmResponse(wBM,'list prerender');
        numItemsToRender = self.specs.dynamicDisplay || currentListItems.length;
        html+= self.renderListItems(currentListItems,0,numItemsToRender);

        _bmResponse(wBM,'list complete');
		//logit('list complete in '+wBM.stop()+' seconds');
		return html;

	};
    this.renderMiniListContent = function(specs){
        var wBM = new Benchmarker();

        specs = specs || {};
        var schema = specs.schema;
        var list = specs.object || [];
        var idprop = specs.idprop || '_id';
        var html = '';
        var sorter = specs.sorter || 'name';
        //var click = specs.click || 'alert(\'${name}\')';
        list = list.sortBy(sorter);
        var click = 'getJoe('+self.joe_index+').minis[\''+specs.minimode+'\'].callback(\'${'+idprop+'}\')';

        var template = specs.template || '<h4>${name}</h4><div>${'+idprop+'}</div>';
            template ='<div class="joe-field-list-item" onclick="'+click+'">'+template+'</div>';

        //TODO: lazy-render images

        for(var li = 0,tot = list.length; li<tot;li++){
          html+= fillTemplate(template,list[li]);
        }
        _bmResponse(wBM,'minilist complete');
        //logit('minilist complete in '+wBM.stop()+' seconds');
        return html;

    };

    this.renderListItems = function(items,start,stop){
        var html = '';
        var listItem;
        var items = items || currentListItems;
        var start = start || 0;
        var stop = stop || currentListItems.length -1;

        if(gridMode) {
            html+='<table class="joe-grid-table"><thead><th>&nbsp;</th><th>name</th><th>id</th></thead><tbody>';
            for (var i = start; i < stop; i++) {
                listItem = items[i];
                if (listItem) {
                    //html += self.renderListItem(listItem, false, i + 1);
                    html += self.renderGridItem(listItem, false, i + 1);

                }
            }
            html+='</tbody></table>';

            return html;
        }else if(tableMode){
            /*var tableSpecs = $.extend({cols:['name',self.getIDProp()]},
                (self.current.schema
                    &&(self.current.schema.table||self.current.schema.tableView)
                   // &&(self.current.schema.table||self.current.schema.tableView).cols
                ) ||{});*/
            html+='<table class="joe-item-table" cellspacing="0"><thead class="joe-table-head"><th>&nbsp;</th>';
            tableSpecs.cols.map(function(c){
                if($c.isString(c)) {
                    html += '<th>' + c + '</th>';
                }else if($c.isObject(c)){
                    html += '<th>' + (c.header||c.display) + '</th>';
                }
            });

            html+='</thead><tbody>';
            stop = currentListItems.length;
            for (var i = start; i < stop; i++) {
                listItem = items[i];
                if (listItem) {
                    //html += self.renderListItem(listItem, false, i + 1);
                    html += self.renderTableItem(listItem, false,i + 1);

                }
            }
            html+='</tbody></table>';

            return html;
        }
        else{
            for (var i = start; i < stop; i++) {
                listItem = items[i];
                if (listItem) {
                    html += self.renderListItem(listItem, false, i + 1);
                    //html += $GET('table') ? self.renderGridItem(listItem, false, i + 1) : self.renderListItem(listItem, false, i + 1);
                }
            }

            return html;

        }
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
                    if(gridMode){

                    }if(tableMode){

                    }else {
                        html += self.renderListItems(null, currentItemCount, currentItemCount + self.specs.dynamicDisplay);
                        self.panel.find('.joe-panel-content').append(html);
                    }
                }
        }catch(e){
            logit('error scrolling for more content: \n'+e);
        }
    };

/*--
     //OBJECT
 --*/
	//TODO: Add configed listeneres via jquery not strings
    var renderFieldTo;
	this.renderObjectContent = function(specs){
        renderFieldTo = 'main';
		specs = specs || {};
		var object = specs.object;
		var fields = {main:'',left:'',right:''};
		var propObj;
		var fieldProp;
        self.current.fields = [];
        self.current.sections = {};
        var schemaFields = (specs.schema)?self.propAsFuncOrValue(specs.schema.fields):false;
		if(!specs.schema || !schemaFields){//no schema use items as own schema
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

					fields.main += self.renderObjectField(propObj);
				}
			}
		}
		else{
            var fhtml;
			(schemaFields||[]).map(function(prop){

                //logit(renderFieldTo);
                fhtml = self.renderObjectPropFieldUI(prop,specs);
                fields[renderFieldTo]+=fhtml;
			}); //end map

		}

		var html ='<div class="joe-object-content">'+fields.main+'<div class="clear"></div></div>';
		return fields;
	};
    var rerenderingField = false;
	this.rerenderField = function(fieldname){
        self.current.constructed = self.constructObjectFromFields();
        rerenderingField = true;
        if($c.isArray(fieldname)){
            fieldname = fieldname.join(',');
        }
        fieldname.split(',').map(function(f){
            var fields = self.renderObjectPropFieldUI(f);
            $('.joe-object-field[data-name='+f+']').parent().replaceWith(fields);
        });
        rerenderingField = false;
        self.current.constructed = null;

	};

	self.renderObjectPropFieldUI = function(prop,specs){
		//var prop = fieldname;
		var fields = '';

        var schemaspec = specs || self.current.schema;
        var existingProp =
            (self.propAsFuncOrValue(schemaspec.fields)||[]).filter(function(s){return s.name == prop || s.extend == prop})[0]
        if(existingProp){
            prop = existingProp;
        }

		if($.type(prop) == "string") {
			//var fieldProp = self.fields[prop] || {};
            var propObj = self.fields[prop] || self.current.fields.filter(function(f){return f.name ==prop;})[0]||{};
			var fieldProp = $.extend({},propObj);
			//merge all the items
			var propObj =extendField();

			if(self.constructObjectFromFields()[prop] !== undefined){

				fieldProp.value = self.constructObjectFromFields()[prop]
			}
			fields += self.renderObjectField(propObj);
		}else if($.type(prop) == "object" && prop.name) {
            var fieldProp = $.extend({},prop || {});
            //merge all the items
            var propObj =extendField(prop.name);

            if(self.constructObjectFromFields()[prop.name] !== undefined){

                fieldProp.value = self.constructObjectFromFields()[prop.name]
            }
            fields += self.renderObjectField(propObj);
        }else if(prop && prop.extend){
            var fieldProp = $.extend({},self.fields[prop.extend] || {},prop.specs||{});
            var propObj =extendField(prop.extend);
            if(self.constructObjectFromFields()[prop.extend] !== undefined){
                fieldProp.value = self.constructObjectFromFields()[prop.extend]
            }
            //renderFieldTo = propObj.sidebar_side || propObj.side || 'main';
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
                //renderFieldTo = prop.sidebar_side || prop.side || renderFieldTo;
            }
            else if(prop.section_end){
                fields += self.renderPropSectionEnd(prop);
                //renderFieldTo = 'main';
            }else if(prop.sidebar_start){
                //fields += self.renderPropSectionStart(prop);


                renderFieldTo = prop.sidebar_side || prop.sidebar_start || 'main';
                if(renderFieldTo != 'main'){
                    //self.current.sidebars[renderFieldTo].collapsed = false;
                    if(prop.hasOwnProperty('collapsed')){
                        self.current.sidebars[renderFieldTo].collapsed = self.propAsFuncOrValue(prop.collapsed);
                    }
                }
            }
            else if(prop.sidebar_end){
                renderFieldTo = 'main';
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
        var collapsed = (self.propAsFuncOrValue(prop.collapsed))?'collapsed':'';
        var toggle_action = "onclick='$(this).parent().toggleClass(\"collapsed\")'";
        var section_html = '<div class="joe-content-section '+show+' '+collapsed+'" data-section="'+secID+'">' +
            '<div class="joe-content-section-label" '+toggle_action+'>'+secname+'</div>'+
            '<div class="joe-content-section-content">';
        //add to current sections
        self.current.sections[secID]={open:true,name:secname,id:secID,hidden:hidden,renderTo:renderFieldTo};
        return section_html;
    };
    self.renderPropSectionEnd = function(prop){
        var secID = prop.section_end;
        var section = _getSection(secID)
        if(!secID || !(section && section.open)){
            return '';
        }
        var section_html = __clearDiv__+'</div></div>';
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

        _bmResponse(fBM,'[Footer] rendered');
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
		display = fillTemplate(self.propAsFuncOrValue(m.label || m.name),self.current.object);
		action = fillTemplate(self.propAsFuncOrValue(m.action),self.current.object) || 'alert(\''+display+'\')';
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
        var joeFieldBenchmarker = new Benchmarker();
		//field requires {name,type}
        self.current.fields.push(prop);
        prop.value = self.propAsFuncOrValue(prop.value);
		//set default value
		if(prop.value == undefined && prop['default'] != undefined){
			prop.value = prop['default'];
		}

    //hidden
		var hidden = '';
        var qHidden = self.propAsFuncOrValue(prop.hidden);
        if(qHidden){
            if(parseBoolean(qHidden) === undefined){
                var negated = qHidden[0] == '!';
                var hiddenPropVal = $.extend({},self.current.object,self.constructObjectFromFields())[qHidden.replace('!','')];
                hidden = negated^!!hiddenPropVal?'hidden':'';
            }else {
                hidden = 'hidden';
            }
        }

    //required
        var required = '';
        if(self.propAsFuncOrValue(prop.required)){
            required = 'joe-required';
        }

        var html ='';

    //propdside
        var propdside = prop.sidebar_side||prop.side || renderFieldTo;
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
			html+='<div class="joe-field-container joe-fleft" style="width:'+prop.width+';" data-side="'+propdside+'">';
		}else{
            html+='<div class="joe-field-container" data-side="'+propdside+'">';
        }

        var fieldlabel = self.propAsFuncOrValue(prop.display||prop.label||prop.name);

		html+=
			'<div class="joe-object-field '+hidden+' '+required+' '+prop.type+'-field " data-type="'+prop.type+'" data-name="'+prop.name+'">'+
			'<label class="joe-field-label" title="'+prop.name+'">'+(required && '*' ||'')
                +fillTemplate(fieldlabel,self.current.object)
				+self.renderFieldTooltip(prop)
            +'</label>';
        //render comment
        html+= self.renderFieldComment(prop);
        //add multi-edit checkbox
		if(self.current.userSpecs.multiedit){
			html+='<div class="joe-field-multiedit-toggle" onclick="$(this).parent().toggleClass(\'multi-selected\')"></div>';
		}

		html += self.selectAndRenderFieldType(prop);
        html += self.renderGotoLink(prop);
        html+= renderFieldAfter();
        html+='</div>';//close object field;

		//if(prop.width){
        //close field container
			html+='</div>';
	//	}


        function renderFieldAfter(){
            var obj = (rerenderingField)?self.current.constructed:self.current.object;
            return (prop.after &&
            '<div class="joe-field-after">'+fillTemplate(self.propAsFuncOrValue(prop.after),obj)+'</div>'
            ||'');
        }
		preProp = prop;
        _bmResponse(joeFieldBenchmarker,'field '+prop.name+ ' '+prop.type);
		return html;
	};

    this.renderGotoLink = function(prop,style){
        var goto = self.propAsFuncOrValue(prop.goto);
      if(goto){
          var action='';
          if($.type(goto) == "string"){

            action = goto;
            //action = 'getJoe('+self.joe_index+').gotoItemByProp(\''+prop.name+'\',$(this).siblings().val(),\''+goto+'\');';
              action = 'getJoe('+self.joe_index+').gotoFieldItem(this,\''+goto+'\');';
          }else {
              //var values= self.getField(prop.name);

          }
          var btnHtml = '';
          switch(style||prop.type){
              case 'select':
                  btnHtml+=
                  '<div class="joe-button inline joe-view-button joe-iconed-button" onclick="' +
                    action + '" title="view '+goto+ '">view</div>';
              break;
          }
          return btnHtml;
      }else{
        return '';
      }
    };

    this.gotoFieldItem =function(dom,schema){
        var fieldname = $(dom).parents('.joe-object-field').data('name');
        var field = self.getField(fieldname);
        var idprop = prop.idprop || self.getIDProp(schema);
        //var values = self.propAsFuncOrValue(field.values);
        var values = self.getFieldValues(field.values);
        var id = $(dom).siblings('.joe-field').val();
        var object = values.filter(function(v){
            return v[idprop] == id;
        })[0]||false;
        if(!object){
            return false;
        }
        self.show(object,{schema:schema});

    };
    this.renderFieldComment = function(prop){
        var comment = self.propAsFuncOrValue(prop.comment);
        if(!comment){return '';}
        //var comment = ($.type(prop.comment) == "function")?prop.comment():prop.comment;
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
		//var joeFieldBenchmarker = new Benchmarker();

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

            case 'uploader':
                html+= self.renderUploaderField(prop);
                break;

            case 'preview':
                html+= self.renderPreviewField(prop);
                break;
            case 'wysiwyg':
                html+= self.renderTinyMCEField(prop);
                //html+= self.renderCKEditorField(prop);
                break;
            case 'passthrough':
                html+= self.renderPassthroughField(prop);
                break;
			default:
				html+= self.renderTextField(prop);
				break;
		}

        //_bmResponse(joeFieldBenchmarker,'Joe rendered '+(prop.name||"a field"));
		//logit('Joe rendered '+(prop.name||"a field")+' in '+joeFieldBenchmarker.stop()+' seconds');
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
        var rerender = (prop.rerender)?
            ' getJoe('+self.joe_index+').rerenderField(\''+prop.rerender+'\'); ':'';

		var profile = self.current.profile;

		var disabled = (profile.lockedFields.indexOf(prop.name) == -1)?
			'':'disabled';

		if(evts.onblur || prop.onblur){
			bluraction = 'onblur="'+(evts.onblur||'')+' '+self.getActionString('onblur',prop)+'"';
		}
		if(evts.onchange || prop.onchange || rerender){
			changeaction = 'onchange="'+rerender+(evts.onchange||'')+' '+self.getActionString('onchange',prop)+'"';
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
    function cleanString(value){
        return ((value || '')+'').replace(/\"/g,"&quot;");
    }
	this.renderTextField = function(prop){
		var autocomplete;
		if(prop.autocomplete && prop.values){

            if(typeof prop.values == "function"){
                prop.values = prop.values(self.current.object);
            }
            if($.type(prop.values) == 'string' && self.getDataset(prop.values)){
                prop.values = self.getDataset(prop.values);
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
            ((prop.placeholder && 'placeholder="'+self.propAsFuncOrValue(prop.placeholder)+'"')||'')+ //add placeholder
            'type="text"  '+disabled+' name="'+prop.name+'" value="'+cleanString(prop.value || '')+'" maxlength="'+(prop.maxlength || '')+'" '
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
                ac_id = (autocomplete.value && fillTemplate(self.propAsFuncOrValue(autocomplete.value,ac_opt),ac_opt))
                    ||(autocomplete.idprop && ac_opt[autocomplete.idprop])
                    ||ac_opt._id||ac_opt.id||ac_opt.name;
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
        var content,show
            needles = dom.val().toLowerCase().replace( /,/,' ').split(' ');
            needles.removeAll('');
		autocomplete.find('.joe-text-autocomplete-option').each(function(i,obj){
            content = (obj.textContent===undefined) ? obj.innerText : obj.textContent;
            //content = obj.innerHTML;
			//self.checkAutocompleteValue(dom.val().toLowerCase(),content,obj);
            show = self.checkAutocompleteValue(needles,content.replace( /,/,' ').toLowerCase(),obj);
            $(obj).toggleClass('visible',show);

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
        $(dom).parent().siblings('.joe-reference-add-button').click();
		//$(dom).previous('.joe-text-field').val($(dom).html());
	};

	this.checkAutocompleteValue = function(needles,haystack,dom,additive){
		var d = $(dom);
        //var needles = needle.replace( /,/,' ').split(' ');
        if(!needles.length){
            return true;
            //d.addClass('visible');
        }
        for(var n = 0, tot = needles.length; n<tot; n++){
          if(haystack.indexOf(needles[n]) == -1){//needle not in haystack
            return false;
          }
            //d.removeClass('visible');
        }
        return true;
        //d.addClass('visible');
/*        var overlap = needles.filter(function(n) {
            return haystacks.indexOf(n) != -1
        });
        if(overlap.length || !needle){
            d.addClass('visible');
        }else{
            d.removeClass('visible');
        }*/
       /* if(haystack.toLowerCase().indexOf(needle) != -1 || !needle){
			d.addClass('visible');
		}else{
			d.removeClass('visible');
		}*/
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
		/*var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values || [prop.value];*/
        var values = self.getFieldValues(prop.values);
		var valObjs = [];
		if($.type(values[0]) != 'object'){
			values.map(function(v){
				valObjs.push({name:v});
			});
		}
		else{
			valObjs = values;
		}



		var selected;
		var multiple =(prop.multiple)?' multiple ':'';
		var selectSize = prop.size || ((valObjs.length*.5) > 10)? 10 : valObjs.length/2;

		if(!prop.size && !prop.multiple){
			selectSize = 1;
		}
		var html=
		'<select '+disabled+' class="joe-select-field joe-field" name="'+prop.name+'" value="'+(prop.value || '')+'" size="'+selectSize+'"'+
			self.renderFieldAttributes(prop)+
			multiple+
		' >';


        var template = self.propAsFuncOrValue(prop.template) || '';
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
				html += '<option value="'+val+'" '
                    +selected
                    +(self.propAsFuncOrValue(v.disabled)&&'disabled="disabled"'||'')+'>'+optionVal+'</option>';
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
		+'<img class="joe-image-field-image" src="'+(prop.value||'')+'" />'
		+'<span class="joe-image-field-size"></span>';
           // +'<script>_joe.updateImageFieldImage($(\'input[name=thumbnail]\'),2000)</script>';

		return html;
	};

	this.updateImageFieldImage = function(dom,timeout){
        /*if($(dom).is('img')) {//img
            var src = $(dom).parent().find('input.joe-image-field').val();
            //var img = $(dom).next('.joe-image-field-image');
            var img = $(dom).parent().find('.joe-image-field-image');
            img.attr('src', src);
        }else{//input*/
        logit('img update');
            var src = $(dom).val();
            //var img = $(dom).next('.joe-image-field-image');
            var img = $(dom).parent().find('.joe-image-field-image');
            self.updateImageSize(img);
            img.attr('src', src);
     //   }
	};

    this.updateImageSize = function(img) {
        var jqImg = $(img);
        //if (!jqImg.hasClass('loaded')) {
            jqImg.siblings('.joe-image-field-size').html(jqImg.width() + 'w x ' + jqImg.height() + 'h');

            //jqImg.addClass('loaded');
       // }

    };

/*----------------------------->
	J | Multisorter
<-----------------------------*/
	this.renderMultisorterField = function(prop){

		//var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
        var values = self.getFieldValues(prop.values);
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

		/*var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];*/
        var values = self.getFieldValues(prop.values);
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
		var constructedItem =self.current.constructed || {};
		if(!self.current.object[idProp] ||(constructedItem[idProp] && constructedItem[idProp] == self.current.object[idProp])){
			itemObj = constructedItem;

            if(self.current.object[idProp] && constructedItem[idProp] == self.current.object[idProp]){
                if(rerenderingField){

                    itemObj = $.extend({},  self.current.object,constructedItem);
                }else{

                    itemObj = $.extend({}, constructedItem, self.current.object);
                }
            }
		}
        try {
            if (prop.run) {
                html += prop.run(itemObj, prop) || '';
            } else if (prop.template) {
                html += fillTemplate(prop.template, itemObj);
            }
        }catch(e){
            return 'error rendering field:'+e;
        }
        return html;

    };

    this.renderFieldListItem = function(item,contentTemplate,schema,specs){


        var specs = $.extend({
            deleteButton:false,
            expander:null,
            gotoButton:false,
            itemMenu:false,
            schemaprop:false,
            callback:false,
            value:''
        },specs);
        var contentTemplate = contentTemplate || '<h4>${name}</h4><div class="joe-subtext">${itemtype}</div>';
        var schema = (self.propAsFuncOrValue(specs.schemaprop,item)||schema||item.itemtype||item.type);
        var schemaobj = self.schemas[schema];

        var idprop = specs.idprop || (schemaobj && schemaobj.idprop) ||'_id';
        var hasMenu = specs.itemMenu && specs.itemMenu.length;
        var action = specs.action || ' onclick="goJoe(_joe.search(\'${'+idprop+'}\')[0],{schema:\''+schema+'\'})" ';
        var clickablelistitem = (!specs.gotoButton/* && !hasMenu*/);
        //var clickablelistitem = !!clickable && (!specs.gotoButton && !hasMenu);
        var deleteButton = '<div class="joe-delete-button joe-block-button left" ' +
            'onclick="$(this).parent().remove();">&nbsp;</div>';
        var expanderContent = renderItemExpander(item,specs.expander);

        var click = (!clickablelistitem)?'':action;

        var html = fillTemplate('<div class="'
            +((clickablelistitem && 'joe-field-list-item clickable') ||'joe-field-item')
            +(specs.deleteButton &&' deletable' ||'')
            +(specs.gotoButton &&' gotobutton' ||'')
            +(specs.itemMenu &&' itemmenu' ||'')
            +(specs.expander &&' expander expander-collapsed' ||'')+'" '
            +(specs.value &&'data-value="' + specs.value + '"' ||'')
            +'>'

                    //if(clickableListItem){
                        +((hasMenu && renderItemMenu(item, specs.itemMenu)) || '')

                        + (specs.deleteButton && deleteButton || '')
                        + '<div class="joe-field-item-content" ' + click + '>'
                        + self.propAsFuncOrValue(contentTemplate+__clearDiv__, item)
                        + '</div>'
                        + self._renderExpanderButton(expanderContent, item)
                   /* }else {
                        //+click
                        +((hasMenu && renderItemMenu(item, specs.itemMenu)) || '')
                        + '<div class="joe-field-item-content" ' + click + '>'
                        + (specs.deleteButton && deleteButton || '')
                        + self._renderExpanderButton(expanderContent, item)
                        + self.propAsFuncOrValue(contentTemplate, item)
                        + '</div>'
                    }*/
                +(specs.gotoButton && '${RUN[_renderGotoButton]}' || '')
                +expanderContent
            +'</div>',item);
        return html;
    };
/*----------------------------->
 M | URL
 <-----------------------------*/
    this.renderURLField = function(prop){
        var profile = self.current.profile;
            var disabled = _disableField(prop);// (prop.locked &&'disabled')||'';
        var prefix = fillTemplate(prop.prefix||'',self.current.object);
        var html=
            prefix+
            '<div class="joe-button" onclick="_joe.gotoFieldURL(this,\''+prefix+'\');">view</div>'
            +'<input class="joe-url-field joe-field" type="text" ' +
            self.renderFieldAttributes(prop)+
            'name="'+prop.name+'" value="'+(prop.value || '')+'"  '+disabled+' />'
       + __clearDiv__;
        return html;
    };
    this.gotoFieldURL = function(dom,prefix){
        var url = $(dom).siblings('.joe-url-field').val();
        window.open((prefix||'')+url);
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
    function getObjectlistSubProperty(prop){
        var subprop = prop;
        if($.type(prop) == "string"){
            subprop = {name:prop};
            subprop.name = subprop.name || prop;
        }else{
            if(subprop.extend && self.fields[subprop.extend]){
                subprop = $.extend({},subprop,self.fields[subprop.extend],(subprop.specs||{}))
                subprop.name = subprop.name || subprop.extend;
            }
        }
        return subprop;
    }
    this.renderObjectListField = function(prop){
        var hiddenHeading = (prop.hideHeadings)?" hidden-heading " :'';
        var html ="<table class='joe-objectlist-table "+hiddenHeading+"' >"
            +self.renderObjectListHeaderProperties(prop)
            +self.renderObjectListObjects(prop)
        //render a (table/divs) of properties
        //cross reference with array properties.
        +"</table>";
        var max = prop.max;

        if(!max || !prop.value || (prop.value.length < max)){
            var addaction = 'onclick="getJoe('+self.joe_index+').addObjectListItem(\''+prop.name+'\')"';
            html+='<div><div class="joe-button joe-iconed-button joe-plus-button" '+addaction+'> Add Another</div>'+__clearDiv__+'</div>'
        }
        return html;
    };
    this.objectlistdefaultproperties = ['name','_id'];
//render headers
    this.renderObjectListHeaderProperties = function(prop){
        var properties = prop.properties || self.objectlistdefaultproperties;
        var property;
        var subprop;
        var width;
        var html = '<thead><tr><th class="joe-objectlist-object-row-handle-header"></th>';
        for(var p = 0,tot = properties.length; p<tot;p++){
            subprop = getObjectlistSubProperty(properties[p]);
/*            if($.type(properties[p]) == "string"){
                subprop = self.fields[subprop]||{name:properties[p]}
                subprop.name = subprop.name || properties[p];
            }*/


            property = {
                name: subprop.display||subprop.name,
                type: subprop.type||'text'
            };
            width=(subprop.width)?'width="'+subprop.width+'"':'';
            html+="<th data-subprop='"+subprop.name+"' "+width+">"
                +(subprop.display || subprop.name)+"</th>";
        }
        html+="<th class='joe-objectlist-delete-header'></th>";
        html+="</tr></thead>";
        return html;
    };

//render objects
    this.renderObjectListObjects = function(prop){
        var objects = self.current.object[prop.name] || prop['default'] || [];
        var properties = prop.properties || self.objectlistdefaultproperties;

        var html = '<tbody id="joe-objectist-table">';
        var objHtml = '';
        var obj;
        for(var o = 0,objecttot = objects.length; o<objecttot;o++){
            obj = objects[o];
            html+=self.renderObjectListObject(obj,properties,o);
        //parse across properties

        }
        html+="</tbody>";
        return html;
    };
    this.renderObjectListObject = function(object,objectListProperties,index){
        var properties = objectListProperties || self.objectlistdefaultproperties;
        var prop,property;
        //var html = "<tr class='joe-object-list-row' data-index='"+index+"'><td class='joe-objectlist-object-row-handle'>|||</td>";
        var html = "<tr class='joe-object-list-row' data-index='"+index+"'><td><div class='joe-panel-button joe-objectlist-object-row-handle' "+delaction+">|||</div></td>";

        var renderInput = {
            'text':self.renderTextField,
            select:self.renderSelectField,
            'date':self.renderDateField,
            'content':self.renderContentField,
            'rendering':self.renderRenderingField
        };

        //show all properties
        //TODO:create template in previous function and then use that to show values?
        for(var p = 0,tot = properties.length; p<tot;p++){
            prop = getObjectlistSubProperty(properties[p]);
            //prop = ($.type(properties[p]) == "string")?{name:properties[p]}:prop;
            property = $.extend({
                name: prop.name,
                type:prop.type||'text',
                value:object[prop.name] || ''
            },prop);

            html+="<td>"+renderInput[property.type](property)+"</td>";

        }
        var delaction = "onclick='getJoe("+self.joe_index+")._oldeleteaction(this);'";
        html+="<td ><div class='jif-panel-button joe-delete-button' "+delaction+">&nbsp;</div></td>";
        html+= '</tr>';



        return html;
    };

    this.addObjectListItem = function(fieldname,specs){
        var fieldobj = self.getField(fieldname);
        var index = $('.joe-object-field[data-name='+fieldname+']').find('.joe-object-list-row').length;
        var content = self.renderObjectListObject({},fieldobj.properties,index);
        $('.joe-object-field[data-name='+fieldname+']').find('tbody').append(content);
    };
    this._oldeleteaction = function(dom){
        $(dom).parents('tr.joe-object-list-row').remove();
    };
    this.removeObjectListItem = function(fieldname,index){
        var fieldobj = self.getField(fieldname);
        $('.joe-object-field[data-name=module_fields]').find('tbody').append(content);
    };

/*----------------------------->
 P | Render Checkbox Group
 <-----------------------------*/
    this.renderCheckboxGroupField = function(prop){
        //var profile = self.current.profile;
       /* var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];*/
        var values = self.getFieldValues(prop.values);
        var html= '';
        var checked;
        var itemid;
        var idprop = prop.idprop || '_id';
        var cols = prop.cols || 2;
        values.map(function(value){
            if($.type(value) != 'object'){
                var tempval = {name:value};
                tempval[idprop]=value;
                value = tempval;
            }
            itemid = 'joe_checkbox-'+prop.name;
            checked = ((prop.value||[]).indexOf(value[idprop]) != -1)?' checked ':'';
            html+= '<div class="joe-group-item cols-'+cols+'"><label >'
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
		var code_language = (prop.language||'html').toLowerCase();
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
 U | Uploader Field
 <-----------------------------*/
    this.uploaders = {};
    this.renderUploaderField = function(prop){
        var uploader_id = cuid();
        if(typeof AWS == 'undefined' ){
            $('body').append(
                '<script>function none(){return; }</script>' +
                '<script type="text/javascript" src="https://sdk.amazonaws.com/js/aws-sdk-2.1.34.min.js"></script>'+
                //'<script src="http://webapps-cdn.esri.com/CDN/jslibs/craydent-1.7.37.js"></script>'+
                '<script src="'+joe_web_dir+'js/libs/craydent-upload-1.1.0.js" type="text/javascript"></script>'+
                '');
        }

        var values = self.getFieldValues(prop.values);
        var dz_message = '<div style="line-height:100px;">drag files here to upload</div>';

        if(prop.field && self.current.object[prop.field]){
            var kfield = self.getField(prop.field);
            var preview = self.current.object[prop.field]
            if(kfield.prefix){
                preview = fillTemplate(kfield.prefix,self.current.object)+preview;
            }
            dz_message = '<img src="'+preview+'"/>'
        }
        var html=
            '<div class="joe-uploader" data-uploader_id="'+uploader_id+'">'+
                '<div class="joe-uploader-preview"></div>'+
                '<div class="joe-uploader-dropzone">'+dz_message+'</div>'+
                '<div class="joe-uploader-message">add a file</div>'+
            '<div class="joe-button joe-green-button joe-upload-cofirm-button hidden"  onclick="_joe.uploaderConfirm(\''+uploader_id+'\');">Upload File</div>'+__clearDiv__+
            '</div>'
            ;
        //var idprop = prop.idprop || '_id';
        //html+= __clearDiv__;
        self.uploaders[uploader_id] = {prop:prop.name};
        return html;
    };

    this.onUserUpload = function(file,base64) {
        var dom = $(this.dropZone).parent();

        var joe_uploader = self.uploaders[dom.data('uploader_id')];
        //var results = dom.find('.joe-uploader-message');
        var guid = "" || cuid();
        var field = _joe.getField(joe_uploader.prop);
        if (file) {
            joe_uploader.file = file;
            joe_uploader.base64 = base64;

            joe_uploader.dropzone.html('<img src="' + base64 + '">');
            joe_uploader.message.html('<b>'+file.name+'</b> selected');
            joe_uploader.confirmBtn.removeClass('hidden');
        }else {
            results.innerHTML = 'Nothing to upload.';
        }
    };
        //setup AWS
    this.uploaderConfirm = function(uploader_id){
        var joe_uploader = self.uploaders[uploader_id];
        //var results = dom.find('.joe-uploader-message');
        var guid = "" || cuid();
        var field = _joe.getField(joe_uploader.prop);
        var file = joe_uploader.file;
        var base64 = joe_uploader.base64;
        var callback = function(err,url){
            if(err){
                joe_uploader.message.append('<div>'+(err.message||err)+'<br/>'+err+'</div>');
                alert('error uploading');
            }else{
                if(field.field){
                    joe_uploader.message.append('<div>uploaded</div>');
                    self.current.object[field.field] = url;
                    self.rerenderField(field.field);
                    self.updateObject(null, null, true);
                   // self.panel.find('.joe-panel-menu').find('.joe-quicksave-button').click();

                }
            }
        }
        var uploadFunction = field.upload || function(file,callback,base64){
                alert('file uploaded');
                callback(err,url);
            };
        if(file){
                uploadFunction(file,callback,base64);
        }
       /* AWS.config.update({
            accessKeyId:'',
            secretAccessKey:'',
            region:''
        });

        // Configure your region
        //AWS.config.region = 'us-west-1';
        if (file) {
            if(field.aws && field.aws.bucket) {
                var bucket = new AWS.S3({
                    params: {
                        Bucket: field.aws.bucket//'patterns.esri.com/uploaded'
                    }
                });
            }
            joe_uploader.message.append('Uploading '+file.name+' to s3');

            var params = {
                Key:guid+""+file.name,
                ContentType:file.type,
                Body:file
            };
            bucket.upload(params, function (err, data) {
                if(err){

                    joe_uploader.message.append('<div>'+m+'<br/>'+err+'</div>');
                }else{

                    joe_uploader.message.append('<div>uploaded</div>');
                }
                //var m = err ? 'ERROR!' : 'UPLOADED.';
                logit(data);
            });
        } else {
            results.innerHTML = 'Nothing to upload.';
        }*/
    };
    this.readyUploaders = function(){
        self.panel.find('.joe-uploader').each(function(){
            var id = $(this).data('uploader_id');
          //$(this).find('.joe-uploader-message').html('awaiting file');
            var uploader = new Uploader({
                target:$(this).find('.joe-uploader-dropzone')[0],
                deferUpload:true,
                onerror:function (data, status, response) {
                    var message = data.message || data || "Server responded with error code: " + status;
                    message = message.indexOf('bytes') != -1 ? 'file is too small, needs to be larger than 1MB' : message;
                    alert(message);
                    //objUpload['uploadFaces'].clear();
                    logit(data);
                    //$('divDropZone').innerHTML = data;
                },
                onafterfileready:self.onUserUpload
            });
            self.uploaders[id].ready = true;
            self.uploaders[id].uploader = uploader;
            self.uploaders[id].message = $(this).find('.joe-uploader-message').html('awaiting file');
            self.uploaders[id].preview = $(this).find('.joe-uploader-preview');
            self.uploaders[id].dropzone = $(this).find('.joe-uploader-dropzone');
            self.uploaders[id].confirmBtn = $(this).find('.joe-upload-cofirm-button');

        });
    };
/*----------------------------->
 V | Object Reference
 <-----------------------------*/
    this.renderObjectReferenceField = function(prop){
        //var values = self.propAsFuncOrValue(prop.values) || [];
        var values = self.getFieldValues(prop.values);
        var value = self.current.object[prop.name] ||
            prop.value ||
            (!self.current.object.hasOwnProperty(prop.name) && prop['default']) ||
            [];
        if($.type(value) != 'array'){
            value = (value != null)?[value]:[];
        }
        var disabled = _disableField(prop);
        var idprop =prop.idprop || self.getIDProp();
        var template = prop.autocomplete_template || "<div>${name}</div><span class='subtext'>${"+idprop+"}</span>";//prop.template ||
        //var values = ($.type(prop.values) == 'function')?prop.values(self.current.object):prop.values||[];
        var html = "Object Reference";
        var specs = $.extend(
            {},{
                autocomplete:{idprop:prop.idprop,template:template},
                values:values,
                skip:true,
                name:prop.name,
                ftype:'objectReference',
                placeholder:prop.placeholder

            }
        ); //,{onblur:'_joe.showMessage($(this).val());'})
        var sortable = true;
        if(prop.hasOwnProperty('sortable')){sortable = prop.sortable;}
        var html= '';
        if(!disabled){
            html+=
                '<div class="joe-references-container">'
                +self.renderTextField(specs)
                +'<div class="joe-text-input-button joe-reference-add-button" data-fieldname="'+prop.name+'"' +
                'onclick="getJoe('+self.joe_index+').addObjectReferenceHandler(this);">add</div>'
                + '</div>'
        }
            html+=__clearDiv__+'<div class ="joe-object-references-holder '+disabled+(sortable && !disabled && 'sortable'||'')+'" data-field="'+prop.name+'">';

        //html+= fillTemplate(template,values);
       // html += self.createObjectReferenceItem(null,value,prop.name);
        value.map(function(v){
            if($c.isObject(v)){
                html += self.createObjectReferenceItem(v,null,prop.name);
            }else if($c.isString(v)){
                html += self.createObjectReferenceItem(null,v,prop.name);
            }

        });
        html +='</div>';
        //html+= self.renderTextField(specs);
        return html;
    };

    this.addObjectReferenceHandler = function(btn){
        var id = $(btn).siblings('input').val();
        if(!id){return false;}
        $(btn).siblings('input').val('');
        var field = $(btn).data().fieldname;
        $('.joe-object-references-holder[data-field='+field+']').append(self.createObjectReferenceItem(null,id,field));

    };
    this.createObjectReferenceItem = function(item,id,fieldname){
        var field = _getField(fieldname);
        var idprop = field.idprop||'_id';
        if(!item) {
            var values = self.getFieldValues(field.values);
            var item;
            for(var i = 0,tot = values.length; i <tot; i++){
                if(values[i][idprop] == id){
                    item = values[i];
                    break;
                }
            }
        }
        if(!item) {
            var deleteButton = '<div class="joe-delete-button joe-block-button left" ' +
                'onclick="$(this).parent().remove();">&nbsp;</div>';
            return '<div class="joe-field-item deletable" data-value="' + id + '">' +
                deleteButton + "<div>REFERENCE NOT FOUND</div><span class='subtext'>" + id + "</span>" + '</div>';
        }
        var template = self.propAsFuncOrValue(field.template, item) || "<div>${name}</div><span class='subtext'>" + id + "</span>";
        var specs = {
            deleteButton:true,
            expander:field.expander,
            gotoButton:field.gotoButton,
            itemMenu:field.itemMenu,
            value:'${_id}',
            idprop:field.idprop,
            schemaprop:field.schemaprop
        };
        return self.renderFieldListItem(item,template,'',specs);

    };

    this.createObjectReferenceItem2 = function(item,id,fieldname){
        var field = _getField(fieldname);
        var idprop = field.idprop||'_id';
        var gotoButton = '${RUN[_renderGotoButton]}';
        if(field.hideGotoButton){gotoButton = '';}
        if(!item) {
            //logit('adding ' + id + ' from ' + fieldname);

            //var values = self.propAsFuncOrValue(field.values);
            var values = self.getFieldValues(field.values);
            //var idprop = field.idprop||'_id';
            var item;
            for(var i = 0,tot = values.length; i <tot; i++){
                if(values[i][idprop] == id){
                    item = values[i];
                    break;
                }
            }
        }

        var deleteButton = '<div class="joe-delete-button joe-block-button left" ' +
            'onclick="$(this).parent().remove();">&nbsp;</div>';
        if(!item) {
            return '<div class="joe-field-item deletable" data-value="' + id + '">' +
                deleteButton + "<div>REFERENCE NOT FOUND</div><span class='subtext'>" + id + "</span>" + '</div>';
        }
        var id = id||item[idprop];

        var itemMenu = self.propAsFuncOrValue(field.itemMenu,item);

        var expander = fillTemplate(self.propAsFuncOrValue(field.expander,item),item)||'';
        var template = self.propAsFuncOrValue(field.template, item) || "<div>${name}</div><span class='subtext'>" + id + "</span>";
        return '<div class="joe-field-item deletable '+(expander && 'expander expander-collapsed' || '')+'" data-value="' + id + '">'

            + deleteButton
            + '<div class="joe-field-item-content">'
                +fillTemplate(template, item)
            + '</div>'
            +(itemMenu && renderItemMenu(item,itemMenu) || '')
            +self._renderExpanderButton(expander,item)
            +fillTemplate(gotoButton,item)
            +renderItemExpander(item, expander)
            + '</div>';

    };

/*----------------------------->
 W | Preview Field
 <-----------------------------*/
    this.renderPreviewField = function(prop){
        //var locked = self.propAsFuncOrValue(prop.locked)?' disabled ':'';
        //var profile = self.current.profile;
        var height = prop.height || '600px';
        var url = self.propAsFuncOrValue(prop.url) || joe_web_dir+'joe-preview.html';
        var construct = _joe.constructObjectFromFields();
        obj = (construct[self.getIDProp()] && construct) || self.current.object;
        var content= self.propAsFuncOrValue(prop.content,obj) || '';
        var bodycontent= self.propAsFuncOrValue(prop.bodycontent,obj) || '';
        var previewid = obj[self.getIDProp()] +'_'+prop.name;
        /*if(content) {
            url += '?c=' + ((prop.encoded && content) || encodeURIComponent(content));
        }else if(bodycontent){
            url+='?bc='+((prop.encoded && content) || encodeURIComponent(bodycontent));
        }
*/
        window.__PreviewTest= function(){
            alert('test alert');
        };
        window.__previews = window.__previews || {};
        window.__previews[previewid] = {content:content,bodycontent:bodycontent};
        url+='?pid='+previewid;
        var html=
            '<div class="joe-button joe-reload-button joe-iconed-button" onclick="getJoe('+self.joe_index+').rerenderField(\''+prop.name+'\');">Reload</div>'
                +'<div class="joe-preview-iframe-holder" style="height:'+height+'">'
            +'<iframe class="joe-preview-field joe-field joe-preview-iframe" width="100%" height="100%" name="'+prop.name+'" ' +
            'src="'+url+'"></iframe>'
                +'</div>'
            //+ '<a href="'+url+'" target="_blank"> view fullscreen preview</a><p>' + url.length + ' chars</p>';
            + '<div class="joe-button joe-iconed-button joe-view-button multiline" onclick="window.open(\''+url+'\',\'joe-preview-'+previewid+'\').joeparent = window;"> view fullscreen preview <p class="joe-subtext">' + url.length + ' chars</p></div>'+__clearDiv__;
        return html;
    };

/*----------------------------->
 X //TextEditor Field
 <-----------------------------*/
    var tinyconfig = {};
    this.renderTinyMCEField = function(prop){
         var locked = self.propAsFuncOrValue(prop.locked)?' disabled ':'';
        var height = (prop.height)?'style="height:'+prop.height+';"' : '';
        var editor_id = cuid();
        var html=
            '<div class="joe-tinymce-holder joe-texteditor-field joe-field" '
            +height+' data-texteditor_id="'+editor_id+'" data-ftype="tinymce" name="'+prop.name+'">'+
            '<div id="'+editor_id+'" class="joe-tinymce">'+(prop.value || "")+'</div>'+
            '</div>';
        return html;
    };

    this.readyTinyMCEs = function() {
        tinymce.init({
            selector: ".joe-tinymce"
            /*plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table contextmenu paste"
            ],*/
            /*toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image"*/
        });
    };
    self.texteditors = [];
    this.renderCKEditorField = function(prop){
        var profile = self.current.profile;
        var locked = self.propAsFuncOrValue(prop.locked)?' disabled ':'';
        var height = (prop.height)?'style="height:'+prop.height+';"' : '';
        var code_language = (prop.language||'html').toLowerCase();
        var editor_id = cuid();
        var html=
            '<div class="joe-ckeditor-holder joe-texteditor-field joe-field" '
            +height+' data-ckeditor_id="'+editor_id+'" data-ftype="ckeditor" name="'+prop.name+'">'+
            '<div id="'+editor_id+'" class="joe-ckeditor">'+(prop.value || "")+'</div>'+
            '</div>';
        return html;
    };
    var ckconfig = {};
    ckconfig.toolbarGroups = [
            { name: 'clipboard', groups: [ 'undo', 'clipboard' ] },
            { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
            { name: 'links', groups: [ 'links' ] },
            { name: 'insert', groups: [ 'insert' ] },
            { name: 'forms', groups: [ 'forms' ] },
            { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
            { name: 'tools', groups: [ 'tools' ] },
            { name: 'others', groups: [ 'others' ] },
            '/',
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
            { name: 'styles', groups: [ 'styles' ] },
            { name: 'colors', groups: [ 'colors' ] }
        ];

    ckconfig.removeButtons = 'Anchor,Subscript,Superscript,Image';
    ckconfig.toolbarCanCollapse = true;
    self.ck_editors = [];
    this.readyCKEditors = function(){
        if(typeof CKEDITOR == 'undefined'){
            //TODO:use require
            alert('CKEDITOR undefined');
        }
        var neweditors = [];
        self.ck_editors.map(function(ck){
            try {
                ck.destroy && ck.destroy();
            }catch(e){
             logit('ckeditor "'+ck.name+'" error:'+e);
            }
        });
        $('.joe-ckeditor').each(function(dom){
            var field = self.getField($(this).parent().attr('name'))
            var id = $(this).attr('id');
            if(self.ck_editors.indexOf(id)==-1) {
                var editor = CKEDITOR.replace(id,ckconfig);
                neweditors.push(editor);
            }
        });
        self.ck_editors = neweditors;

    };
    this.readyTextEditors = this.readyTinyMCEs;

    function _getField(fieldname){
        var fieldobj;
        for(var f = 0,tot= self.current.fields.length; f<tot; f++){
            fieldobj = self.current.fields[f];
            if(fieldobj.name == fieldname){
                return fieldobj;
            }
        }
        return false;

    }
    this.getField = _getField;

/*----------------------------->
 Z | Passthrough
 <-----------------------------*/
    this.renderPassthroughField = function(prop){
        var html= 'passthrough';
        return html;
    };
/*-------------------------------------------------------------------->
	4 | OBJECT LISTS
<--------------------------------------------------------------------*/

    //ITEM MENU

    function renderItemMenu(item,buttons){
        if(!buttons){
            return '';
        }
        buttons = self.propAsFuncOrValue(buttons,item);
        if(!buttons){
            return '';
        }
        var btn_template = '<td class="joe-option-menu-button" onclick="${action}"> ${name}</td>';
        var html = '<div class="joe-panel-content-option-menu"><table class=""><tbody><tr>';
        var oc;
            buttons.map(function(b) {
                if (!b.hasOwnProperty('condition') || self.propAsFuncOrValue(b.condition,item)) {
                    oc = (b.url && "window.open(\'"+fillTemplate(b.url,item)+"\')" )
                        || b.action || "alert('" + b.name + "');";
                html += fillTemplate('<td class="joe-option-menu-button '+(self.propAsFuncOrValue(b.css,item)||'')+'" onclick="' + oc + '">' + b.name + '</td>', item)
                }
            });

            html+='</tr></tbody></table></div>';


        return html;
    }


    //ITEM EXPANDER
    this._renderExpanderButton =function(expanderContent,item){
            if(!expanderContent){return '';}
            return '<div class="joe-panel-content-option-expander-button" onclick="_joe.toggleItemExpander(this);"></div>';
    };

    //window._renderExpanderButton = this._renderExpanderButton;
    this.toggleItemExpander = function(dom,itemid){
      if(dom){
          $(dom).closest('.expander')
              .toggleClass('expander-collapsed')
              .toggleClass('expander-expanded');

      }
    };
    function renderItemExpander(item,contentVal){
        var content = fillTemplate(self.propAsFuncOrValue(contentVal,item),item);
        if(!content){return '';}
        var html = '<div class="joe-panel-content-option-expander">'+content+'</div>';


        return html;
    }
    this.renderItemExpander = renderItemExpander;

    this.renderTableItem = function(listItem,quick,index) {
        //var tableSpecs = tSpecs || tableSpecs;
        var idprop = self.getIDProp();// listSchema._listID;
        var id = listItem[idprop] || null;
        var colprop;
        if(quick){
            var searchable = '';
            tableSpecs.cols.map(function(c){
                if($c.isString(c)) {
                    searchable+=(listItem[c]||'')+' ';
                }else if($c.isObject(c)){
                    colprop = c.property || c.name;
                    searchable+=(listItem[colprop]||(colprop.indexOf('${') != -1 && colprop)||'')+' ';
                   // html += '<th>' + (c.display || c.header) + '</th>';
                }
                searchable = fillTemplate(searchable,listItem);
            });
            return searchable;
        }
        var action;
        //var action = 'onclick="_joe.editObjectFromList(\''+id+'\');"';
        var schemaprop = self.current.schema && (self.current.schema.listView && self.current.schema.listView.schemaprop);
        if(schemaprop){
            action = 'onclick="getJoe('+self.joe_index+').listItemClickHandler({dom:this,id:\''+id+'\',schema:\''+schemaprop+'\'});"';
        }else{
            action = 'onclick="getJoe('+self.joe_index+').listItemClickHandler({dom:this,id:\''+id+'\'});"';
        }

        var ghtml = '<tr class="joe-panel-content-option trans-bgcol" '+action+'>';
        ghtml +='<td class="joe-table-checkbox">' +
            '<label>'+index+(tableSpecs.multiselect && '<input type="checkbox" />' || '')+'</label></td>';
        //ghtml +='<td>'+index+'</td>';

        tableSpecs.cols.map(function(c){

            if($c.isString(c)) {
                ghtml+=fillTemplate('<td>'+(listItem[c]||'')+'</td>',listItem);
            }else if($c.isObject(c)){
                colprop = c.property || c.name;
                ghtml+=fillTemplate('<td>'+(listItem[colprop]||(colprop.indexOf('${') != -1 && colprop)||'')+'</td>',listItem);
            }

        });
        ghtml +='</tr>';
    return ghtml;
    };
    this.renderGridItem = function(listItem,quick,index,specs) {
        var ghtml = '<tr class="joe-panel-content-option trans-bgcol">';
        ghtml +='<td class="joe-grid-checkbox"><label><input type="checkbox"></label></td>';
        ghtml +='<td>'+index+'</td>';
        ghtml +='<td>'+listItem[self.getIDProp()]+'</td>';
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
        var schemaprop = self.current.schema && (self.current.schema.listView && self.current.schema.listView.schemaprop);
        if(schemaprop){
            action = 'onclick="getJoe('+self.joe_index+')' +
                '.listItemClickHandler({dom:this,id:\''+id+'\',schema:\''+listItem[schemaprop]+'\',idprop:\'_id\'});"';
        }else{
            action = 'onclick="getJoe('+self.joe_index+')' +
                '.listItemClickHandler({dom:this,id:\''+id+'\'});"';
        }

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
        var listSchemaObjIndicator = 'listView';
        var template = //getProperty('listSchema.'+listSchemaObjIndicator+'.template')
            (listSchema.listView && listSchema.listView.template) || listSchema._listTemplate;
        var title = //getProperty('listSchema.'+listSchemaObjIndicator+'.title')
            (listSchema.listView && listSchema.listView.title) || listSchema._listTitle;

        if(quick){
            var quicktitle = template || title || '';
            return fillTemplate(quicktitle,listItem);
        }

    //add background color
        var numberHTML = '';
        if(index && !listSchema.hideNumbers){
            numberHTML = index;
        }

        if(!template){
			var title = title || listItem.name || id || 'untitled';

            var menu = (listSchema.listView && listSchema.listView.itemMenu)||listSchema.itemMenu;
            var listItemMenu = renderItemMenu(listItem,menu);//<div class="joe-panel-content-option-button fleft">#</div><div class="joe-panel-content-option-button fright">#</div>';

            var expander = (listSchema.listView && listSchema.listView.itemExpander)||listSchema.itemExpander;

            var listItemExpander = renderItemExpander(listItem,expander);
            var listItemExpanderButton = self._renderExpanderButton(listItemExpander,listItem);
            var icon = //getProperty('listSchema.'+listSchemaObjIndicator+'.icon')
                (listSchema.listView && listSchema.listView.icon)||listSchema.icon || listSchema._icon || '';

            var listItemIcon = (icon && renderIcon(icon,listItem)) || '';
            //list item content
            title="<div class='joe-panel-content-option-content ' "+action+">"+title+"<div class='clear'></div></div>";

            var html = '<div class="'+(self.allSelected && 'selected' ||'')+' joe-panel-content-option trans-bgcol '+((numberHTML && 'numbered') || '' )+' joe-no-select '+((stripeColor && 'striped')||'')+' '+((listItemExpanderButton && 'expander expander-collapsed')||'')+'"  data-id="'+id+'" >'

                +'<div class="joe-panel-content-option-bg" '+bgHTML+'></div>'
                +'<div class="joe-panel-content-option-stripe" '+stripeHTML+'></div>'
                +(numberHTML && '<div class="joe-panel-content-option-number" >'+numberHTML+'</div>' || numberHTML)
                +listItemExpanderButton
                +listItemIcon
                +listItemMenu
                +fillTemplate(title,listItem)
                +listItemExpander
                +'</div>';
		}
		//if there is a list template
		else{
            var dup = $c.duplicate(listItem);
            dup.action = action;
			html = fillTemplate(template,dup);
		}


        function renderIcon(icon,listItem){
            var url = icon.url || icon;
            var width = (icon.width)?' width:'+icon.width+'; ':'';
            var height = (icon.height)?' height:'+icon.height+'; ':'';
            var iconURL = fillTemplate(url,listItem);
            var iconhtml = '<div style=" background-image:url(\''+iconURL+'\'); " class="joe-panel-content-option-icon trans-bgcol fleft"  >' +
                '<img style="'+width+height+'" src="'+iconURL+'"/>' +
                '</div>';
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
			});

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
		var idprop = specs.idprop || self.getIDProp();//(self.current.schema && self.current.schema._listID) || 'id';

		var object = list.filter(function(li){return li[idprop] == id;})[0]||false;

		if(!object){
			alert('error finding object');
			return;
		}

		var setts ={schema:specs.schema||self.current.schema,callback:specs.callback};
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
        specs = $.extend({mode:'object'},
            (specs || {}));
        var object =specs.props || specs.object ||specs.list||specs.content;
		if(!object){
			return;
		}

		var title=specs.title || 'Object Focus';
		//mini.name=specs.prop.name||specs.prop.id || specs.prop._id;
		mini.id = cuid();

		//var html = '<div class="joe-mini-panel joe-panel">';
        var mode = specs.mode || 'object';
        switch($.type(object)){
            case 'object':
                mode ='object';
            break;
            case 'array':
                mode ='list';
            break;
        }
        var minimode = mini.id;
        var html =
            self.renderEditorHeader({title: title, minimode:minimode,
                close_action: 'onclick="getJoe(' + self.joe_index + ').hideMini();"'});

            html += self.renderEditorContent({object: object, mode: mode, minimode:minimode});
            html += self.renderEditorFooter({minimenu: specs.menu,minimode:minimode,});

        var height = specs.height ||self.overlay.height()/2;
        mini.panel = $('.joe-mini-panel');
        mini.panel.addClass('active').html(html);
        if(!$('.joe-mini-panel .joe-panel-footer').find('.joe-button:visible').length){
            $('.joe-mini-panel').addClass('no-footer-menu');
        }
        mini.panel.css('height',height);

        mini.panel.draggable({handle:'.joe-panel-header',snap:'.joe-overlay'}).resizable({handles:'s'});

        mini.callback = specs.callback || function(itemid){
            alert(itemid);
        }
		self.minis[mini.id] = mini;
	};

	this.hideMini = function(){
        $('.joe-mini-panel').resizable('destroy').draggable('destroy');
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
  D | DATA
 <--------------------------------------------------------------------*/
    self.search = function(id,specs){
        var specs = specs || {};
        var collections = specs.collections || '';
        var properties = specs.props || specs.properties ||['_id','id','name'];
        //var idprop = specs.idprop || '_id';
      var haystack =[];
        for(var d in self.Data){
            haystack = haystack.concat(self.Data[d]);
        }
        var results;
        if($.type(id) == "string"){
            results = haystack.filter(function(r){

                return r['_id'] == id;
            })
        }else if($.type(id) == "object"){
            results = haystack.where(id);
        }
        return results;
    };
    self.addDataset = function(name,values,specs){
        //idprop
        //concatenate
        var values = self.propAsFuncOrValue(values,name);
        if(name && values && $.type(values) == "array"){
            self.Data[name] == values;
        }


    };
    self.deleteDataset = function(dataset){
        delete self.Data[dataset];
    };
    self.getDataItem = function(id,datatype,idprop) {
        var item;
        var idprop = idprop || '_id';
        var dataset = self.Data[datatype];
        if(!self.Data[datatype]){
            return false;
        }
        for(var i = 0, tot =dataset.length; i < tot; i++){
            item = dataset[i];
            if(item[idprop] == id){
                return item;
            }
        }
        return false;
    };
    self.getDataset = function(datatype,specs) {
        specs = specs || {};
        var sortby = specs.sortby || 'name';

        if (self.Data[datatype]) {
            var data = self.Data[datatype].sortBy(sortby);
        }else{
            if(specs.boolean = true){
                return false;
            }
            var data =[];
        }
        if(specs.filter){
            data = data.where(specs.filter);
        }
        if(specs.reverse){
            data.reverse();
        }

        if(specs.blank){
            return [{name:'',val:''}].concat(data);
        }
        return data;
    };
    self.getDataItemProp = function(id,dataset,prop){
        prop = prop || 'name';
        if(!id){
            return '';
        }

        var item = self.getDataItem(id,dataset);
        if(item){
            return item[prop];
        }
        return '';
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
		setTimeout(self.onPanelShow,0);
/*        var evt = new Event('JoeEvent');
        evt.initEvent("showJoe",true,true);

// custom param
        evt.schemaname = self.current.schema.__schemaname;
        document.addEventListener("myEvent",function(){alert('finished')},false);
        document.dispatchEvent(evt);*/


        $(self.container).trigger({
            type: "showJoe",
            schema: self.current.specs.schema,
            subset: self.current.specs.subset
        });

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

    this.reload = function(hideMessage,specs){
        logit('reloading joe '+self.joe_index);
        var specs = specs || {};
        var reloadBM = new Benchmarker();
        var info = self.history.pop();
        if($.type(info.data)== 'object') {
            var obj = $.extend({}, info.data, (specs.overwrite || specs.overwrites));
        }else{
            var obj = info.data;
        }

        //delete data overwirtes
        delete specs.overwrite;
        delete specs.overwrites;
        var specs = $.extend({},info.specs,specs);
        self.show(obj,specs);
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
		if (e.keyCode == 27) {
        if($('.joe-text-autocomplete.active').length){//close autocoomplete first
            $('.joe-text-autocomplete.active').removeClass('active');
        }else {
            self.closeButtonAction();
        }
        }   // esc
        //TODO:if the joe is also current main joe.
	//ctrl + enter
		else if(e.ctrlKey && e.keyCode == 13 && self.specs.useControlEnter){
			self.overlay.find('.joe-confirm-button').click();
		}
	});

	var sortable_index;
	this.onPanelShow = function(){
        var BM = new Benchmarker();
        self.respond();

		//init datepicker
		self.overlay.find('.joe-date-field').Zebra_DatePicker({offset:[5,20],format:'m/d/Y',first_day_of_week:0});


        //itemcount
        if(currentListItems && self.overlay.find('.joe-submenu-search-field').length){
            if(goingBackQuery  || (!$c.isEmpty(self.current.userSpecs.filters) && listMode) ){
                self.overlay.find('.joe-submenu-search-field').val(goingBackQuery);
                self.filterListFromSubmenu(self.overlay.find('.joe-submenu-search-field')[0].value,true);
                goingBackQuery = '';
            }

            self.overlay.find('.joe-submenu-itemcount').html(currentListItems.length+' item'+((currentListItems.length != 1 &&'s') ||''));

        }
        //multisorter
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


        //preview
        $('.joe-preview-iframe-holder').resizable({handles:'s'});
        //imagefield
		self.overlay.find('input.joe-image-field').each(function(){_joe.updateImageFieldImage(this);});
        //object reference
        self.overlay.find('.joe-object-references-holder.sortable').sortable({handle:'.joe-field-item-content'});
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

        //sidebars
        if(self.current.sidebars){
            var lsb = self.current.sidebars.left;
            var rsb = self.current.sidebars.right;

            self.panel.find('.joe-sidebar_left-button').toggleClass('active',lsb.content != '');
            self.panel.find('.joe-sidebar_right-button').toggleClass('active',rsb.content != '');
            if(self.sizeClass != 'small-size'){
                self.panel.toggleClass('right-sidebar',(rsb.content && !rsb.collapsed || false));
            }
            self.panel.toggleClass('left-sidebar',(lsb.content && !lsb.collapsed || false));
        }
        //self.toggleSidebar('right',false);
        //uploaders
        self.readyUploaders();

        //ckeditors|
        self.readyTextEditors();

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

        if(listMode) {
            //self.overlay[0].className.replace()
            self.setColumnCount(colCount);
            self.panel.toggleClass('list-mode',listMode);
        }
        self.panel.toggleClass('show-filters',leftMenuShowing && listMode);


/*        if($(window).height() > 700) {
            self.overlay.find('.joe-submenu-search-field').focus();
        }*/
        _bmResponse(BM,'on panel show complete');
        _bmResponse(self.showBM,'----Joe Shown');
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
	K | OBJECT
<--------------------------------------------------------------------*/
	this.createObject = function(specs,item_defaults){
		//takes fields to be deleted
        //var schema = self.current.schema
		specs = specs || {schema:self.current.schema};
		goJoe($.extend({},(item_defaults||{})),specs);
	};

/*    /!*-------------------------------------------------------------------->
     + | Add Items
     <--------------------------------------------------------------------*!/
    this.createItem = function(schema,defaults,title){
        var specs = {type:schema,itemtype:schema};
        var defaults = defaults||{};
        var joespecs = {schema:schema};
        if(title){
            joespecs.title = title;
        }
        goJoe($.extend(specs,defaults),joespecs)
    };*/

    function _defaultUpdateCallback(data){
        self.showMessage(data.name +' updated successfully');
    }

    this.validateObject = function(obj){
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

        return true;
    };

    this.updateObjectAsync = function(ajaxURL,specs){

        var specs = $.extend({
            oldObj:$.extend({},self.current.object),
            callback:function(data){
                self.showMessage(data.name +' updated successfully');
            },
            ajaxObj: self.constructObjectFromFields(self.joe_index),
            overwrites:{},
            skipValidation:false
        },(specs||{}));
        var newObj = $.extend(
            ajaxObj.newObj,
            specs.overwrites,
            {joeUpdated:new Date()}
        );

        var skipVal = _joe.propAsFuncOrValue(self.skipValidation);
        if(!skipVal) {
            var valid = self.validateObject(obj);
            if(!valid){return false;}
        }

        $.ajax({
            url:specs.ajaxObj,
            data:newObj,
            dataType:'jsonp',
            success:specs.callback
        })


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
            var valid = self.validateObject(obj);
            if(!valid){return false;}

        }
    //end validation

        obj = $.extend(self.current.object,newObj);
    //update object list
        var index = (self.current.list && self.current.list.indexOf(obj));
        if(self.current.list && (index == -1 || index == undefined)){
          //  object not in current list
            self.current.list.push(obj);
        }

    //update object in dataset
        var dsname = self.current.schema.__schemaname;
        var idprop = self.getIDProp();
        if(self.Data[dsname]){
            if(self.getDataItem(obj[idprop],dsname)) {

            }else{
                self.Data[dsname].push(obj);
            }
            logit('item matches current schema, updating...');
        }
    //run callback

		logit((obj.name||'object')+' updated');
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
                            case 'passthrough':
                                object[prop] = object[prop] || false;
                                break;
                            //ace editor
                            case 'ace':
                                var editor = _joe.ace_editors[$(this).data('ace_id')];
                                //$(this).find('.ace_editor');
                                object[prop] = editor.getValue();
                                break;
                            case 'ckeditor':
                                var editor = CKEDITOR.instances[$(this).data('ckeditor_id')];
                                //_joe.ace_editors[];
                                //$(this).find('.ace_editor');
                                object[prop] =(editor)? editor.getData():self.current.object[prop];
                                break;
                            case 'tinymce':
                                var editor = tinymce.editors.where({id:$(this).data('texteditor_id')})[0]||false;
                                object[prop] =(editor)? editor.getContent():self.current.object[prop];
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
                                $('.objectReference-field[data-name="'+prop+'"]').find('.joe-field-list-item')
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

    //CONTENT FIELD
        parentFind.find('.joe-object-field.content-field').each(function() {
            prop = $(this).data('name');
            var cfield = self.getField(prop);
            if (cfield.passthrough) {
                object[prop] = self.current.object[prop];
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
                        ol_array_obj[subprops[i]] = $(this).find('input,select,textarea').val();
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
            if (!newObj) {
                data.same.push(oldObj);//same
            } else {
                if (specs.dateProp
                    && newObj[specs.dateProp]
                    && oldObj[specs.dateProp]
                    && newObj[specs.dateProp] == oldObj[specs.dateProp]) {
                    data.same.push(newObj);//same

                } else {
                    data.update.push(newObj);//update
                }
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

	this.getIDProp = function(schema){
		var prop = ( ((schema && self.schemas[schema]) || self.current.schema) && (self.current.schema.idprop || self.current.schema._listID)) || 'id' || '_id';
		return prop;
	};

    this.propAsFuncOrValue = function(prop, toPass, defaultTo){
        try {
            var toPass = toPass || self.current.object;

            /*        if(!toPass.hasOwnProperty(prop)){
             return defaultTo || false;
             }*/
            if (prop && typeof prop == 'function') {
                return prop(toPass);
            }
            return prop;
        }catch(e){
            logit('JOE: error parsing propAsFunction: '+e);
            return '';
        }
    };
    this.getFieldValues = function(values){
        var vals = self.propAsFuncOrValue(values) || [];
        if(vals.isString()){
            return self.getDataset(vals)||[];
        }
        return vals;
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
        if(!self.specs.useHashlink){
            return;
        }
        var hashInfo ={};

        hashInfo.schema_name =self.current.schema && self.current.schema.__schemaname;
        if(listMode){
            hashInfo.object_id = '';
        }else{

            hashInfo.object_id = (self.current.object && self.current.object[self.getIDProp()])||'';
        }

        var hashtemplate = ($.type(specs.useHashlink) == 'string')?specs.useHashlink:hash_delimiter+'${schema_name}'+hash_delimiter+'${object_id}';
        //$SET({'@!':fillTemplate(hashtemplate,hashInfo)},{noHistory:true});
        //$SET({'@!':fillTemplate(hashtemplate,hashInfo)});
        location.hash = fillTemplate(hashtemplate,hashInfo);

    };

    this.readHashLink = function(){
        try {
            var useHash = $GET('!') || location.hash;
            if (!useHash || self.joe_index != 0) {
                return false;
            }
            var useHash = useHash.replace('#','');
            var hashBreakdown = useHash.split(hash_delimiter).condense();
            hashBreakdown.removeAll('');
            if(!hashBreakdown.length){
                return false;
            }
            var hashSchema = self.schemas[hashBreakdown[0]];
            var hashItemID = hashBreakdown[1]||'';
            if (hashSchema && (hashSchema.dataset || (!$.isEmptyObject(self.Data) && self.Data[hashSchema.__schemaname]))) {
                var dataset;
                if(hashSchema.dataset) {
                    dataset = (typeof(hashSchema.dataset) == "function") ? hashSchema.dataset() : hashSchema.dataset;
                }else{
                    dataset =  self.Data[hashSchema.__schemaname] || [];
                }
                //SINGLE ITEM
                if(!$.isEmptyObject(self.Data)) {
                    if(hashItemID ){
                        var collectionName = hashSchema.__collection || hashSchema.__schemaname;
                    //using standard id
                        if(hashItemID.indexOf(':') == -1) {

                            if (collectionName) {
                                var collectionItem = self.getDataItem(hashItemID, collectionName);
                                if (collectionItem) {
                                    goJoe(collectionItem, {schema: hashSchema});
                                }else {//SHOW LIST, NO item
                                    goJoe(dataset, {schema: hashSchema});
                                }
                            }
                        }else{
                            var key = hashItemID.split(':')[0];
                            var value = hashItemID.split(':')[1];

                            //var collectionName = hashSchema.__collection || hashSchema.__schemaname;
                            if (collectionName) {
                                var collectionItem = self.getDataItem(value, collectionName,key);
                                if (collectionItem) {
                                    goJoe(collectionItem, {schema: hashSchema});
                                }
                            }else {//SHOW LIST, NO item
                                goJoe(dataset, {schema: hashSchema});
                            }
                        }
                    }else {//SHOW LIST, NO item
                        goJoe(dataset, {schema: hashSchema});
                    }
                    var section = $GET('section')||hashBreakdown[2];
                    if(section) {
                        //$DEL('section');
                        self.updateHashLink();
                        self.gotoSection(section);
                    }

                }
            }
            else{
                throw(error,'dataset for "'+hashSchema+'" note found');
            }
        }catch(e){
            logit('error reading hashlink:'+e);
            return false;
        }

        __gotoJoeSection = self.gotoSection;
        return true;
    };

    this.isNewItem = function(){

        if(!self.current.object || !self.current.object[self.getIDProp()]){
            return true;
        }
        return false;
    };

/*<-----------------s-------------------------------------------->*/

/*-------------------------------------------------------------------->
 I.2 | HashCHangeHandler
 <--------------------------------------------------------------------*/

/*-------------------------------------------------------------------->
 J | RESPOND
 <--------------------------------------------------------------------*/
    self.respond = function(e){
        var w = self.overlay.width();
        var h = self.overlay.height();
        var curPanel = self.panel[0];
        //logit(w);
        var sizeClass='';
        if(curPanel.className.indexOf('-size') == -1){
            curPanel.className += ' large-size ';
        }
        if(w<600){
            sizeClass='small-size';
        }else{
            sizeClass='large-size';
        }

        curPanel.className = curPanel.className.replace(/[a-z]*-size/,sizeClass);
        self.sizeClass = sizeClass;
/*
        logit(e);
        logit($(window).height())*/
    };

this._renderGotoButton = function(id,dataset,schema){
    var item = {};
    item._id = id || this._id;
    item.dataset = dataset || this.itemtype;
    item.schema = schema || item.dataset;
    var idprop = self.getIDProp(schema);
    return fillTemplate(
        '<div class="joe-block-button goto-icon" ' +
            //'onclick="goJoe(getNPCDataItem(\'${_id}\',\'${dataset}\'),' +
        'onclick="goJoe(_joe.getDataItem(\'${'+idprop+'}\',\'${dataset}\'),' +
        '{schema:\'${schema}\'})"></div>',item);

};

    window._renderGotoButton = this._renderGotoButton;

/*-------------------------------------------------------------------->
K | Smart Schema Values
 <--------------------------------------------------------------------*/
    this.smartSave = function(item,newItem,schema){
        //find schema
        //look for save function

    };

/*-------------------------------------------------------------------->
     //AUTOINIT
 <--------------------------------------------------------------------*/

	if(self.specs.autoInit){
		self.init();
	}
   // if(window){
        window._jco = function(construct){
            if(construct){return self.constructObjectFromFields();}
            return self.current.object};
   // }
	return this;
}

var __gotoJoeSection;
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


var __defaultButtons = [__createBtn__];
var __defaultObjectButtons = [__deleteBtn__,__saveBtn__];
var __defaultMultiButtons = [__multisaveBtn__,__multideleteBtn__];

function __removeTags(str){
    if(!str){return '';}
    return str.replace(/<(?:.|\n)*?>/gm, '');
}

function _COUNT(array){
    if(!array){
        return 0;
    }
	if(array.isArray()) {
		return array.length;
	}else if(array.isString()){
        return 'str';
    }
	return 0;
};

function _bmResponse(benchmarker,message){
    var t = benchmarker.stop();
    var m = message + ' in ' + t + ' secs';
    if($c.DEBUG_MODE && window.console && window.console.warn){
        if(t > .4){
            window.console.warn(m);
        }else {
            logit(m);
        }
    }else {
        logit(m);
    }
}

function beginLogGroup(name,expanded){
    if(expanded){
        window.console && window.console.group && console.group(name);
    }else{
        window.console && window.console.groupCollapsed && console.groupCollapsed(name);
    }
}
function endLogGroup(){
    window.console && window.console.groupEnd &&console.groupEnd();
}
function _renderUserCube(user,cssclass){
    var css = cssclass||'fleft';
    var u = user;
    var html ='';
    initials = u.name[0]+ (((u.name.indexOf(' ') > 0) && u.name[u.name.indexOf(' ')+1])||'');
    html += '<div title="'+ u.name+'" class="joe-initials '+css+'">'+initials+' <span>'+ u.name+'</span></div>';

    return html;

}
/*-------------------------------------------------------------------->
 Watch Polyfill
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
/*
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
}*/
/*-------------------------------------------------------------------->
CRAYDENT UPDATES
 <--------------------------------------------------------------------*/

//UNTIL VERBOSE IS REMOVED

/*
function logit(){
    try {

/!*      var location = "\t\t\t\t    " + (new Error()).stack.split('\n')[2];
        for (var i = 0, len = arguments.length; i < len; i++) {
            arguments[i] = arguments[i] + location;
        }*!/

        cout.apply(this, arguments);
        //cout.apply(arguments[0])
    } catch (e) {
        error('logit', e);
    }
}
*/


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
}, true);/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/
!function(t,e,i){var n=t.L,o={};o.version="0.7.2","object"==typeof module&&"object"==typeof module.exports?module.exports=o:"function"==typeof define&&define.amd&&define(o),o.noConflict=function(){return t.L=n,this},t.L=o,o.Util={extend:function(t){var e,i,n,o,s=Array.prototype.slice.call(arguments,1);for(i=0,n=s.length;n>i;i++){o=s[i]||{};for(e in o)o.hasOwnProperty(e)&&(t[e]=o[e])}return t},bind:function(t,e){var i=arguments.length>2?Array.prototype.slice.call(arguments,2):null;return function(){return t.apply(e,i||arguments)}},stamp:function(){var t=0,e="_leaflet_id";return function(i){return i[e]=i[e]||++t,i[e]}}(),invokeEach:function(t,e,i){var n,o;if("object"==typeof t){o=Array.prototype.slice.call(arguments,3);for(n in t)e.apply(i,[n,t[n]].concat(o));return!0}return!1},limitExecByInterval:function(t,e,i){var n,o;return function s(){var a=arguments;return n?void(o=!0):(n=!0,setTimeout(function(){n=!1,o&&(s.apply(i,a),o=!1)},e),void t.apply(i,a))}},falseFn:function(){return!1},formatNum:function(t,e){var i=Math.pow(10,e||5);return Math.round(t*i)/i},trim:function(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")},splitWords:function(t){return o.Util.trim(t).split(/\s+/)},setOptions:function(t,e){return t.options=o.extend({},t.options,e),t.options},getParamString:function(t,e,i){var n=[];for(var o in t)n.push(encodeURIComponent(i?o.toUpperCase():o)+"="+encodeURIComponent(t[o]));return(e&&-1!==e.indexOf("?")?"&":"?")+n.join("&")},template:function(t,e){return t.replace(/\{ *([\w_]+) *\}/g,function(t,n){var o=e[n];if(o===i)throw new Error("No value provided for variable "+t);return"function"==typeof o&&(o=o(e)),o})},isArray:Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)},emptyImageUrl:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="},function(){function e(e){var i,n,o=["webkit","moz","o","ms"];for(i=0;i<o.length&&!n;i++)n=t[o[i]+e];return n}function i(e){var i=+new Date,o=Math.max(0,16-(i-n));return n=i+o,t.setTimeout(e,o)}var n=0,s=t.requestAnimationFrame||e("RequestAnimationFrame")||i,a=t.cancelAnimationFrame||e("CancelAnimationFrame")||e("CancelRequestAnimationFrame")||function(e){t.clearTimeout(e)};o.Util.requestAnimFrame=function(e,n,a,r){return e=o.bind(e,n),a&&s===i?void e():s.call(t,e,r)},o.Util.cancelAnimFrame=function(e){e&&a.call(t,e)}}(),o.extend=o.Util.extend,o.bind=o.Util.bind,o.stamp=o.Util.stamp,o.setOptions=o.Util.setOptions,o.Class=function(){},o.Class.extend=function(t){var e=function(){this.initialize&&this.initialize.apply(this,arguments),this._initHooks&&this.callInitHooks()},i=function(){};i.prototype=this.prototype;var n=new i;n.constructor=e,e.prototype=n;for(var s in this)this.hasOwnProperty(s)&&"prototype"!==s&&(e[s]=this[s]);t.statics&&(o.extend(e,t.statics),delete t.statics),t.includes&&(o.Util.extend.apply(null,[n].concat(t.includes)),delete t.includes),t.options&&n.options&&(t.options=o.extend({},n.options,t.options)),o.extend(n,t),n._initHooks=[];var a=this;return e.__super__=a.prototype,n.callInitHooks=function(){if(!this._initHooksCalled){a.prototype.callInitHooks&&a.prototype.callInitHooks.call(this),this._initHooksCalled=!0;for(var t=0,e=n._initHooks.length;e>t;t++)n._initHooks[t].call(this)}},e},o.Class.include=function(t){o.extend(this.prototype,t)},o.Class.mergeOptions=function(t){o.extend(this.prototype.options,t)},o.Class.addInitHook=function(t){var e=Array.prototype.slice.call(arguments,1),i="function"==typeof t?t:function(){this[t].apply(this,e)};this.prototype._initHooks=this.prototype._initHooks||[],this.prototype._initHooks.push(i)};var s="_leaflet_events";o.Mixin={},o.Mixin.Events={addEventListener:function(t,e,i){if(o.Util.invokeEach(t,this.addEventListener,this,e,i))return this;var n,a,r,h,l,u,c,d=this[s]=this[s]||{},p=i&&i!==this&&o.stamp(i);for(t=o.Util.splitWords(t),n=0,a=t.length;a>n;n++)r={action:e,context:i||this},h=t[n],p?(l=h+"_idx",u=l+"_len",c=d[l]=d[l]||{},c[p]||(c[p]=[],d[u]=(d[u]||0)+1),c[p].push(r)):(d[h]=d[h]||[],d[h].push(r));return this},hasEventListeners:function(t){var e=this[s];return!!e&&(t in e&&e[t].length>0||t+"_idx"in e&&e[t+"_idx_len"]>0)},removeEventListener:function(t,e,i){if(!this[s])return this;if(!t)return this.clearAllEventListeners();if(o.Util.invokeEach(t,this.removeEventListener,this,e,i))return this;var n,a,r,h,l,u,c,d,p,_=this[s],m=i&&i!==this&&o.stamp(i);for(t=o.Util.splitWords(t),n=0,a=t.length;a>n;n++)if(r=t[n],u=r+"_idx",c=u+"_len",d=_[u],e){if(h=m&&d?d[m]:_[r]){for(l=h.length-1;l>=0;l--)h[l].action!==e||i&&h[l].context!==i||(p=h.splice(l,1),p[0].action=o.Util.falseFn);i&&d&&0===h.length&&(delete d[m],_[c]--)}}else delete _[r],delete _[u],delete _[c];return this},clearAllEventListeners:function(){return delete this[s],this},fireEvent:function(t,e){if(!this.hasEventListeners(t))return this;var i,n,a,r,h,l=o.Util.extend({},e,{type:t,target:this}),u=this[s];if(u[t])for(i=u[t].slice(),n=0,a=i.length;a>n;n++)i[n].action.call(i[n].context,l);r=u[t+"_idx"];for(h in r)if(i=r[h].slice())for(n=0,a=i.length;a>n;n++)i[n].action.call(i[n].context,l);return this},addOneTimeEventListener:function(t,e,i){if(o.Util.invokeEach(t,this.addOneTimeEventListener,this,e,i))return this;var n=o.bind(function(){this.removeEventListener(t,e,i).removeEventListener(t,n,i)},this);return this.addEventListener(t,e,i).addEventListener(t,n,i)}},o.Mixin.Events.on=o.Mixin.Events.addEventListener,o.Mixin.Events.off=o.Mixin.Events.removeEventListener,o.Mixin.Events.once=o.Mixin.Events.addOneTimeEventListener,o.Mixin.Events.fire=o.Mixin.Events.fireEvent,function(){var n="ActiveXObject"in t,s=n&&!e.addEventListener,a=navigator.userAgent.toLowerCase(),r=-1!==a.indexOf("webkit"),h=-1!==a.indexOf("chrome"),l=-1!==a.indexOf("phantom"),u=-1!==a.indexOf("android"),c=-1!==a.search("android [23]"),d=-1!==a.indexOf("gecko"),p=typeof orientation!=i+"",_=t.navigator&&t.navigator.msPointerEnabled&&t.navigator.msMaxTouchPoints&&!t.PointerEvent,m=t.PointerEvent&&t.navigator.pointerEnabled&&t.navigator.maxTouchPoints||_,f="devicePixelRatio"in t&&t.devicePixelRatio>1||"matchMedia"in t&&t.matchMedia("(min-resolution:144dpi)")&&t.matchMedia("(min-resolution:144dpi)").matches,g=e.documentElement,v=n&&"transition"in g.style,y="WebKitCSSMatrix"in t&&"m11"in new t.WebKitCSSMatrix&&!c,P="MozPerspective"in g.style,L="OTransition"in g.style,x=!t.L_DISABLE_3D&&(v||y||P||L)&&!l,w=!t.L_NO_TOUCH&&!l&&function(){var t="ontouchstart";if(m||t in g)return!0;var i=e.createElement("div"),n=!1;return i.setAttribute?(i.setAttribute(t,"return;"),"function"==typeof i[t]&&(n=!0),i.removeAttribute(t),i=null,n):!1}();o.Browser={ie:n,ielt9:s,webkit:r,gecko:d&&!r&&!t.opera&&!n,android:u,android23:c,chrome:h,ie3d:v,webkit3d:y,gecko3d:P,opera3d:L,any3d:x,mobile:p,mobileWebkit:p&&r,mobileWebkit3d:p&&y,mobileOpera:p&&t.opera,touch:w,msPointer:_,pointer:m,retina:f}}(),o.Point=function(t,e,i){this.x=i?Math.round(t):t,this.y=i?Math.round(e):e},o.Point.prototype={clone:function(){return new o.Point(this.x,this.y)},add:function(t){return this.clone()._add(o.point(t))},_add:function(t){return this.x+=t.x,this.y+=t.y,this},subtract:function(t){return this.clone()._subtract(o.point(t))},_subtract:function(t){return this.x-=t.x,this.y-=t.y,this},divideBy:function(t){return this.clone()._divideBy(t)},_divideBy:function(t){return this.x/=t,this.y/=t,this},multiplyBy:function(t){return this.clone()._multiplyBy(t)},_multiplyBy:function(t){return this.x*=t,this.y*=t,this},round:function(){return this.clone()._round()},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},floor:function(){return this.clone()._floor()},_floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this},distanceTo:function(t){t=o.point(t);var e=t.x-this.x,i=t.y-this.y;return Math.sqrt(e*e+i*i)},equals:function(t){return t=o.point(t),t.x===this.x&&t.y===this.y},contains:function(t){return t=o.point(t),Math.abs(t.x)<=Math.abs(this.x)&&Math.abs(t.y)<=Math.abs(this.y)},toString:function(){return"Point("+o.Util.formatNum(this.x)+", "+o.Util.formatNum(this.y)+")"}},o.point=function(t,e,n){return t instanceof o.Point?t:o.Util.isArray(t)?new o.Point(t[0],t[1]):t===i||null===t?t:new o.Point(t,e,n)},o.Bounds=function(t,e){if(t)for(var i=e?[t,e]:t,n=0,o=i.length;o>n;n++)this.extend(i[n])},o.Bounds.prototype={extend:function(t){return t=o.point(t),this.min||this.max?(this.min.x=Math.min(t.x,this.min.x),this.max.x=Math.max(t.x,this.max.x),this.min.y=Math.min(t.y,this.min.y),this.max.y=Math.max(t.y,this.max.y)):(this.min=t.clone(),this.max=t.clone()),this},getCenter:function(t){return new o.Point((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,t)},getBottomLeft:function(){return new o.Point(this.min.x,this.max.y)},getTopRight:function(){return new o.Point(this.max.x,this.min.y)},getSize:function(){return this.max.subtract(this.min)},contains:function(t){var e,i;return t="number"==typeof t[0]||t instanceof o.Point?o.point(t):o.bounds(t),t instanceof o.Bounds?(e=t.min,i=t.max):e=i=t,e.x>=this.min.x&&i.x<=this.max.x&&e.y>=this.min.y&&i.y<=this.max.y},intersects:function(t){t=o.bounds(t);var e=this.min,i=this.max,n=t.min,s=t.max,a=s.x>=e.x&&n.x<=i.x,r=s.y>=e.y&&n.y<=i.y;return a&&r},isValid:function(){return!(!this.min||!this.max)}},o.bounds=function(t,e){return!t||t instanceof o.Bounds?t:new o.Bounds(t,e)},o.Transformation=function(t,e,i,n){this._a=t,this._b=e,this._c=i,this._d=n},o.Transformation.prototype={transform:function(t,e){return this._transform(t.clone(),e)},_transform:function(t,e){return e=e||1,t.x=e*(this._a*t.x+this._b),t.y=e*(this._c*t.y+this._d),t},untransform:function(t,e){return e=e||1,new o.Point((t.x/e-this._b)/this._a,(t.y/e-this._d)/this._c)}},o.DomUtil={get:function(t){return"string"==typeof t?e.getElementById(t):t},getStyle:function(t,i){var n=t.style[i];if(!n&&t.currentStyle&&(n=t.currentStyle[i]),(!n||"auto"===n)&&e.defaultView){var o=e.defaultView.getComputedStyle(t,null);n=o?o[i]:null}return"auto"===n?null:n},getViewportOffset:function(t){var i,n=0,s=0,a=t,r=e.body,h=e.documentElement;do{if(n+=a.offsetTop||0,s+=a.offsetLeft||0,n+=parseInt(o.DomUtil.getStyle(a,"borderTopWidth"),10)||0,s+=parseInt(o.DomUtil.getStyle(a,"borderLeftWidth"),10)||0,i=o.DomUtil.getStyle(a,"position"),a.offsetParent===r&&"absolute"===i)break;if("fixed"===i){n+=r.scrollTop||h.scrollTop||0,s+=r.scrollLeft||h.scrollLeft||0;break}if("relative"===i&&!a.offsetLeft){var l=o.DomUtil.getStyle(a,"width"),u=o.DomUtil.getStyle(a,"max-width"),c=a.getBoundingClientRect();("none"!==l||"none"!==u)&&(s+=c.left+a.clientLeft),n+=c.top+(r.scrollTop||h.scrollTop||0);break}a=a.offsetParent}while(a);a=t;do{if(a===r)break;n-=a.scrollTop||0,s-=a.scrollLeft||0,a=a.parentNode}while(a);return new o.Point(s,n)},documentIsLtr:function(){return o.DomUtil._docIsLtrCached||(o.DomUtil._docIsLtrCached=!0,o.DomUtil._docIsLtr="ltr"===o.DomUtil.getStyle(e.body,"direction")),o.DomUtil._docIsLtr},create:function(t,i,n){var o=e.createElement(t);return o.className=i,n&&n.appendChild(o),o},hasClass:function(t,e){if(t.classList!==i)return t.classList.contains(e);var n=o.DomUtil._getClass(t);return n.length>0&&new RegExp("(^|\\s)"+e+"(\\s|$)").test(n)},addClass:function(t,e){if(t.classList!==i)for(var n=o.Util.splitWords(e),s=0,a=n.length;a>s;s++)t.classList.add(n[s]);else if(!o.DomUtil.hasClass(t,e)){var r=o.DomUtil._getClass(t);o.DomUtil._setClass(t,(r?r+" ":"")+e)}},removeClass:function(t,e){t.classList!==i?t.classList.remove(e):o.DomUtil._setClass(t,o.Util.trim((" "+o.DomUtil._getClass(t)+" ").replace(" "+e+" "," ")))},_setClass:function(t,e){t.className.baseVal===i?t.className=e:t.className.baseVal=e},_getClass:function(t){return t.className.baseVal===i?t.className:t.className.baseVal},setOpacity:function(t,e){if("opacity"in t.style)t.style.opacity=e;else if("filter"in t.style){var i=!1,n="DXImageTransform.Microsoft.Alpha";try{i=t.filters.item(n)}catch(o){if(1===e)return}e=Math.round(100*e),i?(i.Enabled=100!==e,i.Opacity=e):t.style.filter+=" progid:"+n+"(opacity="+e+")"}},testProp:function(t){for(var i=e.documentElement.style,n=0;n<t.length;n++)if(t[n]in i)return t[n];return!1},getTranslateString:function(t){var e=o.Browser.webkit3d,i="translate"+(e?"3d":"")+"(",n=(e?",0":"")+")";return i+t.x+"px,"+t.y+"px"+n},getScaleString:function(t,e){var i=o.DomUtil.getTranslateString(e.add(e.multiplyBy(-1*t))),n=" scale("+t+") ";return i+n},setPosition:function(t,e,i){t._leaflet_pos=e,!i&&o.Browser.any3d?t.style[o.DomUtil.TRANSFORM]=o.DomUtil.getTranslateString(e):(t.style.left=e.x+"px",t.style.top=e.y+"px")},getPosition:function(t){return t._leaflet_pos}},o.DomUtil.TRANSFORM=o.DomUtil.testProp(["transform","WebkitTransform","OTransform","MozTransform","msTransform"]),o.DomUtil.TRANSITION=o.DomUtil.testProp(["webkitTransition","transition","OTransition","MozTransition","msTransition"]),o.DomUtil.TRANSITION_END="webkitTransition"===o.DomUtil.TRANSITION||"OTransition"===o.DomUtil.TRANSITION?o.DomUtil.TRANSITION+"End":"transitionend",function(){if("onselectstart"in e)o.extend(o.DomUtil,{disableTextSelection:function(){o.DomEvent.on(t,"selectstart",o.DomEvent.preventDefault)},enableTextSelection:function(){o.DomEvent.off(t,"selectstart",o.DomEvent.preventDefault)}});else{var i=o.DomUtil.testProp(["userSelect","WebkitUserSelect","OUserSelect","MozUserSelect","msUserSelect"]);o.extend(o.DomUtil,{disableTextSelection:function(){if(i){var t=e.documentElement.style;this._userSelect=t[i],t[i]="none"}},enableTextSelection:function(){i&&(e.documentElement.style[i]=this._userSelect,delete this._userSelect)}})}o.extend(o.DomUtil,{disableImageDrag:function(){o.DomEvent.on(t,"dragstart",o.DomEvent.preventDefault)},enableImageDrag:function(){o.DomEvent.off(t,"dragstart",o.DomEvent.preventDefault)}})}(),o.LatLng=function(t,e,n){if(t=parseFloat(t),e=parseFloat(e),isNaN(t)||isNaN(e))throw new Error("Invalid LatLng object: ("+t+", "+e+")");this.lat=t,this.lng=e,n!==i&&(this.alt=parseFloat(n))},o.extend(o.LatLng,{DEG_TO_RAD:Math.PI/180,RAD_TO_DEG:180/Math.PI,MAX_MARGIN:1e-9}),o.LatLng.prototype={equals:function(t){if(!t)return!1;t=o.latLng(t);var e=Math.max(Math.abs(this.lat-t.lat),Math.abs(this.lng-t.lng));return e<=o.LatLng.MAX_MARGIN},toString:function(t){return"LatLng("+o.Util.formatNum(this.lat,t)+", "+o.Util.formatNum(this.lng,t)+")"},distanceTo:function(t){t=o.latLng(t);var e=6378137,i=o.LatLng.DEG_TO_RAD,n=(t.lat-this.lat)*i,s=(t.lng-this.lng)*i,a=this.lat*i,r=t.lat*i,h=Math.sin(n/2),l=Math.sin(s/2),u=h*h+l*l*Math.cos(a)*Math.cos(r);return 2*e*Math.atan2(Math.sqrt(u),Math.sqrt(1-u))},wrap:function(t,e){var i=this.lng;return t=t||-180,e=e||180,i=(i+e)%(e-t)+(t>i||i===e?e:t),new o.LatLng(this.lat,i)}},o.latLng=function(t,e){return t instanceof o.LatLng?t:o.Util.isArray(t)?"number"==typeof t[0]||"string"==typeof t[0]?new o.LatLng(t[0],t[1],t[2]):null:t===i||null===t?t:"object"==typeof t&&"lat"in t?new o.LatLng(t.lat,"lng"in t?t.lng:t.lon):e===i?null:new o.LatLng(t,e)},o.LatLngBounds=function(t,e){if(t)for(var i=e?[t,e]:t,n=0,o=i.length;o>n;n++)this.extend(i[n])},o.LatLngBounds.prototype={extend:function(t){if(!t)return this;var e=o.latLng(t);return t=null!==e?e:o.latLngBounds(t),t instanceof o.LatLng?this._southWest||this._northEast?(this._southWest.lat=Math.min(t.lat,this._southWest.lat),this._southWest.lng=Math.min(t.lng,this._southWest.lng),this._northEast.lat=Math.max(t.lat,this._northEast.lat),this._northEast.lng=Math.max(t.lng,this._northEast.lng)):(this._southWest=new o.LatLng(t.lat,t.lng),this._northEast=new o.LatLng(t.lat,t.lng)):t instanceof o.LatLngBounds&&(this.extend(t._southWest),this.extend(t._northEast)),this},pad:function(t){var e=this._southWest,i=this._northEast,n=Math.abs(e.lat-i.lat)*t,s=Math.abs(e.lng-i.lng)*t;return new o.LatLngBounds(new o.LatLng(e.lat-n,e.lng-s),new o.LatLng(i.lat+n,i.lng+s))},getCenter:function(){return new o.LatLng((this._southWest.lat+this._northEast.lat)/2,(this._southWest.lng+this._northEast.lng)/2)},getSouthWest:function(){return this._southWest},getNorthEast:function(){return this._northEast},getNorthWest:function(){return new o.LatLng(this.getNorth(),this.getWest())},getSouthEast:function(){return new o.LatLng(this.getSouth(),this.getEast())},getWest:function(){return this._southWest.lng},getSouth:function(){return this._southWest.lat},getEast:function(){return this._northEast.lng},getNorth:function(){return this._northEast.lat},contains:function(t){t="number"==typeof t[0]||t instanceof o.LatLng?o.latLng(t):o.latLngBounds(t);var e,i,n=this._southWest,s=this._northEast;return t instanceof o.LatLngBounds?(e=t.getSouthWest(),i=t.getNorthEast()):e=i=t,e.lat>=n.lat&&i.lat<=s.lat&&e.lng>=n.lng&&i.lng<=s.lng},intersects:function(t){t=o.latLngBounds(t);var e=this._southWest,i=this._northEast,n=t.getSouthWest(),s=t.getNorthEast(),a=s.lat>=e.lat&&n.lat<=i.lat,r=s.lng>=e.lng&&n.lng<=i.lng;return a&&r},toBBoxString:function(){return[this.getWest(),this.getSouth(),this.getEast(),this.getNorth()].join(",")},equals:function(t){return t?(t=o.latLngBounds(t),this._southWest.equals(t.getSouthWest())&&this._northEast.equals(t.getNorthEast())):!1},isValid:function(){return!(!this._southWest||!this._northEast)}},o.latLngBounds=function(t,e){return!t||t instanceof o.LatLngBounds?t:new o.LatLngBounds(t,e)},o.Projection={},o.Projection.SphericalMercator={MAX_LATITUDE:85.0511287798,project:function(t){var e=o.LatLng.DEG_TO_RAD,i=this.MAX_LATITUDE,n=Math.max(Math.min(i,t.lat),-i),s=t.lng*e,a=n*e;return a=Math.log(Math.tan(Math.PI/4+a/2)),new o.Point(s,a)},unproject:function(t){var e=o.LatLng.RAD_TO_DEG,i=t.x*e,n=(2*Math.atan(Math.exp(t.y))-Math.PI/2)*e;return new o.LatLng(n,i)}},o.Projection.LonLat={project:function(t){return new o.Point(t.lng,t.lat)},unproject:function(t){return new o.LatLng(t.y,t.x)}},o.CRS={latLngToPoint:function(t,e){var i=this.projection.project(t),n=this.scale(e);return this.transformation._transform(i,n)},pointToLatLng:function(t,e){var i=this.scale(e),n=this.transformation.untransform(t,i);return this.projection.unproject(n)},project:function(t){return this.projection.project(t)},scale:function(t){return 256*Math.pow(2,t)},getSize:function(t){var e=this.scale(t);return o.point(e,e)}},o.CRS.Simple=o.extend({},o.CRS,{projection:o.Projection.LonLat,transformation:new o.Transformation(1,0,-1,0),scale:function(t){return Math.pow(2,t)}}),o.CRS.EPSG3857=o.extend({},o.CRS,{code:"EPSG:3857",projection:o.Projection.SphericalMercator,transformation:new o.Transformation(.5/Math.PI,.5,-.5/Math.PI,.5),project:function(t){var e=this.projection.project(t),i=6378137;return e.multiplyBy(i)}}),o.CRS.EPSG900913=o.extend({},o.CRS.EPSG3857,{code:"EPSG:900913"}),o.CRS.EPSG4326=o.extend({},o.CRS,{code:"EPSG:4326",projection:o.Projection.LonLat,transformation:new o.Transformation(1/360,.5,-1/360,.5)}),o.Map=o.Class.extend({includes:o.Mixin.Events,options:{crs:o.CRS.EPSG3857,fadeAnimation:o.DomUtil.TRANSITION&&!o.Browser.android23,trackResize:!0,markerZoomAnimation:o.DomUtil.TRANSITION&&o.Browser.any3d},initialize:function(t,e){e=o.setOptions(this,e),this._initContainer(t),this._initLayout(),this._onResize=o.bind(this._onResize,this),this._initEvents(),e.maxBounds&&this.setMaxBounds(e.maxBounds),e.center&&e.zoom!==i&&this.setView(o.latLng(e.center),e.zoom,{reset:!0}),this._handlers=[],this._layers={},this._zoomBoundLayers={},this._tileLayersNum=0,this.callInitHooks(),this._addLayers(e.layers)},setView:function(t,e){return e=e===i?this.getZoom():e,this._resetView(o.latLng(t),this._limitZoom(e)),this},setZoom:function(t,e){return this._loaded?this.setView(this.getCenter(),t,{zoom:e}):(this._zoom=this._limitZoom(t),this)},zoomIn:function(t,e){return this.setZoom(this._zoom+(t||1),e)},zoomOut:function(t,e){return this.setZoom(this._zoom-(t||1),e)},setZoomAround:function(t,e,i){var n=this.getZoomScale(e),s=this.getSize().divideBy(2),a=t instanceof o.Point?t:this.latLngToContainerPoint(t),r=a.subtract(s).multiplyBy(1-1/n),h=this.containerPointToLatLng(s.add(r));return this.setView(h,e,{zoom:i})},fitBounds:function(t,e){e=e||{},t=t.getBounds?t.getBounds():o.latLngBounds(t);var i=o.point(e.paddingTopLeft||e.padding||[0,0]),n=o.point(e.paddingBottomRight||e.padding||[0,0]),s=this.getBoundsZoom(t,!1,i.add(n)),a=n.subtract(i).divideBy(2),r=this.project(t.getSouthWest(),s),h=this.project(t.getNorthEast(),s),l=this.unproject(r.add(h).divideBy(2).add(a),s);return s=e&&e.maxZoom?Math.min(e.maxZoom,s):s,this.setView(l,s,e)},fitWorld:function(t){return this.fitBounds([[-90,-180],[90,180]],t)},panTo:function(t,e){return this.setView(t,this._zoom,{pan:e})},panBy:function(t){return this.fire("movestart"),this._rawPanBy(o.point(t)),this.fire("move"),this.fire("moveend")},setMaxBounds:function(t){return t=o.latLngBounds(t),this.options.maxBounds=t,t?(this._loaded&&this._panInsideMaxBounds(),this.on("moveend",this._panInsideMaxBounds,this)):this.off("moveend",this._panInsideMaxBounds,this)},panInsideBounds:function(t,e){var i=this.getCenter(),n=this._limitCenter(i,this._zoom,t);return i.equals(n)?this:this.panTo(n,e)},addLayer:function(t){var e=o.stamp(t);return this._layers[e]?this:(this._layers[e]=t,!t.options||isNaN(t.options.maxZoom)&&isNaN(t.options.minZoom)||(this._zoomBoundLayers[e]=t,this._updateZoomLevels()),this.options.zoomAnimation&&o.TileLayer&&t instanceof o.TileLayer&&(this._tileLayersNum++,this._tileLayersToLoad++,t.on("load",this._onTileLayerLoad,this)),this._loaded&&this._layerAdd(t),this)},removeLayer:function(t){var e=o.stamp(t);return this._layers[e]?(this._loaded&&t.onRemove(this),delete this._layers[e],this._loaded&&this.fire("layerremove",{layer:t}),this._zoomBoundLayers[e]&&(delete this._zoomBoundLayers[e],this._updateZoomLevels()),this.options.zoomAnimation&&o.TileLayer&&t instanceof o.TileLayer&&(this._tileLayersNum--,this._tileLayersToLoad--,t.off("load",this._onTileLayerLoad,this)),this):this},hasLayer:function(t){return t?o.stamp(t)in this._layers:!1},eachLayer:function(t,e){for(var i in this._layers)t.call(e,this._layers[i]);return this},invalidateSize:function(t){if(!this._loaded)return this;t=o.extend({animate:!1,pan:!0},t===!0?{animate:!0}:t);var e=this.getSize();this._sizeChanged=!0,this._initialCenter=null;var i=this.getSize(),n=e.divideBy(2).round(),s=i.divideBy(2).round(),a=n.subtract(s);return a.x||a.y?(t.animate&&t.pan?this.panBy(a):(t.pan&&this._rawPanBy(a),this.fire("move"),t.debounceMoveend?(clearTimeout(this._sizeTimer),this._sizeTimer=setTimeout(o.bind(this.fire,this,"moveend"),200)):this.fire("moveend")),this.fire("resize",{oldSize:e,newSize:i})):this},addHandler:function(t,e){if(!e)return this;var i=this[t]=new e(this);return this._handlers.push(i),this.options[t]&&i.enable(),this},remove:function(){this._loaded&&this.fire("unload"),this._initEvents("off");try{delete this._container._leaflet}catch(t){this._container._leaflet=i}return this._clearPanes(),this._clearControlPos&&this._clearControlPos(),this._clearHandlers(),this},getCenter:function(){return this._checkIfLoaded(),this._initialCenter&&!this._moved()?this._initialCenter:this.layerPointToLatLng(this._getCenterLayerPoint())},getZoom:function(){return this._zoom},getBounds:function(){var t=this.getPixelBounds(),e=this.unproject(t.getBottomLeft()),i=this.unproject(t.getTopRight());return new o.LatLngBounds(e,i)},getMinZoom:function(){return this.options.minZoom===i?this._layersMinZoom===i?0:this._layersMinZoom:this.options.minZoom},getMaxZoom:function(){return this.options.maxZoom===i?this._layersMaxZoom===i?1/0:this._layersMaxZoom:this.options.maxZoom},getBoundsZoom:function(t,e,i){t=o.latLngBounds(t);var n,s=this.getMinZoom()-(e?1:0),a=this.getMaxZoom(),r=this.getSize(),h=t.getNorthWest(),l=t.getSouthEast(),u=!0;i=o.point(i||[0,0]);do s++,n=this.project(l,s).subtract(this.project(h,s)).add(i),u=e?n.x<r.x||n.y<r.y:r.contains(n);while(u&&a>=s);return u&&e?null:e?s:s-1},getSize:function(){return(!this._size||this._sizeChanged)&&(this._size=new o.Point(this._container.clientWidth,this._container.clientHeight),this._sizeChanged=!1),this._size.clone()},getPixelBounds:function(){var t=this._getTopLeftPoint();return new o.Bounds(t,t.add(this.getSize()))},getPixelOrigin:function(){return this._checkIfLoaded(),this._initialTopLeftPoint},getPanes:function(){return this._panes},getContainer:function(){return this._container},getZoomScale:function(t){var e=this.options.crs;return e.scale(t)/e.scale(this._zoom)},getScaleZoom:function(t){return this._zoom+Math.log(t)/Math.LN2},project:function(t,e){return e=e===i?this._zoom:e,this.options.crs.latLngToPoint(o.latLng(t),e)},unproject:function(t,e){return e=e===i?this._zoom:e,this.options.crs.pointToLatLng(o.point(t),e)},layerPointToLatLng:function(t){var e=o.point(t).add(this.getPixelOrigin());return this.unproject(e)},latLngToLayerPoint:function(t){var e=this.project(o.latLng(t))._round();return e._subtract(this.getPixelOrigin())},containerPointToLayerPoint:function(t){return o.point(t).subtract(this._getMapPanePos())},layerPointToContainerPoint:function(t){return o.point(t).add(this._getMapPanePos())},containerPointToLatLng:function(t){var e=this.containerPointToLayerPoint(o.point(t));return this.layerPointToLatLng(e)},latLngToContainerPoint:function(t){return this.layerPointToContainerPoint(this.latLngToLayerPoint(o.latLng(t)))},mouseEventToContainerPoint:function(t){return o.DomEvent.getMousePosition(t,this._container)},mouseEventToLayerPoint:function(t){return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(t))},mouseEventToLatLng:function(t){return this.layerPointToLatLng(this.mouseEventToLayerPoint(t))},_initContainer:function(t){var e=this._container=o.DomUtil.get(t);if(!e)throw new Error("Map container not found.");if(e._leaflet)throw new Error("Map container is already initialized.");e._leaflet=!0},_initLayout:function(){var t=this._container;o.DomUtil.addClass(t,"leaflet-container"+(o.Browser.touch?" leaflet-touch":"")+(o.Browser.retina?" leaflet-retina":"")+(o.Browser.ielt9?" leaflet-oldie":"")+(this.options.fadeAnimation?" leaflet-fade-anim":""));var e=o.DomUtil.getStyle(t,"position");"absolute"!==e&&"relative"!==e&&"fixed"!==e&&(t.style.position="relative"),this._initPanes(),this._initControlPos&&this._initControlPos()},_initPanes:function(){var t=this._panes={};this._mapPane=t.mapPane=this._createPane("leaflet-map-pane",this._container),this._tilePane=t.tilePane=this._createPane("leaflet-tile-pane",this._mapPane),t.objectsPane=this._createPane("leaflet-objects-pane",this._mapPane),t.shadowPane=this._createPane("leaflet-shadow-pane"),t.overlayPane=this._createPane("leaflet-overlay-pane"),t.markerPane=this._createPane("leaflet-marker-pane"),t.popupPane=this._createPane("leaflet-popup-pane");var e=" leaflet-zoom-hide";this.options.markerZoomAnimation||(o.DomUtil.addClass(t.markerPane,e),o.DomUtil.addClass(t.shadowPane,e),o.DomUtil.addClass(t.popupPane,e))},_createPane:function(t,e){return o.DomUtil.create("div",t,e||this._panes.objectsPane)},_clearPanes:function(){this._container.removeChild(this._mapPane)},_addLayers:function(t){t=t?o.Util.isArray(t)?t:[t]:[];for(var e=0,i=t.length;i>e;e++)this.addLayer(t[e])},_resetView:function(t,e,i,n){var s=this._zoom!==e;n||(this.fire("movestart"),s&&this.fire("zoomstart")),this._zoom=e,this._initialCenter=t,this._initialTopLeftPoint=this._getNewTopLeftPoint(t),i?this._initialTopLeftPoint._add(this._getMapPanePos()):o.DomUtil.setPosition(this._mapPane,new o.Point(0,0)),this._tileLayersToLoad=this._tileLayersNum;var a=!this._loaded;this._loaded=!0,a&&(this.fire("load"),this.eachLayer(this._layerAdd,this)),this.fire("viewreset",{hard:!i}),this.fire("move"),(s||n)&&this.fire("zoomend"),this.fire("moveend",{hard:!i})},_rawPanBy:function(t){o.DomUtil.setPosition(this._mapPane,this._getMapPanePos().subtract(t))},_getZoomSpan:function(){return this.getMaxZoom()-this.getMinZoom()},_updateZoomLevels:function(){var t,e=1/0,n=-1/0,o=this._getZoomSpan();for(t in this._zoomBoundLayers){var s=this._zoomBoundLayers[t];isNaN(s.options.minZoom)||(e=Math.min(e,s.options.minZoom)),isNaN(s.options.maxZoom)||(n=Math.max(n,s.options.maxZoom))}t===i?this._layersMaxZoom=this._layersMinZoom=i:(this._layersMaxZoom=n,this._layersMinZoom=e),o!==this._getZoomSpan()&&this.fire("zoomlevelschange")},_panInsideMaxBounds:function(){this.panInsideBounds(this.options.maxBounds)},_checkIfLoaded:function(){if(!this._loaded)throw new Error("Set map center and zoom first.")},_initEvents:function(e){if(o.DomEvent){e=e||"on",o.DomEvent[e](this._container,"click",this._onMouseClick,this);var i,n,s=["dblclick","mousedown","mouseup","mouseenter","mouseleave","mousemove","contextmenu"];for(i=0,n=s.length;n>i;i++)o.DomEvent[e](this._container,s[i],this._fireMouseEvent,this);this.options.trackResize&&o.DomEvent[e](t,"resize",this._onResize,this)}},_onResize:function(){o.Util.cancelAnimFrame(this._resizeRequest),this._resizeRequest=o.Util.requestAnimFrame(function(){this.invalidateSize({debounceMoveend:!0})},this,!1,this._container)},_onMouseClick:function(t){!this._loaded||!t._simulated&&(this.dragging&&this.dragging.moved()||this.boxZoom&&this.boxZoom.moved())||o.DomEvent._skipped(t)||(this.fire("preclick"),this._fireMouseEvent(t))},_fireMouseEvent:function(t){if(this._loaded&&!o.DomEvent._skipped(t)){var e=t.type;if(e="mouseenter"===e?"mouseover":"mouseleave"===e?"mouseout":e,this.hasEventListeners(e)){"contextmenu"===e&&o.DomEvent.preventDefault(t);var i=this.mouseEventToContainerPoint(t),n=this.containerPointToLayerPoint(i),s=this.layerPointToLatLng(n);this.fire(e,{latlng:s,layerPoint:n,containerPoint:i,originalEvent:t})}}},_onTileLayerLoad:function(){this._tileLayersToLoad--,this._tileLayersNum&&!this._tileLayersToLoad&&this.fire("tilelayersload")},_clearHandlers:function(){for(var t=0,e=this._handlers.length;e>t;t++)this._handlers[t].disable()},whenReady:function(t,e){return this._loaded?t.call(e||this,this):this.on("load",t,e),this},_layerAdd:function(t){t.onAdd(this),this.fire("layeradd",{layer:t})},_getMapPanePos:function(){return o.DomUtil.getPosition(this._mapPane)},_moved:function(){var t=this._getMapPanePos();return t&&!t.equals([0,0])},_getTopLeftPoint:function(){return this.getPixelOrigin().subtract(this._getMapPanePos())},_getNewTopLeftPoint:function(t,e){var i=this.getSize()._divideBy(2);return this.project(t,e)._subtract(i)._round()},_latLngToNewLayerPoint:function(t,e,i){var n=this._getNewTopLeftPoint(i,e).add(this._getMapPanePos());return this.project(t,e)._subtract(n)},_getCenterLayerPoint:function(){return this.containerPointToLayerPoint(this.getSize()._divideBy(2))},_getCenterOffset:function(t){return this.latLngToLayerPoint(t).subtract(this._getCenterLayerPoint())},_limitCenter:function(t,e,i){if(!i)return t;var n=this.project(t,e),s=this.getSize().divideBy(2),a=new o.Bounds(n.subtract(s),n.add(s)),r=this._getBoundsOffset(a,i,e);return this.unproject(n.add(r),e)},_limitOffset:function(t,e){if(!e)return t;var i=this.getPixelBounds(),n=new o.Bounds(i.min.add(t),i.max.add(t));return t.add(this._getBoundsOffset(n,e))},_getBoundsOffset:function(t,e,i){var n=this.project(e.getNorthWest(),i).subtract(t.min),s=this.project(e.getSouthEast(),i).subtract(t.max),a=this._rebound(n.x,-s.x),r=this._rebound(n.y,-s.y);return new o.Point(a,r)},_rebound:function(t,e){return t+e>0?Math.round(t-e)/2:Math.max(0,Math.ceil(t))-Math.max(0,Math.floor(e))},_limitZoom:function(t){var e=this.getMinZoom(),i=this.getMaxZoom();return Math.max(e,Math.min(i,t))}}),o.map=function(t,e){return new o.Map(t,e)},o.Projection.Mercator={MAX_LATITUDE:85.0840591556,R_MINOR:6356752.314245179,R_MAJOR:6378137,project:function(t){var e=o.LatLng.DEG_TO_RAD,i=this.MAX_LATITUDE,n=Math.max(Math.min(i,t.lat),-i),s=this.R_MAJOR,a=this.R_MINOR,r=t.lng*e*s,h=n*e,l=a/s,u=Math.sqrt(1-l*l),c=u*Math.sin(h);c=Math.pow((1-c)/(1+c),.5*u);var d=Math.tan(.5*(.5*Math.PI-h))/c;return h=-s*Math.log(d),new o.Point(r,h)},unproject:function(t){for(var e,i=o.LatLng.RAD_TO_DEG,n=this.R_MAJOR,s=this.R_MINOR,a=t.x*i/n,r=s/n,h=Math.sqrt(1-r*r),l=Math.exp(-t.y/n),u=Math.PI/2-2*Math.atan(l),c=15,d=1e-7,p=c,_=.1;Math.abs(_)>d&&--p>0;)e=h*Math.sin(u),_=Math.PI/2-2*Math.atan(l*Math.pow((1-e)/(1+e),.5*h))-u,u+=_;
return new o.LatLng(u*i,a)}},o.CRS.EPSG3395=o.extend({},o.CRS,{code:"EPSG:3395",projection:o.Projection.Mercator,transformation:function(){var t=o.Projection.Mercator,e=t.R_MAJOR,i=.5/(Math.PI*e);return new o.Transformation(i,.5,-i,.5)}()}),o.TileLayer=o.Class.extend({includes:o.Mixin.Events,options:{minZoom:0,maxZoom:18,tileSize:256,subdomains:"abc",errorTileUrl:"",attribution:"",zoomOffset:0,opacity:1,unloadInvisibleTiles:o.Browser.mobile,updateWhenIdle:o.Browser.mobile},initialize:function(t,e){e=o.setOptions(this,e),e.detectRetina&&o.Browser.retina&&e.maxZoom>0&&(e.tileSize=Math.floor(e.tileSize/2),e.zoomOffset++,e.minZoom>0&&e.minZoom--,this.options.maxZoom--),e.bounds&&(e.bounds=o.latLngBounds(e.bounds)),this._url=t;var i=this.options.subdomains;"string"==typeof i&&(this.options.subdomains=i.split(""))},onAdd:function(t){this._map=t,this._animated=t._zoomAnimated,this._initContainer(),t.on({viewreset:this._reset,moveend:this._update},this),this._animated&&t.on({zoomanim:this._animateZoom,zoomend:this._endZoomAnim},this),this.options.updateWhenIdle||(this._limitedUpdate=o.Util.limitExecByInterval(this._update,150,this),t.on("move",this._limitedUpdate,this)),this._reset(),this._update()},addTo:function(t){return t.addLayer(this),this},onRemove:function(t){this._container.parentNode.removeChild(this._container),t.off({viewreset:this._reset,moveend:this._update},this),this._animated&&t.off({zoomanim:this._animateZoom,zoomend:this._endZoomAnim},this),this.options.updateWhenIdle||t.off("move",this._limitedUpdate,this),this._container=null,this._map=null},bringToFront:function(){var t=this._map._panes.tilePane;return this._container&&(t.appendChild(this._container),this._setAutoZIndex(t,Math.max)),this},bringToBack:function(){var t=this._map._panes.tilePane;return this._container&&(t.insertBefore(this._container,t.firstChild),this._setAutoZIndex(t,Math.min)),this},getAttribution:function(){return this.options.attribution},getContainer:function(){return this._container},setOpacity:function(t){return this.options.opacity=t,this._map&&this._updateOpacity(),this},setZIndex:function(t){return this.options.zIndex=t,this._updateZIndex(),this},setUrl:function(t,e){return this._url=t,e||this.redraw(),this},redraw:function(){return this._map&&(this._reset({hard:!0}),this._update()),this},_updateZIndex:function(){this._container&&this.options.zIndex!==i&&(this._container.style.zIndex=this.options.zIndex)},_setAutoZIndex:function(t,e){var i,n,o,s=t.children,a=-e(1/0,-1/0);for(n=0,o=s.length;o>n;n++)s[n]!==this._container&&(i=parseInt(s[n].style.zIndex,10),isNaN(i)||(a=e(a,i)));this.options.zIndex=this._container.style.zIndex=(isFinite(a)?a:0)+e(1,-1)},_updateOpacity:function(){var t,e=this._tiles;if(o.Browser.ielt9)for(t in e)o.DomUtil.setOpacity(e[t],this.options.opacity);else o.DomUtil.setOpacity(this._container,this.options.opacity)},_initContainer:function(){var t=this._map._panes.tilePane;if(!this._container){if(this._container=o.DomUtil.create("div","leaflet-layer"),this._updateZIndex(),this._animated){var e="leaflet-tile-container";this._bgBuffer=o.DomUtil.create("div",e,this._container),this._tileContainer=o.DomUtil.create("div",e,this._container)}else this._tileContainer=this._container;t.appendChild(this._container),this.options.opacity<1&&this._updateOpacity()}},_reset:function(t){for(var e in this._tiles)this.fire("tileunload",{tile:this._tiles[e]});this._tiles={},this._tilesToLoad=0,this.options.reuseTiles&&(this._unusedTiles=[]),this._tileContainer.innerHTML="",this._animated&&t&&t.hard&&this._clearBgBuffer(),this._initContainer()},_getTileSize:function(){var t=this._map,e=t.getZoom()+this.options.zoomOffset,i=this.options.maxNativeZoom,n=this.options.tileSize;return i&&e>i&&(n=Math.round(t.getZoomScale(e)/t.getZoomScale(i)*n)),n},_update:function(){if(this._map){var t=this._map,e=t.getPixelBounds(),i=t.getZoom(),n=this._getTileSize();if(!(i>this.options.maxZoom||i<this.options.minZoom)){var s=o.bounds(e.min.divideBy(n)._floor(),e.max.divideBy(n)._floor());this._addTilesFromCenterOut(s),(this.options.unloadInvisibleTiles||this.options.reuseTiles)&&this._removeOtherTiles(s)}}},_addTilesFromCenterOut:function(t){var i,n,s,a=[],r=t.getCenter();for(i=t.min.y;i<=t.max.y;i++)for(n=t.min.x;n<=t.max.x;n++)s=new o.Point(n,i),this._tileShouldBeLoaded(s)&&a.push(s);var h=a.length;if(0!==h){a.sort(function(t,e){return t.distanceTo(r)-e.distanceTo(r)});var l=e.createDocumentFragment();for(this._tilesToLoad||this.fire("loading"),this._tilesToLoad+=h,n=0;h>n;n++)this._addTile(a[n],l);this._tileContainer.appendChild(l)}},_tileShouldBeLoaded:function(t){if(t.x+":"+t.y in this._tiles)return!1;var e=this.options;if(!e.continuousWorld){var i=this._getWrapTileNum();if(e.noWrap&&(t.x<0||t.x>=i.x)||t.y<0||t.y>=i.y)return!1}if(e.bounds){var n=e.tileSize,o=t.multiplyBy(n),s=o.add([n,n]),a=this._map.unproject(o),r=this._map.unproject(s);if(e.continuousWorld||e.noWrap||(a=a.wrap(),r=r.wrap()),!e.bounds.intersects([a,r]))return!1}return!0},_removeOtherTiles:function(t){var e,i,n,o;for(o in this._tiles)e=o.split(":"),i=parseInt(e[0],10),n=parseInt(e[1],10),(i<t.min.x||i>t.max.x||n<t.min.y||n>t.max.y)&&this._removeTile(o)},_removeTile:function(t){var e=this._tiles[t];this.fire("tileunload",{tile:e,url:e.src}),this.options.reuseTiles?(o.DomUtil.removeClass(e,"leaflet-tile-loaded"),this._unusedTiles.push(e)):e.parentNode===this._tileContainer&&this._tileContainer.removeChild(e),o.Browser.android||(e.onload=null,e.src=o.Util.emptyImageUrl),delete this._tiles[t]},_addTile:function(t,e){var i=this._getTilePos(t),n=this._getTile();o.DomUtil.setPosition(n,i,o.Browser.chrome),this._tiles[t.x+":"+t.y]=n,this._loadTile(n,t),n.parentNode!==this._tileContainer&&e.appendChild(n)},_getZoomForUrl:function(){var t=this.options,e=this._map.getZoom();return t.zoomReverse&&(e=t.maxZoom-e),e+=t.zoomOffset,t.maxNativeZoom?Math.min(e,t.maxNativeZoom):e},_getTilePos:function(t){var e=this._map.getPixelOrigin(),i=this._getTileSize();return t.multiplyBy(i).subtract(e)},getTileUrl:function(t){return o.Util.template(this._url,o.extend({s:this._getSubdomain(t),z:t.z,x:t.x,y:t.y},this.options))},_getWrapTileNum:function(){var t=this._map.options.crs,e=t.getSize(this._map.getZoom());return e.divideBy(this._getTileSize())._floor()},_adjustTilePoint:function(t){var e=this._getWrapTileNum();this.options.continuousWorld||this.options.noWrap||(t.x=(t.x%e.x+e.x)%e.x),this.options.tms&&(t.y=e.y-t.y-1),t.z=this._getZoomForUrl()},_getSubdomain:function(t){var e=Math.abs(t.x+t.y)%this.options.subdomains.length;return this.options.subdomains[e]},_getTile:function(){if(this.options.reuseTiles&&this._unusedTiles.length>0){var t=this._unusedTiles.pop();return this._resetTile(t),t}return this._createTile()},_resetTile:function(){},_createTile:function(){var t=o.DomUtil.create("img","leaflet-tile");return t.style.width=t.style.height=this._getTileSize()+"px",t.galleryimg="no",t.onselectstart=t.onmousemove=o.Util.falseFn,o.Browser.ielt9&&this.options.opacity!==i&&o.DomUtil.setOpacity(t,this.options.opacity),o.Browser.mobileWebkit3d&&(t.style.WebkitBackfaceVisibility="hidden"),t},_loadTile:function(t,e){t._layer=this,t.onload=this._tileOnLoad,t.onerror=this._tileOnError,this._adjustTilePoint(e),t.src=this.getTileUrl(e),this.fire("tileloadstart",{tile:t,url:t.src})},_tileLoaded:function(){this._tilesToLoad--,this._animated&&o.DomUtil.addClass(this._tileContainer,"leaflet-zoom-animated"),this._tilesToLoad||(this.fire("load"),this._animated&&(clearTimeout(this._clearBgBufferTimer),this._clearBgBufferTimer=setTimeout(o.bind(this._clearBgBuffer,this),500)))},_tileOnLoad:function(){var t=this._layer;this.src!==o.Util.emptyImageUrl&&(o.DomUtil.addClass(this,"leaflet-tile-loaded"),t.fire("tileload",{tile:this,url:this.src})),t._tileLoaded()},_tileOnError:function(){var t=this._layer;t.fire("tileerror",{tile:this,url:this.src});var e=t.options.errorTileUrl;e&&(this.src=e),t._tileLoaded()}}),o.tileLayer=function(t,e){return new o.TileLayer(t,e)},o.TileLayer.WMS=o.TileLayer.extend({defaultWmsParams:{service:"WMS",request:"GetMap",version:"1.1.1",layers:"",styles:"",format:"image/jpeg",transparent:!1},initialize:function(t,e){this._url=t;var i=o.extend({},this.defaultWmsParams),n=e.tileSize||this.options.tileSize;i.width=i.height=e.detectRetina&&o.Browser.retina?2*n:n;for(var s in e)this.options.hasOwnProperty(s)||"crs"===s||(i[s]=e[s]);this.wmsParams=i,o.setOptions(this,e)},onAdd:function(t){this._crs=this.options.crs||t.options.crs,this._wmsVersion=parseFloat(this.wmsParams.version);var e=this._wmsVersion>=1.3?"crs":"srs";this.wmsParams[e]=this._crs.code,o.TileLayer.prototype.onAdd.call(this,t)},getTileUrl:function(t){var e=this._map,i=this.options.tileSize,n=t.multiplyBy(i),s=n.add([i,i]),a=this._crs.project(e.unproject(n,t.z)),r=this._crs.project(e.unproject(s,t.z)),h=this._wmsVersion>=1.3&&this._crs===o.CRS.EPSG4326?[r.y,a.x,a.y,r.x].join(","):[a.x,r.y,r.x,a.y].join(","),l=o.Util.template(this._url,{s:this._getSubdomain(t)});return l+o.Util.getParamString(this.wmsParams,l,!0)+"&BBOX="+h},setParams:function(t,e){return o.extend(this.wmsParams,t),e||this.redraw(),this}}),o.tileLayer.wms=function(t,e){return new o.TileLayer.WMS(t,e)},o.TileLayer.Canvas=o.TileLayer.extend({options:{async:!1},initialize:function(t){o.setOptions(this,t)},redraw:function(){this._map&&(this._reset({hard:!0}),this._update());for(var t in this._tiles)this._redrawTile(this._tiles[t]);return this},_redrawTile:function(t){this.drawTile(t,t._tilePoint,this._map._zoom)},_createTile:function(){var t=o.DomUtil.create("canvas","leaflet-tile");return t.width=t.height=this.options.tileSize,t.onselectstart=t.onmousemove=o.Util.falseFn,t},_loadTile:function(t,e){t._layer=this,t._tilePoint=e,this._redrawTile(t),this.options.async||this.tileDrawn(t)},drawTile:function(){},tileDrawn:function(t){this._tileOnLoad.call(t)}}),o.tileLayer.canvas=function(t){return new o.TileLayer.Canvas(t)},o.ImageOverlay=o.Class.extend({includes:o.Mixin.Events,options:{opacity:1},initialize:function(t,e,i){this._url=t,this._bounds=o.latLngBounds(e),o.setOptions(this,i)},onAdd:function(t){this._map=t,this._image||this._initImage(),t._panes.overlayPane.appendChild(this._image),t.on("viewreset",this._reset,this),t.options.zoomAnimation&&o.Browser.any3d&&t.on("zoomanim",this._animateZoom,this),this._reset()},onRemove:function(t){t.getPanes().overlayPane.removeChild(this._image),t.off("viewreset",this._reset,this),t.options.zoomAnimation&&t.off("zoomanim",this._animateZoom,this)},addTo:function(t){return t.addLayer(this),this},setOpacity:function(t){return this.options.opacity=t,this._updateOpacity(),this},bringToFront:function(){return this._image&&this._map._panes.overlayPane.appendChild(this._image),this},bringToBack:function(){var t=this._map._panes.overlayPane;return this._image&&t.insertBefore(this._image,t.firstChild),this},setUrl:function(t){this._url=t,this._image.src=this._url},getAttribution:function(){return this.options.attribution},_initImage:function(){this._image=o.DomUtil.create("img","leaflet-image-layer"),this._map.options.zoomAnimation&&o.Browser.any3d?o.DomUtil.addClass(this._image,"leaflet-zoom-animated"):o.DomUtil.addClass(this._image,"leaflet-zoom-hide"),this._updateOpacity(),o.extend(this._image,{galleryimg:"no",onselectstart:o.Util.falseFn,onmousemove:o.Util.falseFn,onload:o.bind(this._onImageLoad,this),src:this._url})},_animateZoom:function(t){var e=this._map,i=this._image,n=e.getZoomScale(t.zoom),s=this._bounds.getNorthWest(),a=this._bounds.getSouthEast(),r=e._latLngToNewLayerPoint(s,t.zoom,t.center),h=e._latLngToNewLayerPoint(a,t.zoom,t.center)._subtract(r),l=r._add(h._multiplyBy(.5*(1-1/n)));i.style[o.DomUtil.TRANSFORM]=o.DomUtil.getTranslateString(l)+" scale("+n+") "},_reset:function(){var t=this._image,e=this._map.latLngToLayerPoint(this._bounds.getNorthWest()),i=this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(e);o.DomUtil.setPosition(t,e),t.style.width=i.x+"px",t.style.height=i.y+"px"},_onImageLoad:function(){this.fire("load")},_updateOpacity:function(){o.DomUtil.setOpacity(this._image,this.options.opacity)}}),o.imageOverlay=function(t,e,i){return new o.ImageOverlay(t,e,i)},o.Icon=o.Class.extend({options:{className:""},initialize:function(t){o.setOptions(this,t)},createIcon:function(t){return this._createIcon("icon",t)},createShadow:function(t){return this._createIcon("shadow",t)},_createIcon:function(t,e){var i=this._getIconUrl(t);if(!i){if("icon"===t)throw new Error("iconUrl not set in Icon options (see the docs).");return null}var n;return n=e&&"IMG"===e.tagName?this._createImg(i,e):this._createImg(i),this._setIconStyles(n,t),n},_setIconStyles:function(t,e){var i,n=this.options,s=o.point(n[e+"Size"]);i=o.point("shadow"===e?n.shadowAnchor||n.iconAnchor:n.iconAnchor),!i&&s&&(i=s.divideBy(2,!0)),t.className="leaflet-marker-"+e+" "+n.className,i&&(t.style.marginLeft=-i.x+"px",t.style.marginTop=-i.y+"px"),s&&(t.style.width=s.x+"px",t.style.height=s.y+"px")},_createImg:function(t,i){return i=i||e.createElement("img"),i.src=t,i},_getIconUrl:function(t){return o.Browser.retina&&this.options[t+"RetinaUrl"]?this.options[t+"RetinaUrl"]:this.options[t+"Url"]}}),o.icon=function(t){return new o.Icon(t)},o.Icon.Default=o.Icon.extend({options:{iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]},_getIconUrl:function(t){var e=t+"Url";if(this.options[e])return this.options[e];o.Browser.retina&&"icon"===t&&(t+="-2x");var i=o.Icon.Default.imagePath;if(!i)throw new Error("Couldn't autodetect L.Icon.Default.imagePath, set it manually.");return i+"/marker-"+t+".png"}}),o.Icon.Default.imagePath=function(){var t,i,n,o,s,a=e.getElementsByTagName("script"),r=/[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;for(t=0,i=a.length;i>t;t++)if(n=a[t].src,o=n.match(r))return s=n.split(r)[0],(s?s+"/":"")+"images"}(),o.Marker=o.Class.extend({includes:o.Mixin.Events,options:{icon:new o.Icon.Default,title:"",alt:"",clickable:!0,draggable:!1,keyboard:!0,zIndexOffset:0,opacity:1,riseOnHover:!1,riseOffset:250},initialize:function(t,e){o.setOptions(this,e),this._latlng=o.latLng(t)},onAdd:function(t){this._map=t,t.on("viewreset",this.update,this),this._initIcon(),this.update(),this.fire("add"),t.options.zoomAnimation&&t.options.markerZoomAnimation&&t.on("zoomanim",this._animateZoom,this)},addTo:function(t){return t.addLayer(this),this},onRemove:function(t){this.dragging&&this.dragging.disable(),this._removeIcon(),this._removeShadow(),this.fire("remove"),t.off({viewreset:this.update,zoomanim:this._animateZoom},this),this._map=null},getLatLng:function(){return this._latlng},setLatLng:function(t){return this._latlng=o.latLng(t),this.update(),this.fire("move",{latlng:this._latlng})},setZIndexOffset:function(t){return this.options.zIndexOffset=t,this.update(),this},setIcon:function(t){return this.options.icon=t,this._map&&(this._initIcon(),this.update()),this._popup&&this.bindPopup(this._popup),this},update:function(){if(this._icon){var t=this._map.latLngToLayerPoint(this._latlng).round();this._setPos(t)}return this},_initIcon:function(){var t=this.options,e=this._map,i=e.options.zoomAnimation&&e.options.markerZoomAnimation,n=i?"leaflet-zoom-animated":"leaflet-zoom-hide",s=t.icon.createIcon(this._icon),a=!1;s!==this._icon&&(this._icon&&this._removeIcon(),a=!0,t.title&&(s.title=t.title),t.alt&&(s.alt=t.alt)),o.DomUtil.addClass(s,n),t.keyboard&&(s.tabIndex="0"),this._icon=s,this._initInteraction(),t.riseOnHover&&o.DomEvent.on(s,"mouseover",this._bringToFront,this).on(s,"mouseout",this._resetZIndex,this);var r=t.icon.createShadow(this._shadow),h=!1;r!==this._shadow&&(this._removeShadow(),h=!0),r&&o.DomUtil.addClass(r,n),this._shadow=r,t.opacity<1&&this._updateOpacity();var l=this._map._panes;a&&l.markerPane.appendChild(this._icon),r&&h&&l.shadowPane.appendChild(this._shadow)},_removeIcon:function(){this.options.riseOnHover&&o.DomEvent.off(this._icon,"mouseover",this._bringToFront).off(this._icon,"mouseout",this._resetZIndex),this._map._panes.markerPane.removeChild(this._icon),this._icon=null},_removeShadow:function(){this._shadow&&this._map._panes.shadowPane.removeChild(this._shadow),this._shadow=null},_setPos:function(t){o.DomUtil.setPosition(this._icon,t),this._shadow&&o.DomUtil.setPosition(this._shadow,t),this._zIndex=t.y+this.options.zIndexOffset,this._resetZIndex()},_updateZIndex:function(t){this._icon.style.zIndex=this._zIndex+t},_animateZoom:function(t){var e=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center).round();this._setPos(e)},_initInteraction:function(){if(this.options.clickable){var t=this._icon,e=["dblclick","mousedown","mouseover","mouseout","contextmenu"];o.DomUtil.addClass(t,"leaflet-clickable"),o.DomEvent.on(t,"click",this._onMouseClick,this),o.DomEvent.on(t,"keypress",this._onKeyPress,this);for(var i=0;i<e.length;i++)o.DomEvent.on(t,e[i],this._fireMouseEvent,this);o.Handler.MarkerDrag&&(this.dragging=new o.Handler.MarkerDrag(this),this.options.draggable&&this.dragging.enable())}},_onMouseClick:function(t){var e=this.dragging&&this.dragging.moved();(this.hasEventListeners(t.type)||e)&&o.DomEvent.stopPropagation(t),e||(this.dragging&&this.dragging._enabled||!this._map.dragging||!this._map.dragging.moved())&&this.fire(t.type,{originalEvent:t,latlng:this._latlng})},_onKeyPress:function(t){13===t.keyCode&&this.fire("click",{originalEvent:t,latlng:this._latlng})},_fireMouseEvent:function(t){this.fire(t.type,{originalEvent:t,latlng:this._latlng}),"contextmenu"===t.type&&this.hasEventListeners(t.type)&&o.DomEvent.preventDefault(t),"mousedown"!==t.type?o.DomEvent.stopPropagation(t):o.DomEvent.preventDefault(t)},setOpacity:function(t){return this.options.opacity=t,this._map&&this._updateOpacity(),this},_updateOpacity:function(){o.DomUtil.setOpacity(this._icon,this.options.opacity),this._shadow&&o.DomUtil.setOpacity(this._shadow,this.options.opacity)},_bringToFront:function(){this._updateZIndex(this.options.riseOffset)},_resetZIndex:function(){this._updateZIndex(0)}}),o.marker=function(t,e){return new o.Marker(t,e)},o.DivIcon=o.Icon.extend({options:{iconSize:[12,12],className:"leaflet-div-icon",html:!1},createIcon:function(t){var i=t&&"DIV"===t.tagName?t:e.createElement("div"),n=this.options;return i.innerHTML=n.html!==!1?n.html:"",n.bgPos&&(i.style.backgroundPosition=-n.bgPos.x+"px "+-n.bgPos.y+"px"),this._setIconStyles(i,"icon"),i},createShadow:function(){return null}}),o.divIcon=function(t){return new o.DivIcon(t)},o.Map.mergeOptions({closePopupOnClick:!0}),o.Popup=o.Class.extend({includes:o.Mixin.Events,options:{minWidth:50,maxWidth:300,autoPan:!0,closeButton:!0,offset:[0,7],autoPanPadding:[5,5],keepInView:!1,className:"",zoomAnimation:!0},initialize:function(t,e){o.setOptions(this,t),this._source=e,this._animated=o.Browser.any3d&&this.options.zoomAnimation,this._isOpen=!1},onAdd:function(t){this._map=t,this._container||this._initLayout();var e=t.options.fadeAnimation;e&&o.DomUtil.setOpacity(this._container,0),t._panes.popupPane.appendChild(this._container),t.on(this._getEvents(),this),this.update(),e&&o.DomUtil.setOpacity(this._container,1),this.fire("open"),t.fire("popupopen",{popup:this}),this._source&&this._source.fire("popupopen",{popup:this})},addTo:function(t){return t.addLayer(this),this},openOn:function(t){return t.openPopup(this),this},onRemove:function(t){t._panes.popupPane.removeChild(this._container),o.Util.falseFn(this._container.offsetWidth),t.off(this._getEvents(),this),t.options.fadeAnimation&&o.DomUtil.setOpacity(this._container,0),this._map=null,this.fire("close"),t.fire("popupclose",{popup:this}),this._source&&this._source.fire("popupclose",{popup:this})},getLatLng:function(){return this._latlng},setLatLng:function(t){return this._latlng=o.latLng(t),this._map&&(this._updatePosition(),this._adjustPan()),this},getContent:function(){return this._content},setContent:function(t){return this._content=t,this.update(),this},update:function(){this._map&&(this._container.style.visibility="hidden",this._updateContent(),this._updateLayout(),this._updatePosition(),this._container.style.visibility="",this._adjustPan())},_getEvents:function(){var t={viewreset:this._updatePosition};return this._animated&&(t.zoomanim=this._zoomAnimation),("closeOnClick"in this.options?this.options.closeOnClick:this._map.options.closePopupOnClick)&&(t.preclick=this._close),this.options.keepInView&&(t.moveend=this._adjustPan),t},_close:function(){this._map&&this._map.closePopup(this)},_initLayout:function(){var t,e="leaflet-popup",i=e+" "+this.options.className+" leaflet-zoom-"+(this._animated?"animated":"hide"),n=this._container=o.DomUtil.create("div",i);this.options.closeButton&&(t=this._closeButton=o.DomUtil.create("a",e+"-close-button",n),t.href="#close",t.innerHTML="&#215;",o.DomEvent.disableClickPropagation(t),o.DomEvent.on(t,"click",this._onCloseButtonClick,this));var s=this._wrapper=o.DomUtil.create("div",e+"-content-wrapper",n);o.DomEvent.disableClickPropagation(s),this._contentNode=o.DomUtil.create("div",e+"-content",s),o.DomEvent.disableScrollPropagation(this._contentNode),o.DomEvent.on(s,"contextmenu",o.DomEvent.stopPropagation),this._tipContainer=o.DomUtil.create("div",e+"-tip-container",n),this._tip=o.DomUtil.create("div",e+"-tip",this._tipContainer)},_updateContent:function(){if(this._content){if("string"==typeof this._content)this._contentNode.innerHTML=this._content;else{for(;this._contentNode.hasChildNodes();)this._contentNode.removeChild(this._contentNode.firstChild);this._contentNode.appendChild(this._content)}this.fire("contentupdate")}},_updateLayout:function(){var t=this._contentNode,e=t.style;e.width="",e.whiteSpace="nowrap";var i=t.offsetWidth;i=Math.min(i,this.options.maxWidth),i=Math.max(i,this.options.minWidth),e.width=i+1+"px",e.whiteSpace="",e.height="";var n=t.offsetHeight,s=this.options.maxHeight,a="leaflet-popup-scrolled";s&&n>s?(e.height=s+"px",o.DomUtil.addClass(t,a)):o.DomUtil.removeClass(t,a),this._containerWidth=this._container.offsetWidth},_updatePosition:function(){if(this._map){var t=this._map.latLngToLayerPoint(this._latlng),e=this._animated,i=o.point(this.options.offset);e&&o.DomUtil.setPosition(this._container,t),this._containerBottom=-i.y-(e?0:t.y),this._containerLeft=-Math.round(this._containerWidth/2)+i.x+(e?0:t.x),this._container.style.bottom=this._containerBottom+"px",this._container.style.left=this._containerLeft+"px"}},_zoomAnimation:function(t){var e=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center);o.DomUtil.setPosition(this._container,e)},_adjustPan:function(){if(this.options.autoPan){var t=this._map,e=this._container.offsetHeight,i=this._containerWidth,n=new o.Point(this._containerLeft,-e-this._containerBottom);this._animated&&n._add(o.DomUtil.getPosition(this._container));var s=t.layerPointToContainerPoint(n),a=o.point(this.options.autoPanPadding),r=o.point(this.options.autoPanPaddingTopLeft||a),h=o.point(this.options.autoPanPaddingBottomRight||a),l=t.getSize(),u=0,c=0;s.x+i+h.x>l.x&&(u=s.x+i-l.x+h.x),s.x-u-r.x<0&&(u=s.x-r.x),s.y+e+h.y>l.y&&(c=s.y+e-l.y+h.y),s.y-c-r.y<0&&(c=s.y-r.y),(u||c)&&t.fire("autopanstart").panBy([u,c])}},_onCloseButtonClick:function(t){this._close(),o.DomEvent.stop(t)}}),o.popup=function(t,e){return new o.Popup(t,e)},o.Map.include({openPopup:function(t,e,i){if(this.closePopup(),!(t instanceof o.Popup)){var n=t;t=new o.Popup(i).setLatLng(e).setContent(n)}return t._isOpen=!0,this._popup=t,this.addLayer(t)},closePopup:function(t){return t&&t!==this._popup||(t=this._popup,this._popup=null),t&&(this.removeLayer(t),t._isOpen=!1),this}}),o.Marker.include({openPopup:function(){return this._popup&&this._map&&!this._map.hasLayer(this._popup)&&(this._popup.setLatLng(this._latlng),this._map.openPopup(this._popup)),this},closePopup:function(){return this._popup&&this._popup._close(),this},togglePopup:function(){return this._popup&&(this._popup._isOpen?this.closePopup():this.openPopup()),this},bindPopup:function(t,e){var i=o.point(this.options.icon.options.popupAnchor||[0,0]);return i=i.add(o.Popup.prototype.options.offset),e&&e.offset&&(i=i.add(e.offset)),e=o.extend({offset:i},e),this._popupHandlersAdded||(this.on("click",this.togglePopup,this).on("remove",this.closePopup,this).on("move",this._movePopup,this),this._popupHandlersAdded=!0),t instanceof o.Popup?(o.setOptions(t,e),this._popup=t):this._popup=new o.Popup(e,this).setContent(t),this},setPopupContent:function(t){return this._popup&&this._popup.setContent(t),this},unbindPopup:function(){return this._popup&&(this._popup=null,this.off("click",this.togglePopup,this).off("remove",this.closePopup,this).off("move",this._movePopup,this),this._popupHandlersAdded=!1),this},getPopup:function(){return this._popup},_movePopup:function(t){this._popup.setLatLng(t.latlng)}}),o.LayerGroup=o.Class.extend({initialize:function(t){this._layers={};var e,i;if(t)for(e=0,i=t.length;i>e;e++)this.addLayer(t[e])},addLayer:function(t){var e=this.getLayerId(t);return this._layers[e]=t,this._map&&this._map.addLayer(t),this},removeLayer:function(t){var e=t in this._layers?t:this.getLayerId(t);return this._map&&this._layers[e]&&this._map.removeLayer(this._layers[e]),delete this._layers[e],this},hasLayer:function(t){return t?t in this._layers||this.getLayerId(t)in this._layers:!1},clearLayers:function(){return this.eachLayer(this.removeLayer,this),this},invoke:function(t){var e,i,n=Array.prototype.slice.call(arguments,1);for(e in this._layers)i=this._layers[e],i[t]&&i[t].apply(i,n);return this},onAdd:function(t){this._map=t,this.eachLayer(t.addLayer,t)},onRemove:function(t){this.eachLayer(t.removeLayer,t),this._map=null},addTo:function(t){return t.addLayer(this),this},eachLayer:function(t,e){for(var i in this._layers)t.call(e,this._layers[i]);return this},getLayer:function(t){return this._layers[t]},getLayers:function(){var t=[];for(var e in this._layers)t.push(this._layers[e]);return t},setZIndex:function(t){return this.invoke("setZIndex",t)},getLayerId:function(t){return o.stamp(t)}}),o.layerGroup=function(t){return new o.LayerGroup(t)},o.FeatureGroup=o.LayerGroup.extend({includes:o.Mixin.Events,statics:{EVENTS:"click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose"},addLayer:function(t){return this.hasLayer(t)?this:("on"in t&&t.on(o.FeatureGroup.EVENTS,this._propagateEvent,this),o.LayerGroup.prototype.addLayer.call(this,t),this._popupContent&&t.bindPopup&&t.bindPopup(this._popupContent,this._popupOptions),this.fire("layeradd",{layer:t}))},removeLayer:function(t){return this.hasLayer(t)?(t in this._layers&&(t=this._layers[t]),t.off(o.FeatureGroup.EVENTS,this._propagateEvent,this),o.LayerGroup.prototype.removeLayer.call(this,t),this._popupContent&&this.invoke("unbindPopup"),this.fire("layerremove",{layer:t})):this},bindPopup:function(t,e){return this._popupContent=t,this._popupOptions=e,this.invoke("bindPopup",t,e)},openPopup:function(t){for(var e in this._layers){this._layers[e].openPopup(t);break}return this},setStyle:function(t){return this.invoke("setStyle",t)},bringToFront:function(){return this.invoke("bringToFront")},bringToBack:function(){return this.invoke("bringToBack")},getBounds:function(){var t=new o.LatLngBounds;return this.eachLayer(function(e){t.extend(e instanceof o.Marker?e.getLatLng():e.getBounds())}),t},_propagateEvent:function(t){t=o.extend({layer:t.target,target:this},t),this.fire(t.type,t)}}),o.featureGroup=function(t){return new o.FeatureGroup(t)},o.Path=o.Class.extend({includes:[o.Mixin.Events],statics:{CLIP_PADDING:function(){var e=o.Browser.mobile?1280:2e3,i=(e/Math.max(t.outerWidth,t.outerHeight)-1)/2;return Math.max(0,Math.min(.5,i))}()},options:{stroke:!0,color:"#0033ff",dashArray:null,lineCap:null,lineJoin:null,weight:5,opacity:.5,fill:!1,fillColor:null,fillOpacity:.2,clickable:!0},initialize:function(t){o.setOptions(this,t)},onAdd:function(t){this._map=t,this._container||(this._initElements(),this._initEvents()),this.projectLatlngs(),this._updatePath(),this._container&&this._map._pathRoot.appendChild(this._container),this.fire("add"),t.on({viewreset:this.projectLatlngs,moveend:this._updatePath},this)},addTo:function(t){return t.addLayer(this),this},onRemove:function(t){t._pathRoot.removeChild(this._container),this.fire("remove"),this._map=null,o.Browser.vml&&(this._container=null,this._stroke=null,this._fill=null),t.off({viewreset:this.projectLatlngs,moveend:this._updatePath},this)},projectLatlngs:function(){},setStyle:function(t){return o.setOptions(this,t),this._container&&this._updateStyle(),this},redraw:function(){return this._map&&(this.projectLatlngs(),this._updatePath()),this}}),o.Map.include({_updatePathViewport:function(){var t=o.Path.CLIP_PADDING,e=this.getSize(),i=o.DomUtil.getPosition(this._mapPane),n=i.multiplyBy(-1)._subtract(e.multiplyBy(t)._round()),s=n.add(e.multiplyBy(1+2*t)._round());this._pathViewport=new o.Bounds(n,s)}}),o.Path.SVG_NS="http://www.w3.org/2000/svg",o.Browser.svg=!(!e.createElementNS||!e.createElementNS(o.Path.SVG_NS,"svg").createSVGRect),o.Path=o.Path.extend({statics:{SVG:o.Browser.svg},bringToFront:function(){var t=this._map._pathRoot,e=this._container;return e&&t.lastChild!==e&&t.appendChild(e),this},bringToBack:function(){var t=this._map._pathRoot,e=this._container,i=t.firstChild;return e&&i!==e&&t.insertBefore(e,i),this},getPathString:function(){},_createElement:function(t){return e.createElementNS(o.Path.SVG_NS,t)},_initElements:function(){this._map._initPathRoot(),this._initPath(),this._initStyle()},_initPath:function(){this._container=this._createElement("g"),this._path=this._createElement("path"),this.options.className&&o.DomUtil.addClass(this._path,this.options.className),this._container.appendChild(this._path)},_initStyle:function(){this.options.stroke&&(this._path.setAttribute("stroke-linejoin","round"),this._path.setAttribute("stroke-linecap","round")),this.options.fill&&this._path.setAttribute("fill-rule","evenodd"),this.options.pointerEvents&&this._path.setAttribute("pointer-events",this.options.pointerEvents),this.options.clickable||this.options.pointerEvents||this._path.setAttribute("pointer-events","none"),this._updateStyle()},_updateStyle:function(){this.options.stroke?(this._path.setAttribute("stroke",this.options.color),this._path.setAttribute("stroke-opacity",this.options.opacity),this._path.setAttribute("stroke-width",this.options.weight),this.options.dashArray?this._path.setAttribute("stroke-dasharray",this.options.dashArray):this._path.removeAttribute("stroke-dasharray"),this.options.lineCap&&this._path.setAttribute("stroke-linecap",this.options.lineCap),this.options.lineJoin&&this._path.setAttribute("stroke-linejoin",this.options.lineJoin)):this._path.setAttribute("stroke","none"),this.options.fill?(this._path.setAttribute("fill",this.options.fillColor||this.options.color),this._path.setAttribute("fill-opacity",this.options.fillOpacity)):this._path.setAttribute("fill","none")},_updatePath:function(){var t=this.getPathString();t||(t="M0 0"),this._path.setAttribute("d",t)},_initEvents:function(){if(this.options.clickable){(o.Browser.svg||!o.Browser.vml)&&o.DomUtil.addClass(this._path,"leaflet-clickable"),o.DomEvent.on(this._container,"click",this._onMouseClick,this);for(var t=["dblclick","mousedown","mouseover","mouseout","mousemove","contextmenu"],e=0;e<t.length;e++)o.DomEvent.on(this._container,t[e],this._fireMouseEvent,this)}},_onMouseClick:function(t){this._map.dragging&&this._map.dragging.moved()||this._fireMouseEvent(t)},_fireMouseEvent:function(t){if(this.hasEventListeners(t.type)){var e=this._map,i=e.mouseEventToContainerPoint(t),n=e.containerPointToLayerPoint(i),s=e.layerPointToLatLng(n);this.fire(t.type,{latlng:s,layerPoint:n,containerPoint:i,originalEvent:t}),"contextmenu"===t.type&&o.DomEvent.preventDefault(t),"mousemove"!==t.type&&o.DomEvent.stopPropagation(t)}}}),o.Map.include({_initPathRoot:function(){this._pathRoot||(this._pathRoot=o.Path.prototype._createElement("svg"),this._panes.overlayPane.appendChild(this._pathRoot),this.options.zoomAnimation&&o.Browser.any3d?(o.DomUtil.addClass(this._pathRoot,"leaflet-zoom-animated"),this.on({zoomanim:this._animatePathZoom,zoomend:this._endPathZoom})):o.DomUtil.addClass(this._pathRoot,"leaflet-zoom-hide"),this.on("moveend",this._updateSvgViewport),this._updateSvgViewport())
},_animatePathZoom:function(t){var e=this.getZoomScale(t.zoom),i=this._getCenterOffset(t.center)._multiplyBy(-e)._add(this._pathViewport.min);this._pathRoot.style[o.DomUtil.TRANSFORM]=o.DomUtil.getTranslateString(i)+" scale("+e+") ",this._pathZooming=!0},_endPathZoom:function(){this._pathZooming=!1},_updateSvgViewport:function(){if(!this._pathZooming){this._updatePathViewport();var t=this._pathViewport,e=t.min,i=t.max,n=i.x-e.x,s=i.y-e.y,a=this._pathRoot,r=this._panes.overlayPane;o.Browser.mobileWebkit&&r.removeChild(a),o.DomUtil.setPosition(a,e),a.setAttribute("width",n),a.setAttribute("height",s),a.setAttribute("viewBox",[e.x,e.y,n,s].join(" ")),o.Browser.mobileWebkit&&r.appendChild(a)}}}),o.Path.include({bindPopup:function(t,e){return t instanceof o.Popup?this._popup=t:((!this._popup||e)&&(this._popup=new o.Popup(e,this)),this._popup.setContent(t)),this._popupHandlersAdded||(this.on("click",this._openPopup,this).on("remove",this.closePopup,this),this._popupHandlersAdded=!0),this},unbindPopup:function(){return this._popup&&(this._popup=null,this.off("click",this._openPopup).off("remove",this.closePopup),this._popupHandlersAdded=!1),this},openPopup:function(t){return this._popup&&(t=t||this._latlng||this._latlngs[Math.floor(this._latlngs.length/2)],this._openPopup({latlng:t})),this},closePopup:function(){return this._popup&&this._popup._close(),this},_openPopup:function(t){this._popup.setLatLng(t.latlng),this._map.openPopup(this._popup)}}),o.Browser.vml=!o.Browser.svg&&function(){try{var t=e.createElement("div");t.innerHTML='<v:shape adj="1"/>';var i=t.firstChild;return i.style.behavior="url(#default#VML)",i&&"object"==typeof i.adj}catch(n){return!1}}(),o.Path=o.Browser.svg||!o.Browser.vml?o.Path:o.Path.extend({statics:{VML:!0,CLIP_PADDING:.02},_createElement:function(){try{return e.namespaces.add("lvml","urn:schemas-microsoft-com:vml"),function(t){return e.createElement("<lvml:"+t+' class="lvml">')}}catch(t){return function(t){return e.createElement("<"+t+' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')}}}(),_initPath:function(){var t=this._container=this._createElement("shape");o.DomUtil.addClass(t,"leaflet-vml-shape"+(this.options.className?" "+this.options.className:"")),this.options.clickable&&o.DomUtil.addClass(t,"leaflet-clickable"),t.coordsize="1 1",this._path=this._createElement("path"),t.appendChild(this._path),this._map._pathRoot.appendChild(t)},_initStyle:function(){this._updateStyle()},_updateStyle:function(){var t=this._stroke,e=this._fill,i=this.options,n=this._container;n.stroked=i.stroke,n.filled=i.fill,i.stroke?(t||(t=this._stroke=this._createElement("stroke"),t.endcap="round",n.appendChild(t)),t.weight=i.weight+"px",t.color=i.color,t.opacity=i.opacity,t.dashStyle=i.dashArray?o.Util.isArray(i.dashArray)?i.dashArray.join(" "):i.dashArray.replace(/( *, *)/g," "):"",i.lineCap&&(t.endcap=i.lineCap.replace("butt","flat")),i.lineJoin&&(t.joinstyle=i.lineJoin)):t&&(n.removeChild(t),this._stroke=null),i.fill?(e||(e=this._fill=this._createElement("fill"),n.appendChild(e)),e.color=i.fillColor||i.color,e.opacity=i.fillOpacity):e&&(n.removeChild(e),this._fill=null)},_updatePath:function(){var t=this._container.style;t.display="none",this._path.v=this.getPathString()+" ",t.display=""}}),o.Map.include(o.Browser.svg||!o.Browser.vml?{}:{_initPathRoot:function(){if(!this._pathRoot){var t=this._pathRoot=e.createElement("div");t.className="leaflet-vml-container",this._panes.overlayPane.appendChild(t),this.on("moveend",this._updatePathViewport),this._updatePathViewport()}}}),o.Browser.canvas=function(){return!!e.createElement("canvas").getContext}(),o.Path=o.Path.SVG&&!t.L_PREFER_CANVAS||!o.Browser.canvas?o.Path:o.Path.extend({statics:{CANVAS:!0,SVG:!1},redraw:function(){return this._map&&(this.projectLatlngs(),this._requestUpdate()),this},setStyle:function(t){return o.setOptions(this,t),this._map&&(this._updateStyle(),this._requestUpdate()),this},onRemove:function(t){t.off("viewreset",this.projectLatlngs,this).off("moveend",this._updatePath,this),this.options.clickable&&(this._map.off("click",this._onClick,this),this._map.off("mousemove",this._onMouseMove,this)),this._requestUpdate(),this._map=null},_requestUpdate:function(){this._map&&!o.Path._updateRequest&&(o.Path._updateRequest=o.Util.requestAnimFrame(this._fireMapMoveEnd,this._map))},_fireMapMoveEnd:function(){o.Path._updateRequest=null,this.fire("moveend")},_initElements:function(){this._map._initPathRoot(),this._ctx=this._map._canvasCtx},_updateStyle:function(){var t=this.options;t.stroke&&(this._ctx.lineWidth=t.weight,this._ctx.strokeStyle=t.color),t.fill&&(this._ctx.fillStyle=t.fillColor||t.color)},_drawPath:function(){var t,e,i,n,s,a;for(this._ctx.beginPath(),t=0,i=this._parts.length;i>t;t++){for(e=0,n=this._parts[t].length;n>e;e++)s=this._parts[t][e],a=(0===e?"move":"line")+"To",this._ctx[a](s.x,s.y);this instanceof o.Polygon&&this._ctx.closePath()}},_checkIfEmpty:function(){return!this._parts.length},_updatePath:function(){if(!this._checkIfEmpty()){var t=this._ctx,e=this.options;this._drawPath(),t.save(),this._updateStyle(),e.fill&&(t.globalAlpha=e.fillOpacity,t.fill()),e.stroke&&(t.globalAlpha=e.opacity,t.stroke()),t.restore()}},_initEvents:function(){this.options.clickable&&(this._map.on("mousemove",this._onMouseMove,this),this._map.on("click",this._onClick,this))},_onClick:function(t){this._containsPoint(t.layerPoint)&&this.fire("click",t)},_onMouseMove:function(t){this._map&&!this._map._animatingZoom&&(this._containsPoint(t.layerPoint)?(this._ctx.canvas.style.cursor="pointer",this._mouseInside=!0,this.fire("mouseover",t)):this._mouseInside&&(this._ctx.canvas.style.cursor="",this._mouseInside=!1,this.fire("mouseout",t)))}}),o.Map.include(o.Path.SVG&&!t.L_PREFER_CANVAS||!o.Browser.canvas?{}:{_initPathRoot:function(){var t,i=this._pathRoot;i||(i=this._pathRoot=e.createElement("canvas"),i.style.position="absolute",t=this._canvasCtx=i.getContext("2d"),t.lineCap="round",t.lineJoin="round",this._panes.overlayPane.appendChild(i),this.options.zoomAnimation&&(this._pathRoot.className="leaflet-zoom-animated",this.on("zoomanim",this._animatePathZoom),this.on("zoomend",this._endPathZoom)),this.on("moveend",this._updateCanvasViewport),this._updateCanvasViewport())},_updateCanvasViewport:function(){if(!this._pathZooming){this._updatePathViewport();var t=this._pathViewport,e=t.min,i=t.max.subtract(e),n=this._pathRoot;o.DomUtil.setPosition(n,e),n.width=i.x,n.height=i.y,n.getContext("2d").translate(-e.x,-e.y)}}}),o.LineUtil={simplify:function(t,e){if(!e||!t.length)return t.slice();var i=e*e;return t=this._reducePoints(t,i),t=this._simplifyDP(t,i)},pointToSegmentDistance:function(t,e,i){return Math.sqrt(this._sqClosestPointOnSegment(t,e,i,!0))},closestPointOnSegment:function(t,e,i){return this._sqClosestPointOnSegment(t,e,i)},_simplifyDP:function(t,e){var n=t.length,o=typeof Uint8Array!=i+""?Uint8Array:Array,s=new o(n);s[0]=s[n-1]=1,this._simplifyDPStep(t,s,e,0,n-1);var a,r=[];for(a=0;n>a;a++)s[a]&&r.push(t[a]);return r},_simplifyDPStep:function(t,e,i,n,o){var s,a,r,h=0;for(a=n+1;o-1>=a;a++)r=this._sqClosestPointOnSegment(t[a],t[n],t[o],!0),r>h&&(s=a,h=r);h>i&&(e[s]=1,this._simplifyDPStep(t,e,i,n,s),this._simplifyDPStep(t,e,i,s,o))},_reducePoints:function(t,e){for(var i=[t[0]],n=1,o=0,s=t.length;s>n;n++)this._sqDist(t[n],t[o])>e&&(i.push(t[n]),o=n);return s-1>o&&i.push(t[s-1]),i},clipSegment:function(t,e,i,n){var o,s,a,r=n?this._lastCode:this._getBitCode(t,i),h=this._getBitCode(e,i);for(this._lastCode=h;;){if(!(r|h))return[t,e];if(r&h)return!1;o=r||h,s=this._getEdgeIntersection(t,e,o,i),a=this._getBitCode(s,i),o===r?(t=s,r=a):(e=s,h=a)}},_getEdgeIntersection:function(t,e,i,n){var s=e.x-t.x,a=e.y-t.y,r=n.min,h=n.max;return 8&i?new o.Point(t.x+s*(h.y-t.y)/a,h.y):4&i?new o.Point(t.x+s*(r.y-t.y)/a,r.y):2&i?new o.Point(h.x,t.y+a*(h.x-t.x)/s):1&i?new o.Point(r.x,t.y+a*(r.x-t.x)/s):void 0},_getBitCode:function(t,e){var i=0;return t.x<e.min.x?i|=1:t.x>e.max.x&&(i|=2),t.y<e.min.y?i|=4:t.y>e.max.y&&(i|=8),i},_sqDist:function(t,e){var i=e.x-t.x,n=e.y-t.y;return i*i+n*n},_sqClosestPointOnSegment:function(t,e,i,n){var s,a=e.x,r=e.y,h=i.x-a,l=i.y-r,u=h*h+l*l;return u>0&&(s=((t.x-a)*h+(t.y-r)*l)/u,s>1?(a=i.x,r=i.y):s>0&&(a+=h*s,r+=l*s)),h=t.x-a,l=t.y-r,n?h*h+l*l:new o.Point(a,r)}},o.Polyline=o.Path.extend({initialize:function(t,e){o.Path.prototype.initialize.call(this,e),this._latlngs=this._convertLatLngs(t)},options:{smoothFactor:1,noClip:!1},projectLatlngs:function(){this._originalPoints=[];for(var t=0,e=this._latlngs.length;e>t;t++)this._originalPoints[t]=this._map.latLngToLayerPoint(this._latlngs[t])},getPathString:function(){for(var t=0,e=this._parts.length,i="";e>t;t++)i+=this._getPathPartStr(this._parts[t]);return i},getLatLngs:function(){return this._latlngs},setLatLngs:function(t){return this._latlngs=this._convertLatLngs(t),this.redraw()},addLatLng:function(t){return this._latlngs.push(o.latLng(t)),this.redraw()},spliceLatLngs:function(){var t=[].splice.apply(this._latlngs,arguments);return this._convertLatLngs(this._latlngs,!0),this.redraw(),t},closestLayerPoint:function(t){for(var e,i,n=1/0,s=this._parts,a=null,r=0,h=s.length;h>r;r++)for(var l=s[r],u=1,c=l.length;c>u;u++){e=l[u-1],i=l[u];var d=o.LineUtil._sqClosestPointOnSegment(t,e,i,!0);n>d&&(n=d,a=o.LineUtil._sqClosestPointOnSegment(t,e,i))}return a&&(a.distance=Math.sqrt(n)),a},getBounds:function(){return new o.LatLngBounds(this.getLatLngs())},_convertLatLngs:function(t,e){var i,n,s=e?t:[];for(i=0,n=t.length;n>i;i++){if(o.Util.isArray(t[i])&&"number"!=typeof t[i][0])return;s[i]=o.latLng(t[i])}return s},_initEvents:function(){o.Path.prototype._initEvents.call(this)},_getPathPartStr:function(t){for(var e,i=o.Path.VML,n=0,s=t.length,a="";s>n;n++)e=t[n],i&&e._round(),a+=(n?"L":"M")+e.x+" "+e.y;return a},_clipPoints:function(){var t,e,i,n=this._originalPoints,s=n.length;if(this.options.noClip)return void(this._parts=[n]);this._parts=[];var a=this._parts,r=this._map._pathViewport,h=o.LineUtil;for(t=0,e=0;s-1>t;t++)i=h.clipSegment(n[t],n[t+1],r,t),i&&(a[e]=a[e]||[],a[e].push(i[0]),(i[1]!==n[t+1]||t===s-2)&&(a[e].push(i[1]),e++))},_simplifyPoints:function(){for(var t=this._parts,e=o.LineUtil,i=0,n=t.length;n>i;i++)t[i]=e.simplify(t[i],this.options.smoothFactor)},_updatePath:function(){this._map&&(this._clipPoints(),this._simplifyPoints(),o.Path.prototype._updatePath.call(this))}}),o.polyline=function(t,e){return new o.Polyline(t,e)},o.PolyUtil={},o.PolyUtil.clipPolygon=function(t,e){var i,n,s,a,r,h,l,u,c,d=[1,4,2,8],p=o.LineUtil;for(n=0,l=t.length;l>n;n++)t[n]._code=p._getBitCode(t[n],e);for(a=0;4>a;a++){for(u=d[a],i=[],n=0,l=t.length,s=l-1;l>n;s=n++)r=t[n],h=t[s],r._code&u?h._code&u||(c=p._getEdgeIntersection(h,r,u,e),c._code=p._getBitCode(c,e),i.push(c)):(h._code&u&&(c=p._getEdgeIntersection(h,r,u,e),c._code=p._getBitCode(c,e),i.push(c)),i.push(r));t=i}return t},o.Polygon=o.Polyline.extend({options:{fill:!0},initialize:function(t,e){o.Polyline.prototype.initialize.call(this,t,e),this._initWithHoles(t)},_initWithHoles:function(t){var e,i,n;if(t&&o.Util.isArray(t[0])&&"number"!=typeof t[0][0])for(this._latlngs=this._convertLatLngs(t[0]),this._holes=t.slice(1),e=0,i=this._holes.length;i>e;e++)n=this._holes[e]=this._convertLatLngs(this._holes[e]),n[0].equals(n[n.length-1])&&n.pop();t=this._latlngs,t.length>=2&&t[0].equals(t[t.length-1])&&t.pop()},projectLatlngs:function(){if(o.Polyline.prototype.projectLatlngs.call(this),this._holePoints=[],this._holes){var t,e,i,n;for(t=0,i=this._holes.length;i>t;t++)for(this._holePoints[t]=[],e=0,n=this._holes[t].length;n>e;e++)this._holePoints[t][e]=this._map.latLngToLayerPoint(this._holes[t][e])}},setLatLngs:function(t){return t&&o.Util.isArray(t[0])&&"number"!=typeof t[0][0]?(this._initWithHoles(t),this.redraw()):o.Polyline.prototype.setLatLngs.call(this,t)},_clipPoints:function(){var t=this._originalPoints,e=[];if(this._parts=[t].concat(this._holePoints),!this.options.noClip){for(var i=0,n=this._parts.length;n>i;i++){var s=o.PolyUtil.clipPolygon(this._parts[i],this._map._pathViewport);s.length&&e.push(s)}this._parts=e}},_getPathPartStr:function(t){var e=o.Polyline.prototype._getPathPartStr.call(this,t);return e+(o.Browser.svg?"z":"x")}}),o.polygon=function(t,e){return new o.Polygon(t,e)},function(){function t(t){return o.FeatureGroup.extend({initialize:function(t,e){this._layers={},this._options=e,this.setLatLngs(t)},setLatLngs:function(e){var i=0,n=e.length;for(this.eachLayer(function(t){n>i?t.setLatLngs(e[i++]):this.removeLayer(t)},this);n>i;)this.addLayer(new t(e[i++],this._options));return this},getLatLngs:function(){var t=[];return this.eachLayer(function(e){t.push(e.getLatLngs())}),t}})}o.MultiPolyline=t(o.Polyline),o.MultiPolygon=t(o.Polygon),o.multiPolyline=function(t,e){return new o.MultiPolyline(t,e)},o.multiPolygon=function(t,e){return new o.MultiPolygon(t,e)}}(),o.Rectangle=o.Polygon.extend({initialize:function(t,e){o.Polygon.prototype.initialize.call(this,this._boundsToLatLngs(t),e)},setBounds:function(t){this.setLatLngs(this._boundsToLatLngs(t))},_boundsToLatLngs:function(t){return t=o.latLngBounds(t),[t.getSouthWest(),t.getNorthWest(),t.getNorthEast(),t.getSouthEast()]}}),o.rectangle=function(t,e){return new o.Rectangle(t,e)},o.Circle=o.Path.extend({initialize:function(t,e,i){o.Path.prototype.initialize.call(this,i),this._latlng=o.latLng(t),this._mRadius=e},options:{fill:!0},setLatLng:function(t){return this._latlng=o.latLng(t),this.redraw()},setRadius:function(t){return this._mRadius=t,this.redraw()},projectLatlngs:function(){var t=this._getLngRadius(),e=this._latlng,i=this._map.latLngToLayerPoint([e.lat,e.lng-t]);this._point=this._map.latLngToLayerPoint(e),this._radius=Math.max(this._point.x-i.x,1)},getBounds:function(){var t=this._getLngRadius(),e=this._mRadius/40075017*360,i=this._latlng;return new o.LatLngBounds([i.lat-e,i.lng-t],[i.lat+e,i.lng+t])},getLatLng:function(){return this._latlng},getPathString:function(){var t=this._point,e=this._radius;return this._checkIfEmpty()?"":o.Browser.svg?"M"+t.x+","+(t.y-e)+"A"+e+","+e+",0,1,1,"+(t.x-.1)+","+(t.y-e)+" z":(t._round(),e=Math.round(e),"AL "+t.x+","+t.y+" "+e+","+e+" 0,23592600")},getRadius:function(){return this._mRadius},_getLatRadius:function(){return this._mRadius/40075017*360},_getLngRadius:function(){return this._getLatRadius()/Math.cos(o.LatLng.DEG_TO_RAD*this._latlng.lat)},_checkIfEmpty:function(){if(!this._map)return!1;var t=this._map._pathViewport,e=this._radius,i=this._point;return i.x-e>t.max.x||i.y-e>t.max.y||i.x+e<t.min.x||i.y+e<t.min.y}}),o.circle=function(t,e,i){return new o.Circle(t,e,i)},o.CircleMarker=o.Circle.extend({options:{radius:10,weight:2},initialize:function(t,e){o.Circle.prototype.initialize.call(this,t,null,e),this._radius=this.options.radius},projectLatlngs:function(){this._point=this._map.latLngToLayerPoint(this._latlng)},_updateStyle:function(){o.Circle.prototype._updateStyle.call(this),this.setRadius(this.options.radius)},setLatLng:function(t){return o.Circle.prototype.setLatLng.call(this,t),this._popup&&this._popup._isOpen&&this._popup.setLatLng(t),this},setRadius:function(t){return this.options.radius=this._radius=t,this.redraw()},getRadius:function(){return this._radius}}),o.circleMarker=function(t,e){return new o.CircleMarker(t,e)},o.Polyline.include(o.Path.CANVAS?{_containsPoint:function(t,e){var i,n,s,a,r,h,l,u=this.options.weight/2;for(o.Browser.touch&&(u+=10),i=0,a=this._parts.length;a>i;i++)for(l=this._parts[i],n=0,r=l.length,s=r-1;r>n;s=n++)if((e||0!==n)&&(h=o.LineUtil.pointToSegmentDistance(t,l[s],l[n]),u>=h))return!0;return!1}}:{}),o.Polygon.include(o.Path.CANVAS?{_containsPoint:function(t){var e,i,n,s,a,r,h,l,u=!1;if(o.Polyline.prototype._containsPoint.call(this,t,!0))return!0;for(s=0,h=this._parts.length;h>s;s++)for(e=this._parts[s],a=0,l=e.length,r=l-1;l>a;r=a++)i=e[a],n=e[r],i.y>t.y!=n.y>t.y&&t.x<(n.x-i.x)*(t.y-i.y)/(n.y-i.y)+i.x&&(u=!u);return u}}:{}),o.Circle.include(o.Path.CANVAS?{_drawPath:function(){var t=this._point;this._ctx.beginPath(),this._ctx.arc(t.x,t.y,this._radius,0,2*Math.PI,!1)},_containsPoint:function(t){var e=this._point,i=this.options.stroke?this.options.weight/2:0;return t.distanceTo(e)<=this._radius+i}}:{}),o.CircleMarker.include(o.Path.CANVAS?{_updateStyle:function(){o.Path.prototype._updateStyle.call(this)}}:{}),o.GeoJSON=o.FeatureGroup.extend({initialize:function(t,e){o.setOptions(this,e),this._layers={},t&&this.addData(t)},addData:function(t){var e,i,n,s=o.Util.isArray(t)?t:t.features;if(s){for(e=0,i=s.length;i>e;e++)n=s[e],(n.geometries||n.geometry||n.features||n.coordinates)&&this.addData(s[e]);return this}var a=this.options;if(!a.filter||a.filter(t)){var r=o.GeoJSON.geometryToLayer(t,a.pointToLayer,a.coordsToLatLng,a);return r.feature=o.GeoJSON.asFeature(t),r.defaultOptions=r.options,this.resetStyle(r),a.onEachFeature&&a.onEachFeature(t,r),this.addLayer(r)}},resetStyle:function(t){var e=this.options.style;e&&(o.Util.extend(t.options,t.defaultOptions),this._setLayerStyle(t,e))},setStyle:function(t){this.eachLayer(function(e){this._setLayerStyle(e,t)},this)},_setLayerStyle:function(t,e){"function"==typeof e&&(e=e(t.feature)),t.setStyle&&t.setStyle(e)}}),o.extend(o.GeoJSON,{geometryToLayer:function(t,e,i,n){var s,a,r,h,l="Feature"===t.type?t.geometry:t,u=l.coordinates,c=[];switch(i=i||this.coordsToLatLng,l.type){case"Point":return s=i(u),e?e(t,s):new o.Marker(s);case"MultiPoint":for(r=0,h=u.length;h>r;r++)s=i(u[r]),c.push(e?e(t,s):new o.Marker(s));return new o.FeatureGroup(c);case"LineString":return a=this.coordsToLatLngs(u,0,i),new o.Polyline(a,n);case"Polygon":if(2===u.length&&!u[1].length)throw new Error("Invalid GeoJSON object.");return a=this.coordsToLatLngs(u,1,i),new o.Polygon(a,n);case"MultiLineString":return a=this.coordsToLatLngs(u,1,i),new o.MultiPolyline(a,n);case"MultiPolygon":return a=this.coordsToLatLngs(u,2,i),new o.MultiPolygon(a,n);case"GeometryCollection":for(r=0,h=l.geometries.length;h>r;r++)c.push(this.geometryToLayer({geometry:l.geometries[r],type:"Feature",properties:t.properties},e,i,n));return new o.FeatureGroup(c);default:throw new Error("Invalid GeoJSON object.")}},coordsToLatLng:function(t){return new o.LatLng(t[1],t[0],t[2])},coordsToLatLngs:function(t,e,i){var n,o,s,a=[];for(o=0,s=t.length;s>o;o++)n=e?this.coordsToLatLngs(t[o],e-1,i):(i||this.coordsToLatLng)(t[o]),a.push(n);return a},latLngToCoords:function(t){var e=[t.lng,t.lat];return t.alt!==i&&e.push(t.alt),e},latLngsToCoords:function(t){for(var e=[],i=0,n=t.length;n>i;i++)e.push(o.GeoJSON.latLngToCoords(t[i]));return e},getFeature:function(t,e){return t.feature?o.extend({},t.feature,{geometry:e}):o.GeoJSON.asFeature(e)},asFeature:function(t){return"Feature"===t.type?t:{type:"Feature",properties:{},geometry:t}}});var a={toGeoJSON:function(){return o.GeoJSON.getFeature(this,{type:"Point",coordinates:o.GeoJSON.latLngToCoords(this.getLatLng())})}};o.Marker.include(a),o.Circle.include(a),o.CircleMarker.include(a),o.Polyline.include({toGeoJSON:function(){return o.GeoJSON.getFeature(this,{type:"LineString",coordinates:o.GeoJSON.latLngsToCoords(this.getLatLngs())})}}),o.Polygon.include({toGeoJSON:function(){var t,e,i,n=[o.GeoJSON.latLngsToCoords(this.getLatLngs())];if(n[0].push(n[0][0]),this._holes)for(t=0,e=this._holes.length;e>t;t++)i=o.GeoJSON.latLngsToCoords(this._holes[t]),i.push(i[0]),n.push(i);return o.GeoJSON.getFeature(this,{type:"Polygon",coordinates:n})}}),function(){function t(t){return function(){var e=[];return this.eachLayer(function(t){e.push(t.toGeoJSON().geometry.coordinates)}),o.GeoJSON.getFeature(this,{type:t,coordinates:e})}}o.MultiPolyline.include({toGeoJSON:t("MultiLineString")}),o.MultiPolygon.include({toGeoJSON:t("MultiPolygon")}),o.LayerGroup.include({toGeoJSON:function(){var e,i=this.feature&&this.feature.geometry,n=[];if(i&&"MultiPoint"===i.type)return t("MultiPoint").call(this);var s=i&&"GeometryCollection"===i.type;return this.eachLayer(function(t){t.toGeoJSON&&(e=t.toGeoJSON(),n.push(s?e.geometry:o.GeoJSON.asFeature(e)))}),s?o.GeoJSON.getFeature(this,{geometries:n,type:"GeometryCollection"}):{type:"FeatureCollection",features:n}}})}(),o.geoJson=function(t,e){return new o.GeoJSON(t,e)},o.DomEvent={addListener:function(t,e,i,n){var s,a,r,h=o.stamp(i),l="_leaflet_"+e+h;return t[l]?this:(s=function(e){return i.call(n||t,e||o.DomEvent._getEvent())},o.Browser.pointer&&0===e.indexOf("touch")?this.addPointerListener(t,e,s,h):(o.Browser.touch&&"dblclick"===e&&this.addDoubleTapListener&&this.addDoubleTapListener(t,s,h),"addEventListener"in t?"mousewheel"===e?(t.addEventListener("DOMMouseScroll",s,!1),t.addEventListener(e,s,!1)):"mouseenter"===e||"mouseleave"===e?(a=s,r="mouseenter"===e?"mouseover":"mouseout",s=function(e){return o.DomEvent._checkMouse(t,e)?a(e):void 0},t.addEventListener(r,s,!1)):"click"===e&&o.Browser.android?(a=s,s=function(t){return o.DomEvent._filterClick(t,a)},t.addEventListener(e,s,!1)):t.addEventListener(e,s,!1):"attachEvent"in t&&t.attachEvent("on"+e,s),t[l]=s,this))},removeListener:function(t,e,i){var n=o.stamp(i),s="_leaflet_"+e+n,a=t[s];return a?(o.Browser.pointer&&0===e.indexOf("touch")?this.removePointerListener(t,e,n):o.Browser.touch&&"dblclick"===e&&this.removeDoubleTapListener?this.removeDoubleTapListener(t,n):"removeEventListener"in t?"mousewheel"===e?(t.removeEventListener("DOMMouseScroll",a,!1),t.removeEventListener(e,a,!1)):"mouseenter"===e||"mouseleave"===e?t.removeEventListener("mouseenter"===e?"mouseover":"mouseout",a,!1):t.removeEventListener(e,a,!1):"detachEvent"in t&&t.detachEvent("on"+e,a),t[s]=null,this):this},stopPropagation:function(t){return t.stopPropagation?t.stopPropagation():t.cancelBubble=!0,o.DomEvent._skipped(t),this},disableScrollPropagation:function(t){var e=o.DomEvent.stopPropagation;return o.DomEvent.on(t,"mousewheel",e).on(t,"MozMousePixelScroll",e)},disableClickPropagation:function(t){for(var e=o.DomEvent.stopPropagation,i=o.Draggable.START.length-1;i>=0;i--)o.DomEvent.on(t,o.Draggable.START[i],e);return o.DomEvent.on(t,"click",o.DomEvent._fakeStop).on(t,"dblclick",e)},preventDefault:function(t){return t.preventDefault?t.preventDefault():t.returnValue=!1,this},stop:function(t){return o.DomEvent.preventDefault(t).stopPropagation(t)},getMousePosition:function(t,e){if(!e)return new o.Point(t.clientX,t.clientY);var i=e.getBoundingClientRect();return new o.Point(t.clientX-i.left-e.clientLeft,t.clientY-i.top-e.clientTop)},getWheelDelta:function(t){var e=0;return t.wheelDelta&&(e=t.wheelDelta/120),t.detail&&(e=-t.detail/3),e},_skipEvents:{},_fakeStop:function(t){o.DomEvent._skipEvents[t.type]=!0},_skipped:function(t){var e=this._skipEvents[t.type];return this._skipEvents[t.type]=!1,e},_checkMouse:function(t,e){var i=e.relatedTarget;if(!i)return!0;try{for(;i&&i!==t;)i=i.parentNode}catch(n){return!1}return i!==t},_getEvent:function(){var e=t.event;if(!e)for(var i=arguments.callee.caller;i&&(e=i.arguments[0],!e||t.Event!==e.constructor);)i=i.caller;return e},_filterClick:function(t,e){var i=t.timeStamp||t.originalEvent.timeStamp,n=o.DomEvent._lastClick&&i-o.DomEvent._lastClick;return n&&n>100&&1e3>n||t.target._simulatedClick&&!t._simulated?void o.DomEvent.stop(t):(o.DomEvent._lastClick=i,e(t))}},o.DomEvent.on=o.DomEvent.addListener,o.DomEvent.off=o.DomEvent.removeListener,o.Draggable=o.Class.extend({includes:o.Mixin.Events,statics:{START:o.Browser.touch?["touchstart","mousedown"]:["mousedown"],END:{mousedown:"mouseup",touchstart:"touchend",pointerdown:"touchend",MSPointerDown:"touchend"},MOVE:{mousedown:"mousemove",touchstart:"touchmove",pointerdown:"touchmove",MSPointerDown:"touchmove"}},initialize:function(t,e){this._element=t,this._dragStartTarget=e||t},enable:function(){if(!this._enabled){for(var t=o.Draggable.START.length-1;t>=0;t--)o.DomEvent.on(this._dragStartTarget,o.Draggable.START[t],this._onDown,this);this._enabled=!0}},disable:function(){if(this._enabled){for(var t=o.Draggable.START.length-1;t>=0;t--)o.DomEvent.off(this._dragStartTarget,o.Draggable.START[t],this._onDown,this);this._enabled=!1,this._moved=!1}},_onDown:function(t){if(this._moved=!1,!(t.shiftKey||1!==t.which&&1!==t.button&&!t.touches||(o.DomEvent.stopPropagation(t),o.Draggable._disabled||(o.DomUtil.disableImageDrag(),o.DomUtil.disableTextSelection(),this._moving)))){var i=t.touches?t.touches[0]:t;this._startPoint=new o.Point(i.clientX,i.clientY),this._startPos=this._newPos=o.DomUtil.getPosition(this._element),o.DomEvent.on(e,o.Draggable.MOVE[t.type],this._onMove,this).on(e,o.Draggable.END[t.type],this._onUp,this)}},_onMove:function(t){if(t.touches&&t.touches.length>1)return void(this._moved=!0);var i=t.touches&&1===t.touches.length?t.touches[0]:t,n=new o.Point(i.clientX,i.clientY),s=n.subtract(this._startPoint);(s.x||s.y)&&(o.DomEvent.preventDefault(t),this._moved||(this.fire("dragstart"),this._moved=!0,this._startPos=o.DomUtil.getPosition(this._element).subtract(s),o.DomUtil.addClass(e.body,"leaflet-dragging"),o.DomUtil.addClass(t.target||t.srcElement,"leaflet-drag-target")),this._newPos=this._startPos.add(s),this._moving=!0,o.Util.cancelAnimFrame(this._animRequest),this._animRequest=o.Util.requestAnimFrame(this._updatePosition,this,!0,this._dragStartTarget))},_updatePosition:function(){this.fire("predrag"),o.DomUtil.setPosition(this._element,this._newPos),this.fire("drag")},_onUp:function(t){o.DomUtil.removeClass(e.body,"leaflet-dragging"),o.DomUtil.removeClass(t.target||t.srcElement,"leaflet-drag-target");for(var i in o.Draggable.MOVE)o.DomEvent.off(e,o.Draggable.MOVE[i],this._onMove).off(e,o.Draggable.END[i],this._onUp);o.DomUtil.enableImageDrag(),o.DomUtil.enableTextSelection(),this._moved&&this._moving&&(o.Util.cancelAnimFrame(this._animRequest),this.fire("dragend",{distance:this._newPos.distanceTo(this._startPos)})),this._moving=!1}}),o.Handler=o.Class.extend({initialize:function(t){this._map=t},enable:function(){this._enabled||(this._enabled=!0,this.addHooks())},disable:function(){this._enabled&&(this._enabled=!1,this.removeHooks())},enabled:function(){return!!this._enabled}}),o.Map.mergeOptions({dragging:!0,inertia:!o.Browser.android23,inertiaDeceleration:3400,inertiaMaxSpeed:1/0,inertiaThreshold:o.Browser.touch?32:18,easeLinearity:.25,worldCopyJump:!1}),o.Map.Drag=o.Handler.extend({addHooks:function(){if(!this._draggable){var t=this._map;this._draggable=new o.Draggable(t._mapPane,t._container),this._draggable.on({dragstart:this._onDragStart,drag:this._onDrag,dragend:this._onDragEnd},this),t.options.worldCopyJump&&(this._draggable.on("predrag",this._onPreDrag,this),t.on("viewreset",this._onViewReset,this),t.whenReady(this._onViewReset,this))}this._draggable.enable()},removeHooks:function(){this._draggable.disable()},moved:function(){return this._draggable&&this._draggable._moved},_onDragStart:function(){var t=this._map;t._panAnim&&t._panAnim.stop(),t.fire("movestart").fire("dragstart"),t.options.inertia&&(this._positions=[],this._times=[])},_onDrag:function(){if(this._map.options.inertia){var t=this._lastTime=+new Date,e=this._lastPos=this._draggable._newPos;this._positions.push(e),this._times.push(t),t-this._times[0]>200&&(this._positions.shift(),this._times.shift())}this._map.fire("move").fire("drag")},_onViewReset:function(){var t=this._map.getSize()._divideBy(2),e=this._map.latLngToLayerPoint([0,0]);this._initialWorldOffset=e.subtract(t).x,this._worldWidth=this._map.project([0,180]).x},_onPreDrag:function(){var t=this._worldWidth,e=Math.round(t/2),i=this._initialWorldOffset,n=this._draggable._newPos.x,o=(n-e+i)%t+e-i,s=(n+e+i)%t-e-i,a=Math.abs(o+i)<Math.abs(s+i)?o:s;this._draggable._newPos.x=a},_onDragEnd:function(t){var e=this._map,i=e.options,n=+new Date-this._lastTime,s=!i.inertia||n>i.inertiaThreshold||!this._positions[0];if(e.fire("dragend",t),s)e.fire("moveend");else{var a=this._lastPos.subtract(this._positions[0]),r=(this._lastTime+n-this._times[0])/1e3,h=i.easeLinearity,l=a.multiplyBy(h/r),u=l.distanceTo([0,0]),c=Math.min(i.inertiaMaxSpeed,u),d=l.multiplyBy(c/u),p=c/(i.inertiaDeceleration*h),_=d.multiplyBy(-p/2).round();_.x&&_.y?(_=e._limitOffset(_,e.options.maxBounds),o.Util.requestAnimFrame(function(){e.panBy(_,{duration:p,easeLinearity:h,noMoveStart:!0})})):e.fire("moveend")}}}),o.Map.addInitHook("addHandler","dragging",o.Map.Drag),o.Map.mergeOptions({doubleClickZoom:!0}),o.Map.DoubleClickZoom=o.Handler.extend({addHooks:function(){this._map.on("dblclick",this._onDoubleClick,this)},removeHooks:function(){this._map.off("dblclick",this._onDoubleClick,this)},_onDoubleClick:function(t){var e=this._map,i=e.getZoom()+(t.originalEvent.shiftKey?-1:1);"center"===e.options.doubleClickZoom?e.setZoom(i):e.setZoomAround(t.containerPoint,i)}}),o.Map.addInitHook("addHandler","doubleClickZoom",o.Map.DoubleClickZoom),o.Map.mergeOptions({scrollWheelZoom:!0}),o.Map.ScrollWheelZoom=o.Handler.extend({addHooks:function(){o.DomEvent.on(this._map._container,"mousewheel",this._onWheelScroll,this),o.DomEvent.on(this._map._container,"MozMousePixelScroll",o.DomEvent.preventDefault),this._delta=0},removeHooks:function(){o.DomEvent.off(this._map._container,"mousewheel",this._onWheelScroll),o.DomEvent.off(this._map._container,"MozMousePixelScroll",o.DomEvent.preventDefault)},_onWheelScroll:function(t){var e=o.DomEvent.getWheelDelta(t);this._delta+=e,this._lastMousePos=this._map.mouseEventToContainerPoint(t),this._startTime||(this._startTime=+new Date);var i=Math.max(40-(+new Date-this._startTime),0);clearTimeout(this._timer),this._timer=setTimeout(o.bind(this._performZoom,this),i),o.DomEvent.preventDefault(t),o.DomEvent.stopPropagation(t)},_performZoom:function(){var t=this._map,e=this._delta,i=t.getZoom();e=e>0?Math.ceil(e):Math.floor(e),e=Math.max(Math.min(e,4),-4),e=t._limitZoom(i+e)-i,this._delta=0,this._startTime=null,e&&("center"===t.options.scrollWheelZoom?t.setZoom(i+e):t.setZoomAround(this._lastMousePos,i+e))}}),o.Map.addInitHook("addHandler","scrollWheelZoom",o.Map.ScrollWheelZoom),o.extend(o.DomEvent,{_touchstart:o.Browser.msPointer?"MSPointerDown":o.Browser.pointer?"pointerdown":"touchstart",_touchend:o.Browser.msPointer?"MSPointerUp":o.Browser.pointer?"pointerup":"touchend",addDoubleTapListener:function(t,i,n){function s(t){var e;if(o.Browser.pointer?(_.push(t.pointerId),e=_.length):e=t.touches.length,!(e>1)){var i=Date.now(),n=i-(r||i);h=t.touches?t.touches[0]:t,l=n>0&&u>=n,r=i}}function a(t){if(o.Browser.pointer){var e=_.indexOf(t.pointerId);if(-1===e)return;_.splice(e,1)}if(l){if(o.Browser.pointer){var n,s={};for(var a in h)n=h[a],s[a]="function"==typeof n?n.bind(h):n;h=s}h.type="dblclick",i(h),r=null}}var r,h,l=!1,u=250,c="_leaflet_",d=this._touchstart,p=this._touchend,_=[];t[c+d+n]=s,t[c+p+n]=a;var m=o.Browser.pointer?e.documentElement:t;return t.addEventListener(d,s,!1),m.addEventListener(p,a,!1),o.Browser.pointer&&m.addEventListener(o.DomEvent.POINTER_CANCEL,a,!1),this},removeDoubleTapListener:function(t,i){var n="_leaflet_";return t.removeEventListener(this._touchstart,t[n+this._touchstart+i],!1),(o.Browser.pointer?e.documentElement:t).removeEventListener(this._touchend,t[n+this._touchend+i],!1),o.Browser.pointer&&e.documentElement.removeEventListener(o.DomEvent.POINTER_CANCEL,t[n+this._touchend+i],!1),this}}),o.extend(o.DomEvent,{POINTER_DOWN:o.Browser.msPointer?"MSPointerDown":"pointerdown",POINTER_MOVE:o.Browser.msPointer?"MSPointerMove":"pointermove",POINTER_UP:o.Browser.msPointer?"MSPointerUp":"pointerup",POINTER_CANCEL:o.Browser.msPointer?"MSPointerCancel":"pointercancel",_pointers:[],_pointerDocumentListener:!1,addPointerListener:function(t,e,i,n){switch(e){case"touchstart":return this.addPointerListenerStart(t,e,i,n);case"touchend":return this.addPointerListenerEnd(t,e,i,n);case"touchmove":return this.addPointerListenerMove(t,e,i,n);default:throw"Unknown touch event type"}},addPointerListenerStart:function(t,i,n,s){var a="_leaflet_",r=this._pointers,h=function(t){o.DomEvent.preventDefault(t);for(var e=!1,i=0;i<r.length;i++)if(r[i].pointerId===t.pointerId){e=!0;break}e||r.push(t),t.touches=r.slice(),t.changedTouches=[t],n(t)};if(t[a+"touchstart"+s]=h,t.addEventListener(this.POINTER_DOWN,h,!1),!this._pointerDocumentListener){var l=function(t){for(var e=0;e<r.length;e++)if(r[e].pointerId===t.pointerId){r.splice(e,1);
break}};e.documentElement.addEventListener(this.POINTER_UP,l,!1),e.documentElement.addEventListener(this.POINTER_CANCEL,l,!1),this._pointerDocumentListener=!0}return this},addPointerListenerMove:function(t,e,i,n){function o(t){if(t.pointerType!==t.MSPOINTER_TYPE_MOUSE&&"mouse"!==t.pointerType||0!==t.buttons){for(var e=0;e<a.length;e++)if(a[e].pointerId===t.pointerId){a[e]=t;break}t.touches=a.slice(),t.changedTouches=[t],i(t)}}var s="_leaflet_",a=this._pointers;return t[s+"touchmove"+n]=o,t.addEventListener(this.POINTER_MOVE,o,!1),this},addPointerListenerEnd:function(t,e,i,n){var o="_leaflet_",s=this._pointers,a=function(t){for(var e=0;e<s.length;e++)if(s[e].pointerId===t.pointerId){s.splice(e,1);break}t.touches=s.slice(),t.changedTouches=[t],i(t)};return t[o+"touchend"+n]=a,t.addEventListener(this.POINTER_UP,a,!1),t.addEventListener(this.POINTER_CANCEL,a,!1),this},removePointerListener:function(t,e,i){var n="_leaflet_",o=t[n+e+i];switch(e){case"touchstart":t.removeEventListener(this.POINTER_DOWN,o,!1);break;case"touchmove":t.removeEventListener(this.POINTER_MOVE,o,!1);break;case"touchend":t.removeEventListener(this.POINTER_UP,o,!1),t.removeEventListener(this.POINTER_CANCEL,o,!1)}return this}}),o.Map.mergeOptions({touchZoom:o.Browser.touch&&!o.Browser.android23,bounceAtZoomLimits:!0}),o.Map.TouchZoom=o.Handler.extend({addHooks:function(){o.DomEvent.on(this._map._container,"touchstart",this._onTouchStart,this)},removeHooks:function(){o.DomEvent.off(this._map._container,"touchstart",this._onTouchStart,this)},_onTouchStart:function(t){var i=this._map;if(t.touches&&2===t.touches.length&&!i._animatingZoom&&!this._zooming){var n=i.mouseEventToLayerPoint(t.touches[0]),s=i.mouseEventToLayerPoint(t.touches[1]),a=i._getCenterLayerPoint();this._startCenter=n.add(s)._divideBy(2),this._startDist=n.distanceTo(s),this._moved=!1,this._zooming=!0,this._centerOffset=a.subtract(this._startCenter),i._panAnim&&i._panAnim.stop(),o.DomEvent.on(e,"touchmove",this._onTouchMove,this).on(e,"touchend",this._onTouchEnd,this),o.DomEvent.preventDefault(t)}},_onTouchMove:function(t){var e=this._map;if(t.touches&&2===t.touches.length&&this._zooming){var i=e.mouseEventToLayerPoint(t.touches[0]),n=e.mouseEventToLayerPoint(t.touches[1]);this._scale=i.distanceTo(n)/this._startDist,this._delta=i._add(n)._divideBy(2)._subtract(this._startCenter),1!==this._scale&&(e.options.bounceAtZoomLimits||!(e.getZoom()===e.getMinZoom()&&this._scale<1||e.getZoom()===e.getMaxZoom()&&this._scale>1))&&(this._moved||(o.DomUtil.addClass(e._mapPane,"leaflet-touching"),e.fire("movestart").fire("zoomstart"),this._moved=!0),o.Util.cancelAnimFrame(this._animRequest),this._animRequest=o.Util.requestAnimFrame(this._updateOnMove,this,!0,this._map._container),o.DomEvent.preventDefault(t))}},_updateOnMove:function(){var t=this._map,e=this._getScaleOrigin(),i=t.layerPointToLatLng(e),n=t.getScaleZoom(this._scale);t._animateZoom(i,n,this._startCenter,this._scale,this._delta)},_onTouchEnd:function(){if(!this._moved||!this._zooming)return void(this._zooming=!1);var t=this._map;this._zooming=!1,o.DomUtil.removeClass(t._mapPane,"leaflet-touching"),o.Util.cancelAnimFrame(this._animRequest),o.DomEvent.off(e,"touchmove",this._onTouchMove).off(e,"touchend",this._onTouchEnd);var i=this._getScaleOrigin(),n=t.layerPointToLatLng(i),s=t.getZoom(),a=t.getScaleZoom(this._scale)-s,r=a>0?Math.ceil(a):Math.floor(a),h=t._limitZoom(s+r),l=t.getZoomScale(h)/this._scale;t._animateZoom(n,h,i,l)},_getScaleOrigin:function(){var t=this._centerOffset.subtract(this._delta).divideBy(this._scale);return this._startCenter.add(t)}}),o.Map.addInitHook("addHandler","touchZoom",o.Map.TouchZoom),o.Map.mergeOptions({tap:!0,tapTolerance:15}),o.Map.Tap=o.Handler.extend({addHooks:function(){o.DomEvent.on(this._map._container,"touchstart",this._onDown,this)},removeHooks:function(){o.DomEvent.off(this._map._container,"touchstart",this._onDown,this)},_onDown:function(t){if(t.touches){if(o.DomEvent.preventDefault(t),this._fireClick=!0,t.touches.length>1)return this._fireClick=!1,void clearTimeout(this._holdTimeout);var i=t.touches[0],n=i.target;this._startPos=this._newPos=new o.Point(i.clientX,i.clientY),n.tagName&&"a"===n.tagName.toLowerCase()&&o.DomUtil.addClass(n,"leaflet-active"),this._holdTimeout=setTimeout(o.bind(function(){this._isTapValid()&&(this._fireClick=!1,this._onUp(),this._simulateEvent("contextmenu",i))},this),1e3),o.DomEvent.on(e,"touchmove",this._onMove,this).on(e,"touchend",this._onUp,this)}},_onUp:function(t){if(clearTimeout(this._holdTimeout),o.DomEvent.off(e,"touchmove",this._onMove,this).off(e,"touchend",this._onUp,this),this._fireClick&&t&&t.changedTouches){var i=t.changedTouches[0],n=i.target;n&&n.tagName&&"a"===n.tagName.toLowerCase()&&o.DomUtil.removeClass(n,"leaflet-active"),this._isTapValid()&&this._simulateEvent("click",i)}},_isTapValid:function(){return this._newPos.distanceTo(this._startPos)<=this._map.options.tapTolerance},_onMove:function(t){var e=t.touches[0];this._newPos=new o.Point(e.clientX,e.clientY)},_simulateEvent:function(i,n){var o=e.createEvent("MouseEvents");o._simulated=!0,n.target._simulatedClick=!0,o.initMouseEvent(i,!0,!0,t,1,n.screenX,n.screenY,n.clientX,n.clientY,!1,!1,!1,!1,0,null),n.target.dispatchEvent(o)}}),o.Browser.touch&&!o.Browser.pointer&&o.Map.addInitHook("addHandler","tap",o.Map.Tap),o.Map.mergeOptions({boxZoom:!0}),o.Map.BoxZoom=o.Handler.extend({initialize:function(t){this._map=t,this._container=t._container,this._pane=t._panes.overlayPane,this._moved=!1},addHooks:function(){o.DomEvent.on(this._container,"mousedown",this._onMouseDown,this)},removeHooks:function(){o.DomEvent.off(this._container,"mousedown",this._onMouseDown),this._moved=!1},moved:function(){return this._moved},_onMouseDown:function(t){return this._moved=!1,!t.shiftKey||1!==t.which&&1!==t.button?!1:(o.DomUtil.disableTextSelection(),o.DomUtil.disableImageDrag(),this._startLayerPoint=this._map.mouseEventToLayerPoint(t),void o.DomEvent.on(e,"mousemove",this._onMouseMove,this).on(e,"mouseup",this._onMouseUp,this).on(e,"keydown",this._onKeyDown,this))},_onMouseMove:function(t){this._moved||(this._box=o.DomUtil.create("div","leaflet-zoom-box",this._pane),o.DomUtil.setPosition(this._box,this._startLayerPoint),this._container.style.cursor="crosshair",this._map.fire("boxzoomstart"));var e=this._startLayerPoint,i=this._box,n=this._map.mouseEventToLayerPoint(t),s=n.subtract(e),a=new o.Point(Math.min(n.x,e.x),Math.min(n.y,e.y));o.DomUtil.setPosition(i,a),this._moved=!0,i.style.width=Math.max(0,Math.abs(s.x)-4)+"px",i.style.height=Math.max(0,Math.abs(s.y)-4)+"px"},_finish:function(){this._moved&&(this._pane.removeChild(this._box),this._container.style.cursor=""),o.DomUtil.enableTextSelection(),o.DomUtil.enableImageDrag(),o.DomEvent.off(e,"mousemove",this._onMouseMove).off(e,"mouseup",this._onMouseUp).off(e,"keydown",this._onKeyDown)},_onMouseUp:function(t){this._finish();var e=this._map,i=e.mouseEventToLayerPoint(t);if(!this._startLayerPoint.equals(i)){var n=new o.LatLngBounds(e.layerPointToLatLng(this._startLayerPoint),e.layerPointToLatLng(i));e.fitBounds(n),e.fire("boxzoomend",{boxZoomBounds:n})}},_onKeyDown:function(t){27===t.keyCode&&this._finish()}}),o.Map.addInitHook("addHandler","boxZoom",o.Map.BoxZoom),o.Map.mergeOptions({keyboard:!0,keyboardPanOffset:80,keyboardZoomOffset:1}),o.Map.Keyboard=o.Handler.extend({keyCodes:{left:[37],right:[39],down:[40],up:[38],zoomIn:[187,107,61,171],zoomOut:[189,109,173]},initialize:function(t){this._map=t,this._setPanOffset(t.options.keyboardPanOffset),this._setZoomOffset(t.options.keyboardZoomOffset)},addHooks:function(){var t=this._map._container;-1===t.tabIndex&&(t.tabIndex="0"),o.DomEvent.on(t,"focus",this._onFocus,this).on(t,"blur",this._onBlur,this).on(t,"mousedown",this._onMouseDown,this),this._map.on("focus",this._addHooks,this).on("blur",this._removeHooks,this)},removeHooks:function(){this._removeHooks();var t=this._map._container;o.DomEvent.off(t,"focus",this._onFocus,this).off(t,"blur",this._onBlur,this).off(t,"mousedown",this._onMouseDown,this),this._map.off("focus",this._addHooks,this).off("blur",this._removeHooks,this)},_onMouseDown:function(){if(!this._focused){var i=e.body,n=e.documentElement,o=i.scrollTop||n.scrollTop,s=i.scrollLeft||n.scrollLeft;this._map._container.focus(),t.scrollTo(s,o)}},_onFocus:function(){this._focused=!0,this._map.fire("focus")},_onBlur:function(){this._focused=!1,this._map.fire("blur")},_setPanOffset:function(t){var e,i,n=this._panKeys={},o=this.keyCodes;for(e=0,i=o.left.length;i>e;e++)n[o.left[e]]=[-1*t,0];for(e=0,i=o.right.length;i>e;e++)n[o.right[e]]=[t,0];for(e=0,i=o.down.length;i>e;e++)n[o.down[e]]=[0,t];for(e=0,i=o.up.length;i>e;e++)n[o.up[e]]=[0,-1*t]},_setZoomOffset:function(t){var e,i,n=this._zoomKeys={},o=this.keyCodes;for(e=0,i=o.zoomIn.length;i>e;e++)n[o.zoomIn[e]]=t;for(e=0,i=o.zoomOut.length;i>e;e++)n[o.zoomOut[e]]=-t},_addHooks:function(){o.DomEvent.on(e,"keydown",this._onKeyDown,this)},_removeHooks:function(){o.DomEvent.off(e,"keydown",this._onKeyDown,this)},_onKeyDown:function(t){var e=t.keyCode,i=this._map;if(e in this._panKeys){if(i._panAnim&&i._panAnim._inProgress)return;i.panBy(this._panKeys[e]),i.options.maxBounds&&i.panInsideBounds(i.options.maxBounds)}else{if(!(e in this._zoomKeys))return;i.setZoom(i.getZoom()+this._zoomKeys[e])}o.DomEvent.stop(t)}}),o.Map.addInitHook("addHandler","keyboard",o.Map.Keyboard),o.Handler.MarkerDrag=o.Handler.extend({initialize:function(t){this._marker=t},addHooks:function(){var t=this._marker._icon;this._draggable||(this._draggable=new o.Draggable(t,t)),this._draggable.on("dragstart",this._onDragStart,this).on("drag",this._onDrag,this).on("dragend",this._onDragEnd,this),this._draggable.enable(),o.DomUtil.addClass(this._marker._icon,"leaflet-marker-draggable")},removeHooks:function(){this._draggable.off("dragstart",this._onDragStart,this).off("drag",this._onDrag,this).off("dragend",this._onDragEnd,this),this._draggable.disable(),o.DomUtil.removeClass(this._marker._icon,"leaflet-marker-draggable")},moved:function(){return this._draggable&&this._draggable._moved},_onDragStart:function(){this._marker.closePopup().fire("movestart").fire("dragstart")},_onDrag:function(){var t=this._marker,e=t._shadow,i=o.DomUtil.getPosition(t._icon),n=t._map.layerPointToLatLng(i);e&&o.DomUtil.setPosition(e,i),t._latlng=n,t.fire("move",{latlng:n}).fire("drag")},_onDragEnd:function(t){this._marker.fire("moveend").fire("dragend",t)}}),o.Control=o.Class.extend({options:{position:"topright"},initialize:function(t){o.setOptions(this,t)},getPosition:function(){return this.options.position},setPosition:function(t){var e=this._map;return e&&e.removeControl(this),this.options.position=t,e&&e.addControl(this),this},getContainer:function(){return this._container},addTo:function(t){this._map=t;var e=this._container=this.onAdd(t),i=this.getPosition(),n=t._controlCorners[i];return o.DomUtil.addClass(e,"leaflet-control"),-1!==i.indexOf("bottom")?n.insertBefore(e,n.firstChild):n.appendChild(e),this},removeFrom:function(t){var e=this.getPosition(),i=t._controlCorners[e];return i.removeChild(this._container),this._map=null,this.onRemove&&this.onRemove(t),this},_refocusOnMap:function(){this._map&&this._map.getContainer().focus()}}),o.control=function(t){return new o.Control(t)},o.Map.include({addControl:function(t){return t.addTo(this),this},removeControl:function(t){return t.removeFrom(this),this},_initControlPos:function(){function t(t,s){var a=i+t+" "+i+s;e[t+s]=o.DomUtil.create("div",a,n)}var e=this._controlCorners={},i="leaflet-",n=this._controlContainer=o.DomUtil.create("div",i+"control-container",this._container);t("top","left"),t("top","right"),t("bottom","left"),t("bottom","right")},_clearControlPos:function(){this._container.removeChild(this._controlContainer)}}),o.Control.Zoom=o.Control.extend({options:{position:"topleft",zoomInText:"+",zoomInTitle:"Zoom in",zoomOutText:"-",zoomOutTitle:"Zoom out"},onAdd:function(t){var e="leaflet-control-zoom",i=o.DomUtil.create("div",e+" leaflet-bar");return this._map=t,this._zoomInButton=this._createButton(this.options.zoomInText,this.options.zoomInTitle,e+"-in",i,this._zoomIn,this),this._zoomOutButton=this._createButton(this.options.zoomOutText,this.options.zoomOutTitle,e+"-out",i,this._zoomOut,this),this._updateDisabled(),t.on("zoomend zoomlevelschange",this._updateDisabled,this),i},onRemove:function(t){t.off("zoomend zoomlevelschange",this._updateDisabled,this)},_zoomIn:function(t){this._map.zoomIn(t.shiftKey?3:1)},_zoomOut:function(t){this._map.zoomOut(t.shiftKey?3:1)},_createButton:function(t,e,i,n,s,a){var r=o.DomUtil.create("a",i,n);r.innerHTML=t,r.href="#",r.title=e;var h=o.DomEvent.stopPropagation;return o.DomEvent.on(r,"click",h).on(r,"mousedown",h).on(r,"dblclick",h).on(r,"click",o.DomEvent.preventDefault).on(r,"click",s,a).on(r,"click",this._refocusOnMap,a),r},_updateDisabled:function(){var t=this._map,e="leaflet-disabled";o.DomUtil.removeClass(this._zoomInButton,e),o.DomUtil.removeClass(this._zoomOutButton,e),t._zoom===t.getMinZoom()&&o.DomUtil.addClass(this._zoomOutButton,e),t._zoom===t.getMaxZoom()&&o.DomUtil.addClass(this._zoomInButton,e)}}),o.Map.mergeOptions({zoomControl:!0}),o.Map.addInitHook(function(){this.options.zoomControl&&(this.zoomControl=new o.Control.Zoom,this.addControl(this.zoomControl))}),o.control.zoom=function(t){return new o.Control.Zoom(t)},o.Control.Attribution=o.Control.extend({options:{position:"bottomright",prefix:'<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'},initialize:function(t){o.setOptions(this,t),this._attributions={}},onAdd:function(t){this._container=o.DomUtil.create("div","leaflet-control-attribution"),o.DomEvent.disableClickPropagation(this._container);for(var e in t._layers)t._layers[e].getAttribution&&this.addAttribution(t._layers[e].getAttribution());return t.on("layeradd",this._onLayerAdd,this).on("layerremove",this._onLayerRemove,this),this._update(),this._container},onRemove:function(t){t.off("layeradd",this._onLayerAdd).off("layerremove",this._onLayerRemove)},setPrefix:function(t){return this.options.prefix=t,this._update(),this},addAttribution:function(t){return t?(this._attributions[t]||(this._attributions[t]=0),this._attributions[t]++,this._update(),this):void 0},removeAttribution:function(t){return t?(this._attributions[t]&&(this._attributions[t]--,this._update()),this):void 0},_update:function(){if(this._map){var t=[];for(var e in this._attributions)this._attributions[e]&&t.push(e);var i=[];this.options.prefix&&i.push(this.options.prefix),t.length&&i.push(t.join(", ")),this._container.innerHTML=i.join(" | ")}},_onLayerAdd:function(t){t.layer.getAttribution&&this.addAttribution(t.layer.getAttribution())},_onLayerRemove:function(t){t.layer.getAttribution&&this.removeAttribution(t.layer.getAttribution())}}),o.Map.mergeOptions({attributionControl:!0}),o.Map.addInitHook(function(){this.options.attributionControl&&(this.attributionControl=(new o.Control.Attribution).addTo(this))}),o.control.attribution=function(t){return new o.Control.Attribution(t)},o.Control.Scale=o.Control.extend({options:{position:"bottomleft",maxWidth:100,metric:!0,imperial:!0,updateWhenIdle:!1},onAdd:function(t){this._map=t;var e="leaflet-control-scale",i=o.DomUtil.create("div",e),n=this.options;return this._addScales(n,e,i),t.on(n.updateWhenIdle?"moveend":"move",this._update,this),t.whenReady(this._update,this),i},onRemove:function(t){t.off(this.options.updateWhenIdle?"moveend":"move",this._update,this)},_addScales:function(t,e,i){t.metric&&(this._mScale=o.DomUtil.create("div",e+"-line",i)),t.imperial&&(this._iScale=o.DomUtil.create("div",e+"-line",i))},_update:function(){var t=this._map.getBounds(),e=t.getCenter().lat,i=6378137*Math.PI*Math.cos(e*Math.PI/180),n=i*(t.getNorthEast().lng-t.getSouthWest().lng)/180,o=this._map.getSize(),s=this.options,a=0;o.x>0&&(a=n*(s.maxWidth/o.x)),this._updateScales(s,a)},_updateScales:function(t,e){t.metric&&e&&this._updateMetric(e),t.imperial&&e&&this._updateImperial(e)},_updateMetric:function(t){var e=this._getRoundNum(t);this._mScale.style.width=this._getScaleWidth(e/t)+"px",this._mScale.innerHTML=1e3>e?e+" m":e/1e3+" km"},_updateImperial:function(t){var e,i,n,o=3.2808399*t,s=this._iScale;o>5280?(e=o/5280,i=this._getRoundNum(e),s.style.width=this._getScaleWidth(i/e)+"px",s.innerHTML=i+" mi"):(n=this._getRoundNum(o),s.style.width=this._getScaleWidth(n/o)+"px",s.innerHTML=n+" ft")},_getScaleWidth:function(t){return Math.round(this.options.maxWidth*t)-10},_getRoundNum:function(t){var e=Math.pow(10,(Math.floor(t)+"").length-1),i=t/e;return i=i>=10?10:i>=5?5:i>=3?3:i>=2?2:1,e*i}}),o.control.scale=function(t){return new o.Control.Scale(t)},o.Control.Layers=o.Control.extend({options:{collapsed:!0,position:"topright",autoZIndex:!0},initialize:function(t,e,i){o.setOptions(this,i),this._layers={},this._lastZIndex=0,this._handlingClick=!1;for(var n in t)this._addLayer(t[n],n);for(n in e)this._addLayer(e[n],n,!0)},onAdd:function(t){return this._initLayout(),this._update(),t.on("layeradd",this._onLayerChange,this).on("layerremove",this._onLayerChange,this),this._container},onRemove:function(t){t.off("layeradd",this._onLayerChange).off("layerremove",this._onLayerChange)},addBaseLayer:function(t,e){return this._addLayer(t,e),this._update(),this},addOverlay:function(t,e){return this._addLayer(t,e,!0),this._update(),this},removeLayer:function(t){var e=o.stamp(t);return delete this._layers[e],this._update(),this},_initLayout:function(){var t="leaflet-control-layers",e=this._container=o.DomUtil.create("div",t);e.setAttribute("aria-haspopup",!0),o.Browser.touch?o.DomEvent.on(e,"click",o.DomEvent.stopPropagation):o.DomEvent.disableClickPropagation(e).disableScrollPropagation(e);var i=this._form=o.DomUtil.create("form",t+"-list");if(this.options.collapsed){o.Browser.android||o.DomEvent.on(e,"mouseover",this._expand,this).on(e,"mouseout",this._collapse,this);var n=this._layersLink=o.DomUtil.create("a",t+"-toggle",e);n.href="#",n.title="Layers",o.Browser.touch?o.DomEvent.on(n,"click",o.DomEvent.stop).on(n,"click",this._expand,this):o.DomEvent.on(n,"focus",this._expand,this),o.DomEvent.on(i,"click",function(){setTimeout(o.bind(this._onInputClick,this),0)},this),this._map.on("click",this._collapse,this)}else this._expand();this._baseLayersList=o.DomUtil.create("div",t+"-base",i),this._separator=o.DomUtil.create("div",t+"-separator",i),this._overlaysList=o.DomUtil.create("div",t+"-overlays",i),e.appendChild(i)},_addLayer:function(t,e,i){var n=o.stamp(t);this._layers[n]={layer:t,name:e,overlay:i},this.options.autoZIndex&&t.setZIndex&&(this._lastZIndex++,t.setZIndex(this._lastZIndex))},_update:function(){if(this._container){this._baseLayersList.innerHTML="",this._overlaysList.innerHTML="";var t,e,i=!1,n=!1;for(t in this._layers)e=this._layers[t],this._addItem(e),n=n||e.overlay,i=i||!e.overlay;this._separator.style.display=n&&i?"":"none"}},_onLayerChange:function(t){var e=this._layers[o.stamp(t.layer)];if(e){this._handlingClick||this._update();var i=e.overlay?"layeradd"===t.type?"overlayadd":"overlayremove":"layeradd"===t.type?"baselayerchange":null;i&&this._map.fire(i,e)}},_createRadioElement:function(t,i){var n='<input type="radio" class="leaflet-control-layers-selector" name="'+t+'"';i&&(n+=' checked="checked"'),n+="/>";var o=e.createElement("div");return o.innerHTML=n,o.firstChild},_addItem:function(t){var i,n=e.createElement("label"),s=this._map.hasLayer(t.layer);t.overlay?(i=e.createElement("input"),i.type="checkbox",i.className="leaflet-control-layers-selector",i.defaultChecked=s):i=this._createRadioElement("leaflet-base-layers",s),i.layerId=o.stamp(t.layer),o.DomEvent.on(i,"click",this._onInputClick,this);var a=e.createElement("span");a.innerHTML=" "+t.name,n.appendChild(i),n.appendChild(a);var r=t.overlay?this._overlaysList:this._baseLayersList;return r.appendChild(n),n},_onInputClick:function(){var t,e,i,n=this._form.getElementsByTagName("input"),o=n.length;for(this._handlingClick=!0,t=0;o>t;t++)e=n[t],i=this._layers[e.layerId],e.checked&&!this._map.hasLayer(i.layer)?this._map.addLayer(i.layer):!e.checked&&this._map.hasLayer(i.layer)&&this._map.removeLayer(i.layer);this._handlingClick=!1,this._refocusOnMap()},_expand:function(){o.DomUtil.addClass(this._container,"leaflet-control-layers-expanded")},_collapse:function(){this._container.className=this._container.className.replace(" leaflet-control-layers-expanded","")}}),o.control.layers=function(t,e,i){return new o.Control.Layers(t,e,i)},o.PosAnimation=o.Class.extend({includes:o.Mixin.Events,run:function(t,e,i,n){this.stop(),this._el=t,this._inProgress=!0,this._newPos=e,this.fire("start"),t.style[o.DomUtil.TRANSITION]="all "+(i||.25)+"s cubic-bezier(0,0,"+(n||.5)+",1)",o.DomEvent.on(t,o.DomUtil.TRANSITION_END,this._onTransitionEnd,this),o.DomUtil.setPosition(t,e),o.Util.falseFn(t.offsetWidth),this._stepTimer=setInterval(o.bind(this._onStep,this),50)},stop:function(){this._inProgress&&(o.DomUtil.setPosition(this._el,this._getPos()),this._onTransitionEnd(),o.Util.falseFn(this._el.offsetWidth))},_onStep:function(){var t=this._getPos();return t?(this._el._leaflet_pos=t,void this.fire("step")):void this._onTransitionEnd()},_transformRe:/([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,_getPos:function(){var e,i,n,s=this._el,a=t.getComputedStyle(s);if(o.Browser.any3d){if(n=a[o.DomUtil.TRANSFORM].match(this._transformRe),!n)return;e=parseFloat(n[1]),i=parseFloat(n[2])}else e=parseFloat(a.left),i=parseFloat(a.top);return new o.Point(e,i,!0)},_onTransitionEnd:function(){o.DomEvent.off(this._el,o.DomUtil.TRANSITION_END,this._onTransitionEnd,this),this._inProgress&&(this._inProgress=!1,this._el.style[o.DomUtil.TRANSITION]="",this._el._leaflet_pos=this._newPos,clearInterval(this._stepTimer),this.fire("step").fire("end"))}}),o.Map.include({setView:function(t,e,n){if(e=e===i?this._zoom:this._limitZoom(e),t=this._limitCenter(o.latLng(t),e,this.options.maxBounds),n=n||{},this._panAnim&&this._panAnim.stop(),this._loaded&&!n.reset&&n!==!0){n.animate!==i&&(n.zoom=o.extend({animate:n.animate},n.zoom),n.pan=o.extend({animate:n.animate},n.pan));var s=this._zoom!==e?this._tryAnimatedZoom&&this._tryAnimatedZoom(t,e,n.zoom):this._tryAnimatedPan(t,n.pan);if(s)return clearTimeout(this._sizeTimer),this}return this._resetView(t,e),this},panBy:function(t,e){if(t=o.point(t).round(),e=e||{},!t.x&&!t.y)return this;if(this._panAnim||(this._panAnim=new o.PosAnimation,this._panAnim.on({step:this._onPanTransitionStep,end:this._onPanTransitionEnd},this)),e.noMoveStart||this.fire("movestart"),e.animate!==!1){o.DomUtil.addClass(this._mapPane,"leaflet-pan-anim");var i=this._getMapPanePos().subtract(t);this._panAnim.run(this._mapPane,i,e.duration||.25,e.easeLinearity)}else this._rawPanBy(t),this.fire("move").fire("moveend");return this},_onPanTransitionStep:function(){this.fire("move")},_onPanTransitionEnd:function(){o.DomUtil.removeClass(this._mapPane,"leaflet-pan-anim"),this.fire("moveend")},_tryAnimatedPan:function(t,e){var i=this._getCenterOffset(t)._floor();return(e&&e.animate)===!0||this.getSize().contains(i)?(this.panBy(i,e),!0):!1}}),o.PosAnimation=o.DomUtil.TRANSITION?o.PosAnimation:o.PosAnimation.extend({run:function(t,e,i,n){this.stop(),this._el=t,this._inProgress=!0,this._duration=i||.25,this._easeOutPower=1/Math.max(n||.5,.2),this._startPos=o.DomUtil.getPosition(t),this._offset=e.subtract(this._startPos),this._startTime=+new Date,this.fire("start"),this._animate()},stop:function(){this._inProgress&&(this._step(),this._complete())},_animate:function(){this._animId=o.Util.requestAnimFrame(this._animate,this),this._step()},_step:function(){var t=+new Date-this._startTime,e=1e3*this._duration;e>t?this._runFrame(this._easeOut(t/e)):(this._runFrame(1),this._complete())},_runFrame:function(t){var e=this._startPos.add(this._offset.multiplyBy(t));o.DomUtil.setPosition(this._el,e),this.fire("step")},_complete:function(){o.Util.cancelAnimFrame(this._animId),this._inProgress=!1,this.fire("end")},_easeOut:function(t){return 1-Math.pow(1-t,this._easeOutPower)}}),o.Map.mergeOptions({zoomAnimation:!0,zoomAnimationThreshold:4}),o.DomUtil.TRANSITION&&o.Map.addInitHook(function(){this._zoomAnimated=this.options.zoomAnimation&&o.DomUtil.TRANSITION&&o.Browser.any3d&&!o.Browser.android23&&!o.Browser.mobileOpera,this._zoomAnimated&&o.DomEvent.on(this._mapPane,o.DomUtil.TRANSITION_END,this._catchTransitionEnd,this)}),o.Map.include(o.DomUtil.TRANSITION?{_catchTransitionEnd:function(t){this._animatingZoom&&t.propertyName.indexOf("transform")>=0&&this._onZoomTransitionEnd()},_nothingToAnimate:function(){return!this._container.getElementsByClassName("leaflet-zoom-animated").length},_tryAnimatedZoom:function(t,e,i){if(this._animatingZoom)return!0;if(i=i||{},!this._zoomAnimated||i.animate===!1||this._nothingToAnimate()||Math.abs(e-this._zoom)>this.options.zoomAnimationThreshold)return!1;var n=this.getZoomScale(e),o=this._getCenterOffset(t)._divideBy(1-1/n),s=this._getCenterLayerPoint()._add(o);return i.animate===!0||this.getSize().contains(o)?(this.fire("movestart").fire("zoomstart"),this._animateZoom(t,e,s,n,null,!0),!0):!1},_animateZoom:function(t,e,i,n,s,a){this._animatingZoom=!0,o.DomUtil.addClass(this._mapPane,"leaflet-zoom-anim"),this._animateToCenter=t,this._animateToZoom=e,o.Draggable&&(o.Draggable._disabled=!0),this.fire("zoomanim",{center:t,zoom:e,origin:i,scale:n,delta:s,backwards:a})},_onZoomTransitionEnd:function(){this._animatingZoom=!1,o.DomUtil.removeClass(this._mapPane,"leaflet-zoom-anim"),this._resetView(this._animateToCenter,this._animateToZoom,!0,!0),o.Draggable&&(o.Draggable._disabled=!1)}}:{}),o.TileLayer.include({_animateZoom:function(t){this._animating||(this._animating=!0,this._prepareBgBuffer());var e=this._bgBuffer,i=o.DomUtil.TRANSFORM,n=t.delta?o.DomUtil.getTranslateString(t.delta):e.style[i],s=o.DomUtil.getScaleString(t.scale,t.origin);e.style[i]=t.backwards?s+" "+n:n+" "+s},_endZoomAnim:function(){var t=this._tileContainer,e=this._bgBuffer;t.style.visibility="",t.parentNode.appendChild(t),o.Util.falseFn(e.offsetWidth),this._animating=!1},_clearBgBuffer:function(){var t=this._map;!t||t._animatingZoom||t.touchZoom._zooming||(this._bgBuffer.innerHTML="",this._bgBuffer.style[o.DomUtil.TRANSFORM]="")},_prepareBgBuffer:function(){var t=this._tileContainer,e=this._bgBuffer,i=this._getLoadedTilesPercentage(e),n=this._getLoadedTilesPercentage(t);return e&&i>.5&&.5>n?(t.style.visibility="hidden",void this._stopLoadingImages(t)):(e.style.visibility="hidden",e.style[o.DomUtil.TRANSFORM]="",this._tileContainer=e,e=this._bgBuffer=t,this._stopLoadingImages(e),void clearTimeout(this._clearBgBufferTimer))},_getLoadedTilesPercentage:function(t){var e,i,n=t.getElementsByTagName("img"),o=0;for(e=0,i=n.length;i>e;e++)n[e].complete&&o++;return o/i},_stopLoadingImages:function(t){var e,i,n,s=Array.prototype.slice.call(t.getElementsByTagName("img"));for(e=0,i=s.length;i>e;e++)n=s[e],n.complete||(n.onload=o.Util.falseFn,n.onerror=o.Util.falseFn,n.src=o.Util.emptyImageUrl,n.parentNode.removeChild(n))}}),o.Map.include({_defaultLocateOptions:{watch:!1,setView:!1,maxZoom:1/0,timeout:1e4,maximumAge:0,enableHighAccuracy:!1},locate:function(t){if(t=this._locateOptions=o.extend(this._defaultLocateOptions,t),!navigator.geolocation)return this._handleGeolocationError({code:0,message:"Geolocation not supported."}),this;var e=o.bind(this._handleGeolocationResponse,this),i=o.bind(this._handleGeolocationError,this);return t.watch?this._locationWatchId=navigator.geolocation.watchPosition(e,i,t):navigator.geolocation.getCurrentPosition(e,i,t),this},stopLocate:function(){return navigator.geolocation&&navigator.geolocation.clearWatch(this._locationWatchId),this._locateOptions&&(this._locateOptions.setView=!1),this},_handleGeolocationError:function(t){var e=t.code,i=t.message||(1===e?"permission denied":2===e?"position unavailable":"timeout");this._locateOptions.setView&&!this._loaded&&this.fitWorld(),this.fire("locationerror",{code:e,message:"Geolocation error: "+i+"."})},_handleGeolocationResponse:function(t){var e=t.coords.latitude,i=t.coords.longitude,n=new o.LatLng(e,i),s=180*t.coords.accuracy/40075017,a=s/Math.cos(o.LatLng.DEG_TO_RAD*e),r=o.latLngBounds([e-s,i-a],[e+s,i+a]),h=this._locateOptions;if(h.setView){var l=Math.min(this.getBoundsZoom(r),h.maxZoom);this.setView(n,l)}var u={latlng:n,bounds:r,timestamp:t.timestamp};for(var c in t.coords)"number"==typeof t.coords[c]&&(u[c]=t.coords[c]);this.fire("locationfound",u)}})}(window,document);/*! esri-leaflet-geocoder - v0.0.1-beta.3 - 2014-02-27
*   Copyright (c) 2014 Environmental Systems Research Institute, Inc.
*   Apache 2.0 License */
!function(a){function b(a,b){b=b||window;for(var c,d=b,e=a.split(".");c=e.shift();)d[c]||(d[c]={}),d=d[c];return d}function c(a){var b="?";for(var c in a)if(a.hasOwnProperty(c)){var d=c,e=a[c];b+=encodeURIComponent(d),b+="=",b+=encodeURIComponent(e),b+="&"}return b.substring(0,b.length-1)}function d(b){var c=new a.LatLng(b.ymin,b.xmin),d=new a.LatLng(b.ymax,b.xmax);return new a.LatLngBounds(c,d)}b("L.esri.Services.Geocoding"),b("L.esri.Controls.Geosearch"),a.esri.Services.Geocoding=a.Class.extend({includes:a.Mixin.Events,options:{url:"https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/",outFields:"Subregion, Region, PlaceName, Match_addr, Country, Addr_type, City, Place_addr"},initialize:function(b){a.Util.setOptions(this,b)},request:function(b,d,e){var f="c"+(1e9*Math.random()).toString(36).replace(".","_");d.f="json",d.callback="L.esri.Services.Geocoding._callback."+f;var g=document.createElement("script");g.type="text/javascript",g.src=b+c(d),g.id=f,this.fire("loading"),a.esri.Services.Geocoding._callback[f]=a.Util.bind(function(b){this.fire("load"),e(b),document.body.removeChild(g),delete a.esri.Services.Geocoding._callback[f]},this),document.body.appendChild(g)},geocode:function(b,c,d){var e={outFields:this.options.outFields},f=a.extend(e,c);f.text=b,this.request(this.options.url+"find",f,d)},suggest:function(a,b,c){var d=b||{};d.text=a,this.request(this.options.url+"suggest",d,c)}}),a.esri.Services.geocoding=function(b){return new a.esri.Services.Geocoding(b)},a.esri.Services.Geocoding._callback={},a.esri.Controls.Geosearch=a.Control.extend({includes:a.Mixin.Events,options:{position:"topleft",zoomToResult:!0,useMapBounds:11,collapseAfterResult:!0,expanded:!1,maxResults:25},initialize:function(b){a.Util.setOptions(this,b),this._service=new a.esri.Services.Geocoding},_processMatch:function(b,c){var e=c.feature.attributes,f=d(c.extent);return{text:b,bounds:f,latlng:new a.LatLng(c.feature.geometry.y,c.feature.geometry.x),name:e.PlaceName,match:e.Addr_type,country:e.Country,region:e.Region,subregion:e.Subregion,city:e.City,address:e.Place_addr?e.Place_addr:e.Match_addr}},_geocode:function(b,c){var d={};if(c)d.magicKey=c;else{var e=this._map.getBounds(),f=e.getCenter(),g=e.getNorthWest();d.bbox=e.toBBoxString(),d.maxLocations=this.options.maxResults,d.location=f.lng+","+f.lat,d.distance=Math.min(Math.max(f.distanceTo(g),2e3),5e4)}a.DomUtil.addClass(this._input,"geocoder-control-loading"),this.fire("loading"),this._service.geocode(b,d,a.Util.bind(function(c){if(c.error)this.fire("error",{code:c.error.code,message:c.error.messsage});else if(c.locations.length){var d,e=[],f=new a.LatLngBounds;for(d=c.locations.length-1;d>=0;d--)e.push(this._processMatch(b,c.locations[d]));for(d=e.length-1;d>=0;d--)f.extend(e[d].bounds);this.fire("results",{results:e,bounds:f,latlng:f.getCenter()}),this.options.zoomToResult&&this._map.fitBounds(f)}else this.fire("results",{results:[],bounds:null,latlng:null,text:b});a.DomUtil.removeClass(this._input,"geocoder-control-loading"),this.fire("load"),this.clear(),this._input.blur()},this))},_suggest:function(b){a.DomUtil.addClass(this._input,"geocoder-control-loading");var c={};if(this.options.useMapBounds===!0||this._map.getZoom()>=this.options.useMapBounds){var d=this._map.getBounds(),e=d.getCenter(),f=d.getNorthWest();c.location=e.lng+","+e.lat,c.distance=Math.min(Math.max(e.distanceTo(f),2e3),5e4)}this._service.suggest(b,c,a.Util.bind(function(b){if(this._input.value){if(this._suggestions.innerHTML="",this._suggestions.style.display="none",b.suggestions){this._suggestions.style.display="block";for(var c=0;c<b.suggestions.length;c++){var d=a.DomUtil.create("li","geocoder-control-suggestion",this._suggestions);d.innerHTML=b.suggestions[c].text,d["data-magic-key"]=b.suggestions[c].magicKey}}a.DomUtil.removeClass(this._input,"geocoder-control-loading")}},this))},clear:function(){this._suggestions.innerHTML="",this._suggestions.style.display="none",this._input.value="",this.options.collapseAfterResult&&a.DomUtil.removeClass(this._container,"geocoder-control-expanded")},onAdd:function(b){return this._map=b,b.attributionControl?b.attributionControl.addAttribution("Geocoding by Esri"):a.control.attribution().addAttribution("Geocoding by Esri").addTo(b),this._container=a.DomUtil.create("div","geocoder-control"+(this.options.expanded?" geocoder-control-expanded":"")),this._input=a.DomUtil.create("input","geocoder-control-input leaflet-bar",this._container),this._suggestions=a.DomUtil.create("ul","geocoder-control-suggestions leaflet-bar",this._container),a.DomEvent.addListener(this._input,"focus",function(){a.DomUtil.addClass(this._container,"geocoder-control-expanded")},this),a.DomEvent.addListener(this._container,"click",function(){a.DomUtil.addClass(this._container,"geocoder-control-expanded"),this._input.focus()},this),a.DomEvent.addListener(this._suggestions,"mousedown",function(a){var b=a.target||a.srcElement;this._geocode(b.innerHTML,b["data-magic-key"]),this.clear()},this),a.DomEvent.addListener(this._input,"blur",function(){this.clear()},this),a.DomEvent.addListener(this._input,"keydown",function(b){var c=this._suggestions.querySelectorAll(".geocoder-control-selected")[0];switch(b.keyCode){case 13:c?(this._geocode(c.innerHTML,c["data-magic-key"]),this.clear()):this.options.allowMultipleResults?this._geocode(this._input.value):a.DomUtil.addClass(this._suggestions.childNodes[0],"geocoder-control-selected"),this.clear(),a.DomEvent.preventDefault(b);break;case 38:c&&a.DomUtil.removeClass(c,"geocoder-control-selected"),c&&c.previousSibling?a.DomUtil.addClass(c.previousSibling,"geocoder-control-selected"):a.DomUtil.addClass(this._suggestions.childNodes[this._suggestions.childNodes.length-1],"geocoder-control-selected"),a.DomEvent.preventDefault(b);break;case 40:c&&a.DomUtil.removeClass(c,"geocoder-control-selected"),c&&c.nextSibling?a.DomUtil.addClass(c.nextSibling,"geocoder-control-selected"):a.DomUtil.addClass(this._suggestions.childNodes[0],"geocoder-control-selected"),a.DomEvent.preventDefault(b)}},this),a.DomEvent.addListener(this._input,"keyup",function(a){var b=a.which||a.keyCode,c=(a.target||a.srcElement).value;return c.length<2?void 0:27===b?(this._suggestions.innerHTML="",void(this._suggestions.style.display="none")):void(13!==b&&38!==b&&40!==b&&this._suggest(c))},this),a.DomEvent.disableClickPropagation(this._container),this._container},onRemove:function(a){a.attributionControl.removeAttribution("Geocoding by Esri")}}),a.esri.Controls.geosearch=function(b){return new a.esri.Controls.Geosearch(b)}}(L);!function(a){"use strict";a.Zebra_DatePicker=function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N={always_visible:!1,days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],days_abbr:!1,default_position:"above",direction:0,disabled_dates:!1,enabled_dates:!1,first_day_of_week:1,format:"Y-m-d",header_captions:{days:"F, Y",months:"Y",years:"Y1 - Y2"},header_navigation:["&#171;","&#187;"],inside:!0,lang_clear_date:"Clear date",months:["January","February","March","April","May","June","July","August","September","October","November","December"],months_abbr:!1,offset:[5,-5],pair:!1,readonly_element:!0,select_other_months:!1,show_clear_date:0,show_icon:!0,show_other_months:!0,show_select_today:"Today",show_week_number:!1,start_date:!1,strict:!1,view:"days",weekend_days:[0,6],zero_pad:!1,onChange:null,onClear:null,onOpen:null,onSelect:null},O=this;O.settings={};var P=a(b),Q=function(b){if(!b){O.settings=a.extend({},N,c);for(var y in P.data())0===y.indexOf("zdp_")&&(y=y.replace(/^zdp\_/,""),void 0!==N[y]&&(O.settings[y]="pair"==y?a(P.data("zdp_"+y)):P.data("zdp_"+y)))}O.settings.readonly_element&&P.attr("readonly","readonly");var E={days:["d","j","D"],months:["F","m","M","n","t"],years:["o","Y","y"]},F=!1,G=!1,Q=!1,T=null;for(T in E)a.each(E[T],function(a,b){O.settings.format.indexOf(b)>-1&&("days"==T?F=!0:"months"==T?G=!0:"years"==T&&(Q=!0))});H=F&&G&&Q?["years","months","days"]:!F&&G&&Q?["years","months"]:F&&G&&!Q?["months","days"]:F||G||!Q?F||!G||Q?["years","months","days"]:["months"]:["years"],-1==a.inArray(O.settings.view,H)&&(O.settings.view=H[H.length-1]),x=[],w=[];for(var U,V=0;2>V;V++)U=0===V?O.settings.disabled_dates:O.settings.enabled_dates,a.isArray(U)&&U.length>0&&a.each(U,function(){for(var b=this.split(" "),c=0;4>c;c++){b[c]||(b[c]="*"),b[c]=b[c].indexOf(",")>-1?b[c].split(","):new Array(b[c]);for(var d=0;d<b[c].length;d++)if(b[c][d].indexOf("-")>-1){var e=b[c][d].match(/^([0-9]+)\-([0-9]+)/);if(null!==e){for(var f=eb(e[1]);f<=eb(e[2]);f++)-1==a.inArray(f,b[c])&&b[c].push(f+"");b[c].splice(d,1)}}for(d=0;d<b[c].length;d++)b[c][d]=isNaN(eb(b[c][d]))?b[c][d]:eb(b[c][d])}0===V?x.push(b):w.push(b)});var W,X,Y=new Date,_=O.settings.reference_date?O.settings.reference_date:P.data("zdp_reference_date")&&void 0!==P.data("zdp_reference_date")?P.data("zdp_reference_date"):Y;if(z=void 0,A=void 0,o=_.getMonth(),l=Y.getMonth(),p=_.getFullYear(),m=Y.getFullYear(),q=_.getDate(),n=Y.getDate(),O.settings.direction===!0)z=_;else if(O.settings.direction===!1)A=_,D=A.getMonth(),C=A.getFullYear(),B=A.getDate();else if(!a.isArray(O.settings.direction)&&$(O.settings.direction)&&eb(O.settings.direction)>0||a.isArray(O.settings.direction)&&((W=R(O.settings.direction[0]))||O.settings.direction[0]===!0||$(O.settings.direction[0])&&O.settings.direction[0]>0)&&((X=R(O.settings.direction[1]))||O.settings.direction[1]===!1||$(O.settings.direction[1])&&O.settings.direction[1]>=0))z=W?W:new Date(p,o,q+(a.isArray(O.settings.direction)?eb(O.settings.direction[0]===!0?0:O.settings.direction[0]):eb(O.settings.direction))),o=z.getMonth(),p=z.getFullYear(),q=z.getDate(),X&&+X>=+z?A=X:!X&&O.settings.direction[1]!==!1&&a.isArray(O.settings.direction)&&(A=new Date(p,o,q+eb(O.settings.direction[1]))),A&&(D=A.getMonth(),C=A.getFullYear(),B=A.getDate());else if(!a.isArray(O.settings.direction)&&$(O.settings.direction)&&eb(O.settings.direction)<0||a.isArray(O.settings.direction)&&(O.settings.direction[0]===!1||$(O.settings.direction[0])&&O.settings.direction[0]<0)&&((W=R(O.settings.direction[1]))||$(O.settings.direction[1])&&O.settings.direction[1]>=0))A=new Date(p,o,q+(a.isArray(O.settings.direction)?eb(O.settings.direction[0]===!1?0:O.settings.direction[0]):eb(O.settings.direction))),D=A.getMonth(),C=A.getFullYear(),B=A.getDate(),W&&+A>+W?z=W:!W&&a.isArray(O.settings.direction)&&(z=new Date(C,D,B-eb(O.settings.direction[1]))),z&&(o=z.getMonth(),p=z.getFullYear(),q=z.getDate());else if(a.isArray(O.settings.disabled_dates)&&O.settings.disabled_dates.length>0)for(var cb in x)if("*"==x[cb][0]&&"*"==x[cb][1]&&"*"==x[cb][2]&&"*"==x[cb][3]){var gb=[];if(a.each(w,function(){var a=this;"*"!=a[2][0]&&gb.push(parseInt(a[2][0]+("*"==a[1][0]?"12":db(a[1][0],2))+("*"==a[0][0]?"*"==a[1][0]?"31":new Date(a[2][0],a[1][0],0).getDate():db(a[0][0],2)),10))}),gb.sort(),gb.length>0){var ib=(gb[0]+"").match(/([0-9]{4})([0-9]{2})([0-9]{2})/);p=parseInt(ib[1],10),o=parseInt(ib[2],10)-1,q=parseInt(ib[3],10)}break}if(Z(p,o,q)){for(;Z(p);)z?(p++,o=0):(p--,o=11);for(;Z(p,o);)z?(o++,q=1):(o--,q=new Date(p,o+1,0).getDate()),o>11?(p++,o=0,q=1):0>o&&(p--,o=11,q=new Date(p,o+1,0).getDate());for(;Z(p,o,q);)z?q++:q--,Y=new Date(p,o,q),p=Y.getFullYear(),o=Y.getMonth(),q=Y.getDate();Y=new Date(p,o,q),p=Y.getFullYear(),o=Y.getMonth(),q=Y.getDate()}var jb=R(P.val()||(O.settings.start_date?O.settings.start_date:""));if(jb&&O.settings.strict&&Z(jb.getFullYear(),jb.getMonth(),jb.getDate())&&P.val(""),b||void 0===z&&void 0===jb||fb(void 0!==z?z:jb),!O.settings.always_visible){if(!b){if(O.settings.show_icon){"firefox"==hb.name&&P.is('input[type="text"]')&&"inline"==P.css("display")&&P.css("display","inline-block");var kb=a('<span class="Zebra_DatePicker_Icon_Wrapper"></span>').css({display:P.css("display"),position:"static"==P.css("position")?"relative":P.css("position"),"float":P.css("float"),top:P.css("top"),right:P.css("right"),bottom:P.css("bottom"),left:P.css("left")});P.wrap(kb).css({position:"relative",top:"auto",right:"auto",bottom:"auto",left:"auto"}),f=a('<button type="button" class="Zebra_DatePicker_Icon'+("disabled"==P.attr("disabled")?" Zebra_DatePicker_Icon_Disabled":"")+'">Pick a date</button>'),O.icon=f,I=f.add(P)}else I=P;I.bind("click",function(a){a.preventDefault(),P.attr("disabled")||(e.hasClass("dp_visible")?O.hide():O.show())}),void 0!==f&&f.insertAfter(P)}if(void 0!==f){f.attr("style",""),O.settings.inside&&f.addClass("Zebra_DatePicker_Icon_Inside");var lb=P.outerWidth(),mb=P.outerHeight(),nb=parseInt(P.css("marginLeft"),10)||0,ob=parseInt(P.css("marginTop"),10)||0,pb=f.outerWidth(),qb=f.outerHeight(),rb=parseInt(f.css("marginLeft"),10)||0,sb=parseInt(f.css("marginRight"),10)||0;O.settings.inside?f.css({top:ob+(mb-qb)/2,left:nb+(lb-pb-sb)}):f.css({top:ob+(mb-qb)/2,left:nb+lb+rb}),f.removeClass(" Zebra_DatePicker_Icon_Disabled"),"disabled"==P.attr("disabled")&&f.addClass("Zebra_DatePicker_Icon_Disabled")}}if(L=O.settings.show_select_today!==!1&&a.inArray("days",H)>-1&&!Z(m,l,n)?O.settings.show_select_today:!1,!b){a(window).bind("resize.Zebra_DatePicker",function(){O.hide(),void 0!==f&&(clearTimeout(M),M=setTimeout(function(){O.update()},100))});var tb='<div class="Zebra_DatePicker"><table class="dp_header"><tr><td class="dp_previous">'+O.settings.header_navigation[0]+'</td><td class="dp_caption">&#032;</td><td class="dp_next">'+O.settings.header_navigation[1]+'</td></tr></table><table class="dp_daypicker"></table><table class="dp_monthpicker"></table><table class="dp_yearpicker"></table><table class="dp_footer"><tr><td class="dp_today"'+(O.settings.show_clear_date!==!1?' style="width:50%"':"")+">"+L+'</td><td class="dp_clear"'+(L!==!1?' style="width:50%"':"")+">"+O.settings.lang_clear_date+"</td></tr></table></div>";e=a(tb),O.datepicker=e,g=a("table.dp_header",e),h=a("table.dp_daypicker",e),i=a("table.dp_monthpicker",e),j=a("table.dp_yearpicker",e),K=a("table.dp_footer",e),J=a("td.dp_today",K),k=a("td.dp_clear",K),O.settings.always_visible?P.attr("disabled")||(O.settings.always_visible.append(e),O.show()):a("body").append(e),e.delegate("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)","mouseover",function(){a(this).addClass("dp_hover")}).delegate("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)","mouseout",function(){a(this).removeClass("dp_hover")}),S(a("td",g)),a(".dp_previous",g).bind("click",function(){"months"==d?s--:"years"==d?s-=12:--r<0&&(r=11,s--),ab()}),a(".dp_caption",g).bind("click",function(){d="days"==d?a.inArray("months",H)>-1?"months":a.inArray("years",H)>-1?"years":"days":"months"==d?a.inArray("years",H)>-1?"years":a.inArray("days",H)>-1?"days":"months":a.inArray("days",H)>-1?"days":a.inArray("months",H)>-1?"months":"years",ab()}),a(".dp_next",g).bind("click",function(){"months"==d?s++:"years"==d?s+=12:12==++r&&(r=0,s++),ab()}),h.delegate("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)","click",function(){O.settings.select_other_months&&null!==(ib=a(this).attr("class").match(/date\_([0-9]{4})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])/))?bb(ib[1],ib[2]-1,ib[3],"days",a(this)):bb(s,r,eb(a(this).html()),"days",a(this))}),i.delegate("td:not(.dp_disabled)","click",function(){var b=a(this).attr("class").match(/dp\_month\_([0-9]+)/);r=eb(b[1]),-1==a.inArray("days",H)?bb(s,r,1,"months",a(this)):(d="days",O.settings.always_visible&&P.val(""),ab())}),j.delegate("td:not(.dp_disabled)","click",function(){s=eb(a(this).html()),-1==a.inArray("months",H)?bb(s,1,1,"years",a(this)):(d="months",O.settings.always_visible&&P.val(""),ab())}),a(J).bind("click",function(b){b.preventDefault(),bb(m,l,n,"days",a(".dp_current",h)),O.settings.always_visible&&O.show(),O.hide()}),a(k).bind("click",function(b){b.preventDefault(),P.val(""),O.settings.always_visible?(t=null,u=null,v=null,a("td.dp_selected",e).removeClass("dp_selected")):(t=null,u=null,v=null,r=null,s=null),O.hide(),O.settings.onClear&&"function"==typeof O.settings.onClear&&O.settings.onClear.call(P,P)}),O.settings.always_visible||a(document).bind({"mousedown.Zebra_DatePicker":function(b){if(e.hasClass("dp_visible")){if(O.settings.show_icon&&a(b.target).get(0)===f.get(0))return!0;0===a(b.target).parents().filter(".Zebra_DatePicker").length&&O.hide()}},"keyup.Zebra_DatePicker":function(a){e.hasClass("dp_visible")&&27==a.which&&O.hide()}}),ab()}};O.destroy=function(){void 0!==O.icon&&O.icon.remove(),O.datepicker.remove(),a(document).unbind("keyup.Zebra_DatePicker"),a(document).unbind("mousedown.Zebra_DatePicker"),a(window).unbind("resize.Zebra_DatePicker"),P.removeData("Zebra_DatePicker")},O.hide=function(){O.settings.always_visible||(Y("hide"),e.removeClass("dp_visible").addClass("dp_hidden"))},O.show=function(){d=O.settings.view;var b=R(P.val()||(O.settings.start_date?O.settings.start_date:""));if(b?(u=b.getMonth(),r=b.getMonth(),v=b.getFullYear(),s=b.getFullYear(),t=b.getDate(),Z(v,u,t)&&(O.settings.strict&&P.val(""),r=o,s=p)):(r=o,s=p),ab(),O.settings.always_visible)e.removeClass("dp_hidden").addClass("dp_visible");else{var c=e.outerWidth(),g=e.outerHeight(),h=(void 0!==f?f.offset().left+f.outerWidth(!0):P.offset().left+P.outerWidth(!0))+O.settings.offset[0],i=(void 0!==f?f.offset().top:P.offset().top)-g+O.settings.offset[1],j=a(window).width(),k=a(window).height(),l=a(window).scrollTop(),m=a(window).scrollLeft();"below"==O.settings.default_position&&(i=(void 0!==f?f.offset().top:P.offset().top)+O.settings.offset[1]),h+c>m+j&&(h=m+j-c),m>h&&(h=m),i+g>l+k&&(i=l+k-g),l>i&&(i=l),e.css({left:h,top:i}),e.removeClass("dp_hidden").addClass("dp_visible"),Y()}O.settings.onOpen&&"function"==typeof O.settings.onOpen&&O.settings.onOpen.call(P,P)},O.update=function(b){O.original_direction&&(O.original_direction=O.direction),O.settings=a.extend(O.settings,b),Q(!0)};var R=function(b){if(b+="",""!==a.trim(b)){for(var c=T(O.settings.format),d=["d","D","j","l","N","S","w","F","m","M","n","Y","y"],e=[],f=[],g=null,h=null,i=0;i<d.length;i++)(g=c.indexOf(d[i]))>-1&&e.push({character:d[i],position:g});if(e.sort(function(a,b){return a.position-b.position}),a.each(e,function(a,b){switch(b.character){case"d":f.push("0[1-9]|[12][0-9]|3[01]");break;case"D":f.push("[a-z]{3}");break;case"j":f.push("[1-9]|[12][0-9]|3[01]");break;case"l":f.push("[a-z]+");break;case"N":f.push("[1-7]");break;case"S":f.push("st|nd|rd|th");break;case"w":f.push("[0-6]");break;case"F":f.push("[a-z]+");break;case"m":f.push("0[1-9]|1[012]+");break;case"M":f.push("[a-z]{3}");break;case"n":f.push("[1-9]|1[012]");break;case"Y":f.push("[0-9]{4}");break;case"y":f.push("[0-9]{2}")}}),f.length&&(e.reverse(),a.each(e,function(a,b){c=c.replace(b.character,"("+f[f.length-a-1]+")")}),f=new RegExp("^"+c+"$","ig"),h=f.exec(b))){var j,k=new Date,l=1,m=k.getMonth()+1,n=k.getFullYear(),o=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],p=["January","February","March","April","May","June","July","August","September","October","November","December"],q=!0;if(e.reverse(),a.each(e,function(b,c){if(!q)return!0;switch(c.character){case"m":case"n":m=eb(h[b+1]);break;case"d":case"j":l=eb(h[b+1]);break;case"D":case"l":case"F":case"M":j="D"==c.character||"l"==c.character?O.settings.days:O.settings.months,q=!1,a.each(j,function(a,d){if(q)return!0;if(h[b+1].toLowerCase()==d.substring(0,"D"==c.character||"M"==c.character?3:d.length).toLowerCase()){switch(c.character){case"D":h[b+1]=o[a].substring(0,3);break;case"l":h[b+1]=o[a];break;case"F":h[b+1]=p[a],m=a+1;break;case"M":h[b+1]=p[a].substring(0,3),m=a+1}q=!0}});break;case"Y":n=eb(h[b+1]);break;case"y":n="19"+eb(h[b+1])}}),q){var r=new Date(n,(m||1)-1,l||1);if(r.getFullYear()==n&&r.getDate()==(l||1)&&r.getMonth()==(m||1)-1)return r}}return!1}},S=function(a){"firefox"==hb.name?a.css("MozUserSelect","none"):"explorer"==hb.name?a.bind("selectstart",function(){return!1}):a.mousedown(function(){return!1})},T=function(a){return a.replace(/([-.,*+?^${}()|[\]\/\\])/g,"\\$1")},U=function(b){for(var c="",d=b.getDate(),e=b.getDay(),f=O.settings.days[e],g=b.getMonth()+1,h=O.settings.months[g-1],i=b.getFullYear()+"",j=0;j<O.settings.format.length;j++){var k=O.settings.format.charAt(j);switch(k){case"y":i=i.substr(2);case"Y":c+=i;break;case"m":g=db(g,2);case"n":c+=g;break;case"M":h=a.isArray(O.settings.months_abbr)&&void 0!==O.settings.months_abbr[g-1]?O.settings.months_abbr[g-1]:O.settings.months[g-1].substr(0,3);case"F":c+=h;break;case"d":d=db(d,2);case"j":c+=d;break;case"D":f=a.isArray(O.settings.days_abbr)&&void 0!==O.settings.days_abbr[e]?O.settings.days_abbr[e]:O.settings.days[e].substr(0,3);case"l":c+=f;break;case"N":e++;case"w":c+=e;break;case"S":c+=d%10==1&&"11"!=d?"st":d%10==2&&"12"!=d?"nd":d%10==3&&"13"!=d?"rd":"th";break;default:c+=k}}return c},V=function(){var b=new Date(s,r+1,0).getDate(),c=new Date(s,r,1).getDay(),d=new Date(s,r,0).getDate(),e=c-O.settings.first_day_of_week;e=0>e?7+e:e,_(O.settings.header_captions.days);var f="<tr>";O.settings.show_week_number&&(f+="<th>"+O.settings.show_week_number+"</th>");for(var g=0;7>g;g++)f+="<th>"+(a.isArray(O.settings.days_abbr)&&void 0!==O.settings.days_abbr[(O.settings.first_day_of_week+g)%7]?O.settings.days_abbr[(O.settings.first_day_of_week+g)%7]:O.settings.days[(O.settings.first_day_of_week+g)%7].substr(0,2))+"</th>";for(f+="</tr><tr>",g=0;42>g;g++){g>0&&g%7===0&&(f+="</tr><tr>"),g%7===0&&O.settings.show_week_number&&(f+='<td class="dp_week_number">'+gb(new Date(s,r,g-e+1))+"</td>");var i=g-e+1;if(O.settings.select_other_months&&(e>g||i>b)){var j=new Date(s,r,i),k=j.getFullYear(),o=j.getMonth(),p=j.getDate();j=k+db(o+1,2)+db(p,2)}if(e>g)f+='<td class="'+(O.settings.select_other_months&&!Z(k,o,p)?"dp_not_in_month_selectable date_"+j:"dp_not_in_month")+'">'+(O.settings.select_other_months||O.settings.show_other_months?db(d-e+g+1,O.settings.zero_pad?2:0):"&nbsp;")+"</td>";else if(i>b)f+='<td class="'+(O.settings.select_other_months&&!Z(k,o,p)?"dp_not_in_month_selectable date_"+j:"dp_not_in_month")+'">'+(O.settings.select_other_months||O.settings.show_other_months?db(i-b,O.settings.zero_pad?2:0):"&nbsp;")+"</td>";else{var q=(O.settings.first_day_of_week+g)%7,w="";Z(s,r,i)?(a.inArray(q,O.settings.weekend_days)>-1?w="dp_weekend_disabled":w+=" dp_disabled",r==l&&s==m&&n==i&&(w+=" dp_disabled_current")):(a.inArray(q,O.settings.weekend_days)>-1&&(w="dp_weekend"),r==u&&s==v&&t==i&&(w+=" dp_selected"),r==l&&s==m&&n==i&&(w+=" dp_current")),f+="<td"+(""!==w?' class="'+a.trim(w)+'"':"")+">"+(O.settings.zero_pad?db(i,2):i)+"</td>"}}f+="</tr>",h.html(a(f)),O.settings.always_visible&&(E=a("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)",h)),h.show()},W=function(){_(O.settings.header_captions.months);for(var b="<tr>",c=0;12>c;c++){c>0&&c%3===0&&(b+="</tr><tr>");var d="dp_month_"+c;Z(s,c)?d+=" dp_disabled":u!==!1&&u==c&&s==v?d+=" dp_selected":l==c&&m==s&&(d+=" dp_current"),b+='<td class="'+a.trim(d)+'">'+(a.isArray(O.settings.months_abbr)&&void 0!==O.settings.months_abbr[c]?O.settings.months_abbr[c]:O.settings.months[c].substr(0,3))+"</td>"}b+="</tr>",i.html(a(b)),O.settings.always_visible&&(F=a("td:not(.dp_disabled)",i)),i.show()},X=function(){_(O.settings.header_captions.years);for(var b="<tr>",c=0;12>c;c++){c>0&&c%3===0&&(b+="</tr><tr>");var d="";Z(s-7+c)?d+=" dp_disabled":v&&v==s-7+c?d+=" dp_selected":m==s-7+c&&(d+=" dp_current"),b+="<td"+(""!==a.trim(d)?' class="'+a.trim(d)+'"':"")+">"+(s-7+c)+"</td>"}b+="</tr>",j.html(a(b)),O.settings.always_visible&&(G=a("td:not(.dp_disabled)",j)),j.show()},Y=function(b){if("explorer"==hb.name&&6==hb.version){if(!y){var c=eb(e.css("zIndex"))-1;y=a("<iframe>",{src:'javascript:document.write("")',scrolling:"no",frameborder:0,css:{zIndex:c,position:"absolute",top:-1e3,left:-1e3,width:e.outerWidth(),height:e.outerHeight(),filter:"progid:DXImageTransform.Microsoft.Alpha(opacity=0)",display:"none"}}),a("body").append(y)}switch(b){case"hide":y.hide();break;default:var d=e.offset();y.css({top:d.top,left:d.left,display:"block"})}}},Z=function(b,c,d){if((void 0===b||isNaN(b))&&(void 0===c||isNaN(c))&&(void 0===d||isNaN(d)))return!1;if(a.isArray(O.settings.direction)||0!==eb(O.settings.direction)){var e=eb(cb(b,"undefined"!=typeof c?db(c,2):"","undefined"!=typeof d?db(d,2):"")),f=(e+"").length;if(8==f&&("undefined"!=typeof z&&e<eb(cb(p,db(o,2),db(q,2)))||"undefined"!=typeof A&&e>eb(cb(C,db(D,2),db(B,2)))))return!0;if(6==f&&("undefined"!=typeof z&&e<eb(cb(p,db(o,2)))||"undefined"!=typeof A&&e>eb(cb(C,db(D,2)))))return!0;if(4==f&&("undefined"!=typeof z&&p>e||"undefined"!=typeof A&&e>C))return!0}"undefined"!=typeof c&&(c+=1);var g=!1,h=!1;return x&&a.each(x,function(){if(!g){var e=this;if((a.inArray(b,e[2])>-1||a.inArray("*",e[2])>-1)&&("undefined"!=typeof c&&a.inArray(c,e[1])>-1||a.inArray("*",e[1])>-1)&&("undefined"!=typeof d&&a.inArray(d,e[0])>-1||a.inArray("*",e[0])>-1)){if("*"==e[3])return g=!0;var f=new Date(b,c-1,d).getDay();if(a.inArray(f,e[3])>-1)return g=!0}}}),w&&a.each(w,function(){if(!h){var e=this;if((a.inArray(b,e[2])>-1||a.inArray("*",e[2])>-1)&&(h=!0,"undefined"!=typeof c))if(h=!0,a.inArray(c,e[1])>-1||a.inArray("*",e[1])>-1){if("undefined"!=typeof d)if(h=!0,a.inArray(d,e[0])>-1||a.inArray("*",e[0])>-1){if("*"==e[3])return h=!0;var f=new Date(b,c-1,d).getDay();if(a.inArray(f,e[3])>-1)return h=!0;h=!1}else h=!1}else h=!1}}),w&&h?!1:x&&g?!0:!1},$=function(a){return(a+"").match(/^\-?[0-9]+$/)?!0:!1},_=function(b){!isNaN(parseFloat(r))&&isFinite(r)&&(b=b.replace(/\bm\b|\bn\b|\bF\b|\bM\b/,function(b){switch(b){case"m":return db(r+1,2);case"n":return r+1;case"F":return O.settings.months[r];case"M":return a.isArray(O.settings.months_abbr)&&void 0!==O.settings.months_abbr[r]?O.settings.months_abbr[r]:O.settings.months[r].substr(0,3);default:return b}})),!isNaN(parseFloat(s))&&isFinite(s)&&(b=b.replace(/\bY\b/,s).replace(/\by\b/,(s+"").substr(2)).replace(/\bY1\b/i,s-7).replace(/\bY2\b/i,s+4)),a(".dp_caption",g).html(b)},ab=function(){if(""===h.text()||"days"==d){if(""===h.text()){O.settings.always_visible||e.css("left",-1e3),e.css("visibility","visible"),V();var b=h.outerWidth(),c=h.outerHeight();i.css({width:b,height:c}),j.css({width:b,height:c}),g.css("width",b),K.css("width",b),e.css("visibility","").addClass("dp_hidden")}else V();i.hide(),j.hide()}else"months"==d?(W(),h.hide(),j.hide()):"years"==d&&(X(),h.hide(),i.hide());if(O.settings.onChange&&"function"==typeof O.settings.onChange&&void 0!==d){var f="days"==d?h.find("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)"):"months"==d?i.find("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)"):j.find("td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month)");f.each(function(){if("days"==d)if(a(this).hasClass("dp_not_in_month_selectable")){var b=a(this).attr("class").match(/date\_([0-9]{4})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])/);a(this).data("date",b[1]+"-"+b[2]+"-"+b[3])}else a(this).data("date",s+"-"+db(r+1,2)+"-"+db(eb(a(this).text()),2));else if("months"==d){var b=a(this).attr("class").match(/dp\_month\_([0-9]+)/);a(this).data("date",s+"-"+db(eb(b[1])+1,2))}else a(this).data("date",eb(a(this).text()))}),O.settings.onChange.call(P,d,f,P)}K.show(),O.settings.show_clear_date===!0||0===O.settings.show_clear_date&&""!==P.val()||O.settings.always_visible&&O.settings.show_clear_date!==!1?(k.show(),L?(J.css("width","50%"),k.css("width","50%")):(J.hide(),k.css("width","100%"))):(k.hide(),L?J.show().css("width","100%"):K.hide())},bb=function(a,b,c,d,e){var f=new Date(a,b,c,12,0,0),g="days"==d?E:"months"==d?F:G,h=U(f);P.val(h),O.settings.always_visible&&(u=f.getMonth(),r=f.getMonth(),v=f.getFullYear(),s=f.getFullYear(),t=f.getDate(),g.removeClass("dp_selected"),e.addClass("dp_selected"),"days"==d&&e.hasClass("dp_not_in_month_selectable")&&O.show()),O.hide(),fb(f),O.settings.onSelect&&"function"==typeof O.settings.onSelect&&O.settings.onSelect.call(P,h,a+"-"+db(b+1,2)+"-"+db(c,2),f,P,gb(f)),P.focus()},cb=function(){for(var a="",b=0;b<arguments.length;b++)a+=arguments[b]+"";return a},db=function(a,b){for(a+="";a.length<b;)a="0"+a;return a},eb=function(a){return parseInt(a,10)},fb=function(b){O.settings.pair&&a.each(O.settings.pair,function(){var c=a(this);if(c.data&&c.data("Zebra_DatePicker")){var d=c.data("Zebra_DatePicker");d.update({reference_date:b,direction:0===d.settings.direction?1:d.settings.direction}),d.settings.always_visible&&d.show()}else c.data("zdp_reference_date",b)})},gb=function(a){var b,c,d,e,f,g,h,i,j,k=a.getFullYear(),l=a.getMonth()+1,m=a.getDate();return 3>l?(b=k-1,c=(b/4|0)-(b/100|0)+(b/400|0),d=((b-1)/4|0)-((b-1)/100|0)+((b-1)/400|0),e=c-d,f=0,g=m-1+31*(l-1)):(b=k,c=(b/4|0)-(b/100|0)+(b/400|0),d=((b-1)/4|0)-((b-1)/100|0)+((b-1)/400|0),e=c-d,f=e+1,g=m+((153*(l-3)+2)/5|0)+58+e),h=(b+c)%7,m=(g+h-f)%7,i=g+3-m,j=0>i?53-((h-e)/5|0):i>364+e?1:(i/7|0)+1},hb={init:function(){this.name=this.searchString(this.dataBrowser)||"",this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||""},searchString:function(a){for(var b=0;b<a.length;b++){var c=a[b].string,d=a[b].prop;if(this.versionSearchString=a[b].versionSearch||a[b].identity,c){if(-1!=c.indexOf(a[b].subString))return a[b].identity}else if(d)return a[b].identity}},searchVersion:function(a){var b=a.indexOf(this.versionSearchString);if(-1!=b)return parseFloat(a.substring(b+this.versionSearchString.length+1))},dataBrowser:[{string:navigator.userAgent,subString:"Firefox",identity:"firefox"},{string:navigator.userAgent,subString:"MSIE",identity:"explorer",versionSearch:"MSIE"}]};hb.init(),Q()},a.fn.Zebra_DatePicker=function(b){return this.each(function(){void 0!==a(this).data("Zebra_DatePicker")&&a(this).data("Zebra_DatePicker").destroy();var c=new a.Zebra_DatePicker(this,b);a(this).data("Zebra_DatePicker",c)})}}(jQuery);