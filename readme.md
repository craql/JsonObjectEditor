#Json Object Editor
**by Corey Hadden**

*v1.2*

Visually Edit Objects Using this GUI tool, what you do from there is up to you.

##what's new

##required includes

+ jquery
+ craydent
+ "js/JsonObjectEditor.jquery.craydent.js"
+ "css/joe-styles.css"

##What's new
+ List subset Selector
+Autocomplete textfield

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
		compact:true
	}
	var JOE = new JsonObjectEditor(specs);
	JOE.init();


##specs

###fields
Properties for all Fields

- `label`: what the field should display as 
- `value`: default value if not one in object
- `type`: what type of field should JOE show
- `rendering`: for css html and js
	- `text`: default single line text.
		- autocomplete: boolean
			- values:array of possibilities
	- `int`: integer field
	- `number`: number (float) field
	- `select`: select list. 
		- multiple(bool)
		- values(array of objects, [{value:"",name/display:""])
	- `geo`: shows a map
		- *takes a string array "[lat,lon]"*
		- center:[lat,lon], center of map
		- zoom: zoom level (higher zooms in more)
		- returns "[lat,lon]"

###defaultProfile
overwrites the default profile

###schemas 
a list of schema objects that can configure the editor fields, these can be given properties that are delegated to all the corresponding fields.

	var animalschema = 
	{
		_title:'Animal', *what shows as the panel header* 
		fields:['id','name','legs','species','weight','color','gender','animalLink'], *list of visible fields*
		_listID:'id', *the id for finding the object*
		_listTitle:'${name} ${species}', *how to display items in the list*
		/*callback:function(obj){
			alert(obj.name);
		},*/
		onblur:logit
		
	}
##menu##
an array of menu buttons

    //the default save button
    //this is the dom object, 
    //use _joe.current.object for current object
    var __saveBtn__ = {name:'save',label:'Save', action:'_joe.updateObject(this);', css:'joe-save-button'};

###Addition properties
**Changing the schema on the fly?**

	_joe.resetSchema(new schema name);



**css (included) options**

- joe-left-button
- joe-right-button

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

- subsets: name:string, filter:object 
- _listTemplate: html tempalte that uses ${var} to write out the dom element for the list item.
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
			+hidden:BOOL //don't show, but value is passed
			+locked:BOOL // show, but uneditable
			//events
			+onchange : FUNC
			+onblur : FUNC
			+onkeypress : FUNC
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