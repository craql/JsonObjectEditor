/**
 * Created by core6924 on 1/28/2015.
 */
importScripts('libs/craydent-1.7.37.js');
//importScripts('libs/jquery-1.11.0.min.js');
var action;
var data;
onmessage = function(e) {

    console.log('Message received from main script');
    action = e.data.action;
    data = e.data.data;
    if(!action || !data){
        postMessage({error:'no action or data'});
        return false;
    }
var response;
    switch(action){
        case 'analyzeMerge':
            response = analyzeImportMerge(data.newArr,data.oldArr,data.idprop,data.specs);
            postMessage(response);
        break;
        default:
            postMessage({action:action,data:data});
        break;
    }



};

function analyzeImportMerge(newArr,oldArr,idprop,specs){
    try {
        var aimBM = new Benchmarker();
        var idprop = idprop || '_id';
        var defs = {
            //callback:printResults,
            deleteOld: false,
            dateProp: null,
            icallback: null
        };
        specs = $c.merge(defs, specs);
        var data = {
            add: [],
            update: [],
            same: [],
            delete: []
        };
        /*    var oldArr = oldArr.sortBy(idprop);
         var newArr = newArr.sortBy(idprop);*/

        var newObj, oldObj, matchObj, testObj, i = 0, query = {};
        var oldIDs = [];
        var newIDs = [];
//create an array of old object ids
        oldArr.map(function (s) {
            oldIDs.push(s[idprop]);
        });
        newArr.map(function (s) {
            newIDs.push(s[idprop]);
        });

        postMessage({worker_update:{message:'Finished part 1/4'}});
        var query = {};
        query[idprop] = {$nin: oldIDs};
        //adds
        data.add = newArr.where(query);

        //deletes
        query[idprop] = {$nin: newIDs};
        data.delete = oldArr.where(query);
        postMessage({worker_update:{message:'Finished part 2/4'}});

        //updates||same
        query[idprop] = {$in: newIDs};
        var existing = oldArr.where(query).sortBy(idprop);


        //for one-to-one, new items in the old array
        query[idprop] = {$in: oldIDs};
        var onetoone = newArr.where(query).sortBy(idprop);
        postMessage({worker_update:{message:'Finished part 3/4'}});

        for (var i = 0, len = existing.length; i < len; i++) {
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

        postMessage({action: action, worker_update: {current: i, total: newArr.length, time: aimBM.stop()}});
        data.results = {
            add: data.add.length,
            update: data.update.length,
            same: data.same.length,
            delete:data.delete.length

        };
        data.time = aimBM.stop();

        return data;
    }catch(e){
        postMessage({error:'e'});
    }

};