#Json Object Editor
**by Corey Hadden**

Visually Edit Objects Using this GUI tool, what you do from there is up to you.

todo:
	-conditional fields

##What's new
12/3/14 - +Added dynamicDisplay specs. (default:30)
this allows for infinite scroll of big lists. Set how many items to load on initial draw.
Changed search in accordance to use list not dom elements. Not updates _listCount property in title after searching.
onUpdate and onMultipleUpdate added to schema for callbacks to these functions/buttons


*v1.5*
+ use back button
+url field

*v1.4*

+ Added Image field
+ Added  MultiSort field

*v1.3*

+ List subset Selector
+ Multi-Select in Object List
+ Multi Update
+ Autocomplete textfield

##required includes

+ jquery
+ craydent
+ "js/JsonObjectEditor.jquery.craydent.js"
+ "css/joe-styles.css"



##In the pipeline
+ Remove Profiles
+ Conditional Fields
+ required fields


##instantiation
	var specs = {
		fields:{
			species:{label:'Species',type:'select', values:['cat','dog','rat','thing'], onchange:adjustSchema},
			gender:{type:'select', values:['male','female']},
			legs:{label:'# of Legs',type:'int', onblur:logit},
			weight:{label:' Weight (lbs)',type:'number', onblur:logit},
			name:{label:' pet Name', onkeyup:logValue},
			//id:{label:'ID',type:'text', locked:true},
			id:{label:'ID',type:'guid'},
			
		//example of select that takes function (function is passed item)	
			animalLink:{label:'Link to other animal',type:'select', values:getAnimals},
			hiddenizer:{hidden:true}
		},
		schemas:{
			animal:animalschema,
			thing:thingschema			
		},
		container:string ('body'),
        compact:false,
        useBackButton:true,
        listSubMenu:{filters:{}},
        useHashlink:true,
        title:'${itemtype} | ${display}'
	}
	var JOE = new JsonObjectEditor(specs);
	JOE.init();


##specs
- useBackButton:[false] if true, back button moves through joe panels when joe has history to go to (is open).
- useHashlink:(false), true or a template for hashlinks. 
    default template is '${schema_name}_${_id}'

###fields
Properties for all Fields

- `label / display`: what the field should display as
    *If the field type is boolean, label controls checkbox/boolean label
- `value`: default value if not one in object
- `default`: default value for field || function(object)
- `type`: what type of field should JOE show
- `hidden`: boolean / function, value will be added (but unsees by user)
- `locked`: boolean
- `condition`: boolean
- `width`: used for layout control.
	- can use pixels or percentages (as string)
- `comment`: a commentthat shows up at the beginning of the field
- `tooltip`: hover/clickable tooltip that shows up next to name

**field types:**

- `rendering`: for css html and js
- `text`: default single line text.
	- autocomplete: boolean // obj of specs (template, idprop)
		- values:array of possibilities
	-maxlength:string
- `int`: integer field
- `number`: number (float) field
- `select`: select list. 
	- multiple(bool)
	- values(array of objects, [{value:"",name/display:""]), can be a function
		- disabled:boolean(func acceptable)
	- idprop: string of prop name
- `geo`: shows a map
	- *takes a string array "[lat,lon]"*
	- center:[lat,lon], center of map
	- zoom: zoom level (higher zooms in more)
	- returns "[lat,lon]"
-`image` : shows an image and HxW as th image url is typed in.
- `multisorter` : allows arrays of objects to be selected and sorted in right bin.
	- values(array of objects, [{value:"",name/display:""]), can be a function
- `content` : show content on in the editor
    - run: function to be run(current_object,field_properties)
    - template: html template for fillTemplate(template,current_object);
- `objectlist` : a table of objects with editable properties
    - properties: array of objects|strings for the object property names
        -name: value in object
        -display: header in objectList
    - max: integer, number or items that can be added. use zero for infinite.
    - hideHeadings: don't show table headings
- `objectReference` : a list of object ids
    - template
    - autocomplete_template
    - idprop
    - values
    - max(0 unlimited)
    - sortable(true)
- `code` :
	- language
	
- `boolean`:
	- label:controls checkbox label
- `preview` :
	-content: string or function(current joe object) to replace everything on page (template).
	-bodycontent: same as content, only replaces body content.
	-url: preview page if not the default one.
	- encoded: boolean, if pre uriencoded
**labels:**

- pass an object instead of a string to the fields array.


    {label:'Name of the following properties section'}

##page sections
    {section_start: 'SectionName',
       section_label:'Section Name with Labels',
       condition:function(item){
           return item.show;}
    },
    {section_end: 'CreativeBrief'}

- pass an object instead of a string to the fields array. these show up on the details view as anchors.


- Object Properties
    - `section_start`: name/id of section
    - `'section_label`:use instead of section_start for display name
    - `section_end`: name/id of section(str)
    - template: html template for fillTemplate(template,current_object);
    
##page sidebar
    {sidebar_start: 'SectionName',
       sidebar_label:'Section Name with Labels',
       condition:function(item){
           return item.show;}
    },
    {sidebar_end: 'CreativeBrief'}

- pass an object instead of a string to the fields array. these show up on the details view as anchors.


- Object Properties
    - `sidebar_start`: name/id of sidebar
    - `sidebar_label`:use instead of sidebar_start for display name
    - `sidebar_end`: name/id of sidebar(str)
    - template: html template for fillTemplate(template,current_object);
    
###defaultProfile
overwrites the default profile

#schemas 

a list of schema objects that can configure the editor fields, these can be given properties that are delegated to all the corresponding fields.

	var animalschema = 
	{
		title:'Animal', *what shows as the panel header* 
		fields:['id','name','legs','species','weight','color','gender','animalLink'], *list of visible fields*
		_listID:'id', *the id for finding the object*
		_listTitle:'${name} ${species}', *how to display items in the list*
		menu:[array of menu buttons],
		listMenuTitle: (string) template forjoe window title in list view,
		listmenu:[array of menu buttons] (multi-edit and select all always show),
		/*callback:function(obj){
			alert(obj.name);
		},*/
		onblur:logit,
		hideNumbers:boolean *toggle list numbers*
		multipleCallback:function to be called after a multi-edit. passed list of edited items.
		onUpdate: callback for after update. passed single edited items.
		onMultipleUpdate:callback for after multi update.passed list of edited items.
                filters: array of objects
	}
##Table View
	- add tableView object to a schema;
	-cols = [strings||objects]
		-string is the name and value
		-display/header is the column title
		-property/name = object property 
###Pre-formating
you can preformat at the joe call or schema level. The data item will be affected by the passed function (which should return the preformated item). 

##menu##
an array of menu buttons

    //the default save button
    //this is the dom object, 
    //use _joe.current.object for current object
    condition:function(field,object) to call
    self = Joe object
    var __saveBtn__ = {name:'save',label:'Save', action:'_joe.updateObject(this);', css:'joe-save-button'};

##itemMenu##
as array of buttons for each item in list views
	- name
	- action (action string)
	- url (instead of js action)
	- condition

##itemExpander##
template or run for content to be shown under the main list item block.


###Addition properties
**Changing the schema on the fly?**

	_joe.resetSchema(new schema name);



**css (included) options**

- joe-left-button
- joe-right-button

##FIELDS

    {extend:'name',specs:{display:'Request Title'}},//extends the field 'name' with the specs provided.
##usage
### a | adding a new object

	_joe.show({},{schema:'animal',callback:addAnimal); 
	//or goJoe(object,specs)

	...
	function addAnimal(obj){
		animals.push(obj);
	}

### b | viewing a list of objects

	goJoe([array of objects],specs:{schema,subsets,subset})
	goJoe.show(animals,{schema:'animal',subsets:[{name:'Two-Legged',filter:{legs:2}}]});
	//use the specs property subset to pre-select a subset by name

**properties**

- _listWindowTitle: the title of the window (can be passed in with the schema);
- _listCount: added to the current object and can be used in the title.
- _listTitle:'${name} ${species}', *how to display items in the list*
- _icon: [str] template for a list item icon (standard min 50x50), 'http://www.icons.com/${itemname}', can be obj with width, height, url 
- listSubMenu:a function or object that represents the list submenu
- stripeColor:string or function that returns valid css color descriptor.
- bgColor:string or function that returns valid css color descriptor.
- subsets: name:string, filter:object 
- subMenu:a function or object that represents the single item submenu

- _listTemplate: html template that uses ${var} to write out the item properties for the list item.
	- standard css class `joe-panel-content-option`


###c | Conditional select that changes the item schema

	fields:{
		species:{label:'Species',type:'select', values:['cat','dog','rat','thing'], onchange:adjustSchema},
		[field_id]:{
			
			+label : STR
			+type : STR
			value : STR (default value)
			+values : ARRAY/FUNC (for select)
			
			//modifiers
			+hidden:BOOL/STRING(name of field that toggles this) //don't show, but value is passed
			+locked:BOOL // show, but uneditable
			//events
			+onchange : FUNC
			+onblur : FUNC
			+onkeypress : FUNC
			+rerender : STRING // name of field to rerender
		}
	}

	function adjustSchema(dom){
		var species = $(dom).val();
		if(species == "thing"){
			JOE.resetSchema('thing')
		}
		else{
			JOE.resetSchema('animal')
		
		}
	}

###d | duplicating an item

	//duplicates the currently active object (being edited)
	_joe.duplicateObject(specs);

**specs**

- `deletes`:array of properties to clear for new item
	- note that you will need to delete guid/id fields or the id will be the same.	



### e | exporting an object in pretty format json (or minified)
JOE.exportJSON = function(object,objvarname,minify)

##Useful Functions
_joe.reload(hideMessage,specs)
- use specs.overwreite object to extend reloaded object.

_joe.constructObjectFromFields()