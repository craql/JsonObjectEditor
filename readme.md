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
	var JOE = new JsonObjectEditor(specs);
	JOE.init();


##specs
**fields:**
an object of field object definitions (profile independent)

**defaultProfile**
overwrites the default profile

**schemas:** a list of schema objects that can configure the editor fields


##usage
###adding a new object
_joe.show({},'animal','',addAnimal); //or goJoe(object,schema,profile,callback)

function addAnimal(obj){
	animals.push(obj);
}