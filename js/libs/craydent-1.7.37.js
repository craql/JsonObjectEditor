/*/---------------------------------------------------------/*/
/*/ Craydent LLC v1.7.37                                    /*/
/*/	Copyright 2011 (http://craydent.com/about)          /*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
/*/	(http://craydent.com/license)                       /*/
/*/---------------------------------------------------------/*/

/*----------------------------------------------------------------------------------------------------------------
/-	Global CONTANTS and variables
/---------------------------------------------------------------------------------------------------------------*/
var __version = "1.7.37",
__thisIsNewer = true,
$w = typeof window != "undefined" ? window : {location:(typeof location != "undefined"?location:{href:''}),console:(typeof console != "undefined"?console:{})},
$d = typeof document != "undefined" ? document : {},
$l = $w.location;

if ($w.__craydentLoaded || typeof($c) != "undefined") {
    var __current = ($w.__craydentVersion||$c.VERSION||"").split("."),
    __thisVersion = __version.split(".");
    if(__thisIsNewer = __isNewer(__current,__thisVersion)) {
        $c.VERSION = __version;
    }
}
function __isNewer(loadedVersion, thisVersion){
    if (loadedVersion[0] == thisVersion[0]) {
        loadedVersion.splice(0,1);
        thisVersion.splice(0,1);
        if (!thisVersion.length || !loadedVersion.length) {
            return false;
        }
        return __isNewer(loadedVersion, thisVersion);
    }
    return loadedVersion < thisVersion;
}
function __cleanUp() {
    try {
        delete $w.__current;
        delete $w.__thisVersion;
        delete $w.__thisIsNewer;
        delete $w.__isNewer;
        delete $w.__version;
        delete $w._ie;
        delete $w._droid;
        delete $w._amay;
        delete $w._browser;
        delete $w._os;
        delete $w._device;
        delete $w._engine;
    } catch(e) {
        $w.__current = undefined;
        $w.__thisVersion = undefined;
        $w.__thisIsNewer = undefined;
        $w.__isNewer = undefined;
        $w.__version = undefined;
        $w._ie = undefined;
        $w._droid = undefined;
        $w._amay = undefined;
        $w._browser = undefined;
        $w._os = undefined;
        $w._device = undefined;
        $w._engine = undefined;
    }
}
$w.__craydentVersion = __version;

if (__thisIsNewer) {

    var _ao,_ah, _df, _irregularNouns = {
        "addendum":"addenda",
        "alga":"algae",
        "alumna":"alumnae",
        "apparatus":"apparatuses",
        "appendix":"appendices",
        "bacillus":"bacilli",
        "bacterium":"bacteria",
        "beau":"beaux",
        "bison":"bison",
        "bureau":"bureaus",
        "child":"children",
        "corps":"corps",
        "corpus":"corpora",
        "curriculum":"curricula",
        "datum":"data",
        "deer":"deer",
        "die":"dice",
        "diagnosis":"diagnoses",
        "erratum":"errata",
        "fireman":"firemen",
        "focus":"focuses",
        "foot":"feet",
        "genus":"genera",
        "goose":"geese",
        "index":"indices",
        "louse":"lice",
        "man":"men",
        "matrix":"matrices",
        "means":"means",
        "medium":"media",
        "memo":"memos",
        "memorandum":"memoranda",
        "moose":"moose",
        "mouse":"mice",
        "nebula":"nebulae",
        "ovum":"ova",
        "ox":"oxen",
        "person":"people",
        "radius":"radii",
        "series":"series",
        "sheep":"sheep",
        "scissors":"scissors",
        "species":"species",
        "stratum":"strata",
        "syllabus":"syllabi",
        "tableau":"tableaux",
        "that":"those",
        "this":"these",
        "tooth":"teeth",
        "vertebra":"vertebrae",
        "vita":"vitae",
        "woman":"women",
        "zero":"zeros"
    };

    /*----------------------------------------------------------------------------------------------------------------
    /-	define functions preventing overwriting other framework functions
    /---------------------------------------------------------------------------------------------------------------*/
    /*----------------------------------------------------------------------------------------------------------------
    /-	private methods
    /---------------------------------------------------------------------------------------------------------------*/
    function __andNotHelper (record, query, operands) {
        try {
            for (var i = 0, len = query.length; i < len; i++) {
                for (var prop in query[i]) {
                    if (!query[i].hasOwnProperty(prop)) {
                        continue;
                    }
                    if (!(prop in operands
                        && _subQuery(record, query[i][prop], prop)
                        || _subQuery(record, query[i][prop], "$equals", prop)
                    )) {
                        return false;
                    }
                }
            }
            return true;
        } catch (e) {
            error('where.__andNotHelper', e);
        }
    }
    function __convert_regex_safe(reg_str) {
        try {
            return reg_str.replace(/\\/gi,"\\\\")
                .replace(/\$/gi, "\\$")
                .replace(/\//gi, "\\/")
                .replace(/\^/gi, "\\^")
                .replace(/\./gi, "\\.")
                .replace(/\|/gi, "\\|")
                .replace(/\*/gi, "\\*")
                .replace(/\+/gi, "\\+")
                .replace(/\?/gi, "\\?")
                .replace(/\!/gi, "\\!")
                .replace(/\{/gi, "\\{")
                .replace(/\}/gi, "\\}")
                .replace(/\[/gi, "\\[")
                .replace(/\]/gi, "\\]")
                .replace(/\(/gi, "\\(")
                .replace(/\)/gi, "\\)")
                .replace('\n','\\n');
        } catch (e) {
            error('__convert_regex_safe', e);
        }
    }
    function __dup (old) {
        try {
            for (prop in old){
                this[prop] = old[prop];	
            }
        } catch (e) {
            error('__dup', e);
        }
    }
    function __or (){
        try {
            for(var a = 0, len = arguments.length; a<len; a++){
                if(arguments[a]){
                    return arguments[a];
                }
            }
            return "";
        } catch (e) {
            error('fillTemplate.__or', e);
        }
    }
    function __count(arr){
        try {
            return arr.length;
        } catch (e) {
            error('fillTemplate.count', e);
        }
    }
    function __enum(obj, delimiter, prePost){
        try {
            delimiter = delimiter || ", ";
            prePost = prePost || ["",""];
            var props = [],
                str = "";
            if ($c.isArray(obj)) {
                props = obj.slice(0);
            }
            if ($c.isObject(obj)) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        props.push(prop);
                    }
                }
            }
            var pptemp = prePost.slice(0);
            for (var i = 0, len = props.length;i < len; i++) {
                pptemp[0] = pptemp[0].replace_all(['{ENUM_VAR}','{ENUM_VAL}'],[props[i],obj[props[i]]]);
                pptemp[1] = pptemp[1].replace_all(['{ENUM_VAR}','{ENUM_VAL}'],[props[i],obj[props[i]]]);
                str += pptemp[0] + props[i] + pptemp[1] + delimiter;
                pptemp = prePost.slice(0);
            }
            return str.slice(0,-1*delimiter.length);
        } catch (e) {
            error('fillTemplate.enum', e);
        }
    }
    function __run_replace (reg, template, use_run, obj) {
        try {
            var pre = "", post = "", split_param = "|", match;
            use_run && (pre="RUN[",post="]", split_param=/;(?!\\)/);

            while ((match = reg.exec(template)) && match[1]) {
                var funcValue = [],
                    func = "";

                funcValue = match[1].replace_all('\\[','[').replace_all('\\]',']').split(split_param);
                func = funcValue.splice(0,1)[0];

                for (var i = 0, len = funcValue.length; i < len; i++) {
                    if (funcValue[i].contains("${")) {
                        funcValue[i] = fillTemplate(funcValue[i], obj);
                    }
                    try {funcValue[i] = eval("(" + funcValue[i].replace_all(';\\', ';').replace_all('\\[','[').replace_all('\\]',']') + ")");} catch (e) {}
                }

                template = template.contains(match[1]) ? template.replace(match[1], (match[1] = match[1].replace_all('\\[', '[').replace_all('\\]', ']'))) : template;
                template = template.replace_all("${" + pre + match[1] + post +"}", $w.getProperty(func) ? $w.getProperty(func).apply(obj, funcValue) : "");
            }
            return template;
        } catch (e) {
            error('fillTemplate.__run_replace', e);
        }
    }
    
    function _ajaxServerResponse(response) {
        try {
            if (response.readyState == 4 && response.status==200) {

                var objResponse = {};
                try {
                    objResponse = eval(response.responseText.trim());
                } catch (e) {
                    objResponse = eval("(" + response.responseText.trim() + ")");
                }
                if (!objResponse || objResponse.hasErrors) {
                    return false;
                }
                return objResponse;
            }
            return false;
        } catch (e) {
            error("ajax._ajaxServerResponse", e);
            return false;
        }  
    }
    function _condense (obj, check_values, alter) {
        try {
            var skip = [], arr = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                if (check_values) {
                    var index = i;
                    if (skip.indexOf(i) != -1) {
                        continue;
                    }
                    while ((index = obj.indexOf(obj[i],index+1)) != -1) {
                        skip.push(index);
                    }

                }
                (skip.indexOf && skip.indexOf(i) || _indexOf(skip, i)) == -1 && obj[i] && arr.push(obj[i]);
            }
            return arr;
        } catch (e) {
            error("_condence", e);
            return false;
        }
    }
    function _craydentSelector (by, overwrite, object, single) {
        try {
            if (!object || object === true) {
                return undefined;
            }

            var elem = $d[by](object);
            if (single) {
                return ((elem && ((elem.length && elem[0]) || elem)) || $w[overwrite](object)[0]);
            }
            return (elem || $w[overwrite](object));
        } catch (e) {
            error('_craydentSelector', e);
        }
    }
    function _defineFunction (name, func, override) {
        try {
            var args = _getFuncArgs(func),
            fstr = func.toString().replace(/this/g,'obj'),
            exec = "",

            // extra code to account for when this == window
            extra_code = "if(obj === undefined && this == $c){return;}",
            fnew = args.length === 0 || (args.length === 1 && !_trim(args[0])) ? 
            //    fstr.toString().replace(/(\(\s*?\)\s*?\{)/, ' ' + name + '(obj){'+extra_code) :
            fstr.toString().replace(/(\(\s*?\)\s*?\{)/, ' (obj){'+extra_code) :
            "(" + fstr.toString().replace(/\((.*?)\)\s*?\{/, '(obj,$1){'+extra_code) + ")";
    
            if (!override && eval("typeof("+name+")") !== "undefined") {
                eval("$c."+name+" = "+fnew);
                return;
            }
            eval("$c."+name+" = "+fnew);
            //eval(fnew.replace("function","function "+name));
        } catch (ex) {
            error("_defineFunction", ex);
        }
    }
    _df = _defineFunction;
    function _displayHelper(object, func){
        try {
            return (($d.getElementById(object) && $(object)[func]()) 
                || (object instanceof HTMLElement && object[func]()) 
                || $w['_'+func+'overwrite'](object));
        } catch (e) {
            error("_displayHelper." + func, e);
        }
    }
    function _ext (cls, property, func, override) {
        try {
            cls['prototype'][property] = cls['prototype'][property] || func;
            _df(property, func, override);
        } catch (e) {
            error('_ext', e);
        }
    }
    function _even (num) {
        try {
            if (isNaN(num)) {
                return false;
            }
            return !(num&1);
        } catch (e) {
            error('_even', e);
        }
    }
    function _getBrowserVersion(browser){
        try {
            var info = navigator.userAgent;
            if (browser == "safari") {
                info = navigator.vendor;
            } else if (browser == "Opera") {
                info = $w.opera;
            }
            var index = navigator.userAgent.indexOf(browser);
            if (index == -1 && $w["is"+browser]()) return -1;
            return parseFloat(navigator.userAgent.substring(index+browser.length+1));
        } catch(e){
            error('_getBrowserVersion', e);
        }
    }
    function _getDimension(isBody, dimension) {
        try {
            if (!isBody && this.tagName.toLowerCase() == 'body') {
                var dim, currentStyle = $d.body.style[dimension];
                $d.body.style[dimension] = "100%";
                dim = $d.body[dimension](true);
                $d.body.style[dimension] = currentStyle;
            }
            var cRect = this.getClientRects && this.getClientRects()[0];
            return (cRect && cRect[dimension]) || this["offset" + dimension.capitalize()] || this["scroll" + dimension.capitalize()];
        } catch (e) {
            if (!this.parentNode && this != $d) {
                var temp = this.cloneNode(1),
                rtn;
                temp.style.visible = 'hidden';
                temp.style.position = 'absolute';
                temp["get" + dimension.capitalize()] = $d.body[dimension];
                $d.body.appendChild(temp);
                rtn = temp["get" + dimension.capitalize()]();
                temp.remove();
                return rtn;
            }
            error("_getDimension", e);
            return false;
        }
    }
    function _getFuncName (func) {
        try {
            return _trim(func.toString().replace(/\/\/.*?[\r\n]/gi,'').replace(/[\t\r\n]*/gi, '').replace(/\/\*.*?\*\//gi, '').replace(/.*?function\s*?(.*?)\s*?\(.*/,'$1'));
        } catch (e) {
            error('_getFuncName', e);
        }
    }
    function _getFuncArgs (func) {
        try {
            return _condense(_trim(_strip(func.toString(), '(')).replace(/\s*/gi, '').replace(/\/\*.*?\*\//g,'').replace(/.*?\((.*?)\).*/, '$1').split(','));
        } catch (e) {
            error('_getFuncArgs', e);
        }
    }
    function _getGMTOffset () {
        try {
            return this.getHours() - 24 - this.getUTCHours();
        } catch (e) {
            error('_getGMTOffset', e);
        }
    }
    function _indexOf (obj, value) {
        try {
            var len = obj.length,
            i = 0;
            while (i < len) {
                if (obj[i] === value) return i;
                ++i;
            }
            return -1;
        } catch (e) {
            error("_indexOf", e);
        }  
    }
    function _invokeHashChange() {
        try {
            var hc = $COMMIT.onhashchange || $c.onhashchange;
            hc && $c.isFunction(hc) && hc();
        } catch (e) {
            error('_invokeHashChange', e);
        }
    }
    function _isArray (obj) {
        try {
            if (obj === undefined) {return false;}
            return (obj.constructor == Array);
        } catch (e) {
            error('_isArray', e);
        }
    }
    function _isString (obj) {
        try {
            if (obj === undefined) {return false;}
            return (obj.constructor == String);
        } catch (e) {
            error('_isString', e);
        }
    }
    function _makePrecidenceBlocks(condition) {
        try {
            var index = condition.indexOf('('),
                parts = {before:'',after:'',block:{}};
            if (index != -1) {
                var lindex = condition.lastIndexOf('(');
                parts.before = condition.substring(0,index).trim();
                parts.after = condition.substring(lindex).trim();
                parts.block = _makePrecidenceBlocks(condition.substring(index+1,lindex-1));
                return parts;
            }
            parts.block = condition;
            return parts;
        } catch (e) {
            error('_makePrecidenceBlocks', e);
        }
    }
    function _processClause (clause) {
        try {
            var index = clause.indexOfAlt(/between/i);
            if (index != -1) { // contains between predicate
                //replace AND in the between to prevent confusion for AND clause separator
                clause.replace(/between( .*? )and( .*?)( |$)/gi,'between$1&and$2$3');
            }

            var ORs = clause.split(/ or /i), query = {"$or":[]};
            for (var i = 0, len = ORs.length; i < len; i++) {
                var ANDs = ORs[i].split(/ and /i),
                    aquery = {'$and':[]};
                for (var j = 0, jlen = ANDs.length; j < jlen; j++) {
                    var predicateClause = ANDs[j],
                        cond = {};

                    //=, <>, >, >=, <, <=, IN, BETWEEN, LIKE, IS NULL or IS NOT NULL
                    switch (true) {
                        case (index = predicateClause.indexOf('=')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$equals':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push(cond);
                        break;
                        case (index = predicateClause.indexOf('<>')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$ne':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push(cond);
                        break;
                        case (index = predicateClause.indexOf('>')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$gt':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push(cond);
                        break;
                        case (index = predicateClause.indexOf('>=')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$gte':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push({'$gte':cond});
                        break;
                        case (index = predicateClause.indexOf('<')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$lt':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push(cond);
                        break;
                        case (index = predicateClause.indexOf('<=')) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = {'$lte':tryEval(predicateClause.substring(index + 1).trim())};
                            aquery['$and'].push(cond);
                        break;
                        case predicateClause.indexOfAlt(/between/i) == 0 :
                            var nums = predicateClause.replace(/between (.*?) &and (.*?) ( |$)/i,'$1,$2').split(',');
                            aquery['$and'].push({'$gte':tryEval(nums[0])});
                            aquery['$and'].push({'$lte':tryEval(nums[1])});
                        break;
                        case (index = predicateClause.indexOfAlt(/ in /i)) != -1 :
                            var _in = tryEval(predicateClause.substring(index + 4).trim().replace(/\((.*)\)/,'[$1]'));
                            if (!_in) {
                                throw "Invalid syntax near 'in'";
                            }
                            cond[predicateClause.substring(0, index).trim()] = _in;
                            aquery['$and'].push({'$in':cond});
                        break;
                        case (index = predicateClause.indexOfAlt(/is null/i)) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = null;
                            aquery['$and'].push({'$equals':cond});
                        break;
                        case (index = predicateClause.indexOfAlt(/is not null/i)) != -1 :
                            cond[predicateClause.substring(0, index).trim()] = null;
                            aquery['$and'].push({'$ne':cond});
                        break;
                        case (index = predicateClause.indexOfAlt(/ like /i)) != -1 :
                            _trim(" 'lol' ", null, [' ',"'"])
                            var likeVal = "^" + _trim(predicateClause.substring(index + 6),null,[' ', "'", '"']).replace_all("%",".*?") + "$";
                            cond[predicateClause.substring(0, index).trim()] = {'$regex': new RegExp(likeVal,'i')};
                            aquery['$and'].push(cond);
                        break;
                    }
                }
                query['$or'].push(aquery);
            }

            return query;
        } catch (e) {
            error('where.processClause', e);
        }   
    }
    function _pv(path, delimiter, options) {
        try {
            options = options || {};
            delimiter = delimiter || ".";
            var props = path.split(delimiter);
            var value = this;
            for (var i = 0, len = props.length; i < len; i++) {
                if (value[props[i]] === undefined || value[props[i]] === null 
                || (options.noInheritance && !value.hasOwnProperty(props[i]))) {
                    return undefined;
                }
                value = value[props[i]];
            }
            options.validPath = 1;
            return value;
        } catch (e) {
            error('_pv', e)
        }
    }
    function _replace_all(replace, subject, flag) {
        try {
            if (!$c.isArray(replace) && !$c.isArray(subject)) {
                replace = [replace];
                subject = [subject];
            }
            var str = this;
            for (var i = 0, len = replace.length; i < len; i++)
            {
                if (!str.contains(replace[i])) {
                    continue;
                }
                str = str.replace(RegExp(__convert_regex_safe(replace[i]), flag), subject[i] || subject[0]);
            }
            return str;
        } catch (e) {
            error("_replace_all", e);
        }
    }
    function _set (variable, value, defer, options, loc){
        try {
            value = encodeURI(value);
            var ignoreCase = options.ignoreCase || options == "ignoreCase" ? "i" : "",
            regex = new RegExp('(.*)?(' + variable +'=)(.*?)(([&]|[@])(.*)|$)', ignoreCase),
            attr = "search",
            symbol = "&",
            queryStr = "";
            attr = variable.indexOf('@') == 0 ? (symbol='', "hash") : attr;

            $COMMIT[attr] = $COMMIT[attr] || "";

            if (defer) {
                $COMMIT[attr] = ($COMMIT[attr] || $l[attr]);
                queryStr = regex.test($COMMIT[attr]) ? 
                $COMMIT[attr].replace(regex, '$1$2' + value + '$4') : 
                $COMMIT[attr] + symbol + variable + '=' + value;
                if (symbol == "&" && queryStr.indexOf('&') == 0) {
                    queryStr = "?" + queryStr.substring(1);
                }
                $COMMIT[attr] = queryStr;
                $COMMIT.update = true;
            } else {
                queryStr = regex.test(loc[attr]) ? 
                loc[attr].replace(regex, '$1$2' + value + '$4') : 
                loc[attr] + symbol + variable + '=' + value;
                if (symbol == "&" && queryStr.indexOf('&') == 0) {
                    queryStr = "?" + queryStr.substring(1);
                }
                loc[attr] = queryStr;
                if (attr == 'hash') {
                    $COOKIE("CRAYDENTHASH", loc.hash[0] == '#' ? loc.hash.substring(1) : loc.hash);
                    _invokeHashChange();
                }
            }
            return loc;
        } catch (e) {
            error("_set", e);
        }
    }
    function _setDOMElementProperties(_elem) {
        try {
            if (!_elem) {
                return;
            }
            for (var prop in $w.HTMLElement.prototype) {
                if ($w.HTMLElement.prototype.hasOwnProperty(prop)) {
                    try {
                        if (prop == "dataset" || prop == "firstElementChild" || prop == "nextElementSibling") {
                            _elem[prop] = $w.HTMLElement.prototype['_' + prop]();
                            //return;
                        }
                        _elem[prop] = $w.HTMLElement.prototype[prop];
                    } catch(e) {

                    }
                }
            }
        } catch (e) {
            error("_setDOMElementProperties", e);
        }
    }
    function _strip (str, character) {
        try {
            return _trim(str, undefined, character);
        } catch (e) {
            error("_strip", e);
        }
    }
    function _subFieldHelper(obj, operands) {
        try {
            if (!$c.isObject(obj)) {
                return false;
            }

            for (var prop in obj) {
                if (prop in operands) {
                    return prop;
                }
            }
            return false;
        } catch (e) {
            error('_subFieldHelper', e);
        }
    }
    function _subQuery(record, query, operator, field) {
        try {
            var operands = {
                "$or":1,
                "$and":1,
                "$in":1,
                "$nin":1,
                "$regex":1,
                "$gt":1,
                "$lt":1,
                "$gte":1,
                "$lte":1,
                "$exists":1,
                "$equals":1,
                "$ne":1,
                "$nor":1,
                "$type":1,
                "$text":1,
                "$mod":1,
                "$all":1,
                "$size":1,
                "$where":1,
                "$elemMatch":1,
                "$not":1},
                value = $c.getProperty(record, field || ""),
                opt = operator,
                rtn = false;

            // prep multiple subqueries
            for (var prop in query) {
                if (query.hasOwnProperty(prop) && prop in operands) {
                    if(!$c.isArray(opt)) {
                        opt = [];
                    }
                    opt.push(prop);
                }
            }

            if (!$c.isArray(opt)) {
                opt = [opt];
            }

            for (var i = 0, len = opt.length; i < len; i++) {
                if (!rtn && i > 0) {
                    return rtn;
                }
                switch(opt[i]) {
                    case "$equals":
                        var isRegex = query.constructor == RegExp;
                        if (value === undefined) {
                            return false;
                        }
                        rtn = isRegex ? query.test(value) : 
                                (query.hasOwnProperty("$equals") ? value == query['$equals'] : value == query);
                    break;

                    case "$ne":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = value != query['$ne'];
                    break;

                    case "$lt":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = value < query['$lt'];
                    break;

                    case "$lte":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = value <= query['$lte'];
                    break;
                    case "$gt":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = value > query['$gt'];
                    break;
                    case "$gte":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = value >= query['$gte'];
                    break;
                    case "$nor":
                        for(var i = 0, len = query.length; i < len; i++) {
                            if (_subQuery(record,[query[i]],'$or',field)) {
                                return false;
                            }
                        }
                        rtn = true;
                    break;
                    case "$regex":
                        if (value === undefined) {
                            return false;
                        }
                        rtn = query["$regex"].test(value);
                    break;
                    case "$exists":
                        var finished = {validPath:0};
                        $c.getProperty(record, field,".",finished);
                        rtn = finished.validPath == query["$exists"];
                    break;
                    case "$type":
                        if (value === undefined && query === undefined || value !== undefined && value.constructor == query) {
    //                        return true;
                            rtn = true;
                            break;
                        } 
                        return false;
                    break;
                    case "$text":
                        //return record.getProperty(field).contains(query['$search']);
                        break;
                    case "$mod":
                        if (!$c.isArray(query) || value === undefined) {
                            return false;
                        }
                        rtn = value % query[0] == query[1];
                    break;
                    case "$all":
                        if (!$c.isArray(value) || !$c.isArray(query)) {
                            return false;
                        }
                        for (var i = 0, len = query.length; i < len; i++) {
                            if (!$c.contains(value, query[i])) {
                                return false;
                            }
                        }
                        rtn = true;
                    break;
                    case "$size":
                        var val = parseInt(query);
                        if (!$c.isArray(value) || !val && val !== 0) {
                            return false;
                        }
                        rtn = value.length == val;
                    break;
                    case "$where":
                        rtn = $c.isFunction(query) ? query.call(record) : tryEval.call(record, "(function(){"+query+"}).call(this)");
                    break;
                    case "$elemMatch":
                        //query = { student: "Jane", grade: { $gt: 85 } } } };
                        if (!$c.isArray(value)) {
                            return false;
                        }
                        for (var i = 0, brk = false, len = value.length; i < len && !brk; i++) {
                            var obj = value[i],
                                val, operand;
                            for (var prop in query) {
                                if (!query.hasOwnProperty(prop)) {
                                    continue;
                                }
                                if ($c.isObject(query[prop])) {
                                    val = [query[prop]];
                                    operand = "$or";
                                } else {
                                    val = query[prop];
                                    operand = "$equals";  
                                }
                                if (_subQuery(record, val, operand, prop)) {
                                    brk = true;
                                    break;
    //                                return true;
                                }
                            }
                        }
                        rtn = brk;
                    break;
                    case "$or":
                        if (!$c.isArray(query)) {
                            return false;
                        }
                        var satisfied = false;
                        for (var i = 0, len = query.length; i < len && !satisfied; i++) {
                            for (var prop in query[i]) {
                                var subprop = _subFieldHelper(query[i][prop], operands);
                                if (!(satisfied = prop in operands?
                                    _subQuery(record, query[i][prop], prop) : 
                                    (subprop ? _subQuery(record, query[i][prop], subprop, prop) :
                                        _subQuery(record, query[i][prop], "$equals", prop)))) {
                                    break;
                                }
                            }
                        }
                        rtn = satisfied;
                    break;
                    case "$and":
                        rtn = __andNotHelper (record, query, operands);
                    break;
                    case "$not": 
                        if ($c.isObject(query)) {
                            rtn = !__andNotHelper (record, query, operands);
                            break;
                        }
                        var isRegex =  query == RegExp;
                        rtn = isRegex ? query.test(value) : value == query;
                    break;


                    case "$in":
                    case "$nin":
                        var isNIN = operator == "$nin";
                        rtn = isNIN;
                        for (var fieldProp in query) {
                            if (!query.hasOwnProperty(fieldProp)) {
                                continue;
                            }
                            value = $c.getProperty(record, field);
                            for (var k = 0, klen = query[fieldProp].length; k < klen; k++) {
                                var isRegex = query[fieldProp][k] && query[fieldProp][k].constructor == RegExp; //array of values
                                if (isRegex ? query[fieldProp][k].test(value) : value == query[fieldProp][k]) {
                                    rtn = true;
                                    if (isNIN) {
                                        return !rtn;
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    break;
                }
            }
            return rtn;
        } catch (e) {
            error('_subQuery', e);
        }
    }
    function _trigger(el, event, type) {
        var options = $c.merge({
            pointerX: 0,
            pointerY: 0,
            button: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            bubbles: true,
            cancelable: true
        }, arguments[3] || {});
        if ($d.createEvent) {
            var evt = $d.createEvent(type || "MouseEvents");

            if (type == 'HTMLEvents') {
                evt.initEvent(event, options.bubbles, options.cancelable);
            }
            else {
                evt.initMouseEvent(event, options.bubbles, options.cancelable, $d.defaultView,
                options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, el);
            }
            el.dispatchEvent(evt);
        }
        else {
            options.clientX = options.pointerX;
            options.clientY = options.pointerY;
            var evtobj = $d.createEventObject();
            evt = $c.merge(evtobj, options);
            el.fireEvent('on' + event, evt);
        }
        return el;
    }
    function _trim(str, side, characters) {
        try {
            var temp = str,
            trimChars = {
                " ":1,
                "\t":1,
                "\n":1
            };
            if (characters) {
                if (_isArray(characters)) {
                    var char = "", i = 0;
                    trimChars = {};
                    while (char = characters[i++]) {
                        trimChars[char] = 1;
                    }
                } else if (_isString(characters)) {
                    trimChars = eval('({"'+characters+'":1})');
                }
            }
            if (!side || side == 'l') {
                while (temp.charAt(0) in trimChars) {
                    temp = temp.substring(1);
                }
            }
            if (!side || side == 'r') {
                while (temp.charAt(temp.length - 1) in trimChars) {
                    temp = temp.substring(0, temp.length - 1);
                }
            }
            return temp.toString();
        } catch (e) {
            error("_trim", e);
        }
    }
    function _whereHelper(objs,condition,callback) {
        var returnAll = true;
        for (var prop in condition) {
            if (condition.hasOwnProperty(prop)) {
                returnAll = false;
                break;
            }
        }
        // if sql syntax convert to mongo object syntax
        if ($c.isString(condition) && condition) {
            condition = _processClause(condition);
            returnAll = false;
        }


        for (var i = 0, len = objs.length; i < len; i++) {
            if (returnAll || _subQuery(objs[i], [condition],'$or')) {
                if(!callback.call(objs, objs[i], i)) {
                    break;
                }
            }
        }
    }

    
    /*----------------------------------------------------------------------------------------------------------------
    /-	Class prototypes
    /---------------------------------------------------------------------------------------------------------------*/
    function addObjectPrototype(name, func, override) {
           
        try {
            var shouldOverride = false;
            if (eval("typeof("+name+")") == "undefined") {
                shouldOverride = true;
            }
            (!override && Object.prototype[name]) || Object.defineProperty(Object.prototype, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: func
            });
            override = shouldOverride;

        } catch (e) {
            error("addPrototype", e);
            try {
                Array.prototype[name] = !override && Array.prototype[name] || func;
                Function.prototype[name] = !override && Function.prototype[name] || func;
                String.prototype[name] = !override && String.prototype[name] || func;
                Number.prototype[name] = !override && Number.prototype[name] || func;
                Boolean.prototype[name] = !override && Boolean.prototype[name] || func;

                if (navigator.geolocation) {
                    var GeoLocation = navigator.geolocation.constructor;
                    GeoLocation.prototype[name] = !override && GeoLocation.prototype[name] || func;
                }
            } catch (ex) {
                error("addPrototype:Non-ECMAScript 5", e);
            }
        }
        _df(name, func, override);
    }
    _ao = addObjectPrototype;
    
    
    /*----------------------------------------------------------------------------------------------------------------
    /-	Benchmark testing Class
    /---------------------------------------------------------------------------------------------------------------*/
    function Benchmarker() {
        try {
            this.start = new Date();
            this.end = "";
            this.executionTime = 0;
            this.stop = function (func) {
                this.end = new Date();
                this.executionTime = (this.end - this.start)/1000;
                return this.executionTime;
            };
        } catch (e) {
            error('BenchMarker', e);
        }
    }

    
    /*----------------------------------------------------------------------------------------------------------------
    /-	Ajax operations
    /---------------------------------------------------------------------------------------------------------------*/
    function ajax(params){
        try {
            var need_to_shard = false, browser_url_limit = 1500, query;
            params.dataType = params.dataType || 'json';
            params.hitch = params.hitch || "";
            params.oncomplete = params.oncomplete || function () {};
            params.onbefore = params.onbefore || function (tag,thiss) {};
            params.onerror = params.onerror || function (data,hitch,thiss,context) {};
            params.onsuccess = params.onsuccess || function (data,hitch,thiss,context) {};
            params.query = params.query || "";
            // commented line below is a valid parameter value
            /*params.shard_data = params.shard_data;
            params.context = params.context;
            params.header = params.header;
            params.method = params.method;
            params.onstatechange = params.onstatechange;
            params.onfileload = params.onfileload;
            params.onprogress = params.onprogress;
            params.onabort = params.onabort;
            params.onerror = params.onerror;
            params.onloadstart = params.onloadstart;
            params.run = params.run;
            params.jsonp = params.jsonp;
            params.jsonpCallback = params.jsonpCallback*/
            params.thiss = this;
            params.url = params.url || "";

            if (params.dataType.toLowerCase() == 'jsonp') {
                var head = $d.getElementsByTagName('head')[0],
                func = params.jsonpCallback || '_cjson' + Math.floor(Math.random() * 1000000),
                insert = 'insertBefore',
                tag = $d.createElement('script');
                //if (!params.jsonpCallback) {
                    while (!params.jsonpCallback && $w[func]) {
                        func = '_cjson' + Math.floor(Math.random() * 1000000);
                    }
                    params.jsonpCallback && (params.onsuccess = $w[func]);
                    $w[func] = function (data) {
                        if (params.query) {
                            var thiss = params.thiss;
                            delete params.thiss;
                            ajax.call(thiss, params);
                        } else {
                            (!data.hasErrors && 
                                (params.onsuccess.call((params.context||params.thiss),data, params.hitch, params.thiss, params.context) || true)) || 
                                params.onerror.call((params.context||params.thiss),data, params.hitch, params.thiss, params.context);
                            params.oncomplete();
                            if (params.jsonpCallback) {
                                $w[func] = params.onsuccess;
                            } else {
                                delete $w[func];
                            }
                        }
                    };
                //}
                if (params.shard_data && params.query && !$c.isObject(params.query) && params.query.length > browser_url_limit) {
                    need_to_shard = true;
                    var query_parts = params.query;
                    params.query = {};
                    query_parts = query_parts.indexOf('?') == 0 ? query_parts.substr(1) : query_parts;
                    query_parts = query_parts.split("&");
                    // params.query now has the object representation of the query
                    query_parts.map(function(str){
                        var name_value = str.split('=');
                        this[encodeURIComponent(name_value[0])] = encodeURIComponent(name_value[1]);
                    },params.query);
                } else if (params.query && $c.isObject(params.query)) {
                    query = $c.toStringAlt(params.query, '=', '&',true);
                    if (query.length > browser_url_limit) {
                        need_to_shard = true;
                    } else {
                        params.query = query;
                    }
                }

                // if need_to_shard is true then params.query is an object
                // and if if need_to_shard is false, params.query is a string ready by sent
                query = params.query,
                url = params.url;
                if (need_to_shard) {
                    if (params.__FIRST === undefined) {
                        params.__FIRST = true;
                    } else {
                        params.__FIRST = false;
                    }
                    params.__EOF = true;
                    query = "&EOQ=false";
                    for (prop in params.query) {
                        var pair = '&' + encodeURIComponent(prop) + "=" + encodeURIComponent(params.query[prop]);
                        if ((query + prop +"xxx").length > browser_url_limit) {
                            break;
                        }
                        query += '&' + encodeURIComponent(prop) + "=" + encodeURIComponent(params.query[prop]);
                        if (query.length > browser_url_limit) {
                            var left_over = query.substr(browser_url_limit);
                            query = query.substr(0, browser_url_limit);
                            params.query[prop] = left_over;
                            break;
                        }
                        delete params.query[prop];
                    }
                } else {
                    params.__EOF && (params.__EOF = "true");
                    delete params.query;
                }
                query = (params.run ? "&run=" + params.run :"") + 
                    (query || "") + 
                    ((params.__EOF && params.__EOF === "true" && ("&EOQ=true")) || "") +
                    ((params.__FIRST && ("&FIRST=true")) || "");
                url += (params.url.indexOf('?') != -1 ? "&" : "?") + (params.jsonp || "callback=") + func + (query || "");         

                tag['type'] = "text/javascript";
                tag.async = "async";
                tag['src'] = url;

                // Attach handlers for all browsers
                tag.onload = tag.onreadystatechange = function(ev) {
                    try {
                        if (!this.readyState || /complete|loaded/.test( this.readyState ) ) {
                            // Handle memory leak in IE
                            this.onload = this.onreadystatechange = null;

                            // Remove the script
                            if ( head && this.parentNode && IEVersion () == -1) {
                                head.removeChild( this );
                            }
                        // Dereference the script
                        //delete this;
                        }
                    } catch (e) {
                        error('ajax.tag.statechange', e);
                    }
                };
                params.onbefore(tag, this);
                head[insert](tag, head.firstChild);
            } else {
                var httpRequest = new Request(),
                fileUpload = httpRequest.upload || {};
                params.method = params.method || "POST";
                params.headers = params.headers || Array();

                if (params.query && $c.isObject(params.query)) {
                    params.query = $c.toStringAlt(params.query, '=', '&', true);
                }
                params.query = (params.run ? "run=" + params.run :"") + (params.query || "");
                params.contentType = params.contentType || "application/x-www-form-urlencoded";
                params.onstatechange = params.onstatechange || function () {};

                fileUpload.onload = params.onfileload || function () {};
                fileUpload.onprogress = params.onprogress || function () {};
                fileUpload.onabort = params.onabort || function () {};
                fileUpload.onerror = params.onerror || function () {};
                fileUpload.onloadstart = params.onloadstart || function () {};

                if (params.method == "GET") {
                    params.url += params.query ? "?" + params.query : "";
                    params.query = undefined;
                }
                params.onbefore(httpRequest, this);
                httpRequest.onreadystatechange = function (xp) {
                    params.onstatechange(xp);
                    var data = _ajaxServerResponse(this);
                    if (data) {
                        params.onsuccess.call((params.context||this), data, params.hitch, params.thiss, params.context, this.status);
                    } else if (this.readyState == 4) {
                        try {
                            params.onerror.call((params.context||this), eval(this.responseText), params.hitch, params.thiss, params.context, this.status);
                        } catch (e) {
                            params.onerror.call((params.context||this), this.responseText, params.hitch, params.thiss, params.context, this.status);
                        }
                    }
                    params.oncomplete();
                };
                httpRequest.open(params.method, params.url, true);
                httpRequest.setRequestHeader("Content-type", params.contentType);

                for (var i = 0; i < params.headers.length; i++) {
                    var header = params.headers[i];
                    httpRequest.setRequestHeader(header.type, header.value);
                }
                httpRequest.send(params.query);
            }
        } catch (e) {
            error("ajax", e);
        }
    }
    function Request() {
        try {
            var ajaxHttpCaller;
            try {
                //request object for mozilla
                ajaxHttpCaller = new XMLHttpRequest();
            } catch (ex) {
                //request object for IE
                try {
                    ajaxHttpCaller = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (ex) {
                    try {
                        ajaxHttpCaller = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (ex) {       
                        return null;
                    }
                }
            }
            return ajaxHttpCaller;
        } catch (e) {
            error("Request", e);
        }
    }   
    
    /*----------------------------------------------------------------------------------------------------------------
    /-	helper operations
    /---------------------------------------------------------------------------------------------------------------*/
    /*  $COOKIE
     *  options can have the properties:
     *      expiration : int
     *      path : string
     **/
    function $COOKIE(key, value, options) {
        try {
            options = options || {};
            var c = $d.cookie;
            if (options.cookie) {
                c = options.cookie;
            }
            if($c.isObject(key)) {
                for (prop in key) {
                    options = value;
                    value = key[prop];
                    key = prop;
                    break;
                }
            }
            var cookies = {},    
            arr = c.split(/[,;]/);

            if (!c && !value) {
                return;
            }
            if (value) {
                var expires = "", path = "";
                if ($c.isInt(options.expiration)) {
                    var dt = new Date();
                    dt.setDate(dt.getDate() + options.expiration);
                    expires = "; expires=" + dt.toUTCString();
                }
                if ($c.isString(options.path)) {
                    path = "; path=/" + options.path;
                }
                key = encodeURIComponent(key);
                value = encodeURIComponent(value);
                $d.cookie = key + "=" + value + expires + path;
                return;
            }
            for (var i = 0, len = arr.length; i < len; i++) {
                var cookie = arr[i],            
                parts = cookie.split(/=/, 2),
//                name = decodeURIComponent($c.ltrim(parts[0])),
                name = decodeURIComponent(parts[0] && parts[0].ltrim && parts[0].ltrim() || ""),
                value = parts.length > 1 ? decodeURIComponent($c.rtrim(parts[1])) : null;
                cookies[name] = value;
                if (key && key == name) {
                    return value;
                }
            }

            if (key) {
                return false;
            }
            return cookies;
        } catch (e) {
            error('$COOKIE', e);
        }
    }
    function $GET(variable, options) {//used to retrieve variables in the url
        try {
            if (!variable) {
                var allkeyvalues = {},
                mapFunc = function(value){
                    if (value == "") {
                        return;
                    }
                    var keyvalue = value.split('='),
                    len = keyvalue.length;
                    if (len > 2) {
                        for (var i = 2; i < len; i++) {
                            keyvalue[1] += keyvalue[i];
                        }
                    }
                    return allkeyvalues[keyvalue[0]] = keyvalue[1];
                };

                ($l.search[0] == "?" ? $l.search.substr(1) : $l.search).split('&').map(mapFunc);
                ($l.hash[0] == "#" ? $l.hash.substr(1) : $l.hash).split('@').map(mapFunc);
                return allkeyvalues;
            }
            options = options || {};
            var ignoreCase = options.ignoreCase || options == "ignoreCase" ? "i" : "",
            defer = !!$COMMIT.update && (options.defer || options == "defer"),
            regex = new RegExp("[\?|&|@]" + variable + "=", ignoreCase),
            attr = "search",
            location = {};
            location.hash = $l.hash;
            location.search = $l.search;

            if (defer) {
                location.hash = $COMMIT.hash || "";
                location.search = $COMMIT.search || "";
            } else if (options.url || $c && $c.isString && ($c.isString(options) && (options.indexOf("?") != -1 || options.indexOf("#") != -1))) {
                var query = options.url || options,
                hindex, qindex = query.indexOf("?");

                qindex != -1 && (query = query.substr(qindex));

                hindex = query.indexOf("#");
                if (hindex != -1) {
                    location.hash = query.substr(hindex);
                    query = query.substr(0,hindex);
                }
                location.search = query;
            }

            var delimiter = "&";
            if (regex.test(location.hash)) {
                attr = 'hash';
                delimiter = "@";
            } else if (!regex.test(location.search)){
                return false;
            }
            regex = new RegExp('(.*)?(' + variable +'=)(.*?)(([' + delimiter + '])(.*)|$)', ignoreCase);
            return decodeURI(location[attr].replace(regex, '$3'));
        } catch (e) {
            logit('$GET');
            logit(e);
        }
    }
    function $SET(keyValuePairs, options) {
        try {
            if (arguments.length == 3 || $c.isString(keyValuePairs)) {
                var variable = keyValuePairs;
                keyValuePairs = {};
                keyValuePairs[variable] = options;
                options = arguments[2] || {};
            } else if (!options) {
                options = {};
            }
            var defer = options.defer || options == "defer" ? true : false,
            loc = {
                'search' : $l.search, 
                'hash' : $l.hash
            };
            if ($c.isArray(keyValuePairs)) {
                for (var i = 0, len = keyValuePairs.length; i < len; i++) {
                    var keyValuePair = keyValuePairs[i];
                    loc = _set(keyValuePair.variable, keyValuePair.value, defer, options, loc);
                }
            } else if ($c.isObject(keyValuePairs)) {
                for (variable in keyValuePairs) {
                    if (!keyValuePairs.hasOwnProperty(variable)) {
                        continue;
                    }
                    loc = _set(variable, keyValuePairs[variable], defer, options, loc);
                }
            }

            if (!defer) {
                var noHistory = options.noHistory || options == "noHistory" || options == "h";
                if (noHistory) {
                    if(loc.hash[0] != "#") {
                        loc.hash = "#" + loc.hash;
                    }
                    if (loc.search && loc.search[0] != "?") {
                        loc.search = "?" + loc.search;
                    }
                    $l.replace(loc.search + loc.hash);
                    return;
                }
                $l.hash = loc.hash;
                if ($l.search.trim() != loc.search.trim()) {
                    $l.search = loc.search;
                }
            }
        } catch (e) {
            error("$SET", e);
        }
    }
    function $DEL(variables, options){
        try {
            if ($c.isString(variables)) {
                variables = [variables];
            }
            options = options || {};
            var ignoreCase = options.ignoreCase || options == "ignoreCase" ? "i" : "",
            defer = options.defer || options == "defer" ? true : false,
            regex, attr;
            for (var i = 0, len = variables.length; i < len; i++) {
                var variable = variables[i];
                regex = new RegExp("[\?|&|@]" + variable + "=", ignoreCase),
                attr = "search";
                if (regex.test($l.hash)) {
                    attr = 'hash';
                } else if (!regex.test($l.search)){
                    continue;
                }

                $COMMIT[attr] = $COMMIT[attr] || "";

                regex = new RegExp('([&]?|[@])(' + variable + '=([^&|^@]*)[&]?)', ignoreCase);

                if (!defer) {
                    $l[attr] = $l[attr].replace(regex, '');
                    if (attr == 'hash') {
                        _invokeHashChange();
                    }
                } else {		
                    $COMMIT[attr] = ($COMMIT[attr] || $l[attr]);
                    $COMMIT[attr] = $COMMIT[attr].replace(regex, '');
                    $COMMIT.update = true;
                }
            }
            return true;
        } catch (e) {
            error("$DEL", e);
            return false;
        }
    }
    function $COMMIT(options) {
        try {
            options = options || {};
            var noHistory = options.noHistory || options == "noHistory" || options == "h";
            if ($COMMIT.update) {
                if ($COMMIT.search) {
                    if (noHistory) {
                        $l.replace($COMMIT.search + ($COMMIT.hash || ""));
                    } else {
                    $l.href = $COMMIT.search + ($COMMIT.hash || "");
                    }
                } else if ($COMMIT.hash) {
                    if (noHistory) {
                        var hash = $COMMIT.hash[0] == '#' ? $COMMIT.hash : "#" + $COMMIT.hash
                        $l.replace($COMMIT.hash);
                    } else {
                    $l.hash = $COMMIT.hash;
                    }
                    $COOKIE("CRAYDENTHASH", $l.hash[0] == '#' ? $l.hash.substring(1) : $l.hash);
                    _invokeHashChange();
                }
                $ROLLBACK();
            }
        } catch (e) {
            error('$COMMIT', e);
        }
    }
    function $ROLLBACK() {
        try {
            delete $COMMIT.update;
            delete $COMMIT.noHistory;
            delete $COMMIT.search;
            delete $COMMIT.hash;
            delete $COMMIT.onhashchange;
        } catch (e) {
            error('$ROLLBACK', e);
        }
    }
    
    function ChromeVersion (){
        try {
            var browser = "Chrome"
            return _getBrowserVersion(browser);   
        } catch(e){
            error('ChromeVersion', e);
        }
    }
    function FirefoxVersion (){
        try {
            var browser = "Firefox"
            return _getBrowserVersion(browser);
        } catch(e){
            error('FirefoxVersion', e);
        }
    }
    function OperaVersion (){
        try {
            var browser = "Opera"
            return _getBrowserVersion(browser);   
        } catch(e){
            error('OperaVersion', e);
        }
    }
    function SafariVersion (){
        try {
            var browser = "Safari"
            return _getBrowserVersion(browser);
        } catch(e){
            error('SafariVersion', e);
        }
    }
    
    
    function addHTMLPrototype (name,fn, override) {
        try {
            var prototypeDefined = !!HTMLElement.prototype[name];
            if (prototypeDefined && HTMLElement.prototype[name].overwritten) {
                override = true;
            }
            var original = override ? "" : "HTMLElement.prototype." + name + " || ";
            eval("HTMLElement.prototype." + name + " = " + original + "fn");
            if (!prototypeDefined || override) {
                HTMLElement.prototype[name].overwritten = true;
            }
            if ($c.isFunction($w.HTMLElement)) {
                $d.body && (!$d.body[name] || override) && ($d.body[name] = fn);
            }
            _df(name, fn, override);
        } catch (e) {
            error("addHTMLPrototype", e);
        }
    }   
    function cacheImages(imgs) {
        try {
            for (var i = 0, len = imgs.length; i < len; i++) {
                var img = $d.createElement('img');
                img.src = imgs[i];	
            }
        } catch (e) {
            error('cacheImages', e);
        }
    }
    function cout(){
        try {
            if($c && $c.DEBUG_MODE && console && console.log){
                for (var i = 0, len = arguments.length; i < len; i++) {
                    console.log(arguments[i]);
                }
            }
        } catch (e) {
            error('cout', e);
        }
    }
    function cuid(){
        try {
            //thanks broofa
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        } catch (e) {
            error('cuid', e);
        }
    }
    function error(fname, e) {
        try {
            $c.DEBUG_MODE && cout("Error in " + fname + "\n" + (e.description || e), e);
        } catch (e) {
            cout("Error in " + fname + "\n" + (e.description || e));
        }
    }
    function fillTemplate (htmlTemplate, objs, offset, max) {
        try {
            if (offset !== undefined && max == undefined) {
                max = offset;
                offset = 0;
            }

            htmlTemplate = htmlTemplate || "";
            $c.isDomElement(htmlTemplate) && (htmlTemplate = htmlTemplate.toString());
            if (htmlTemplate.trim() == "") {
                return "";
            }
            if ($c.isString(objs)) {
                try {
                    objs = eval("(" + objs + ")");
                } catch (ex) {
                    return "";
                }
            }
            objs = objs || [{}];
            if (!$c.isArray(objs)) {
                objs = [objs];
            }
            var html = "",
                variable,
                value,
                hasDataProps = htmlTemplate.contains('${dataproperties}');
            for (var j = 0, jlen = $c.TEMPLATE_VARS.length; j < jlen; j++) {
                variable = $c.TEMPLATE_VARS[j].variable;
                value = $c.TEMPLATE_VARS[j].value;
                if (!variable) {continue;}
                value = $c.isFunction(value) ? value(obj,i):value;
                htmlTemplate = htmlTemplate.replace_all("${"+variable+"}", value);
            }
            max = max || objs.length;
            offset = offset || 0;

            var props = (htmlTemplate.match(/\$\{.*?\}/g) || []).condense(true);


            for (var i = offset; i < max; i++) {
                var obj = objs[i], regex, template = htmlTemplate;
                if (!$c.isObject(obj)) {
                    continue;
                }

                if (template.contains("${this}")) {
                    template = template.replace_all(["${this}","${index}"],[parseRaw(obj, true).replace_all([';','[',']'], [';\\','\\[','\\]']),i]);
                }


                while (template.contains("${this.") && (match=/\$\{this\.(.+?)\}/.exec(template))) {
                    value = parseRaw($c.getProperty(obj, match[1]), true);
                    template= template.replace_all("${this."+match[1]+"}", value);
                }
                var objval;
                for (var j = 0, jlen = props.length; j < jlen; j++) {
                    var property = props[j].slice(2,-1);
                    if (!obj.hasOwnProperty(property)) {
                        continue;
                    }
                    var expression = "${"+property+"}";
                    if (template.contains(expression) && (objval = $c.getProperty(obj,property,null,{noInheritance:true})) /*&& (objval = obj[property])*/) {
                        objval = parseRaw(objval, true).replace_all(['\n',';','[',']'],['<br />',';\\','\\[','\\]']);
                        template = template.replace_all(expression, objval);

                        if (hasDataProps) {
                            template = template.replace_all('${dataproperties}', "data-" + property + "='" + (objval.indexOf('<') && "" || objval) + "' ${dataproperties}");
                        }
                    }
                }
                template = template.replace_all('\n', '');
                // special run sytax
                template = template.contains("${COUNT") ? template.replace(/\$\{COUNT\[(.*?)\]\}/g, '${RUN[__count;$1]}') : template;
                template = template.contains("${ENUM") ? template.replace(/\$\{ENUM\[(.*?)\]\}/g, '${RUN[__enum;$1]}') : template;
                template = template.contains("${RUN") ? __run_replace(/\$\{RUN\[(.+?)\]\}/, template, true, obj) : template;
                template = template.contains("${") ? template.replace(/(\$\{[a-zA-Z$_-]*\})/g, '') : template;
                var tmp, rptmp;
                if (template.contains('||') && (tmp = /\$\{(.+?\|\|?.+?)\}/.exec(template)) && tmp[1]) {
                    tmp = tmp[1];
                    rptmp = (tmp && "__or|"+tmp.replace_all('||', "|") || "");
                    template = template.replace_all(tmp, rptmp);
                }
                template = template.contains('|') ? __run_replace (/\$\{(.+?(\|?.+?)+)\}/, template, false,obj) : template;
                template = template.contains('${') ? template.replace(/\$\{.*?\}/g,"") : template;
                html += template.replace_all('${dataproperties}', "").replace_all(';\\', ';');
            }

            return html;
        } catch (e) {
            error('fillTemplate', e);
        }
    }
    function getUniqueId(prefix) {
        try {
            var index = "";
            prefix = prefix || "";
            while (!isNull($(prefix + index))) {
                index = index || 0;
                index++;
            }
            return {
                id : prefix + index, 
                index: index
            };
        } catch (e) {
            error('getUniqueId', e);
        }
    }
    function IEVersion () {
        try {
            var rv = -1;
            if (navigator.appName == 'Microsoft Internet Explorer') {
                var ua = navigator.userAgent,
                re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                if (re.exec(ua) != null) {
                    rv = parseFloat(RegExp.$1);
                }
            }
            return rv;
        } catch (e) {
            error('IEVersion', e);
        }
    }
    
    function isAmaya() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/amaya/i.test(navUserAgent));
        } catch (e) {
            error('isAmaya', e);
        }
    }
    function isAndroid(){
        try {
            var navUserAgent = navigator.userAgent;
            return (/android/i.test(navUserAgent));
        } catch (e) {
            error('isAndroid', e);
        }
    }
    function isBlackBerry() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/blackberry/i.test(navUserAgent));
        } catch (e) {
            error('isBlackBerry', e);
        }
    }
    function isChrome(){
        try {
            return (navigator.userAgent.indexOf("Chrome") != -1);
        } catch(e){
            error('isChrome', e);
        }
    }
    function isFirefox(){
        try {
            return (navigator.userAgent.indexOf("Chrome") == -1) 
            && (navigator.userAgent.indexOf("Apple") == -1) 
            && (navigator.userAgent.indexOf("Opera") == -1) 
            && (navigator.userAgent.indexOf("Firefox") != -1);   
        } catch(e){
            error('isFirefox', e);
        }
    }
    function isGecko() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/gecko/i.test(navUserAgent));
        } catch (e) {
            error('isGecko', e);
        }
    }
    function isIE6() {
        try {
            var rv = IEVersion();
            return (rv != -1 && rv < 7.0);
        } catch (e) {
            error('isIE6', e);
        }
    }
    function isIE() {
        try {
            return (IEVersion() != -1);
        } catch (e) {
            error('isIE', e);
        }
    }
    function isIPad() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/iPad|iPhone OS 3_[1|2]_2/i.test(navUserAgent));
        } catch (e) {
            error('isIPad', e);
        }
    }
    function isIPhone(){
        try{
            return !isIPad() && navigator.userAgent.indexOf("iPhone") != -1;
        } catch (e) {
            error('isIPhone', e);
        }
    }
    function isIPod() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/ipod/i.test(navUserAgent));
        } catch (e) {
            error('isIPod', e);
        }
    }
    function isKHTML() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/khtml/i.test(navUserAgent));
        } catch (e) {
            error('isKHTML', e);
        }
    }
    function isLinux(){
        try{
            return navigator.platform.indexOf("Linux") != -1;
        } catch (e) {
            error('isLinux', e);
        }
    }
    function isMac(){
        try{
            return navigator.platform.indexOf("Mac") != -1;
        } catch (e) {
            error('isMac', e);
        }
    }
    function isMobile(){
        try{
            return isAndroid() || isBlackBerry() || isIPad() || isIPhone() || isIPod() || isPalmOS() || isSymbian() || isWindowsMobile();
        } catch (e) {
            error('isMobile', e);
        }
    }
    function isNull(thiss, value) {//used to determine if thiss is undefined->if undefined, return value
        try {
            if (value == null || value == undefined) {
                return (thiss == null || thiss == undefined || thiss.length == 0);
            }
            return ((thiss ? thiss.length == 0 : thiss) || value);
        } catch (e) {
            error("isNull", e);
        }  
    }
    function isOpera(){
        try {
            return (navigator.userAgent.indexOf("Chrome") == -1) 
            && (navigator.userAgent.indexOf("Apple") == -1) 
            && (navigator.userAgent.indexOf("Opera") != -1);   
        } catch(e){
            error('isOpera', e);
        }
    }
    function isPalmOS(){
        try {
            var navUserAgent = navigator.userAgent;
            return (/palm/i.test(navUserAgent));
        } catch (e) {
            error('isIPad', e);
        }
    }
    function isPresto() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/presto/i.test(navUserAgent));
        } catch (e) {
            error('isPresto', e);
        }
    }
    function isPrince() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/prince/i.test(navUserAgent));
        } catch (e) {
            error('isPrince', e);
        }
    }
    function isSafari(){
        try {
            return (navigator.userAgent.indexOf("Chrome") == -1) && (navigator.userAgent.indexOf("Apple") != -1);
        } catch(e){
            error('isSafari', e);
        }
    }
    function isSymbian () {
        try {
            var navUserAgent = navigator.userAgent;
            return (isWebkit() && (/series60/i.test(navUserAgent) || /symbian/i.test(navUserAgent)));
        } catch (e) {
            error('isIPad', e);
        }
    }
    function isTrident() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/trident/i.test(navUserAgent));
        } catch (e) {
            error('isTrident', e);
        }
    }
    function isWebkit() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/webkit/i.test(navUserAgent));
        } catch (e) {
            error('isWebkit', e);
        }
    }
    function isWindows(){
        try{
            return navigator.platform.indexOf("Win") != -1;
        } catch (e) {
            error('isWindows', e);
        }
    }
    function isWindowsMobile() {
        try {
            var navUserAgent = navigator.userAgent;
            return (/windows ce/i.test(navUserAgent));
        } catch (e) {
            error('isWindowsMobile', e);
        }
    }
    
    function killPropagation(ev, bubble, returnValue) {//used to cancel any bubbling and propagation
        try {
            ev = ev || $w.event;
            if (!ev) {return false;}
            bubble = bubble || true;
            returnValue = returnValue || false;
            if (ev.stopPropagation) {
                ev.stopPropagation();
                ev.preventDefault();
            } else {
                ev.cancelBubble = bubble;
                ev.returnValue = returnValue;
            }
            return true;
        } catch (e) {
            error("killPropagation", e);
            return false;
        }
    }
    function logit(){
        try {
            var location = "", err = new Error();

            $c.VERBOSE_MODE && err.stack && (location = "\t\t\t\t    " + err.stack.split('\n')[2]);
            for (var i = 0, len = arguments.length; i < len; i++) {
                arguments[i] = arguments[i] + location;
            }
            cout.apply(this, arguments);
        } catch (e) {
            error('logit', e);
        }
    }
    function now (format) {
        try {
        return format ? (new Date()).format(format) : new Date();
        } catch (e) { }
    }
    function parseBoolean(obj) {
        try {
            if ($c.isString(obj)) {
                obj = obj.toLowerCase();
                return (obj == "true" ? true : obj == "false" ? false : obj == "1" ? true : obj == "0" ? false : undefined);
            } else if ($c.isNumber(obj)) {
                return (obj === 1 ? true : obj === 0 ? false : undefined);
            } else if ($c.isBoolean(obj)) {
                return obj;
            }
            return undefined;
        } catch (e) {
            error('parseBoolean', e);
        }
    }
    function parseRaw(value, skipQuotes/*, removeCircular*/, __windowVars, __windowVarNames) {
        try {
            if (value === null || value === undefined) {
                return value + "";
            } 
            var raw = "";
            if ($c.isString(value)) {
                !skipQuotes && (raw = "\"" + value + "\"") || (raw = value);
            }
            else if ($c.isArray(value)) {
                var tmp = [];
                for (var i = 0, len = value.length; i < len; i++) {
                    tmp[i] = parseRaw(value[i]);
                }
                raw = "[" + tmp.join(',') + "]";
            }
            else if (value instanceof Object && !$c.isFunction(value)) {
                if (!__windowVars) {
                    __windowVars = [];
                    __windowVarNames = [];
                    for (var prop in $w) {
                        if (value.hasOwnProperty(prop)) {
                            __windowVars.push($w[prop]);
                            __windowVarNames.push(prop);
                        }
                    }
                }
                var index = __windowVars.indexOf(value);
                if (index == -1) {
                    var name = cuid();
                    __windowVars.push(value);
                    __windowVarNames.push(name);
                    raw = "{";
                    for (var prop in value) {
                        if (value.hasOwnProperty(prop)) {
                            raw += "'" + prop + "': " + parseRaw(value[prop], skipQuotes/*, removeCircular*/, __windowVars, __windowVarNames) + ",";
                        }
                    }
                    raw = raw.slice(0,-1) + "}";
                } else {
    //                if (removeCircular) {
    //                    raw = "{}";
    //                } else {
                        raw = "$w['" + __windowVarNames[index ] +"']";
    //                }
                }
            }
            else {
                raw = value.toString();
            }
            return raw;
        } catch (e) {
            error('parseRaw', e);
        }
    }
    function rand(num1, num2, inclusive) {
        try {
            if (inclusive) {
                if (num1 < num2) {
                    num1 -= 0.1;
                    num2 += 0.1;
                } else if (num1 > num2) {
                    num1 += 0.1;
                    num2 -= 0.1;            
                }
            }
            return (num2 - num1)*Math.random() + num1;
        } catch (e) {
            error('rand', e);
        }
    }
    function tryEval(expression) {
        try {
            return eval(expression);
        } catch(e) {
            try {
                return eval("("+expression+")");
            } catch(e) {
                return undefined;
            }
        }
    }
    /*timing functions*/
    function wait() {
        try {
            var args = arguments.callee.caller.arguments,
            funcOriginal = arguments.callee.caller.toString().
            replace(/\/\/.*?[\r\n]/gi,'').
            replace(/[\t\r\n]*/gi, '').
            replace(/\/\*.*?\*\//gi, ''),
            func = funcOriginal,
            funcArgNames = func.trim().replace(/^function\s*?\((.*?)\).*/, '$1').replace(/\s*/gi,'').split(','),
            fname = func.replace(/function\s*?(.*?)\s*?\(.*/,'$1'),
            fnBefore = func.substr(0, func.indexOf('return wait')),
            variableGroups = fnBefore.match(/var .*?;/gi),
            condition = func.replace(/.*?(return)*\s*?wait\((.*?)\);.*/, '$2'),
            fregex = /\s*?function\s*?\(\s*?\)\s*?\{/;
            func = func.replace(fname, '').replace(/(function\s*?\(.*?\)\s*?\{).*?(return)*\s*?wait\((.*?)\);/, '$1');
            for (var a = 0, alen = funcArgNames.length; a < alen; a++) {
                if (funcArgNames[a]) {
                    func = func.replace(fregex, 'function(){var ' + funcArgNames[a] + '=' + parseRaw(args[a]) + ';');
                }
            }
            for (var i = 0, len = variableGroups.length; i < len; i++) {
                variableGroups[i] = variableGroups[i].replace(/^var\s(.*)?;/,'$1');
                var variables = variableGroups[i].split(/^(?!.*\{.*,).*$/g);
                if (!variables[0]) {
                    variables = variableGroups[i].split(',');
                }
                for (var j = 0, jlen = variables.length; j < jlen; j++) {
                    var variable = variables[j], regex, values;
                    if (variable.indexOf('=') != -1) {
                        variable = variable.split('=')[0].trim();
                    }
                    regex = new RegExp(variable + '\\s*?=\\s*?.*?\\s*?[,;]', 'gi');
                    values = fnBefore.match(regex) || [];
                    for (var k = values.length - 1; k >= 0; k--){
                        try {
                            var value = eval(values[k].replace(/.*?=\s*?(.*?)\s*?;/, '$1').trim());
                            func = func.replace(fregex, 'function(){var ' + variable + '=' + parseRaw(value) + ';');
                        } catch (e) {
                            error("wait.eval-value", e)
                        }
                    }
                }
            }

            if ($c.isNumber(condition)) {
                setTimeout(eval(func), condition);
            } else {
                var delayFunc = function(){
                    if (eval(condition)) {
                        (eval("(" + func + ")"))();
                    } else {
                        setTimeout(delayFunc, 1);
                    }
                }
                setTimeout(delayFunc, 1);
            }
        } catch (e) {
            error('wait', e);
        }
    }
    function foo () {}
    // Changes XML to JSON
    function xmlToJson(xml, ignoreAttributes) {
        try {
            // Create the return object
            var obj = {};
            if ($c.isString(xml)) {
                xml = xml.replace(/&(?!amp;)/gi, '&amp;');
                if ($w.DOMParser) {
                    xml = (new DOMParser()).parseFromString(xml, 'text/xml');
                } else {
                    var doc;
                    doc = new ActiveXObject('Microsoft.XMLDOM');
                    doc.async='false';
                    xml = doc.loadXML(xml) && doc;
                }
            }

            if (xml.nodeType == 1 && !ignoreAttributes) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue;
            }

            // do children
            if (xml.hasChildNodes()) {
                for(var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof(obj[nodeName]) == "undefined") {
                        if (nodeName != "#text" || !ignoreAttributes) {
                            obj[nodeName] = xmlToJson(item, ignoreAttributes);
                        } else if (xml.childNodes.length == 1) {
                            obj = xmlToJson(item, ignoreAttributes);
                        }
                    } else {
                        if (!$c.isArray(obj[nodeName]) || typeof(obj[nodeName].length) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xmlToJson(item, ignoreAttributes));
                    }
                }
            }
            return obj;
        } catch (e) {
            error('xmlToJson', e);
        }
    }

    function zipit(files, content/*=NULL*/) {
        try {
            files = (content && $c.isString(files) && [{
                name:files,
                content:content
            }]) || $c.isObject(files) && [files] || $c.isArray(files) && files;
            var zip = new JSZip();
            for (var i = 0, len = files.length; i < len; i++) {
                var file = files[i];
                content = file.content;
                if ($c.isObject(content)) {
                    file.content = JSON.stringify(content,null,"\t");
                }

                zip.add(file.name, (file.pretext || "") + file.content + (file.posttext || ""));
            }

            content = zip.generate();

            location.href="data:application/zip;base64," + content;
        } catch (e) {
            error('zipit', e);
        }
    }
    
    
    
    var _ie = IEVersion(),
    _ie = IEVersion(),_chrm = ChromeVersion(),_ff = FirefoxVersion(),_op = OperaVersion(),_saf = SafariVersion(),
    _droid = isAndroid(),_bbery = isBlackBerry(),_ipad = isIPad(),_ifon = isIPhone(),_ipod = isIPod(),_linx = isLinux(),_mac = isMac(),_palm = isPalmOS(),_symb = isSymbian(),_win = isWindows(),_winm = isWindowsMobile(),
    _amay = isAmaya(),_gekk = isGecko(),_khtm = isKHTML(),_pres = isPresto(),_prin = isPrince(),_trid = isTrident(),_webk = isWebkit(),
    console = $w.console,
    _browser = (_ie != -1 && 'Internet Explorer') || (_chrm != -1 && 'Chrome') || (_ff != -1 && 'Firefox') || (_saf != -1 && 'Safari'),
    _os = (_droid && 'Android') || (_bbery && 'BlackBerry') || (_linx && 'Linux') || ((_ipad || _ifon || _ipod) && 'iOS') || (_mac && 'Mac') || (_palm && 'PalmOS') || (_symb && 'Symbian') || (_win && 'Windows') || (_winm && 'Windows Mobile'),
    _device = (_droid && 'Android') || (_bbery && 'BlackBerry') || (_ipad && 'iPad') || (_ifon && 'iPhone') || (_ipod && 'iPod') || (_linx && 'Linux') || (_mac && 'Mac') || (_palm && 'PalmOS') || (_symb && 'Symbian') || (_win && 'Windows') || (_winm && 'Windows Mobile'),
    _engine = (_amay && 'Amaya') || (_gekk && 'Gekko') || (_khtm && 'KHTML') || (_pres && 'Presto') || (_prin && 'Prince') || (_trid && 'Trident') || (_webk && 'WebKit');
    
    if (!$w.__craydentLoaded) {
        var Craydent = {
            browser:{
                CURRENT: _browser,
                CURRENT_VERSION:(_ie != -1 && _ie) || (_chrm != -1 && _chrm) || (_ff != -1 && _ff) || (_saf != -1 && _saf),
                IE:isIE(),
                IE_VERSION:_ie,
                IE6:(_ie < 7.0 && _ie >= 6.0),
                IE7:(_ie < 8.0 && _ie >= 7.0),
                IE8:(_ie < 9.0 && _ie >= 8.0),
                CHROME:isChrome(),
                CHROME_VERSION:_chrm,
                FIREFOX:isFirefox(),
                FIREFOX_VERSION:_ff,
                OPERA:isOpera(),
                OPERA_VERSION:_op,
                SAFARI:isSafari(),
                SAFARI_VERSION:_saf
            },
            client: {
                browser: _browser,
                device: _device,
                engine: _engine,
                os:_os
            },
            engine:{
                CURRENT:_engine,
                AMAYA:_amay,
                GEKKO:_gekk,
                KHTML:_khtm,
                PRESTO:_pres, 
                PRINCE:_prin,
                TRIDENT:_trid, 
                WEBKIT:_webk
            },
            os:{
                CURRENT:_os,
                ANDROID:_droid,
                BLACKBERRY:_bbery,
                LINUX:_linx,
                IOS:(_ipad || _ifon || _ipod),
                MAC:_mac,
                PALM:_palm,
                SYMBIAN:_symb,
                WINDOWS:_win,
                WINDOWS_MOBILE:_winm
            },
            device:{
                CURRENT:_device,
                ANDROID:_droid,
                BLACKBERRY:_bbery,
                IPAD:_ipad,
                IPHONE:_ifon,
                IPOD: _ipod,
                LINUX:_linx,
                MAC:_mac,
                PALM:_palm,
                SYMBIAN:_symb,
                WINDOWS:_win,
                WINDOWS_MOBILE:_winm
            },
            ANDROID:_droid,
            AMAYA:_amay,
            BLACKBERRY:_bbery,
            CHROME:isChrome(),
            CHROME_VERSION:_chrm,
            CLICK: "click",
            DEBUG_MODE: !!$GET("debug"),
            FIREFOX:isFirefox(),
            FIREFOX_VERSION:FirefoxVersion(),
            FIREFOX:isFirefox(),
            GEKKO:isGecko(),
            HANDPOINT: "pointer",
            HIDDEN: "hidden",
            IE:isIE(),
            IE_VERSION:_ie,
            IE6:(_ie < 7.0 && _ie >= 6.0),
            IE7:(_ie < 8.0 && _ie >= 7.0),
            IE8:(_ie < 9.0 && _ie >= 8.0),
            IPAD:isIPad(),
            IPHONE:isIPhone(),
            IPOD: isIPod(),
            KHTML:isKHTML(),
            LINUX:isLinux(),
            MAC:isMac(),
            ONMOUSEDOWN: "onmousedown",
            ONMOUSEUP: "onmouseup",
            OPERA:isOpera(),
            OPERA_VERSION:OperaVersion(),
            PAGE_NAME: (function () {
                var pn = $l.href.substring($l.href.lastIndexOf('/') + 1).replace(/([^#^?]*).*/gi,'$1');
                return !pn || pn.indexOf('.') == -1 ? "index.html" : pn;
            })(),
            PAGE_NAME_RAW: (function () {
                var pn = $l.href.substring($l.href.lastIndexOf('/') + 1).replace(/(.*)?\?.*/gi,'$1');
                return !pn || pn.indexOf('.') == -1 ? "index.html" : pn;
            })(),
            PALM:isPalmOS(),
            POINTER: "default",
            PRESTO:isPresto(), 
            PRINCE:isPrince(),
            PROTOCOL: $l.protocol,
            SAFARI:isSafari(),
            SAFARI_VERSION:SafariVersion(),
            SERVER: $l.host,
            SERVER_PATH: $l.pathname,
            SYMBIAN:isSymbian(),
            TEMPLATE_VARS: [],
            TRIDENT:isTrident(),
            VERBOSE_LOGS: !!$GET("verbose"),
            VERSION: $w.__craydentVersion,
            VISIBLE: "visible",
            WAIT: "wait",
            WEBKIT:isWebkit(),
            WINDOWS:isWindows(),
            WINDOWS_MOBILE:isWindowsMobile(),
            noConflict:function (setTo) {
                var tmp = $;
                $ = setTo || _$overwrite;
                return tmp;
            }
        },
        $c = Craydent,
        __$$ = [
        {
            func: '$', 
            selector: 'getElementById', 
            overwrite: '_$overwrite'
        },{
            func: '$CSS', 
            selector: 'querySelectorAll', 
            overwrite: '_$CSSoverwrite'
        },{
            func: '$TAG', 
            selector: 'getElementsByTagName', 
            overwrite: '_$TAGoverwrite'
        }
        ],

    /*----------------------------------------------------------------------------------------------------------------
    /-	Event tracking
    /---------------------------------------------------------------------------------------------------------------*/
        EVENT_REGISTRY = {
            length : 0
        };// Array();
        
        $w._onload = $w.onload || foo;
        $w.onload = function () {
            $c.browser.SCROLLBAR_WIDTH = (function(){
                try {
                    var sizer_element, sizer_child, width;
                    sizer_element = '<div style="width:50px;height:50px;overflow:auto"><div></div></div>'.toDomElement();
                    $d.body.appendChild(sizer_element);
                    sizer_child = sizer_element.firstChild;
                    width = sizer_child.width();
                    sizer_child.style.height = '99px';
                    width -= sizer_child.width();
                    sizer_element.remove();
                    return width;
                } catch (e) {
                    error("SCROLLBAR_WIDTH", e);
                }
            })();
            $w._onload.apply(arguments);
        };
        
        for (var i = 0, len = __$$.length; i < len; i++) {
            var __$ = __$$[i];
            $w[__$.overwrite] = $w[__$.func] || function(){};
            $w[__$.func] = eval('$w.'+__$.func+' = (function (object, single) {try {return _craydentSelector(\''+__$.selector+'\', \''+__$.overwrite+'\', object, single);} catch (e) {error('+__$.func+', e);}})');
            $w[__$.func].duplicate = __dup;
            $w[__$.overwrite] && $w[__$.func].duplicate($w[__$.overwrite]);
        }

        $w._showoverwrite = $w.show || function () {};
        $w._hideoverwrite = $w.hide || function () {};
        $w._toggleoverwrite = $w.toggle || function () {};
        $w.show = function (object) {
            _displayHelper(object, "show");
        };
        $w.hide = function (object) {
            _displayHelper(object, "hide");
        };
        $w.toggle = function (object) {
            _displayHelper(object, "toggle");
        };
    }
    EVENT_REGISTRY.Exists = function (id, event, func, pos){
        try {
            pos = pos ? pos : function(){};
            if (EVENT_REGISTRY[id]) {
                for(eri = 0; eri < EVENT_REGISTRY[id].length; eri++){
                    if(EVENT_REGISTRY[id][eri][0] == event && EVENT_REGISTRY[id][eri][1] == func){
                        pos.index = eri;
                        return true;
                    }
                }
            }
            return false;
        } catch (e) {
            error("EVENT_REGISTRY.Exists", e);
        } 
    };
    
    /*----------------------------------------------------------------------------------------------------------------
    /-	String class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    _ext(String, 'capitalize', function (pos, everyWord) {
        try {
            pos = pos || [0];
            !$c.isArray(pos) && (pos = [pos]);
            var wordArray = everyWord ? this.split(' ') : ([this]);
            for (var i = 0; i < pos.length; i++) {
                for (var j = 0; j < wordArray.length; j++) {
                    wordArray[j] = wordArray[j].substring(0,pos[i]) + wordArray[j].charAt(pos[i]).toUpperCase() + wordArray[j].slice(pos[i] + 1);
                }
            }
            return wordArray.join(' ');
        } catch (e) {
            error("String.capitalize", e);
        }
    }, true);
    _ext(String, 'convertUTCDate', function (delimiter) {
        try {
            var dateAsString = this;
            if (dateAsString.substring(dateAsString.length - 2) == ".0") {
                dateAsString = dateAsString.substring(0, dateAsString.length - 2);
            }
            var pattern = new RegExp( "(\\d{4})" + delimiter + "(\\d{2})" + delimiter + "(\\d{2}) (\\d{2}):(\\d{2}):(\\d{2})" );
            var parts = dateAsString.match( pattern );

            return parts ? parts[2] + "/" + parts[3] + "/" + parts[1] + " " + parts[4] + ":" + parts[5] + ":" + parts [6] : dateAsString;
        } catch (e) {
            error('String.convertUTCDate', e);
        }
    }, true);
     _ext(String, 'endsWith', function (str) {
         try {
            for (var i = 0, len = arguments.length; i < len; i++) {
                if (arguments[i] == this) {
                    continue;
                }
                if (arguments[i] == this.slice(-arguments[i].length)) {
                    return arguments[i];
                }
            }
            return false;
        } catch (e) {
            error('String.endsWith', e);
        }
     });
    _ext(String, 'indexOfAlt', function(regex, pos) {
        try {
            pos = pos || 0;
            var index = this.substring(pos).search(regex);
            return (index >= 0) ? (index + pos) : index;
        } catch (e) {
            error("String.indexOfAlt", e);
        }
    }, true);
    _ext(String, 'ireplace_all', function(replace, subject) {
        try {
            return _replace_all.call(this, replace, subject, "gi")
        } catch (e) {
            error("String.ireplace_all", e);
        }
    }, true);
    _ext(String, 'isBlank', function () {
        try {
            return !this.length;
        //return (this === "");
        } catch (e) {
            error("String.isBlank", e);
        }
    }, true);
    _ext(String, 'isValidEmail', function () {
        try {
            if (!$c.isBlank(this) && !isNull(this)) {
                var reg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                return (reg.test(this));
            }
            return false;
        } catch (e) {
            error("String.isValidEmail", e);
        }
    }, true);
    _ext(String, 'lastIndexOfAlt', function(regex, pos) {
        try {
            regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
            pos = pos || this.length;
            if(pos < 0) {
                pos = 0;
            }
            var str = this.substring(0, pos + 1),
                lindex = -1,
                next = 0,
                result;
                
            while((result = regex.exec(str)) != null) {
                lindex = result.index;
                regex.lastIndex = ++next;
            }
            return lindex;
        } catch (e) {
            error("String.lastIndexOfAlt", e);
        }
    }, true);
    _ext(String, 'ltrim', function (character) {
        try {
            return _trim(this, 'l', character);
        } catch (e) {
            error("String.ltrim", e);
        }
    }, true);
    _ext(String, 'replace_all', function(replace, subject) {
        try {
            return _replace_all.call(this, replace, subject, "g")
        } catch (e) {
            error("String.replace_all", e);
        }
    }, true);
    _ext(String, 'reverse', function () {
        try {
            return this.split('').reverse().join('');
        } catch (e) {
            error("String.reverse", e);
        }
    }, true);
    _ext(String, 'rtrim', function (character) {
        try {
            return _trim(this, 'r', character);
        } catch (e) {
            error("String.rtrim", e);
        }
    }, true);
    _ext(String, 'sanitize', function () {
        try {
            var thiss = this.replace(/&/gi, "&#38;").
            replace(/#/gi, "&#35;").
            replace(/%/gi, "&#37;").
            replace(/;/gi, "&#59;").
            replace(/\+/gi, "&#43;").
            replace(/\-/gi, "&#45;").
            replace(/\'/gi, "&#39;").
            replace(/\\"/gi, "&#34;").
            replace(/\(/gi, "&#40;").
            replace(/\)/gi, "&#41;").
            replace(/\</gi, "&#60;").
            replace(/\>/gi, "&#62;");

            return thiss;
        } catch (e) {
            error("String.sanitize", e);
        }
    }, true);
    _ext(String, 'startsWith', function (/*str, str1*/) {
        try {
            for (var i = 0, len = arguments.length; i < len; i++) {
                if (arguments[i] == this) {
                    continue;
                }
                if (arguments[i] == this.slice(0, arguments[i].length)) {
                    return arguments[i];
                }
            }
            return false;
        } catch (e) {
            error('String.startsWith', e);
        }
    });
    _ext(String, 'strip', function(character) {
        try {
            return _strip(this, character);
        } catch (e) {
            error("String.strip", e);
        }
    }, true);
    _ext(String, 'toCurrencyNotation', function (separator) {
        try {
            separator = separator || ",";
            return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        } catch (e) {
            error("String.toCurrencyNotation", e);
        }
    }, true);   
    _ext(String, 'toDateTime', function (options) {
        try {
        /*
        *  options properties:
        *  gmt:true - convert to GMT
        *  offset:offset from GMT
        *  format:format used in Datetime.format
        **/  
            options = options || {};
            var strDatetime = this;
            if (/\d\d\d\d-\d\d-\d\d/.test(strDatetime)) {
                strDatetime = this.replace("-","/").replace("-","/");
            }
            var dt = new Date(strDatetime);
            if (!dt.getDate()) {
                var parts = [],
                dtstring = this[0] == "(" ? this.substring(1,this.length-1) : this,
                chars = ["\\.","\\/","-","\\s*?"];

                for (var i = 0, len = chars.length; i < len && !dt.getDate(); i++) {
                    // using format m(m).d(d).yy(yy) or d(d).m(m).yy(yy) or yy(yy).m(m).d(d) or yy(yy).d(d).m(m)
                    // using format m(m)/d(d)/yy(yy) or d(d)/m(m)/yy(yy) or yy(yy)/m(m)/d(d) or yy(yy)/d(d)/m(m)
                    // using format m(m)-d(d)-yy(yy) or d(d)-m(m)-yy(yy) or yy(yy)-m(m)-d(d) or yy(yy)-d(d)-m(m)
                    var c = chars[i],
                    regex = new RegExp("(\\d{1,4})" + c + "\\s*?(\\d{1,2})" + c + "\\s*?(\\d{2,4})(.*)");
                    if ((parts = dtstring.match(regex)) && parts.length > 1) { 
                        // assume year is first
                        if (parts[1].length == 4) {
                            parts[0] = parts[1],
                            parts[1] = parts[2],
                            parts[3] = parts[0];
                        }
                        // assume month is first
                        if (parseInt(parts[1]) >= 1  && parseInt(parts[1]) <= 12) {
                            dt = new Date(parts[1] + "/" + parts[2] + "/" + parts[3] + parts[4]);
                        } else { // day is first
                            dt = new Date(parts[2] + "/" + parts[1] + "/" + parts[3] + parts[4]);
                        }
                    }
                    if (!dt.getDate() && (parts = dtstring.match(/(\d{1,2})\/(\d{1,2})-(\d{2,4})(.*)/)) && parts.length > 1) {
                        dt = new Date(parts[2] + "/" + parts[1] + "/" + parts[3] + parts[4]);
                    } else if (!dt.getDate() && (parts = dtstring.match(/(\d{1,2})-([a-zA-Z]{3,9})-(\d{2,4})(.*)/)) && parts.length > 1) {
                        dt = new Date(dtstring.replace("-", " "));
                    }
                }
            }
            if (options.gmt) {
                var offset = options.offset !== undefined ? options.offset : _getGMTOffset.call(new Date());
                dt = new Date(dt.valueOf() + offset * 60*60000);
            }
            return options.format ? dt.format(options.format) : dt;
        } catch (e) {
            error("String.toDateTime", e);
        }
    }, true);
    _ext(String, 'toDomElement', function () {
        try {
            var div = $d.createElement('div'), children;
            
            // ie special case when creating options
            if ($c.browser.IE && $c.browser.IE_VERSION < 10 && this.startsWith("<option")) {
                div = $d.createElement('select');
                var parts = this.match(/<option(.*?)>(.*?)<\/option>/i),
                    attrs = parts[1].trim(),
                    arrAttr = [],
                    value = '',
                    text = parts[2];
                    
                if (attrs) {
                    arrAttr = attrs.match(/.*?=['].*?[']|.*?=["].*?["]/g).map(function (attr) {
                        var temp = attr.replace(/\s*(.*?)\s*?=\s*(.*?)\s*/,'$1=$2').split('=');
                        if (temp[0] == 'value') {
                            value = temp[1];
                        }
                        return temp;
                    });
                }
                div.options[0] = new Option(text, value);
                for (var i = 0, len = arrAttr.length; i < len; i++) {
                    div.childNodes[0].setAttribute(arrAttr[i][0],arrAttr[i][1]);
                }
                return div.childNodes[0];
                
            }
            div.innerHTML = this;
            children = div.childNodes;
            if (children.length == 1) {
                return children[0];
            } else if (children.length == 0) {
                return false;
            }
            return children;
        } catch (e) {
            error("String.toDomElement", e);
        }
    }, true);
    _ext(String, 'trim', function(character) {
        try {
            return _trim(this, undefined, character);
        } catch (e) {
            error("String.trim", e);
        }
    }, true);

    /*----------------------------------------------------------------------------------------------------------------
    /-	Array class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    _ext(Array,'buildTree', function (rt,child,options) {
        try {
            options = options || {};
            var rtnArr = [];
            var i = 0,objt,cats=[],catDict={},tmp={}, singles = {};
            var prop = options.childProp || "children";
            while(objt=this[i++]){
                var cat = $c.isFunction(child) ? child(objt) : objt[child],
                    rootFound = cats.contains(cat);

                objt[prop] = objt[prop] || [];
                if (rt(objt)) {
                    delete singles[cat];

                    if (!rootFound && tmp[cat]) {
                        objt[prop] = tmp[cat];
                    }
                    tmp[cat] = objt[prop];

                    cats.push(cat);
                    //catDict[cat] = objt;
                    rtnArr.push(objt);
                    continue;
                }

                // root not found yet
                if (!rootFound) {
                    singles[cat] = singles[cat] || [];
                    singles[cat].push(objt);
                    tmp[cat] = tmp[cat] || [];
                    tmp[cat].push(objt);
                }
            }
            for (var prop in singles) {
                if (!singles.hasOwnProperty(prop)) {
                    continue;
                }
                for (var j = 0, len = singles[prop].length; j < len; j++) {
                    singles[prop][j].children = [];

                }
                rtnArr = rtnArr.concat(singles[prop]);
            }
            return rtnArr;
        } catch (e) {
            error('Array.buildTree', e);
        }
    });
    _ext(Array, 'complexSort', function(specs){
        try {
            specs = specs || {};
            var defunc = function(v){return v;},
            props = specs.props,
            rev = specs.rev,
            lprimer = specs.lookupprimer || defunc
            pprimer = specs.propprimer || defunc,
            lookup = specs.lookup,
            lookupfunc = specs.lookupfunc || function(id){
                if(lookup){return lookup[id];}
                return id;
            };

            if(props.isString()){props=[props];}
            var craftVal = function(v,prop){
                var val = 
                pprimer(
                    (lookup && lookup[lprimer(v)][prop]) || 
                    (lookupfunc && lookupfunc(lprimer(v))[prop]) || 
                    v[prop]
                )
                return val;
            }
            prop_sort = function (a,b,p) {
            p = p||0,
            prop = props[p];

            if(!prop){return -1;}

                var aVal = craftVal(a,prop),//pprimer((lookup && lookup[lprimer(a)][prop]) || a[prop]),
                bVal = craftVal(b,prop);//pprimer((lookup && lookup[lprimer(b)][prop]) || b[prop]);

                if (aVal == bVal) {
                    return prop_sort(a,b,p+1);
                }

                if (aVal > bVal) {return 1;}
                return -1;
           };

            return this.sort(prop_sort);
        } catch (e) {
            error('Array.complexSort', e);
        }
    },true);
    
    _ext(Array, 'condense', function (check_values, alter) {
        try {
            return _condense(this, check_values, alter);
        } catch (e) {
            error("Array.condence", e);
            return false;
        }
    }, true);

    _ext(Array, 'every', function(callback /*, thisObject*/) {
        try {
            var thisObject = arguments[1] || this;
            for (var i= 0, n= this.length; i<n; i++)
                if (i in this && !callback.call(thisObject, this[i], i, this))
                    return false;
            return true;
        } catch (e) {
            error("Array.every", e);
        }  
    }, true);
    
    _ext(Array, 'filter', function(func /*, thiss*/) {
        try {
            if (!$c.isFunction(func)) {
                throw new TypeError();
            }
            var filtered = new Array(),
            thiss = arguments[1] || this;
            for (var i = 0; i < this.length; i++) {
                var val = this[i];
                if (func.call(thiss, val, i, this)) {
                    filtered.push(val);
                }
            }

            return filtered;
        } catch (e) {
            error('Array.filter', e);
            return false;
        }
    }, true);

    _ext(Array, 'indexOf', function(value) {
        try {
            return _indexOf(this, value);
        } catch (e) {
            error("Array.indexOf", e);
        }  
    }, true);

    _ext(Array, 'indexOfAlt', function(value, func) {
        try {
            var len = this.length,
            i = 0;
            while (i < len) {
                if (value instanceof Object ? func(this[i], value) : func(this[i]) === value) return i;
                ++i;
            }
            return -1;
        } catch (e) {
            error("Array.indexOfAlt", e);
        }  
    }, true);

    _ext(Array, 'insertAfter', function(index, value) {
        try {
            this.splice(index + 1, 0, value);
            return true;
        } catch (e) {
            error("Array.insertAfter", e);
            return false;
        }  
    }, true);

    _ext(Array, 'insertBefore', function(index, value) {
        try {
            this.splice(index, 0, value);
            return true;
        } catch (e) {
            error("Array.insertBefore", e);
            return false;
        }  
    }, true);

    _ext(Array, 'isEmpty', function() {
        try {
            return (this.length == 0);
        } catch (e) {
            error("Array.isEmpty", e);
            return false;
        }  
    }, true);

    _ext(Array, 'map', function(callback /*, thisObject*/) {
        try {
            var thisObject = arguments[1] || this,
            other= new Array(this.length);
            for (var i= 0, n= this.length; i<n; i++)
                if (i in this)
                    other[i]= callback.call(thisObject, this[i], i, this);
            return other;
        } catch (e) {
            error("Array.map", e);
        }  
    }, true);
    
    _ext(Array, 'normalize', function () {
        try {
            var allProps = {}, arrObj = [], len = this.length, i;
            for(i = 0; i < len; i++) {
                var json = this[i];
                if (!$c.isObject(json)) {
                    error("normalize", {description:'index: ' + i + ' (skipped) is not an object'});
                    continue;
                }
                for(var prop in json) {
                    allProps[prop] = '';
                }
            }
            for(i = 0; i < len; i++) {
                arrObj.push($c.merge(allProps, this[i]));
            }
            return arrObj;
        } catch(e) {

        }
    }, true);

    _ext(Array, 'remove', function (value, indexOf) {
        try {
            indexOf = indexOf || this.indexOf;
            var index = indexOf.call(this, value);
            if(index == -1) {
                return false;
            }
            return this.splice(index, 1)[0];
        } catch (e) {
            error("Array.remove", e);
        }  
    }, true);

    _ext(Array, 'removeAll', function (value, indexOf) {
        try {
            indexOf = indexOf || this.indexOf;
            var index = indexOf.call(this, value),
            removed = [];
            if(index == -1) {
                return false;
            }
            while (index != -1) {
                removed.push(this.remove(value, indexOf));
                index = indexOf.call(this, value);
            }
            return removed;
        } catch (e) {
            error("Array.removeAll", e);
        }  
    }, true);

    _ext(Array, 'removeAt', function (index) {
        try {
            if(!this[index]) {
                return false;
            }
            return this.splice(index, 1)[0];
        } catch (e) {
            error("Array.removeAt", e);
        }  
    }, true);

    _ext(Array, 'replaceAt', function(index, value) {
        try {
            return this.splice(index, 1, value)[0];
        } catch (e) {
            error("Array.replaceAt", e);
        }  
    }, true);
    //ARRAY SORTING
    _ext(Array, 'sortBy', function(props, rev, primer, lookup, options){
        try {
            options = ($c.isString(options) && options in {"i":1,"ignoreCase":1}) ? {i:1} : {};
            if($c.isString(props)){props=[props];}
            var key = function (x) {return primer ? primer(x[prop]) : x[prop]};
            primer = primer || function(x){return x;}
            var tmpVal;
            var prop_sort = function (a,b,p) {
                p = p||0;
                var prop = props[p],
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
                aVal = ((aVal = parseInt(aVal)) && aVal.toString() == tmpVal && parseInt(tmpVal)) || tmpVal;
                tmpVal = bVal;
                bVal = ((bVal = parseInt(bVal)) && bVal.toString() == tmpVal && parseInt(tmpVal)) || tmpVal;



                if (aVal == bVal) {return prop_sort(a,b,p+1);}
                if (aVal == undefined) {return 1;}
                if (aVal == undefined) {return -1;}
                if(!reverseProp) {
                    if (aVal > bVal) {return 1;}
                    return -1;
                }
                if (aVal < bVal) {return 1;}
                return -1;
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

    _ext(Array, 'sortByLookup', function(prop,lookup,rev,primer,options){
        try {
            options = ($c.isString(options) && options in {"i":1,"ignoreCase":1}) ? {i:1} : {};
            //prop="TABLE_SORT";
            function orderByTable(a, b) {
                var aVal = a[prop],
                bVal = b[prop];
                if (lookup) {
                    aVal = lookup[a][prop];
                    bVal = lookup[b][prop];
                }
                if (options.i) {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
                if (aVal == bVal) {return 0;}
                if (aVal > bVal) {return 1;}
                return -1;
            }
            this.sort(orderByTable);
            if(rev){
                this.reverse();
            }
            return this;
        } catch (e) {
            error('Array.sortByLookup', e);
        }
    }, true);
    
    _ext(Array, 'trim', function(chars) {
        try {
            var arr = [],
            alter = false;
            if ($c.isBoolean(chars)) {
                alter = true;
            }

            for (var i = 0, len = this.length; i < len; i++) {
                $c.isString(this[i]) && (arr[i] = this[i].toString().trim()) || (arr[i] = this[i]);
                alter && (this[i] = arr[i]);
            }
            return arr;
        } catch (e) {
            error("Array.trim", e);
            return false;
        }  
    }, true);
    _ext(Array, 'upsert', function(records, prop, callback) {
        /*|  {info: "Array class extension to upsert records to array",
         *    category: "Array",
         *    parameters:[
         *        {records: "(Array) Records to use to insert/update array"},
         *        {: ""},
         *        {: ""}],
         *
         *    overloads:[
         *        {parameters:[
         *            {: ""},
         *            {: ""},
         *            {: ""}]}],
         *
         *    description: "http://www.craydent.com/library/1.8.0/docs#array.upsert"},
         *    returnType: “(Array)”
         * |*/
        try {
            prop = prop || "_id";
            callback = callback || foo;
            if ($c.isFunction(prop)) {
                callback = prop;
                props = "_id";
            }

            var ids = [], refs = {}, insert = [];
            for (var i = 0, len = records.length; i < len; i++) {
                refs[records[i][prop]] = {record:records[i],index:i};
                ids.push(records[i][prop]);
            }


            var condition = {}, uIndex = [], iIndex = [], sIndex = [], j = 0;
            condition[prop] = {$in:ids};
            _whereHelper(this, condition, function (obj,i) {
                var ref = refs[obj[prop]],
                    record = ref.record,
                    isEqual = callback(obj,record),
                    index = uIndex;
                if (isEqual !== undefined ? isEqual : $c.equals(record,obj)) {
                    index = sIndex;
                } else {
                    $c.merge(obj, record);
                }
                index.push(i);
                ids.splice(ref.index-(j++), 1);
                return true;
            });
            for (var i = 0, len = ids.length; i < len; i++) {
                iIndex.push(this.length);
                this.push($c.duplicate(refs[ids[i]]));
                //this.push(refs[ids[i]]);
            }

            return {inserted:iIndex,updated:uIndex,unchanged:sIndex};
        } catch (e) {
            error("Array.update", e);
            return false;
        }
    }, true);
    _ext(Array, 'where', function(condition/*, projection*/) {
        try {
            // if no condition was given, return all
            if (!condition) {
                return this;
            }
            var returnAll = true;
            for (var prop in condition) { 
                if (condition.hasOwnProperty(prop)) {
                    returnAll = false;
                    break;
                }
            }
            if (returnAll) {
                return this;
            }
            // if sql syntax convert to mongo object syntax
            if ($c.isString(condition)) {
                condition = _processClause(condition);
            }
            
            var arr = [];
            for (var i = 0, len = this.length; i < len; i++) {
                if (_subQuery(this[i], [condition],'$or')) {
                    arr.push(this[i]);
                }
            }
            
/*            var arr = [],
            props = [],
            satisfied = true,
            $in = condition.$in,
            $or = condition.$or,
            $exists = condition.$exists;
            
//            if ($c.isString(condition)) {
//                orConditions = condition.split(/ or /i);
//            }
            
            
            for (var prop in condition) {
                if (condition.hasOwnProperty()) {
                    props.push(prop);
                }
            }

            
            for (var i = 0, len = this.length; i < len; i++) {
                for (var j = 0, jlen = props.length; j < jlen; j++) {
                    var prop = props[j];
                    
                    if (prop == "$in") {
                        var isRegex = condition[prop][0] && condition[prop][0].constructor == RegExp; //array of values
                        for (var k = 0, klen = condition[prop].length; k < klen; k++) {
                            if (satisfied = isRegex ? condition[prop][k].test(this[i][prop]) : this[i][prop].indexOf(condition[prop][k])) {
                                break;
                            }
                        }
                    }else if (prop == "$or") {
                        
                    }
                    
                    if (condition[prop].hasOwnProperty("$exists")) {
//                        if (!(satisfied = ((condition[prop]['$exists'] && this[i].hasOwnProperty(prop))
                        if ((satisfied = ((condition[prop]['$exists'] && this[i].hasOwnProperty(prop))
                        || (!condition[prop]['$exists'] && !this[i].hasOwnProperty(prop))))) {
                            break;
                        }
                    } else if (condition[prop].hasOwnProperty("$regex")) {
                        
//                    } else if(this[i].hasOwnProperty[prop] && !(satisfied = this[i][prop] == condition[prop])) {
                    } else if(this[i].hasOwnProperty[prop] && (satisfied = this[i][prop] == condition[prop])) {
                        break;
                    }
                    
                }
                if (satisfied) {
                    arr.push(this[i]);
                }
            }*/
            return arr;
        } catch (e) {
            error("Array.where", e);
            return false;
        }  
    }, true);
    
    /*----------------------------------------------------------------------------------------------------------------
    /-	Date class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    
    //_ext(Date, 'toGMT', function (offset, toString) {
    //    if (offset === true || offset === false) {
    //        toString = offset;
    //        offset = undefined;
    //    }
    //    offset = this.getTimezoneOffset() + (offset * 60);
    //    var dt = new Date(this.valueOf() - offset * 60000);
    //    if (toString && offset === undefined) {
    //        return this.toUTCString();
    //    } else if (toString) {
    //        return this.toUTCString();
    //    }
    //    return new Date(dt.toUTCString());
    //});
    _ext(Date, 'format', function (format, options) {
        try {
            if(!$c.isValidDate(this)) {
                return;
            }
            options = options || {offset:0};
            /*
             *  options properties:
             *  gmt:true - convert to GMT
             *  offset:offset from GMT
             **/        
            var localTimeZoneOffset = _getGMTOffset.call(this),
            datetime = options.offset ? new Date(this.valueOf() - (options.offset + (options.offset ? -1 : 1) * localTimeZoneOffset)*60*60000) : this,
        //    date = datetime.getDate(),
        //    day = datetime.getDay(),
        //    month = datetime.getMonth() + 1,
        //    year = datetime.getFullYear(),
        //    firstMonday = new Date((new Date('1/6/' + year)).getTime() + (1-(new Date('1/6/' + year)).getDay())*(24*60*60*1000)),
        //    week = Math.ceil(Math.ceil((datetime - (firstMonday - (new Date('1/1/'+year)))) - (new Date('12/31/' + (year - 1))))/(7*24*60*60*1000)),
        //    hour = datetime.getHours(),
            minute = datetime.getMinutes(),
            second = datetime.getSeconds(),
            GMTDiff = options.offset || datetime.getHours() - 24 - datetime.getUTCHours(),
        //    GMTDiffFormatted = (GMTDiff > 0 ? "+" : "-") + (Math.abs(GMTDiff) < 100 ? "00" : (Math.abs(GMTDiff) < 1000 ? "0" : "")),
            epoch = datetime.getTime(),
            timezones = {
                'Afghanistan Time':'AFT',
                'AIX specific equivalent of Central European Time':'DFT',
                'Alaska Daylight Time':'AKDT',
                'Alaska Standard Time':'AKST',
                'Arab Standard Time (Kuwait, Riyadh)':'AST',
                'Arabian Standard Time (Abu Dhabi, Muscat)':'AST',
                'Arabic Standard Time (Baghdad)':'AST',
                'Argentina Time':'ART',
                'Armenia Summer Time':'AMST',
                'Armenia Time':'AMT',
                'ASEAN Common Time':'ACT',
                'Atlantic Daylight Time':'ADT',
                'Atlantic Standard Time':'AST',
                'Australian Central Daylight Time':'ACDT',
                'Australian Central Standard Time':'ACST',
                'Australian Eastern Daylight Time':'AEDT',
                'Australian Eastern Standard Time':'AEST',
                'Australian Western Daylight Time':'AWDT',
                'Australian Western Standard Time':'AWST',
                'Azerbaijan Time':'AZT',
                'Azores Standard Time':'AZOST',
                'Baker Island Time':'BIT',
                'Bangladesh Standard Time':'BST',
                'Bhutan Time':'BTT',
                'Bolivia Time':'BOT',
                'Brasilia Time':'BRT',
                'British Indian Ocean Time':'BIOT',
                'British Summer Time (British Standard Time from Feb 1968 to Oct 1971)':'BST',
                'Brunei Time':'BDT',
                'Cape Verde Time':'CVT',
                'Central Africa Time':'CAT',
                'Central Daylight Time (North America)':'CDT',
                'Central European Daylight Time':'CEDT',
                'Central European Summer Time (Cf. HAEC)':'CEST',
                'Central European Time':'CET',
                'Central Standard Time (Australia)':'CST',
                'Central Standard Time (North America)':'CST',
                'Chamorro Standard Time':'CHST',
                'Chatham Daylight Time':'CHADT',
                'Chatham Standard Time':'CHAST',
                'Chile Standard Time':'CLT',
                'Chile Summer Time':'CLST',
                'China Standard Time':'CST',
                'China Time':'CT',
                'Christmas Island Time':'CXT',
                'Clipperton Island Standard Time':'CIST',
                'Cocos Islands Time':'CCT',
                'Colombia Summer Time':'COST',
                'Colombia Time':'COT',
                'Cook Island Time':'CKT',
                'Coordinated Universal Time':'UTC',
                'East Africa Time':'EAT',
                'Easter Island Standard Time':'EAST',
                'Eastern Caribbean Time (does not recognise DST)':'ECT',
                'Eastern Daylight Time (North America)':'EDT',
                'Eastern European Daylight Time':'EEDT',
                'Eastern European Summer Time':'EEST',
                'Eastern European Time':'EET',
                'Eastern Standard Time (North America)':'EST',
                'Ecuador Time':'ECT',
                'Falkland Islands Summer Time':'FKST',
                'Falkland Islands Time':'FKT',
                'Fiji Time':'FJT',
                'French Guiana Time':'GFT',
                'Further-eastern_European_Time':'FET',
                'Galapagos Time':'GALT',
                'Gambier Island Time':'GIT',
                'Georgia Standard Time':'GET',
                'Gilbert Island Time':'GILT',
                'Greenwich Mean Time':'GMT',
                'Gulf Standard Time':'GST',
                'Guyana Time':'GYT',
                'Hawaii Standard Time':'HST',
                'Hawaii-Aleutian Daylight Time':'HADT',
                'Hawaii-Aleutian Standard Time':'HAST',
                'Heard and McDonald Islands Time':'HMT',
                'Heure AvancÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e d\'Europe Centrale francised name for CEST':'HAEC',
                'Hong Kong Time':'HKT',
                'Indian Standard Time':'IST',
                'Indochina Time':'ICT',
                'Iran Standard Time':'IRST',
                'Irish Summer Time':'IST',
                'Irkutsk Time':'IRKT',
                'Israel Standard Time':'IST',
                'Israeli Daylight Time':'IDT',
                'Japan Standard Time':'JST',
                'Kamchatka Time':'PETT',
                'Korea Standard Time':'KST',
                'Krasnoyarsk Time':'KRAT',
                'Line Islands Time':'LINT',
                'Lord Howe Standard Time':'LHST',
                'Magadan Time':'MAGT',
                'Malaysia Time':'MYT',
                'Malaysian Standard Time':'MST',
                'Marquesas Islands Time':'MIT',
                'Mauritius Time':'MUT',
                'Middle European Saving Time Same zone as CEST':'MEST',
                'Middle European Time Same zone as CET':'MET',
                'Moscow Standard Time':'MSK',
                'Moscow Summer Time':'MSD',
                'Mountain Daylight Time (North America)':'MDT',
                'Mountain Standard Time (North America)':'MST',
                'Myanmar Standard Time':'MST',
                'Nepal Time':'NPT',
                'New Zealand Daylight Time':'NZDT',
                'New Zealand Standard Time':'NZST',
                'Newfoundland Daylight Time':'NDT',
                'Newfoundland Standard Time':'NST',
                'Newfoundland Time':'NT',
                'Norfolk Time<sup id="cite_ref-0" class="reference"><span>[</span>1<span>]</span></sup>':'NFT',
                'Omsk Time':'OMST',
                'Pacific Daylight Time (North America)':'PDT',
                'Pacific Standard Time (North America)':'PST',
                'Pakistan Standard Time':'PKT',
                'Philippine Standard Time':'PST',
                'Phoenix Island Time':'PHOT',
                'RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©union Time':'RET',
                'Samara Time':'SAMT',
                'Samoa Standard Time':'SST',
                'Seychelles Time':'SCT',
                'Singapore Standard Time':'SST',
                'Singapore Time':'SGT',
                'Solomon Islands Time':'SBT',
                'South African Standard Time':'SAST',
                'South Georgia and the South Sandwich Islands':'GST',
                'Sri Lanka Time':'SLT',
                'Tahiti Time':'TAHT',
                'Thailand Standard Time':'THA',
                'Uruguay Standard Time':'UYT',
                'Uruguay Summer Time':'UYST',
                'Venezuelan Standard Time':'VET',
                'Vladivostok Time':'VLAT',
                'West Africa Time':'WAT',
                'Western European Daylight Time':'WEDT',
                'Western European Summer Time':'WEST',
                'Western European Time':'WET',
                'Western Standard Time':'WST',
                'Yakutsk Time':'YAKT',
                'Yekaterinburg Time':'YEKT'
            },
            currentTimezone = datetime.toTimeString().replace(/.*?\((.*?)\).*?/, '$1'),
        //    dateWithZero = (date < 10 ? "0" + date : date),
        //    threeLetterDay = ['\\S\\u\\n','\\M\\o\\n','\\T\\u\\e\\s','\\W\\e\\d','\\T\\h\\u','\\F\\r\\i', '\\S\\a\\t'][day],
        //    threeLetterMonth = ['\\J\\a\\n','\\F\\e\\b','\\M\\a\\r','\\A\\p\\r','\\M\\a\\y','\\J\\u\\n','\\J\\u\\l','\\A\\u\\g','\\S\\e\\p','\\O\\c\\t','\\N\\o\\v','\\D\\e\\c'][month - 1],
        //    hour24 = (hour < 10 ? "0" + hour : hour),
            minuteWithZero = (minute < 10 ? "0" + minute : minute),
            secondsWithZero = (second < 10 ? "0" + second : second);

            if (options.gmt) {
                datetime = new Date(datetime.valueOf() - localTimeZoneOffset*60*60000);
                currentTimezone = "GMT";
                GMTDiff = 0;
            }

            var date = datetime.getDate(),
            day = datetime.getDay();
            month = datetime.getMonth() + 1;
            year = datetime.getFullYear();
            firstMonday = new Date((new Date('1/6/' + year)).getTime() + (1-(new Date('1/6/' + year)).getDay())*(24*60*60*1000));
            week = Math.ceil(Math.ceil((datetime - (firstMonday - (new Date('1/1/'+year)))) - (new Date('12/31/' + (year - 1))))/(7*24*60*60*1000));
            hour = datetime.getHours();

            dateWithZero = (date < 10 ? "0" + date : date);
            threeLetterDay = ['\\S\\u\\n','\\M\\o\\n','\\T\\u\\e\\s','\\W\\e\\d','\\T\\h\\u','\\F\\r\\i', '\\S\\a\\t'][day];
            threeLetterMonth = ['\\J\\a\\n','\\F\\e\\b','\\M\\a\\r','\\A\\p\\r','\\M\\a\\y','\\J\\u\\n','\\J\\u\\l','\\A\\u\\g','\\S\\e\\p','\\O\\c\\t','\\N\\o\\v','\\D\\e\\c'][month - 1];
            hour24 = (hour < 10 ? "0" + hour : hour),
            GMTDiffFormatted = (GMTDiff > 0 ? "+" : "-") + (Math.abs(GMTDiff) < 10 ? "0" : "") + Math.abs(GMTDiff) + "00";



            return /*option d*/format.replace(/([^\\])d|^d/g, '$1' + dateWithZero).// replace all d's with the 2 digit day leading 0
            /*option D*/replace(/([^\\])D|^D/g, '$1' + threeLetterDay).// replace all D's with A textual representation of a day, three letters
            /*option j*/replace(/([^\\])j|^j/g, '$1' + date).// replace all j's with the day without leading 0
            /*option l*/replace(/([^\\])l|^l/g, '$1' + ['\\S\\u\\n\\d\\a\\y','\\M\\o\\n\\d\\a\\y','\\T\\u\\e\\s\\d\\a\\y','\\W\\e\\d\\n\\e\\s\\d\\a\\y','\\T\\h\\u\\r\\s\\d\\a\\y','\\F\\r\\i\\d\\a\\y', '\\S\\a\\t\\u\\r\\d\\a\\y'][day]).// replace all l's (lower case L) with A full textual representation of the day of the week
            /*option N*/replace(/([^\\])N|^N/g, '$1' + (day == 0 ? 7 : day)).// replace all N's with ISO-8601 numeric representation of the day of the week
            /*option S*/replace(/([^\\])S|^S/g, '$1' + (date > 3 ? '\\t\\h' : (date == 1 ? '\\s\\t' : (date == 2 ? '\\n\\d' : '\\r\\d')))).// replace all S's with English ordinal suffix for the day of the month, 2 characters
            /*option w*/replace(/([^\\])w|^w/g, '$1' + day).// replace all w's with Numeric representation of the day of the week
            /*option z*/replace(/([^\\])z|^z/g, '$1' + Math.ceil(Math.ceil(datetime - (new Date('12/31/' + (year - 1))))/(24*60*60*1000)) - 1).// replace all z's with The day of the year (starting from 0)

            /*option W*/replace(/([^\\])W|^W/g, '$1' + (week > 0 ? week : 52)).// replace all W's with ISO-8601 week number of the year, weeks staring on Monday

            /*option F*/replace(/([^\\])F|^F/g, '$1' + ['\\J\\a\\n\\u\\a\\r\\y','\\F\\e\\b\\r\\u\\a\\r\\y','\\M\\a\\r\\c\\h','\\A\\p\\r\\i\\l','\\M\\a\\y','\\J\\u\\n\\e','\\J\\u\\l\\y','\\A\\u\\g\\u\\s\\t','\\S\\e\\p\\t\\e\\m\\b\\e\\r','\\O\\c\\t\\o\\b\\e\\r','\\N\\o\\v\\e\\m\\b\\e\\r','\\D\\e\\c\\e\\m\\b\\e\\r'][month - 1]).// replace all F's with A full textual representation of a month, such as January or March
            /*option m*/replace(/([^\\])m|^m/g, '$1' + (month < 10 ? "0" + month : month)).// replace all m's with Numeric representation of a month, with leading zeros
            /*option M*/replace(/([^\\])M|^M/g, '$1' + threeLetterMonth).// replace all M's with A short textual representation of a month, three letters
            /*option n*/replace(/([^\\])n|^n/g, '$1' + month).// replace all n's with Numeric representation of a month, without leading zeros
            /*option t*/replace(/([^\\])t|^t/g, '$1' + (month == 2 && $c.isInt(year/4) ? 29 :[31,28,31,30,31,30,31,31,30,31,30,31][month - 1])).// replace all t's with Number of days in the given month

            /*option L*/replace(/([^\\])L|^L/g, '$1' + $c.isInt(year/4) ? 0 : 1).//replace all t's with Whether it's a leap year
            /*option o*/replace(/([^\\])o|^o/g, '$1' + (week > 0 ? year : year - 1)).//replace all o's with A full numeric representation of a year, 4 digits.  If 'W' belongs to the previous or next year, that year is used instead.
            /*option Y*/replace(/([^\\])Y|^Y/g, '$1' + year).//replace all t's with A full numeric representation of a year, 4 digits
            /*option y*/replace(/([^\\])y|^y/g, '$1' + year.toString().substring(year.toString().length - 2)).//replace all t's with A two digit representation of a year

            /*option a*/replace(/([^\\])a|^a/g, '$1' + (hour > 11 ? "\\p\\m" : "\\a\\m")).//replace all a's with Lowercase Ante meridiem and Post meridiem
            /*option A*/replace(/([^\\])A|^A/g, '$1' + (hour > 11 ? "\\P\\M" : "\\A\\M")).//replace all A's with Uppercase Ante meridiem and Post meridiem
            /*option B*/replace(/([^\\])B|^B/g, '$1' + Math.floor((((datetime.getUTCHours() + 1)%24) + datetime.getUTCMinutes()/60 + datetime.getUTCSeconds()/3600)*1000/24)).//replace all B's with Swatch Internet time
            /*option g*/replace(/([^\\])g|^g/g, '$1' + (hour == 0 ? 12 : hour > 12 ? hour - 12 : hour)).//replace all g's with 12-hour format of an hour without leading zeros
            /*option G*/replace(/([^\\])G|^G/g, '$1' + hour).//replace all G's with 24-hour format of an hour without leading zeros
            /*option h*/replace(/([^\\])h|^h/g, '$1' + (hour < 10 ? "0" + hour : (hour > 12 && hour - 12 < 10) ? "0" + (hour - 12) : hour)).//replace all h's with 12-hour format of an hour with leading zeros
            /*option H*/replace(/([^\\])H|^H/g, '$1' + hour24).//replace all H's with 24-hour format of an hour with leading zeros
            /*option i*/replace(/([^\\])i|^i/g, '$1' + minuteWithZero).//replace all i's with Minutes with leading zeros
            /*option s*/replace(/([^\\])s|^s/g, '$1' + secondsWithZero).//replace all s's with Seconds, with leading zeros
            /*option u*/replace(/([^\\])u|^u/g, '$1' + epoch*1000).//replace all u's with Microseconds

            /*option e*/replace(/([^\\])e|^e/g, '$1' + currentTimezone).//replace all e's with Timezone identifier
            /*option I*/replace(/([^\\])I|^I/g, '$1' + Math.max((new Date(datetime.getFullYear(), 0, 1)).getTimezoneOffset(), (new Date(datetime.getFullYear(), 6, 1)).getTimezoneOffset()) > datetime.getTimezoneOffset() ? 1 : 0).//replace all I's with Whether or not the date is in daylight saving time

            /*option O*/replace(/([^\\])O|^O/g, '$1' + GMTDiffFormatted).//replace all O's with Difference to Greenwich time (GMT) in hours	
            /*option P*/replace(/([^\\])P|^P/g, '$1' + GMTDiffFormatted.substr(0, 3) + ":" + GMTDiffFormatted.substr(3,2)).//replace all P's with Difference to Greenwich time (GMT) with colon between hours and minutes
            /*option T*/replace(/([^\\])T|^T/g, '$1' + timezones[currentTimezone]).//replace all T's with Timezone abbreviation
            /*option Z*/replace(/([^\\])Z|^Z/g, '$1' + (-1 * GMTDiff * 60)).//replace all Z's with Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive


            /*option c*/replace(/([^\\])c|^c/g, '$1' + (datetime.toISOString ? datetime.toISOString() : "")).//replace all c's with ISO 8601 date
            /*option r*/replace(/([^\\])r|^r/g, '$1' + threeLetterDay + ', ' + dateWithZero + ' ' + threeLetterMonth + ' ' + year  + ' ' + hour24 + ':' + minuteWithZero + ':' + secondsWithZero + ' ' + GMTDiffFormatted).//replace all r's with RFC 2822 formatted date
            /*option U*/replace(/([^\\])U|^U/g, '$1' + epoch / 1000).//replace all U's with Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT)
            replace(/\\/gi, "");
        } catch (e) {
            error("Date.format", e);
        }
    }, true);
    
    _ext(Date, 'isValidDate', function () {
        try {
            return !isNaN(this.getTime());
        } catch (e) {
            error("Date.isValidDate", e);
        }
    });


    /*----------------------------------------------------------------------------------------------------------------
    /-	Number class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    _ext(Number, 'aboutEqualTo', function (compare, giveOrTake) {
        try {
            return $c.isBetween(this, compare - giveOrTake, compare + giveOrTake, true);
        } catch (e) {
            error("Number.aboutEqualTo", e);
        }
    }, true);

    _ext(Number, 'isEven', function () {
        try {
            return _even(this);
        } catch (e) {
            error("Number.isEven", e);
        }
    }, true);
    
    _ext(Number, 'isOdd', function () {
        try {
            return !_even(this);
        } catch (e) {
            error("Number.isOdd", e);
        }
    }, true);

    _ext(Number, 'toCurrencyNotation', function () {
        try {
            return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
        } catch (e) {
            error("Number.toCurrencyNotation", e);
        }
    }, true);


    /*----------------------------------------------------------------------------------------------------------------
    /-	Object class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    _ao("changes", function(compare){
        try {
            if (this.constructor != Object || compare.constructor != Object) {
                throw new TypeError();
                return;
            }
            var rtn = {$length:0};
            // loop through each property of the original
            for (var prop in this) {
                if (this.hasOwnProperty(prop)) {
                    if (!compare.hasOwnProperty(prop)) {
                        rtn[prop] = null;
                        rtn.$length++;
                    } else if (!$c.equals(compare[prop], this[prop])) {
                        rtn[prop] = compare[prop];
                        rtn.$length++;
                    }
                }
            }
            // loop through each property of the compare to make sure 
            // there are no properties from compare missing from the original
            for (var prop in compare) {
                if (compare.hasOwnProperty(prop) && !this.hasOwnProperty(prop)) {
                    rtn[prop] = compare[prop];
                    rtn.$length++;
                }
            }
            return rtn;
        
        } catch (e) {
            error("Object.changes", e);
        }
    });
    _ao("contains", function(val, func){
        try {
            switch(true) {
                case $c.isArray(this):
                    if (func) {
                        return $c.indexOfAlt(this, func) != -1;
                    }
                    return this.indexOf(val) != -1;
                case $c.isString(this):
                    return this.indexOf(val) != -1;
                case $c.isObject(this):
                    for (var prop in this) {
                        if ((func && func(this[prop])) || this[prop] == val) {
                            return true;
                        }
                    }
                    break;
                case $c.isNumber(this):
                    return this.toString().indexOf(val) != -1;
            }
            return false;
        } catch (e) {
            error("Object.contains", e);
        }
    });
     _ao("copyObject", function () {
        try {
            if (!this) {
                return undefined;
            }
            var copyObject = typeof(this.constructor) == "function" ? new this.constructor() : {};
//            copyObject.duplicate ? copyObject.duplicate(this, true) : $c.duplicate(copyObject, this, true);
            copyObject.duplicate ? copyObject.duplicate(this, true) : $c.duplicate(copyObject, this, true);
            return copyObject;
        } catch (e) {
            error("Object.copyObject", e);
        }
    });
    _ao("duplicate", function (original, recursive/*, ref, current_path, exec*/) {
        try {
            if ($c.isString(this) || $c.isString(original)
                || $c.isInt(this) || $c.isInt(original)
                || $c.isFloat(this) || $c.isFloat(original)
                || $c.isNumber(this) || $c.isNumber(original)) {
                error('duplicate', 'invalid type');
                return false;
            }
            var argIndex = 2;
            if (!$c.isBoolean(arguments[1])) {
                argIndex = 3;
            }

            // remove all properties if it is the root level
            var ref = arguments[argIndex] || {objects:[{obj:original,path:"this"}]},
            current_path = arguments[argIndex+1] || "this";
            (arguments[argIndex+2] || (arguments[argIndex+2] = {})) && (arguments[argIndex+2].command = arguments[argIndex+2].command || "");
            if (!ref.objects.length == 1) {
                for (prop in this){
                    if (this.hasOwnProperty(prop)) {
                        delete this[prop];	
                    }
                }
            }
            var loop_func = function (prop, original) {
                if (original.hasOwnProperty(prop) && original[prop] && (!$c.isFunction(original[prop]) || !recursive)) {
                    var index = ref.objects.indexOfAlt(original[prop],function(obj,value){
                        return obj.obj===value;
                    }),
                    new_path = current_path+"["+parseRaw(prop)+"]";

                    if (index != -1) {
                        arguments[argIndex+1].command += new_path + "="+ref.objects[index].path+";";
                        return;
                    }

                    if (typeof(original[prop]) == "object" && recursive) {
                        this[prop] = typeof(original[prop].constructor) == "function" ? new original[prop].constructor() : {};
                        ref.objects.push({obj:original[prop],path:new_path});
                        $c.duplicate(this[prop], original[prop], true, ref, new_path, arguments[argIndex+1]);
                        return;
                    }
                } else if (!original.hasOwnProperty(prop)) {
                    return;
                }
                this[prop] = original[prop];
            }
            //JSON.parse(JSON.stringify(obj));
            if ($c.isArray(original)) {
                for (var i = 0, len = original.length; i < len; i++){
                    loop_func.call(this, i, original, ref, current_path, arguments[argIndex+2]);
                }
            } else {
                for (prop in original){
                    loop_func.call(this, prop, original, ref, current_path, arguments[argIndex+2]);
                }
            }

            if (!arguments[argIndex+1]) {
                eval(arguments[argIndex+2].command);
            }

            return this;
        } catch (e) {
            error('Object.duplicate', e);
        }
    });
    _ao("equals", function (compare){
        try {
            if (($c.isObject(this) && $c.isObject(compare)) || ($c.isArray(this) && $c.isArray(compare))) {
                for (prop in compare){
                    if (!compare.hasOwnProperty(prop)) {
                        continue;
                    }
                    if (this[prop] !== compare[prop]) {
                        return false;
                    }
                }
                for (prop in this){
                    if (!this.hasOwnProperty(prop)) {
                        continue;
                    }
                    if (this[prop] !== compare[prop]) {
                        return false;
                    }
                }
                return true;
            } else {
                return (this.toString() == compare.toString() && this.constructor == compare.constructor);
            }
        } catch (e) {
            error('Object.equals', e);
        }
    });
    _ao("every", function(callback) {
        try {
            for (var prop in this) {
                if (this.hasOwnProperty(prop)) {
                    callback(this[prop]);
                }
            }
        } catch (e) {
            error('Object.every', e)
        }
    });
    
    _ao("getClass", function() {
        try {
            return _getFuncName(this);
        } catch (e) {
            error('Object.getClass', e)
        }
    });
    _ao("innerJoin", function (right, options) {
        try {
            if (!$c.isObject(this) && !$c.isObject(right)) {
                error('innerJoin', 'invalid type');
                return false;
            }
            var rtn = {};
            options = options || {equal:true};
            for (prop in this){
                if (!this.hasOwnProperty(prop)) {
                    continue;
                }
                (options.equal || options.left) && (right[prop] == this[prop])
                ? rtn[prop] = this[prop] : options.right && (rtn[prop] = right[prop]);	
            }
            return rtn;
        } catch (e) {
            error('Object.innerJoin', e);
        }
    });
    _ao("isArray", function () {
        try {
            return _isArray(this);
        } catch (e) {
            error('Object.isArray', e);
        }
    });
    _ao("isBetween", function(lowerBound, upperBound, inclusive) {
        try {
            if (this === undefined) {return false;}
            if (inclusive) {
                return (this >= lowerBound && this <= upperBound);
            } else {
                return (this > lowerBound && this < upperBound);
            }
        } catch (e) {
            error('Object.isBetween', e);
        }
    });
    _ao("isBoolean", function() {
        try {
            if (this === undefined) {return false;}
            return (this.constructor == Boolean);
        } catch (e) {
            error('Object.isBoolean', e);
        }
    });
    _ao("isDate", function() {
        try {
            if (this === undefined) {return false;}
            return (this.constructor == Date);
        } catch (e) {
            error('Object.isDate', e);
        }
    });
    _ao("isDomElement", function() {
        try {
            if (this === undefined) {return false;}
            return (this.nodeType == 1);
        } catch (e) {
            error('Object.isDomElement', e);
        }
    });
    _ao("isFloat", function() {
        try {
            if (this === undefined) {return false;}
            return ($c.isNumber(this) && (parseFloat(this) == this || parseFloat(this) === 0));
        } catch (e) {
            error('Object.isFloat', e);
        }
    });
    _ao("isFunction", function() {
        try {
            if (this === undefined) {return false;}
            return (this.constructor == Function);
        } catch (e) {
            error('Object.isFunction', e);
        }
    });
    _ao("isGeolocation", function () {
        try {
            if (this === undefined) {return false;}
            return (this.constructor.toString().indexOf('function Geolocation()') == 0);
        } catch (e) {
            error('Object.isGeolocation', e);
        }
    });
    _ao("isInt", function () {
        try {
            if (this === undefined || $c.isArray(this)) {return false;}
            return (parseInt(this) == this || parseInt(this) === 0);
        } catch (e) {
            error('Object.isInt', e);
        }
    });
    _ao("isNumber", function() {
        try {
            if (this === undefined) {return false;}
            return (this.constructor == Number);
        } catch (e) {
            error('Object.isNumber', e);
        }
    });
    _ao("isObject", function (check_instance) {
        try {
            if (this === undefined) {return false;}
            return (this.constructor == Object || (!!check_instance && this instanceof Object));
        } catch (e) {
            error('Object.isObject', e);
        }
    });
    _ao("isString", function () {
        try {
            return _isString(this);
        } catch (e) {
            error('Object.isString', e);
        }
    });
    _ao("isSubset", function (compare){
        try {
            if (($c.isObject(this) && $c.isObject(compare)) || ($c.isArray(this) && compare.isArray())) {

                for (prop in this){
                    if (!this.hasOwnProperty(prop)) {
                        continue;
                    }
                    if (!compare.hasOwnProperty(prop)) {
                        return false;
                    }
                }

                return true;
            } else {
                return $c.contains(this.toString(), compare.toString()) && this.constructor == compare.constructor;
            }
        } catch (e) {
            error('Object.isSubset', e);
        }
    });
    _ao("itemCount", function () {
        try {
            if ($c.isObject(this)) {
                var count = 0;
                for (prop in this){
                    if (this.hasOwnProperty(prop)) {
                        count++;	
                    }
                }
                return count;
            }
            return undefined;
        } catch (e) {
            error('Object.itemCount', e);
        }
    });
    _ao("joinLeft", function (right, overwrite) {
        try {
            if (!$c.isObject(this) && !$c.isObject(right)) {
                error('joinLeft', 'invalid type');
                return false;
            }
            for (prop in right){
                if (!this.hasOwnProperty(prop)) {
                    continue;
                }
                (!this[prop] || overwrite) && (this[prop] = right[prop]);
            }
            return true;
        } catch (e) {
            error('Object.joinLeft', e);
        }
    });
    _ao("joinRight", function (right, overwrite) {
        try {
            if (!$c.isObject(this) && !$c.isObject(right)) {
                error('joinRight', 'invalid type');
                return false;
            }
            for (prop in this){
                if (!this.hasOwnProperty(prop)) {
                    continue;
                }
                (!right[prop] || overwrite) && (right[prop] = this[prop]);
            }
            return true;
        } catch (e) {
            error('Object.joinRight', e);
        }
    });
    _ao("merge", function (secondary, condition) {//shareOnly) {
        try {
            condition = condition || {};
            var recurse = condition == "recurse" || condition.recurse,
                shared = condition == "onlyShared" || condition.onlyShared,
                objtmp = (condition == "clone" || condition.clone) ? $c.copyObject(this) : this,
                compareFunction = $c.isFunction(condition) ? condition : condition.compareFunction;

            for (var prop in secondary){
                if (secondary.hasOwnProperty(prop)) {
                    if (shared) {
                        // passing share Only
                        if (objtmp[prop]) {
                            objtmp[prop] = secondary[prop];
                        }
                    } else if (compareFunction && $c.isFunction(compareFunction)) {
                        if ($c.isArray(objtmp) && objtmp[prop] && compareFunction(objtmp[prop], secondary[prop])) {
                            objtmp[prop] = secondary[prop];
                            continue;
                        }
                        objtmp.push($c.duplicate({},secondary[prop]));
                    } else {
                        if ($c.isArray(objtmp) && (condition === undefined || recurse)) {
                            if (objtmp.indexOf(secondary[prop]) == -1) {
                                objtmp.push(secondary[prop]);
                            }
                        } else {
                            objtmp[prop] = secondary[prop];
                        }
                    }
                }
            }
            if (recurse) {
                var args = [],
                removeCount = 1;
                for (var aprop in arguments) {
                    if ($c.isInt(aprop)) {
                        args.push(arguments[aprop]);
                    } 
                }
                var noThis = false;
                if (typeof obj != "undefined") {
                    noThis = true;
                    removeCount = 2;
                }
                args.splice(0,removeCount,objtmp);
                objtmp = $c.merge.apply(noThis?obj:this, args);
            }
            return objtmp;
        } catch (e) {
            error('Object.merge', e);
        }
    });
    _ao("propertyValue", _pv);
    _ao("getProperty", _pv);
    _ao("setProperty", function (path, value, delimiter, options) {
        try {
            options = options || {};
            delimiter = delimiter || ".";
            var props = path.split(delimiter);
            var obj = this;
            for (var i = 0, len = props.length; i < len; i++) {
                if (i + 1 == len) {
                    obj[props[i]] = value;
                    return true;
                }
                obj[props[i]] = obj[props[i]] || {};
                obj = obj[props[i]];
            }
            return false;
        } catch (e) {
            error('Object.setProperty', e)
        }
    });
    _ao("toStringAlt", function (delimiter, prefix, urlEncode) {
        try {
            delimiter = delimiter || '=';
            prefix = prefix || '&';
            var str = '';
            for (var prop in this) {
                if (this.hasOwnProperty(prop)) {
                    urlEncode && 
                        (str += prefix + encodeURIComponent(prop) + delimiter + encodeURIComponent(this[prop])) || (str += prefix + prop + delimiter + this[prop]);
                }
            }
            return str;
        } catch (e) {
            error('Object.toStringAlt', e);
        }
    }, true);
    

    /*IE prototype workaround*/
    if(!$w.HTMLElement) {
        $w.HTMLElement = function(){};
        var _createElement = $d.createElement;

        $d.createElement = function(tag) {
            try {
                var _elem = _createElement(tag);
                _setDOMElementProperties(_elem);
                return _elem;
            } catch (e) {
                error("DOM.createElement", e);
            }
        };

        var _getElementById = $d.getElementById;

        $d.getElementById = function(id) {
            try {
                var _elem = _getElementById(id);
                _setDOMElementProperties(_elem);

                return _elem;
            } catch (e) {
                error("DOM. getElementById", e);
            }
        };

        var _getElementsByTagName = $d.getElementsByTagName;

        $d.getElementsByTagName = function(tag) {
            try {
                var _arr = _getElementsByTagName(tag);
                for(var _elem=0;_elem<_arr.length;_elem++) {
                    try {
                        if (isNull(_arr[_elem][name])) {
                            _setDOMElementProperties(_arr[_elem]);
                        }
                    } catch (e) {}
                }
                return _arr;
            } catch (e) {
                error("DOM.getElementsByTagName", e);
            }
        };
    }
    _ah = addHTMLPrototype;
    /*----------------------------------------------------------------------------------------------------------------
    /-	Event class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    (function(){
        if ($w.Event) {
            Event.prototype.pageX = Event.prototype.pageX || function(){
                try {
                    var scroll = $d.documentElement.scrollLeft ? $d.documentElement.scrollLeft : $d.body.scrollLeft;
                    return this.clientX + scroll;
                } catch (e) {
                    error("Event.pageX", e);
                }
            };
            Event.prototype._getCurrentTarget = Event.prototype._getCurrentTarget || function(func){
                try {
                    if(this.currentTarget){
                        return this.currentTarget;
                    } else {
                        var srcElement = this.srcElement,
                        sid = srcElement.id,
                        nextParentNode = srcElement.parentNode,
                        fnString = func ? func.toString() : arguments.callee.caller.toString(),
                        sIndex = fnString.indexOf("function", 0) + 8,
                        eIndex = fnString.indexOf("(", sIndex),
                        found = false,
                        fname = fnString.substring(sIndex, eIndex).trim();
                        while(sid){
                            if(EVENT_REGISTRY.Exists(sid, this.type, fname)){
                                return $(sid);
                            }
                            sid = nextParentNode.id;
                            nextParentNode = nextParentNode.parentNode;
                        }
                    }
                    return undefined;
                } catch (e) {
                    error("Event._getCurrentTarget", e);
                }
            };
        }
    })();

    /*----------------------------------------------------------------------------------------------------------------
    /-	DOM class Extensions
    /---------------------------------------------------------------------------------------------------------------*/
    _ah("_firstElementChild", function() {
        try {
            var children = this.childNodes;

            for (var i = 0; i < children.length; i++) {
                if (children[i].nodeType == 1) {
                    return children[i]; 
                }
            }
            return false;
        } catch (e) {
            error("DOM._firstElementChild", e);
            return false;
        }
    });
    _ah("_nextElementSibling", function() {
        try {
            var next = this.nextSibling;
            while (next && next.nodeType != 1) {
                next = next.nextSibling;
            }
            return next;
        } catch (e) {
            error("DOM._nextElementSibling", e);
            return false;
        }
    });
    _ah("addClass", function(name) {
        try {
            var arr = this.className.split(' ');
            arr.indexOf(name) != -1 || arr.push(name);
            this.className = arr.join(' ').trim();
            return true;
        } catch (e) {
            error("DOM.addClass", e);
            return false;
        }
    });
    _ah("blur", function (callback) {
        this.on("blur", callback);
    });
    _ah("change", function (callback) {
        this.on("change", callback);
    });
    _ah("click", function (callback) {
        this.on("click", callback);
    });
    _ah("contextmenu", function (callback) {
        this.on("contextmenu", callback);
    });
    _ah("dblclick", function (callback) {
        this.on("dblclick", callback);
    });
    _ah("drag", function (callback) {
        this.on("drag", callback);
    });
    _ah("dragend", function (callback) {
        this.on("dragend", callback);
    });
    _ah("dragenter", function (callback) {
        this.on("dragenter", callback);
    });
    _ah("dragleave", function (callback) {
        this.on("dragleave", callback);
    });
    _ah("dragover", function (callback) {
        this.on("dragover", callback);
    });
    _ah("dragstart", function (callback) {
        this.on("dragstart", callback);
    });
    _ah("drop", function (callback) {
        this.on("drop", callback);
    });
    _ah("focus", function (callback) {
        this.on("focus", callback);
    });
    _ah("formchange", function (callback) {
        this.on("formchange", callback);
    });
    _ah("forminput", function (callback) {
        this.on("forminput", callback);
    });
    _ah("getContainer", function (tagName) {
        try {
            var thiss = this.parentNode;
            if (tagName) {
                while (thiss && thiss.tagName.toLowerCase() != tagName) {
                    thiss = thiss.parentNode;
                }
            }
            return thiss;
        } catch (e) {
            error("DOM.getContainer", e);
            return false;
        }
    });
    _ah("getElementsByClassName", function(classnames, taghint) {
        try {
            var exps = classnames.split(/\s+/).map(function(name) {
                name = name.replace(/([/\\^$*+?.()|[\]{}])/g, '\\$1');
                return new RegExp('(^|\\s)'+name+'(\\s|$)');
            }),
            elems = this.getElementsByTagName(taghint || '*'),
            matches = Array();
            for (var i = 0, len = this.length; i < len; i++) {
                var elem = elems[i];
                (exps.every(function(exp) {
                    return exp.test(elem.className);
                })) && matches.push(el);
            }
            return matches;
        } catch (e) {
            error("DOM.getElementsByClassName", e);
            return false;
        }
    });
    _ah("hasClass", function(name) {
        try {
            var regex = new RegExp('((^)|(\\s+))' + name + '(\\s+|$)');
            return regex.test(this.className);
        } catch (e) {
            error("DOM.addClass", e);
            return false;
        }
    });
    _ah("height", function(isBody) {
        try {
            return _getDimension.call(this, isBody, 'height');
        } catch (e) {
            error("DOM.height", e);
            return false;
        }
    });
    _ah("hide", function() {
        try {
            if (this.tagName.toLowerCase() == "object") {
                this.style.visibility = "hidden";
                !parseInt(this.height) || this.setAttribute('data-height', this.height);
                !parseInt(this.width) || this.setAttribute('data-width', this.width);

                this.height = 0;
                this.width = 0;
            } else {
                this.style.display = "none";
            }
            return true;
        } catch (e) {
            error("DOM.hide", e);
            return false;
        }
    });
    _ah("hookEvent", function(type, fn){
        try {
            var fnString = fn.toString(),
            sIndex = fnString.indexOf("function", 0) + 8,
            eIndex = fnString.indexOf("(", sIndex),
            fname = fnString.substring(sIndex, eIndex).trim();

            if (typeof(EVENT_REGISTRY[this.id]) == "undefined") {
                EVENT_REGISTRY[this.id] = Array();
                EVENT_REGISTRY.length++;
            }

            if(!EVENT_REGISTRY.Exists(this.id, type, fname)) {
                if (this.attachEvent) {
                    this['e' + type + fn] = fn;
                    this[type + fn] = function() { 
                        try {
                            if (this['e' + type + fn]) {
                                this['e' + type + fn]($w.event);
                            } else {
                                if (this.event._getCurrentTarget(fn.toString())) {
                                    this.event._getCurrentTarget(fn.toString())['e' + type + fn]($w.event);            				
                                }
                            }
                        } catch (ex) {
                            error("hookEvent.anonymous", ex);
                        }
                    };
                    this.attachEvent("on" + type, this[type + fn]);
                } else {
                    this.addEventListener(type, fn, false);
                }
                EVENT_REGISTRY[this.id][EVENT_REGISTRY[this.id].length] = [type, fname];
                return true;
            }
            return false;
        } catch (e) {
            error("DOM.hookEvent", e);
            return false;
        }
    });
    _ah("insertAfter", function (refElem){
        try {
            var next = $c.isFunction(refElem.nextElementSibling) ? refElem.nextElementSibling() : refElem.nextElementSibling;
            next ? refElem.parentNode.insertBefore(this, next) : refElem.parentNode.appendChild(this);
            return true;
        } catch (e) {
            error("DOM.insertAfter", e);
            return false;
        } 
    });
    _ah("input", function (callback) {
        this.on("input", callback);
    });
    _ah("insertAlphabetically", function (elem){
        try {
            var childNodes = this.children,
            eid = elem.id.toLowerCase(),
            arr = Array(),
            index = -1;

            for (var i = 0; i < childNodes.length; i++) {
                arr[i] = childNodes[i].id.toLowerCase();
            }
            arr[arr.length] = eid;
            arr.sort();
            index = arr.indexOf(eid);
            if (arr.length > 1 && index != arr.length - 1) {
                this.insertBefore(elem, childNodes[index]);
            } else {
                this.appendChild(elem);
            }
            return true;
        } catch (e) {
            error("DOM.insertAlphabetically", e);
            return false;
        } 
    });
    _ah("insertAt", function (elem, pos){
        try {
            var children = this.children;
            pos = pos || 0;
            if (children.length > pos) {
                this.insertBefore(elem, children[pos]);
                return true;
            } else if (children.length == pos) {
                this.appendChild(elem);
                return true;
            }
            return false;
        } catch (e) {
            error("DOM.insertAt", e);
            return false;
        } 
    });
    _ah("invalid", function (callback) {
        this.on("invalid", callback);
    });
    _ah("keydown", function (callback) {
        this.on("keydown", callback);
    });
    _ah("keypress", function (callback) {
        this.on("keypress", callback);
    });
    _ah("keyup", function (callback) {
        this.on("keyup", callback);
    });
    _ah("left", function() {
        try {
            return _getDimension.call(this, null, 'left');
            //return this.getClientRects && this.getClientRects()[0].left <= this.offsetLeft ? this.getClientRects()[0].left : this.offsetLeft;
        } catch (e) {
            error("DOM.left", e);
            return false;
        }
    });
    _ah("mousedown", function (callback) {
        this.on("mousedown", callback);
    });
    _ah("mousemove", function (callback) {
        this.on("mousemove", callback);
    });
    _ah("mouseout", function (callback) {
        this.on("mouseout", callback);
    });
    _ah("mouseover", function (callback) {
        this.on("mouseover", callback);
    });
    _ah("mouseup", function (callback) {
        this.on("mouseup", callback);
    });
    _ah("mousewheel", function (callback) {
        this.on("mousewheel", callback);
    });
    _ah("moveDown", function (tagName) {
        try {
            var thiss = this;
            while (!isNull(thiss.nextSibling) && (thiss.nextSibling.nodeType != 1 || (tagName && thiss.nextSibling.tagName.toLowerCase() != tagName))) {
                thiss = thiss.nextSibling;
            }
            //if not last element
            if (!isNull(thiss.nextSibling)) {
                thiss.parentNode.insertBefore(this, thiss.nextSibling.nextSibling);
                return true;
            }
            return false;
        } catch (e) {
            error("DOM.moveDown", e);
            return false;
        }
    });
    _ah("moveUp", function (tagName) {
        try {
            var thiss = this;
            while (!isNull(thiss.previousSibling) && (thiss.previousSibling.nodeType != 1 || (tagName && thiss.previousSibling.tagName.toLowerCase() != tagName))) {
                thiss = thiss.previousSibling;
            }
            //if not first element
            if (!isNull(thiss.previousSibling)) {
                thiss.parentNode.insertBefore(this, thiss.previousSibling);
                return true;
            }
            return false;
        } catch (e) {
            error("DOM.moveUp", e);
            return false;
        }
    });
    _ah("on", function (event, callback) {
        if (!callback) {
            return _trigger(this, event);
        } else {
            this.evts = this.evts || [];
            this.evts.push({event:callback});
        }
    });
    _ah("remove", function () {
        try {
            return this.parentNode.removeChild(this);
        } catch (e) {
            error("DOM.remove", e);
            return false;
        }
    });
    _ah("removeClass", function(name) {
        try {
            var arr = this.className.split(' '),
            index = arr.indexOf(name);
            if (index != -1) {
                arr.splice(index,1);
                this.className = arr.join(' ').trim();
            }
            return true;
        } catch (e) {
            error("DOM.removeClass", e);
            return false;
        }
    });
    _ah("reset", function (callback) {
        this.on("reset", callback);
    });
    _ah("scroll", function (callback) {
        this.on("scroll", callback);
    });
    _ah("select", function (callback) {
        this.on("select", callback);
    });
    _ah("show", function() {
        try {
            if (this.tagName.toLowerCase() == "object") {
                this.style.visibility = "visible";
                this.height = this.getAttribute('data-height') || this.height;
                this.width = this.getAttribute('data-width') || this.width;
                this.removeAttribute('data-height');
                this.removeAttribute('data-width');
            } else {
                this.style.display = "block";
            }
            return true;
        } catch (e) {
            error("DOM.show", e);
            return false;
        }
    });
    _ah("submit", function (callback) {
        this.on("submit", callback);
    });
    _ah("toggle", function() {
        try {
            var style = "visibility",
            inheritedStyle,
            parent = this.parentNode;
            this.tagName.toLowerCase() == "object" || (style = "display");
            // look for inherited style
            inheritedStyle = this.style[style] in {
                none:1,
                hidden:1
            };
            while (parent && !inheritedStyle) {
                if (parent.style && parent.style[style]) {
                    inheritedStyle = parent.style[style] in {
                        none:1,
                        hidden:1
                    };
                    break;
                }
                parent = parent.parentNode;
            }
            //finally check if height and width are 0/false
            !this.width() && !this.height() && (inheritedStyle = true);
            inheritedStyle ? this.show() : this.hide();
            return true;
        } catch (e) {
            error("DOM.toggle", e);
            return false;
        }
    });
    _ah("top", function() {
        try {
            return _getDimension.call(this, null, 'top');
            //return this.getClientRects && this.getClientRects()[0].top <= this.offsetTop ? this.getClientRects()[0].top : this.offsetTop;
        } catch (e) {
            error("DOM.top", e);
            return false;
        }
    });
    _ah("toString", function () {
        try {
            var domElemContainer = $d.createElement('div');
            domElemContainer.appendChild(this.cloneNode(true));
            return domElemContainer.innerHTML; 
        } catch (e) {
            error("DOM.toString", e);
            return false;
        }
    }, true);
    _ah("unbind", function (event, func) {
        var index = this.events.indexOfAlt(func, function(obj, value){return(obj[event].toString()== value.toString());});
        index != -1 && this.events.splice(index);
        return this;
    });
    _ah("unhookEvent", function(type, fn) {
        try {
            var fnString, sIndex, eIndex, fname = "", pos = {};
            if(fn) {
                fnString = fn.toString();
                sIndex = fnString.indexOf("function", 0) + 8;
                eIndex = fnString.indexOf("(", sIndex);
                fname = fnString.substring(sIndex, eIndex).trim();
            }
            if (EVENT_REGISTRY.Exists(this.id, type, fname, pos)) {
                EVENT_REGISTRY[this.id].splice(pos.index, 1);

                if (this.detachEvent) {
                    this.detachEvent("on" + type, this[type + fn]);
                    this[type + fn] = null;
                } else {
                    this.removeEventListener(type, fn, false);
                }
                if (EVENT_REGISTRY[this.id].length < 1) {
                    delete EVENT_REGISTRY[this.id];
                    EVENT_REGISTRY.length--;
                }
            }
            return true;
        } catch (e) {
            error("DOM.unhookEvent", e);
            return false;
        }
    });
    _ah("width", function(isBody) {
        try {
            return _getDimension.call(this, isBody, 'width');
        } catch (e) {
            error("DOM.width", e);
            return false;
        }
    });

    /*dataset workaround*/
    if (!$w.DOMStringMap) {
        _ah("_dataset", function(){
            try {
                var attributes = this.attributes,
                ds = {};
                for (var i in attributes) {
                    attribute = attributes[i];
                    if (attribute.name.indexOf("data-") == 0) {
                        ds[attribute.name.substring(5)] = attribute.value;
                    }
                }
                return eval(ds);
            } catch (e) {
                error("DOM._dataset", e);
            }
        });
    }
    
    
    /**

    JSZip - A Javascript class for generating Zip files
    <http://jszip.stuartk.co.uk>

    (c) 2009 Stuart Knightley <stuart [at] stuartk.co.uk>
    Licenced under the GPLv3 and the MIT licences

    Usage:
       zip = new JSZip();
       zip.add("hello.txt", "Hello, World!").add("tempfile", "nothing");
       zip.folder("images").add("smile.gif", base64Data, {base64: true});
       zip.add("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
       zip.remove("tempfile");

       base64zip = zip.generate();

    **/

    function JSZip(compression)
    {
        // default : no compression
        this.compression = (compression || "STORE").toUpperCase();
        this.files = [];

        // Where we are in the hierarchy
        this.root = "";

        // Default properties for a new file
        this.d = {
            base64: false,
            binary: false,
            dir: false,
            date: null
        };

        if (!JSZip.compressions[this.compression]) {
            throw compression + " is not a valid compression method !";
        }
    }
    /**
     * Add a file to the zip file
     * @param   name  The name of the file
     * @param   data  The file data, either raw or base64 encoded
     * @param   o     File options
     * @return  this JSZip object
     */
    JSZip.prototype.add = function(name, data, o){
        o = o || {};
        name = this.root+name;
        if (o.base64 === true && o.binary == null) o.binary = true;
        for (var opt in this.d){
            o[opt] = o[opt] || this.d[opt];
        }

        // date
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
        // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

        o.date = o.date || new Date();
        var dosTime, dosDate;

        dosTime = o.date.getHours();
        dosTime = dosTime << 6;
        dosTime = dosTime | o.date.getMinutes();
        dosTime = dosTime << 5;
        dosTime = dosTime | o.date.getSeconds() / 2;

        dosDate = o.date.getFullYear() - 1980;
        dosDate = dosDate << 4;
        dosDate = dosDate | (o.date.getMonth() + 1);
        dosDate = dosDate << 5;
        dosDate = dosDate | o.date.getDate();

        if (o.base64 === true) data = JSZipBase64.decode(data);
        // decode UTF-8 strings if we are dealing with text data
        if(o.binary === false) data = this.utf8encode(data);


        var compression    = JSZip.compressions[this.compression];
        var compressedData = compression.compress(data);

        var header = "";

        // version needed to extract
        header += "\x0A\x00";
        // general purpose bit flag
        header += "\x00\x00";
        // compression method
        header += compression.magic;
        // last mod file time
        header += this.decToHex(dosTime, 2);
        // last mod file date
        header += this.decToHex(dosDate, 2);
        // crc-32
        header += this.decToHex(this.crc32(data), 4);
        // compressed size
        header += this.decToHex(compressedData.length, 4);
        // uncompressed size
        header += this.decToHex(data.length, 4);
        // file name length
        header += this.decToHex(name.length, 2);
        // extra field length
        header += "\x00\x00";

        // file name

        this.files[name] = {
            header: header, 
            data: compressedData, 
            dir: o.dir
            };

        return this;
    };

    /**
     * Add a directory to the zip file
     * @param   name  The name of the directory to add
     * @return  JSZip object with the new directory as the root
     */
    JSZip.prototype.folder = function(name)
    {
        // Check the name ends with a /
        if (name.substr(-1) != "/") name += "/";

        // Does this folder already exist?
        if (typeof this.files[name] === "undefined") this.add(name, '', {
            dir:true
        });

        // Allow chaining by returning a new object with this folder as the root
        var ret = this.clone();
        ret.root = this.root+name;
        return ret;
    };

    /**
     * Compare a string or regular expression against all of the filenames and
     * return an informational object for each that matches.
     * @param  needle string/regex The regular expression to test against
     * @return  An array of objects representing the matched files. In the form
     *          {name: "filename", data: "file data", dir: true/false}
     */
    JSZip.prototype.find = function(needle)
    {
        var result = [], re;
        if (typeof needle === "string")
        {
            re = new RegExp("^"+needle+"$");
        }
        else
        {
            re = needle;
        }

        for (var filename in this.files)
        {
            if (re.test(filename))
            {
                var file = this.files[filename];
                result.push({
                    name: filename, 
                    data: file.data, 
                    dir: !!file.dir
                    });
            }
        }

        return result;
    };

    /**
     * Delete a file, or a directory and all sub-files, from the zip
     * @param   name  the name of the file to delete
     * @return  this JSZip object
     */
    JSZip.prototype.remove = function(name)
    {
        var file = this.files[name];
        if (!file)
        {
            // Look for any folders
            if (name.substr(-1) != "/") name += "/";
            file = this.files[name];
        }

        if (file)
        {
            if (name.match("/") === null)
            {
                // file
                delete this.files[name];
            }
            else
            {
                // folder
                var kids = this.find(new RegExp("^"+name));
                for (var i = 0; i < kids.length; i++)
                {
                    if (kids[i].name == name)
                    {
                        // Delete this folder
                        delete this.files[name];
                    }
                    else
                    {
                        // Remove a child of this folder
                        this.remove(kids[i].name);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Generate the complete zip file
     * @return  A base64 encoded string of the zip file
     */
    JSZip.prototype.generate = function(asBytes)
    {
        asBytes = asBytes || false;

        // The central directory, and files data
        var directory = [], files = [], fileOffset = 0;

        for (var name in this.files)
        {
            if( !this.files.hasOwnProperty(name) ) {
                continue;
            }

            var fileRecord = "", dirRecord = "";
            fileRecord = "\x50\x4b\x03\x04" + this.files[name].header + name + this.files[name].data;

            dirRecord = "\x50\x4b\x01\x02" +
            // version made by (00: DOS)
            "\x14\x00" +
            // file header (common to file and central directory)
            this.files[name].header +
            // file comment length
            "\x00\x00" +
            // disk number start
            "\x00\x00" +
            // internal file attributes TODO
            "\x00\x00" +
            // external file attributes
            (this.files[name].dir===true?"\x10\x00\x00\x00":"\x00\x00\x00\x00")+
            // relative offset of local header
            this.decToHex(fileOffset, 4) +
            // file name
            name;

            fileOffset += fileRecord.length;

            files.push(fileRecord);
            directory.push(dirRecord);
        }

        var fileData = files.join("");
        var dirData = directory.join("");

        var dirEnd = "";

        // end of central dir signature
        dirEnd = "\x50\x4b\x05\x06" +
        // number of this disk
        "\x00\x00" +
        // number of the disk with the start of the central directory
        "\x00\x00" +
        // total number of entries in the central directory on this disk
        this.decToHex(files.length, 2) +
        // total number of entries in the central directory
        this.decToHex(files.length, 2) +
        // size of the central directory   4 bytes
        this.decToHex(dirData.length, 4) +
        // offset of start of central directory with respect to the starting disk number
        this.decToHex(fileData.length, 4) +
        // .ZIP file comment length
        "\x00\x00";

        var zip = fileData + dirData + dirEnd;
        return (asBytes) ? zip : JSZipBase64.encode(zip);

    };

    /*
     * Compression methods
     * This object is filled in as follow :
     * name : {
     *    magic // the 2 bytes indentifying the compression method
     *    compress // function, take the uncompressed content and return it compressed.
     * }
     *
     * STORE is the default compression method, so it's included in this file.
     * Other methods should go to separated files : the user wants modularity.
     */
    JSZip.compressions = {
        "STORE" : {
            magic : "\x00\x00",
            compress : function (content) {
                return content; // no compression
            }
        }
    };

    // Utility functions

    JSZip.prototype.decToHex = function(dec, bytes)
    {
        var hex = "";
        for(var i=0;i<bytes;i++) {
            hex += String.fromCharCode(dec&0xff);
            dec=dec>>>8;
        }
        return hex;
    };

    /**
    *
    *  Javascript crc32
    *  http://www.webtoolkit.info/
    *
    **/

    JSZip.prototype.crc32 = function(str, crc)
    {

        if (str === "") return "\x00\x00\x00\x00";

        var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

        if (typeof(crc) == "undefined") {
            crc = 0;
        }
        var x = 0;
        var y = 0;

        crc = crc ^ (-1);
        for( var i = 0, iTop = str.length; i < iTop; i++ ) {
            y = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
            x = "0x" + table.substr( y * 9, 8 );
            crc = ( crc >>> 8 ) ^ x;
        }

        return crc ^ (-1);

    };

    // Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165
    JSZip.prototype.clone = function()
    {
        var newObj = new JSZip();
        for (var i in this)
        {
            if (typeof this[i] !== "function")
            {
                newObj[i] = this[i];

            }
        }

        return newObj;
    };


    JSZip.prototype.utf8encode = function(input)

    {
            input = encodeURIComponent(input);

            input = input.replace(/%.{2,2}/g, function(m) {

                var hex = m.substring(1);

                return String.fromCharCode(parseInt(hex,16));

            });
            return input;

        };

    /**

    *
    *  Base64 encode / decode

    *  http://www.webtoolkit.info/

    *
    *  Hacked so that it doesn't utf8 en/decode everything

    **/

    var JSZipBase64 = function() {
        // private property
        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        return {
            // public method for encoding
            encode : function(input, utf8) {
                var output = "",
                chr1, chr2, chr3, enc1, enc2, enc3, enc4,
                i = 0;

                while (i < input.length) {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
                    output = output +
                    _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                    _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
                }
                return output;
            },
            // public method for decoding

            decode : function(input, utf8) {
                var output = "",
                chr1, chr2, chr3, 
                enc1, enc2, enc3, enc4,
                i = 0;

                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                while (i < input.length) {
                    enc1 = _keyStr.indexOf(input.charAt(i++));
                    enc2 = _keyStr.indexOf(input.charAt(i++));
                    enc3 = _keyStr.indexOf(input.charAt(i++));
                    enc4 = _keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }
                }
                return output;
            }
        };
    }();
    /*
        json2.js
        2011-10-19

        Public Domain.

        NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

        See http://www.JSON.org/js.html


        This code should be minified before deployment.
        See http://javascript.crockford.com/jsmin.html

        USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
        NOT CONTROL.


        This file creates a global JSON object containing two methods: stringify
        and parse.

            JSON.stringify(value, replacer, space)
                value       any JavaScript value, usually an object or array.

                replacer    an optional parameter that determines how object
                            values are stringified for objects. It can be a
                            function or an array of strings.

                space       an optional parameter that specifies the indentation
                            of nested structures. If it is omitted, the text will
                            be packed without extra whitespace. If it is a number,
                            it will specify the number of spaces to indent at each
                            level. If it is a string (such as '\t' or '&nbsp;'),
                            it contains the characters used to indent at each level.

                This method produces a JSON text from a JavaScript value.

                When an object value is found, if the object contains a toJSON
                method, its toJSON method will be called and the result will be
                stringified. A toJSON method does not serialize: it returns the
                value represented by the name/value pair that should be serialized,
                or undefined if nothing should be serialized. The toJSON method
                will be passed the key associated with the value, and this will be
                bound to the value

                For example, this would serialize Dates as ISO strings.

                    Date.prototype.toJSON = function (key) {
                        function f(n) {
                            // Format integers to have at least two digits.
                            return n < 10 ? '0' + n : n;
                        }

                        return this.getUTCFullYear()   + '-' +
                             f(this.getUTCMonth() + 1) + '-' +
                             f(this.getUTCDate())      + 'T' +
                             f(this.getUTCHours())     + ':' +
                             f(this.getUTCMinutes())   + ':' +
                             f(this.getUTCSeconds())   + 'Z';
                    };

                You can provide an optional replacer method. It will be passed the
                key and value of each member, with this bound to the containing
                object. The value that is returned from your method will be
                serialized. If your method returns undefined, then the member will
                be excluded from the serialization.

                If the replacer parameter is an array of strings, then it will be
                used to select the members to be serialized. It filters the results
                such that only members with keys listed in the replacer array are
                stringified.

                Values that do not have JSON representations, such as undefined or
                functions, will not be serialized. Such values in objects will be
                dropped; in arrays they will be replaced with null. You can use
                a replacer function to replace those with JSON values.
                JSON.stringify(undefined) returns undefined.

                The optional space parameter produces a stringification of the
                value that is filled with line breaks and indentation to make it
                easier to read.

                If the space parameter is a non-empty string, then that string will
                be used for indentation. If the space parameter is a number, then
                the indentation will be that many spaces.

                Example:

                text = JSON.stringify(['e', {pluribus: 'unum'}]);
                // text is '["e",{"pluribus":"unum"}]'


                text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
                // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

                text = JSON.stringify([new Date()], function (key, value) {
                    return this[key] instanceof Date ?
                        'Date(' + this[key] + ')' : value;
                });
                // text is '["Date(---current time---)"]'


            JSON.parse(text, reviver)
                This method parses a JSON text to produce an object or array.
                It can throw a SyntaxError exception.

                The optional reviver parameter is a function that can filter and
                transform the results. It receives each of the keys and values,
                and its return value is used instead of the original value.
                If it returns what it received, then the structure is not modified.
                If it returns undefined then the member is deleted.

                Example:

                // Parse the text. Values that look like ISO date strings will
                // be converted to Date objects.

                myData = JSON.parse(text, function (key, value) {
                    var a;
                    if (typeof value === 'string') {
                        a =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                        if (a) {
                            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                                +a[5], +a[6]));
                        }
                    }
                    return value;
                });

                myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                    var d;
                    if (typeof value === 'string' &&
                            value.slice(0, 5) === 'Date(' &&
                            value.slice(-1) === ')') {
                        d = new Date(value.slice(5, -1));
                        if (d) {
                            return d;
                        }
                    }
                    return value;
                });


        This is a reference implementation. You are free to copy, modify, or
        redistribute.
    */

    /*jslint evil: true, regexp: true */

    /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
        call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
        getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
        lastIndex, length, parse, prototype, push, replace, slice, stringify,
        test, toJSON, toString, valueOf
    */


    // Create a JSON object only if one does not already exist. We create the
    // methods in a closure to avoid creating global variables.

    var JSON;
    if (!JSON) {
        JSON = {};
    }

    (function () {
        //    'use strict';

        function f(n) {
            // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        }

        if (typeof Date.prototype.toJSON !== 'function') {

            Date.prototype.toJSON = function (key) {

                return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z'
                : null;
            };

            String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
        }

        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


        function quote(string) {

            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.

            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + string + '"';
        }


        function str(key, holder) {

            // Produce a string from holder[key].

            var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.

            if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }

            // If we were called with a replacer function, then call the replacer to
            // obtain a replacement value.

            if (typeof rep === 'function') {
                value = rep.call(holder, key, value);
            }

            // What happens next depends on the value's type.

            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':

                    // JSON numbers must be finite. Encode non-finite numbers as null.

                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':

                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                // If the type is 'object', we might be dealing with an object or an array or
                // null.

                case 'object':

                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.

                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.

                    gap += indent;
                    partial = [];

                    // Is the value an array?

                    if (Object.prototype.toString.apply(value) === '[object Array]') {

                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.

                        v = partial.length === 0
                        ? '[]'
                        : gap
                        ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                        : '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // If the replacer is an array, use it to select the members to be stringified.

                    if (rep && typeof rep === 'object') {
                        length = rep.length;
                        for (i = 0; i < length; i += 1) {
                            if (typeof rep[i] === 'string') {
                                k = rep[i];
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    } else {

                        // Otherwise, iterate through all of the keys in the object.

                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.

                    v = partial.length === 0
                    ? '{}'
                    : gap
                    ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                    : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        }

        // If the JSON object does not yet have a stringify method, give it one.

        if (typeof JSON.stringify !== 'function') {
            JSON.stringify = function (value, replacer, space) {

                // The stringify method takes a value and an optional replacer, and an optional
                // space parameter, and returns a JSON text. The replacer can be a function
                // that can replace values, or an array of strings that will select the keys.
                // A default replacer method can be provided. Use of the space parameter can
                // produce text that is more easily readable.

                var i;
                gap = '';
                indent = '';

                // If the space parameter is a number, make an indent string containing that
                // many spaces.

                if (typeof space === 'number') {
                    for (i = 0; i < space; i += 1) {
                        indent += ' ';
                    }

                // If the space parameter is a string, it will be used as the indent string.

                } else if (typeof space === 'string') {
                    indent = space;
                }

                // If there is a replacer, it must be a function or an array.
                // Otherwise, throw an error.

                rep = replacer;
                if (replacer && typeof replacer !== 'function' && (typeof replacer === 'string' && replacer.trim()) &&
                        (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                    throw new Error('JSON.stringify');
                }

                // Make a fake root object containing our value under the key of ''.
                // Return the result of stringifying the value.

                return str('', {
                    '': value
                });
            };
        }


        // If the JSON object does not yet have a parse method, give it one.

        if (typeof JSON.parse !== 'function') {
            JSON.parse = function (text, reviver) {

                // The parse method takes a text and an optional reviver function, and returns
                // a JavaScript value if the text is a valid JSON text.

                var j;

                function walk(holder, key) {

                    // The walk method is used to recursively walk the resulting structure so
                    // that modifications can be made.

                    var k, v, value = holder[key];
                    if (value && typeof value === 'object') {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v;
                                } else {
                                    delete value[k];
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value);
                }


                // Parsing happens in four stages. In the first stage, we replace certain
                // Unicode characters with escape sequences. JavaScript handles many characters
                // incorrectly, either silently deleting them, or treating them as line endings.

                text = String(text);
                cx.lastIndex = 0;
                if (cx.test(text)) {
                    text = text.replace(cx, function (a) {
                        return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    });
                }

                // In the second stage, we run the text against regular expressions that look
                // for non-JSON patterns. We are especially concerned with '()' and 'new'
                // because they can cause invocation, and '=' because it can cause mutation.
                // But just to be safe, we want to reject all unexpected forms.

                // We split the second stage into 4 regexp operations in order to work around
                // crippling inefficiencies in IE's and Safari's regexp engines. First we
                // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
                // replace all simple value tokens with ']' characters. Third, we delete all
                // open brackets that follow a colon or comma or that begin the text. Finally,
                // we look to see that the remaining characters are only whitespace or ']' or
                // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

                if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                    // In the third stage we use the eval function to compile the text into a
                    // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                    // in JavaScript: it can begin a block or an object literal. We wrap the text
                    // in parens to eliminate the ambiguity.

                    j = eval('(' + text + ')');

                    // In the optional fourth stage, we recursively walk the new structure, passing
                    // each name/value pair to a reviver function for possible transformation.

                    return typeof reviver === 'function'
                    ? walk({
                        '': j
                    }, '')
                    : j;
                }

                // If the text is not JSON parseable, then a SyntaxError is thrown.

                throw new SyntaxError('JSON.parse');
            };
        }
    }());
}
__cleanUp();
$w.__craydentLoaded = true;