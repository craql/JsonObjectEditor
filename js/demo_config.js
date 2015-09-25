var demo_config = {
    schemas:{
        'function':{
            fields:[
                'name',
                'global_function',
                'source_code',
                'description',
                'parameters',

                '_id'
            ],
            idprop:'name',
            _listTitle:
                '<div class="joe-fright"><div class="joe-subtext">${_id}</div></div>'
                +'<div class="joe-title">${name}()</div><p>${parameters}</p>' +
                '<div>${description}</div>',
            _title:'&fnof; ${name}',
            _listMenuTitle:'Functions | ${_listCount}',
            listmenu:[__createBtn__]
        },
        'schema':{
            fields:[
                'name',
            ]
        }
    },
    fields:{
        //all items
        name:{label:'${} Name', onblur:'updateSourceCode()'},
        _id:{label:'ID',type:'guid'},
        description:{label:'Description',type:'code'},

        //function
        global_function:{label:'Global',type:'boolean', onchange:'updateSourceCode()'},
        source_code:{label:'Code',type:'content',
            run:function(item){
               // item = _joe.constructObjectFromFields()|| item;
                var evalString = '';
                try{
                    if(item.global_function){
                        evalString = eval(item.name);
                    }else{

                        if(item.ref && eval(item.ref+'.'+item.name)){
                            evalString = eval(item.ref+'.'+item.name);
                        }else{
                            evalString =(item.ref||'object')+' does not have the function '+item.name;
                        }
                    }
                }catch(e){
                    evalString = 'Could not evalutate: \n'+e;
                }

                return '<code><pre>'+evalString+'</pre></code>';
            }
        }

        //schema

       /* _title:{ 'Element | ${name}',
        _listWindowTitle: 'Elements',
        _listTitle:
        '<div class="fright joe-subtext">sort:${sort_order}</div>'+
        '<h4>${name}</h4>' +
        '<div class="joe-subtext">${RUN[_COUNT;${sub_modules};]} submodules</div>'+
        '<div class="subtext">${RUN[enumerate;${itags};]}</div>',*/

    },
    menu:[

        __saveBtn__,
        __quicksaveBtn__,
        __deleteBtn__,
        __duplicateBtn__
        /*	{name:'save',label:'Save', action:'NPC.saveJoeItem();', css:'joe-right-button joe-confirm-button'},
         {name:'cancel',label:'Cancel', action:'_joe.hide()', css:'joe-right-button'},


         {name:'duplicate',label:'Duplicate', action:'_joe.duplicateObject({deletes:[\'id\',\'_id\']});', css:'joe-left-button'},
         {name:'view',label:'Object', action:'alert(JSON.stringify(_joe.current.object,\'  \',\'  \')); logit(_joe.current.object);', css:'joe-left-button'},
         //__saveBtn__,

         {name:'delete',label:'Delete', action:'NPC.deleteJoeItem();', css:'joe-left-button'}*/
    ],
    //filters:true,
    useBackButton:true,
    listSubMenu:{filters:true},
    useHashlink:true,
    _title:'${itemtype} | ${name}'

};

function updateSourceCode(){
    _joe.rerenderField('source_code');
}