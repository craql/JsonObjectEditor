/*/-------------------------------------------------------------------------------------------------------------/*/
/*/ Craydent LLC v1.0																							/*/
/*/	Copyright 2011 (http://craydent.com/about) 																	/*/
/*/ Dual licensed under the MIT or GPL Version 2 licenses.														/*/
/*/	(http://craydent.com/license) 																				/*/
/*/-------------------------------------------------------------------------------------------------------------/*/
function Uploader(params) {
    try { 
        this.UploadScript = params.uploadUrl || "";

        this.headers = params.headers || [];
        this.FileUploadMaxSize = params.maxsize || 0;
        this.FileUploadMinSize = params.minsize || 0;
        this.FileUploadMaxFileCount = params.maxfilecount || 0;
        this.UsageMax = params.usagemax || 0;
        this.CurrentUsage = params.currentusage || 0;
        this.fileExtensions = params.fileExtensions || Array();
        this.SuccessFileCount = 0;
        this.FailedFileCount = 0;
        this.deferUpload = params.deferUpload || false;
        this.crossDomain = params.crossDomain || false;
        this.crossDomainProxy = params.crossDomainProxy || "http://pipes.craydent.com/rest_controller.php";
        this.api_key = params.api_key;
        this.destination_url = params.destination_url;
                
        //when upload has finished on the server
        this.onafterupload = function (ev) {
            this.ref.SuccessFileCount++;
            params.onafterupload && params.onafterupload.call(this, ev);
            if (this.ref.SuccessFileCount + this.ref.FailedFileCount == this.ref.files.length) {
                this.ref.oncomplete(this.ref.SuccessFileCount, this.ref.FailedFileCount);
            }
        };
        this.onbeforeupload = params.onbeforeupload || function(){};
        //after drop before processing the files to raw/base64
        this.onbeforefileready = params.onbeforefileready || function (numberOfFiles) {};
		
        this.onafterfileready = params.onafterfileready || function (fileObject) {};	
        this.onabort = params.onabort || function(){};
        this.onfileload = params.onfileload || function(){};
        this.oncomplete = params.oncomplete || function () {};
        this.onloadstart = params.onloadstart || function(){};
        //function to run during the upload progress
        this.onprogress = params.onprogress || function () {};
		
        this.ondragenter = params.ondragenter || function () {};
        this.ondragover = params.ondragover || function () {};
		
        this.onerror = function (data, status, response) {
            if (isNull(status)) {
                params.onerror && params.onerror.call(this, data);
                return;
            } 
            this.ref.FailedFileCount++;
            params.onerror && params.onerror.call(this, data, status, response);
            if (this.ref.SuccessFileCount + this.ref.FailedFileCount == this.ref.files.length) {
                this.ref.oncomplete(this.ref.SuccessFileCount, this.ref.FailedFileCount);
            }
        };
        this.onbefore = function (httpRequest, caller) {
            var fileUpload = httpRequest.upload || {};
            fileUpload.ref = caller;
            params.onbefore && params.onbefore.call(this, httpRequest, caller);
        };
		
        this.onbeforeclear = params.onbeforeclear || function () {};
        this.onafterclear = params.onafterclear || function () {};
        
        this.files = [];

        if (this.dropZone = params.target) {
            var listener = !this.dropZone.addEventListener ? "attachEvent" : "addEventListener";

            this.dropZone['uploadRef'] = this;

            this.dropZone[listener]("dragenter", function (ev) {
                try {
                    ev = ev ? ev : window.event;
                    killPropagation(ev);
                    this.uploadRef.ondragenter();
                } catch (e) {
                    error('uploadDragEnter', e);
                }
            }, false);
            this.dropZone[listener]("dragover", function (ev) {
                try {
                    ev = ev ? ev : window.event;
                    killPropagation(ev);
                    this.uploadRef.ondragover();
                } catch (e) {
                    error('uploadDragOver', e);
                }  
            }, false);
            this.dropZone[listener]("drop", function (ev) {
                this.uploadRef.upload(ev);
            }, false);
        }
		
        this.isValidFileType = function (ext) {
            try {
                return (this.fileExtensions.isEmpty() || this.fileExtensions.indexOf(ext) != -1);
            } catch (e) {
                error('isValidType', e);
            }
        };
		
        this.upload = function (ev) {
            try {
                ev = ev || window.event;
                var dt = ev.dataTransfer;
                var files = dt.files;
                //this.files.append(files);
                var count = files.length;
                this.onbeforefileready(count); 

                killPropagation(ev);
		        
                if (this.FileUploadMaxFileCount && this.files.length + count > this.FileUploadMaxFileCount) {
                    this.onerror("You can not upload more than " + this.FileUploadMaxFileCount + " file(s)");
                    this.files.splice(this.FileUploadMaxFileCount, this.files.length - this.FileUploadMaxFileCount);
                    return;
                }
                for (var i = 0; i < count && (!this.FileUploadMaxFileCount || this.files.length < this.FileUploadMaxFileCount); i++) {               	
                    var file = this.files[this.files.length] = files[i];
                    if (!this.FileUploadMinSize || file.size >= this.FileUploadMinSize) {
                        if (!this.FileUploadMaxSize || file.size < this.FileUploadMaxSize) {
                            if (this.UsageMax == 0 || (file.size + this.CurrentUsage <= this.UsageMax)) {
                                this.CurrentUsage += file.size;
                                var filename = file.name;
                                if (window.FileReader) {
                                    var reader = new FileReader();
                                    reader.index = i;
                                    reader.file = file;

                                    reader.onloadend = this.processFile;
                                    reader.uploadRef = this;
                                    reader.readAsDataURL(file);
                                } else {
                                    var fileExt = file.type.substring(file.type.indexOf("/") + 1);
                                    var fileType = file.type.substring(0, file.type.indexOf("/"));
                                    if (this.isValidFileType(fileExt)) {
                                        this.onafterfileready(file);
                                        this.processRequest({
                                            file: file,
                                            headers: [
                                                {type: "If-Modified-Since", value: "Mon, 26 Jul 1997 05:00:00 GMT"},
                                                {type: "Cache-Control", value: "no-cache"},
                                                {type: "X-Requested-With", value: "XMLHttpRequest"}, 
                                                {type: "X-File-Name", value:file.fileName || file.filename || file.name},
                                                {type: "X-File-Size", value: file.fileSize},
                                                {type: "X-File-Encoding", value: "binary"},
                                                {type: "Content-Type", value: "multipart/form-data"}
                                            ].concat(this.headers)
                                        });
                                    } else {
                                        this.onerror('invalid file type');
                                        this.files.splice(i, 1);
                                    }
                                }
                            } else {
                                this.onerror("You do not have enough space available to upload this file.");
                                this.files.splice(i, 1);
                            }
                        } else {
                            this.onerror("file is too big, needs to be below " + this.FileUploadMaxSize + "bytes");
                            this.files.splice(i, 1);
                        }
                    } else {
                        this.onerror("file is too small, needs to be larger than " + this.FileUploadMinSize + "bytes");
                        this.files.splice(i, 1);
                    }
                }
            } catch (e) {
                error('uploadDrop', e);
            }  
        };
        this.processFile = function (ev) {
            try {
                if(ev.contructor == String) {
                    ev = eval(ev.replace(/\n/gi, ''));
                }
                var data = ev.target.result;
                var file = ev.target.file;
                var fileExt = file.type.substring(file.type.indexOf("/") + 1);
                var fileType = file.type.substring(0, file.type.indexOf("/"));
                if (this.uploadRef.isValidFileType(fileExt)) {
                    this.uploadRef.onafterfileready(file, data);
	            	
                    var headers = [
                    {type: "If-Modified-Since", value: "Mon, 26 Jul 1997 05:00:00 GMT"},
                    {type: "Cache-Control", value: "no-cache"},
                    {type: "X-Requested-With", value: "XMLHttpRequest"},
                    {type: "X-File-Name", value:file.fileName || file.filename || file.name},
                    {type: "X-File-Size", value: file.fileSize},
                    {type: "X-File-Encoding", value: "base64"}/*,
						{type: "Content-Type", value: "multipart/form-data"}*/
                    ];
                    headers = headers.concat(this.uploadRef.headers);
                    if (window.FileReader) {
                        var getBinaryDataReader = new FileReader();
                        getBinaryDataReader.uploadRef = this.uploadRef;
                        getBinaryDataReader.onloadend = function(evt) {
                            evt = evt ? evt : window.event;
                            var bin = evt.target.result;
                            this.uploadRef.processRequest({
                                file: file, 
                                bin: encodeURIComponent(bin.substring(bin.indexOf("base64,") + 7, bin.length)),
                                headers: headers
                            });
                        };
                        getBinaryDataReader.readAsDataURL(file);
                    } else {
                        var bin = data;
                        this.uploadRef.processRequest({
                            file: file, 
                            bin: encodeURIComponent(bin.substring(bin.indexOf("base64,") + 7, bin.length)),
                            headers: headers
                        });
                    }
                } else {
                    alert("The file type \"" + fileExt + "\" is not of a valid type.");
                }
            }
            catch (e) {
                error('processFile', e);
            }
        };
        this.processRequest = function (params) {
            try {
                if (this.deferUpload) {
                    return;
                }
                var file = params.file;
                var headers = params.headers;
                var bin = params.bin || file;
                if (!this.crossDomain) {
                    ajax.call(this, {
                        method: "POST",
                        url: this.UploadScript,
                        query: bin,
                        headers: headers,
                        onfileload: this.onfileload,
                        onbefore: this.onbefore,
                        onprogress: this.onprogress,
                        onabort: this.onabort,
                        onerror: this.onerror,
                        onloadstart: this.onloadstart,
                        context: this,
                        onsuccess: this.onafterupload
                    });
                } else {
                    var encoding = (headers.filter(function(obj){
                        return obj.type == "X-File-Encoding";
                    })[0]) || {},
                    fileName = (headers.filter(function(obj){
                        return obj.type == "X-File-Name";
                    })[0]) || {},
                    //                    blobs = bin.match(/.{1,1900}/g),

                    totalBytes = bin.length,
                    _cuid = cuid(),
                    destination = this.destination_url ? 'fields={"destination_url":"' + this.destination_url + '"}&': "",
                    key = this.api_key ? "api_key=" + this.api_key + "&": "",
                    q = this.crossDomainProxy.indexOf('?') == -1 ? "?" : "&";
                    
                    //for (var i = 0, len = blobs.length, eof = len - 1; i < len; i++) {
                    query = q + key + destination + 'files={"'+_cuid+'":{"'+encoding.value+'":"'+bin.substr(0,1500)+'", "type" : "'+file.type+'", "name":"'+fileName.value+'"}}&EOF=false',
                    loop_function = function (data, status, xr, context) {
                        context.onprogress((totalBytes - bin.length)/totalBytes);
                        if (bin.length > 0) {
                            var query = q + key + destination + 'files={"'+_cuid+'":{"'+encoding.value+'":"'+bin.substr(0,1500)+'", "type" : "'+file.type+'", "name":"'+fileName.value+'"}}&EOF=';
                            bin = bin.substr(1500);
                                    
                            if (!bin) {
                                query += "true";
                            } else {
                                query += "false";
                            }
                            ajax.call(context, {
                                dataType: "jsonp",
                                url: context.crossDomainProxy + query,
                                headers: headers,
                                onerror: context.onerror,
                                context: context,
                                onsuccess: loop_function
                            })
                        } else {
                            context.onsuccess(data);
                        }
                    };
                    bin = bin.substr(1500);
                    
                    ajax.call(this, {
                        dataType: "jsonp",
                        url: this.crossDomainProxy + query,//this.UploadScript,
                        headers: headers,
                        onfileload: this.onfileload,
                        onbefore: this.onbefore,
                        onabort: this.onabort,
                        onerror: this.onerror,
                        onloadstart: this.onloadstart,
                        context: this,
                        onsuccess: loop_function
                    });
                //                    }
                }
            }
            catch (e) {
                error('processRequest', e);
            }  
        }; 
        this.clear = function (index) {
            this.onbeforeclear();
            if (!index) {
                this.files = [];
        		this.SuccessFileCount = 0;
				this.FailedFileCount = 0;
            }
            this.onafterclear();
        };
        this.remove = function (filename, indexOf) {
        	this.SuccessFileCount--;
            return this.files.remove(filename, indexOf);
        };
    }
    catch (e) {
        error('uploadObject', e);
    }  
};
		
if (!window.killPropagation) {
    window.killPropagation = function (ev, bubble, returnValue) {
        try {
            ev = ev || window.event;
            bubble = bubble || true;
            returnValue = returnValue || false;
            if (ev.stopPropagation) {
                ev.stopPropagation();
                ev.preventDefault();
            } else {
                ev.cancelBubble = bubble;
                ev.returnValue = returnValue;
            }
        } catch (e) {
            error("killPropagation", e);
        }
    };
}
if (!window.error) {
    window.error = function error(fname, e) {
        var index = window.location.search.indexOf("debug=true");
        if(index != -1) {
            alert("Error in " + fname + "\n" + (e.description || e));
        }
    };
}
