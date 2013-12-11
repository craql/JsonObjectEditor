#Json Object Editor
###Visually Edit Objects Using this GUID tool, what you do from there is up to you.

##required includes

<link rel="stylesheet" type="text/css" href="css/joe-styles.css">
<script src="js/jquery-1.10.2.min.js"></script>
<script src="js/craydent-1.7.18.js"></script>
<script src="js/JsonObjectEditor.jquery.craydent.js"></script>


##instantiation



##specs
**fields:**
an object of field object definitions (profile independent)

**defaultProfile**
overwrites the default profile

**extProfile


##usage
###adding a new object
_joe.show({},'animal','',addAnimal); //or goJoe(object,schema,profile,callback)

function addAnimal(obj){
	animals.push(obj);
}