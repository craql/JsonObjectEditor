#Json Object Editor
Visually Edit Objects Using this GUID tool, what you do from there is up to you.

##required includes
+"css/joe-styles.css"
+js/jquery-1.10.2.min.js"
+"js/craydent-1.7.18.js"
+"js/JsonObjectEditor.jquery.craydent.js"

##In the pipeline
+Remove Profiles
+Conditional Fields
+required fields


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

an object of field object definitions (profile independent)
types ("type" property)

- text: default single line text.
- int: integer field
- number: number (float) field
- select: select list. 
	- multiple(bool)
	- values(array of objects, [{value:"",name/display:""])
- geo: shows a map
	- **takes a string array "[lat,lon]"**
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
###adding a new object

	_joe.show({},{schema:'animal',callback:addAnimal); 
	//or goJoe(object,specs)

	...
	function addAnimal(obj){
		animals.push(obj);
	}

###Conditional select that changes the item schema

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

###exporting an object in pretty format json (or minified)
JOE.exportJSON = function(object,objvarname,minify)