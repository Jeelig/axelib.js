/**
    Axelib.js 
    Mobile Backend Library to interact with Axelib Server
*/

'use strict';

(function (doc, win) {
	
	var axelib = {
		
		code: "XXXXXX", //Project code
		title: "Axelib",
		token: {},
        retry: 3,
		timeout: 25000,
        iteration: 0,
        version: '1.0',
		retry_methods: ["login"],
		active: '#9b59b6',
		coreURL: "https://api.axelib.com/",
		
		new : function() {
			return Object.create(this); //ax = axelib.new(); 
		},
        /**
            This method inits the axelib ajax object and global vars
            popmsgclr : Popup Message Color
        */
        init: function() {
            axelib.tools.appendCssModal({
                popmsgclr: '#9b59b6'
            });
			return axelib.tools.ajax.init();
		},
        /**
            Checks if an object has a specific property
            - obj : Object
            - key : Property to check
        */
		hasKey: function(obj, key) {
			if (typeof(obj) == "object" && obj.length > 0)
				obj = obj[0];
			var keys = Object.keys(obj);
			if (keys.indexOf(key) >= 0) return true;
			else return false;
		},
		/**
			To Prompt a Message to the screen
			- Message : Message that you want to alert
		*/
        alert: function(message) {
            navigator.notification.confirm(
                message, 	   			// message
                null,          			// callback to invoke with index of button pressed
                axelib.title,  			// title
                [axelib.txt.okbutton]	// buttonLabels
            );
        },
		/**
			Shows a Message
			- strMessage : Message to show
		*/
		message: function(strMessage) {
			
			var parent = document.querySelector("#ix");
            
			if(strMessage == null) {
				var child = document.querySelector(".ax-window");
				parent.removeChild(child);
			}
			else {
				var html = '<div class="ax-window">'
						 + '	<div class="ax-window-box">'
						 + '		<div id="ax-window-msg"></div>'
					     + '		<div onclick="axelib.message(null)" class="ax-window-btn activated">Action</div>'
				    	 + '		<div onclick="axelib.message(null)" class="ax-window-btn">Close</div>'
			    		 + '	</div>'
		    			 + '</div>';
				document.querySelector("#ix").innerHTML = html;
				document.querySelector("#ax-window-msg").innerHTML = strMessage;
			}
			
		},
		/**
			Shows a Message
			- msg : Object with message to show
		*/
		popupmessage: function(msg) {
			
            this.timer = msg.timer ? msg.timer : 1500;
            this.position = msg.position ? 'on-top' : 'on-bot';
            this.style = msg.color ? 'style="background-color:' + msg.color + ';"' : '';
			
			var html = '<div class="ax-window">'
					 + '	<div class="popupmsg ' + this.position + '" ' + this.style + '>'
					 + '	    ' + msg.message
					 + '	</div>'
					 + '</div>';
						
			document.querySelector("#ix").innerHTML = html;

			setTimeout(function() {
				var parent = document.querySelector("#ix");
				var child = document.querySelector(".ax-window");
				parent.removeChild(child);
			}, this.timer);
			
		},
		/**
			This is the main function that calls the server
			- Method : Name of the Axelib Method that you want to call (required)
			- Entity : Name of the entity that you're targeting (required)
			- Data : Object containing key as axelib tab fields, and their values
			- ID : ID of the targeted item (optional)
			- Success : Method that will be called of everything succeeds
			- Error : Error method (runs if no timeout)
		*/
		ServerCall : function(Method, Entity, Data, ID, success, error) {
			
            var coreURL = axelib.coreURL;
            
            if (this.hasKey(axelib, 'version') && axelib.version && axelib.version != 0) coreURL += axelib.version + '/'; //In case a version has been specified
			var myUrl = coreURL + Method + "/" + Entity;
            var headers = { 
                "projectID": axelib.code, 
                "token": axelib.token.val //,"Content-type": "application/x-www-form-urlencoded"
            };
            
			if(ID && ID != null) myUrl += "/" + ID;
            
            if(Method == "file" && (!Data || !Data.type || Data.type != 'blob'))
                ServerUploadFile(Data, success, error);
            
            ajx.run({
				url: myUrl,
				type: "POST",
				headers: headers,
				data: Data,
				dataType: "json",        //ToRemoveIfUseless ::: processData: processData,
				timeout: axelib.timeout,
				success: function(result) {
                    axelib.tools.ajax.success(result, Method, Entity, success, error);
				},
				error: function(err, t, m) {
                    axelib.tools.ajax.fail(err, Method, Entity, error);
				},
				nointernet: function() {
					axelib.tools.ajax.nointernet(error);
				},
				timesout: function() {
					axelib.tools.ajax.timesout(error);
				}
			});
            
		},
        ServerUploadFile: function(imageData, success, error) {

            var ft = new FileTransfer();

            var params = new Object();
            params.folder = "Thing";

            var options = new FileUploadOptions();
            options.fileKey  = "file";
            options.fileName = imageData.substr(imageData.lastIndexOf('/') + 1);
            options.mimeType = "image/png";
            options.params = params;
            options.chunkedMode = false;
            options.headers = { "projectID": axelib.code, "token": axelib.token.val };
            
            ft.upload(imageData, axelib.coreURL + "file/null", function(e) {
                console.log(e);
                alert(JSON.stringify(e));
            }, function(e) {
                console.log("Erreur !!!");
                console.warn(e);
                alert("Error : " + JSON.stringify(e));
            }, options);
            
		},
		/**
			Login Method
			- login : email of the user who wants to login
			- password : password of the user who wants to login
		*/
        login: function(login, password, loginCallCack, errorCallBack) {
            
            var obj = { email: login, password: password };
			var exist_storage = (window.localStorage !== undefined);
			var token = axelib.tools.SGet("token");
			
			if (exist_storage) token = token ? JSON.parse(token) : null;
            
            var myCallback = function(e) {
                if(e["error"])
	            	console.warn("There is an error : " + e["error"]);
				else {
					axelib.user = e.user;
					axelib.token.val = e.token;
					axelib.token.exp = e.exp;
                    axelib.token.usr = e.user;
                    if(loginCallCack)  loginCallCack(e);
					if (exist_storage) axelib.tools.SSave("token", axelib.token);
                    //registerForToken();
                    loginCallCack();
				}
            };
            
            var myError = function(e) {
                if(_.has(e, "error") && e["error"])
	            	console.warn("There is an error : " + e["error"]);
                else console.log(e);
                if (errorCallBack)
                    errorCallBack(e);
            };
            
            if (token == null || (token.exp && axelib.toDate(token.exp, "yyyy-MM-dd hh:ii:ss") < new Date()) ) //token is not null and expires in the future
				this.ServerCall("login", "user", obj, null, myCallback, myError);
            else {
				//The user has an available token saved
				//If still available we connect the user automatically
				//	If internet, we update his data
				myCallback({
                    token:token.val,
                    exp:token.exp,
                    user:token.usr
                });
			}
            
        },
        /**
         * This method helps make a login at app start, without any the action of the user.
         * The user is automatically logged in if his credentials has been stored.
         * The purpose is to launch a specific actions such as routing, before screens are loaded.
         */
        silentLogin: function(login, password, callback) {

            axelib.login(login, password, function(e) {
                callback(e);
            })

        },
		/**
			Facebook Login Method to the application
			- fbuser : object returned by the Graph API to login
		*/
		FBlogin: function(FBresponse, fb_token, FBCallBack) {
			
            if (FBresponse.error) {
                console.log("Uh-oh! " + JSON.stringify(FBresponse.error));
            } else {

                FBresponse = axelib.tools.preFormatFB(FBresponse, fb_token);

                axelib.ServerCall("fblogin", "user", FBresponse, null, function(e) {
                    
                    axelib.user = e.user;
                    axelib.token.val = e.token;
                    axelib.token.exp = e.exp;
                    if (FBCallBack) FBCallBack(e);
                    
                }, function(e) {
                    axelib.alert('Cant connect with Facebook ! ' + JSON.stringify(e));
                });

            }
            
		},
		leave: function() {
            
			localStorage.removeItem("token");

		},
        /**
        	Send push notification to the user
        */
        push: function(user_id, message, title) {
			
            if (!title) title = axelib.title;
            
            var data = {
                "user_id": user_id,
                "push_title": title,
                "push_message": message
            };

            axelib.ServerCall("push", "user", data, null, function(e) {
                axelib.alert(JSON.stringify(e));
                console.log(e);
            }, function(e) {
                axelib.popupmessage({
                    message: "<div class='material-icons'>&#xE88F;</div> Can't subscribe push notifications"
                });
                console.log("error : " + JSON.stringify(e));
            });
            
		},
		/**
			Converts a string to date
			ex: axelib.toDate("30/10/1985 15:45:10", "dd/MM/yyyy hh:ii:ss");
		*/
		toDate: function (_date, _format) {
			var normalized       = _date.replace(/[^a-zA-Z0-9]/g, '-');
			var normalizedFormat = _format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
			var formatItems      = normalizedFormat.split('-');
			var dateItems        = normalized.split('-');
			
			return axelib.tools.dateFromString(dateItems, formatItems);			
		},
		/**
			Checks if given string is an email
			- email : email address. Ex: axelib.isEmail("demo@axelib.com")
		*/
		isEmail: function (email) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		},
        register: function(login, password, name, is_presta) {
            
            var obj = { email: login, password: password, firstname: name, user_type: is_presta };
            
            var myCallback = function(e) {
                toast_0.show();
                mainView.router.back();
            };
            
            var myError = function() {
                console.warn("There is an error : " + e["error"]);
            };
            
            this.ServerCall("register", "user", obj, null, myCallback, myError);
        },
        changepwd: function(old_pwd, new_pwd) {
            
            var obj = { password: old_pwd, new_password: new_pwd };
            
            var mSuccess = function(e) {
                console.log(e);
            };
            
            var mError = function(e) {
                console.log(e);
            };
            
            this.ServerCall("changepwd", "user", obj, null, mSuccess, mError);
            
        },
		/**
			Remap an object renaming the keys.
			Ex: var map = {
					"lastname" : "nom",
					"firstname" : "prenom"
				};
				axelib.remap(users, map)
		*/
		remap: function(collection, map) {
			
			try {
				_.now();
				for(var i = 0; i < collection.length; i++) {
					var a = collection[i];
					b = _.reduce(a, function(result, value, key) {
						key = map[key] || key;
						result[key] = value;
						return result;
					}, {});
					collection[i] = b;				
				}
			}
			catch(e) {
				console.warn("underscore is not available");
			}
			return collection;
		},
		/**
			TOOLS : Object containing all the useful tools methods
		*/
		tools: {
			/**	Get a key previously saved into the localStorage
				key, value that we want to save */
			SGet: function (key) {
				if (localStorage && localStorage.getItem(key))
					return localStorage.getItem(key);
				else
					return null;
			},
			/** Save a key into the localStorage
				key, value that we want to save */
			SSave: function (key, value) {
				if (localStorage && localStorage.getItem(key))
					localStorage.removeItem(key);
				localStorage.setItem(key, JSON.stringify(value));
			},
			/** Deletes a key from the localStorage
				key we want to remove */
			SDel: function(key) {
				localStorage.removeItem(key);
			},
            /** Init axelib ajax object */
            ajax: {
                init: function() {
    				
    				var obj = {};
    				var ajax = function() {
    					this.type    = "json";
    					this.type	= "POST";
    				};
    				ajax.prototype.run = function(arr) {
    					if (navigator.onLine) axelib.tools.ajax.request(arr, this);
    					else arr.nointernet();
    				};
    				var my_ajax = function() { ajax.call(this); };			
    				my_ajax.prototype = Object.create(ajax.prototype);
    				my_ajax.prototype.constructor = my_ajax;
    				obj = new my_ajax();
    				return obj;
    				
    			},
    			/** 
                    This is the replacement for jquery ajax Method 
    			*/
                request: function(arr) {

                    var data_array, data_string, idx, xhr, value;
    				
    				if (arr.data == null) arr.data = {};
    				if (arr.success == null) arr.success = function () { };
    				if (!arr.type || arr.type == null) arr.type = 'POST';
    				data_array = [];
                    for (idx in arr.data) {
    					value = arr.data[idx];
    					data_array.push("" + idx + "=" + value);
    				}
    				data_string = data_array.join("&");
    				xhr = new XMLHttpRequest();
    				xhr.open(arr.type, arr.url, true);
                    for (idx in arr.headers) xhr.setRequestHeader(idx, arr.headers[idx]);
    				xhr.timeout = arr.timeout;
    				xhr.ontimeout = arr.timesout;
                    
    				xhr.onreadystatechange = function () {
    					if(this.readyState == 4) {
    						if(this.status == 200)
    							return arr.success(JSON.parse(xhr.responseText));
    						else {
    							return arr.error(JSON.parse(xhr.responseText)); 
    						}
    					}
    				}
    				xhr.send(data_string);
    				return xhr;
                },
                success: function(result, Method, Entity, success, error) {
                    
                    var res = result[Entity];

                    if (res || (res && res.success)) {
                        if (Method == "login" && Entity == "user") {
                            axelib.user = res.user;
                            axelib.token.val = res.token;
                            axelib.token.exp = res.exp;
                        }
                        if (success && success != null) success(res);
                    }
                    else {
        				if (error == null) console.warn(result); //No callback method, we console.warn
                        else error(res);						 //Else we launch callback method
                    }
                },
                fail: function(err, Method, Entity, error) {
            
        			if( !navigator.onLine ) axelib.tools.ajax.nointernet(); //No internet connexion
        			else {
						if( (axelib.retry_methods.indexOf(Method) >= 0) && (axelib.iteration < axelib.retry) ) {
							axelib.iteration++;
							axelib.login(Data.email, Data.password);
						}
						else {
							axelib.iteration = 0;
							console.warn(err.responseText);
							axelib.popupmessage({
								message: "<div class='material-icons'>&#xE88F;</div>" + axelib.txt.errorserver, 
								position: 1,
								timer: 2000
							});
							if (error)
								error(err);
						}
        			}
                },
				nointernet: function(e) {
                    axelib.popupmessage({
                        message: "<div class='material-icons'>&#xE88F;</div>" + axelib.txt.nointernet, 
                        position: 1,
                        timer: 2000
                    });
					if(e) e();
                },
				timesout: function(e) {
                    axelib.popupmessage({
                        message: "<div class='material-icons'>" + axelib.txt.timesout, 
                        position: 1,
                        timer: 2000
                    });
					if(e) e();
                },
            },
			/** Table of durations */
            DURATION_IN_SECONDS: {
              epochs: ['year', 'month', 'day', 'hour', 'minute'],
              year:   31536000,
              month:  2592000,
              day:    86400,
              hour:   3600,
              minute: 60
            },
            getDuration: function(seconds) {
                var epoch, interval;
                for (var i = 0; i < axelib.DURATION_IN_SECONDS.epochs.length; i++) {
                    epoch = axelib.DURATION_IN_SECONDS.epochs[i];
                    interval = Math.floor(seconds / axelib.DURATION_IN_SECONDS[epoch]);
                    if (interval >= 1) {
                        return { interval: interval, epoch: epoch };
                    }
                }
            },
            timeSince: function(date) {
                var seconds = Math.floor((new Date() - new Date(date)) / 1000);
                var duration = axelib.getDuration(seconds);
                var suffix  = (duration.interval > 1 || duration.interval === 0) ? 's' : '';
                return duration.interval + ' ' + duration.epoch + suffix;
            },
			/** Returns a Timestamp if a Date() is given. EX : axelib.tools.TsFromDate(new Date());*/
			TsFromDate: function(d) {
				var ts = parseInt(d.getTime() / 1000);
				return ts;
			},
			/** Returns a Date() if a timestamp is given. EX : axelib.tools.DateFromTs(1470218837);*/
			DateFromTs: function(ts) {
				var a = ts.toString();
				if (a.length < 13) ts = ts * 1000;
				var d = new Date(ts);
				return d;
			},
			dateFromString: function(dateItems, formatItems) {
				var monthIndex    = formatItems.indexOf("mm");
				var dayIndex      = formatItems.indexOf("dd");
				var yearIndex     = formatItems.indexOf("yyyy");
				var hourIndex     = formatItems.indexOf("hh");
				var minutesIndex  = formatItems.indexOf("ii");
				var secondsIndex  = formatItems.indexOf("ss");
				var today  = new Date();
				var year   = yearIndex>-1    ? dateItems[yearIndex]    : today.getFullYear();
				var month  = monthIndex>-1   ? dateItems[monthIndex]-1 : today.getMonth()-1;
				var day    = dayIndex>-1     ? dateItems[dayIndex]     : today.getDate();
				var hour   = hourIndex>-1    ? dateItems[hourIndex]    : today.getHours();
				var minute = minutesIndex>-1 ? dateItems[minutesIndex] : today.getMinutes();
				var second = secondsIndex>-1 ? dateItems[secondsIndex] : today.getSeconds();
				return new Date(year, month, day, hour, minute, second);
			},
            dateToStringMysql: function(date) {
                var month = '' + (date.getMonth() + 1),
                    day   = '' + date.getDate(),
                    year  = date.getFullYear(),
                    hour  = date.getHours(),
                    min   = date.getMinutes(),
                    sec   = date.getSeconds();

                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;

                return [year, month, day].join('-') + ' ' + [hour, min, sec].join(':');
            },
            preFormatFB: function(response, fb_token) {
                response.fb_token = fb_token;
                if(_.has(response, "birthday"))
                    response.birthday = axelib.toDate(response.birthday, "MM/dd/yyyy");
                if(_.has(response, "updated_time")) {
                    response.updated_time = response.updated_time.substring(0, response.updated_time.length- 5);
                    response.updated_time = response.updated_time.replace("T", " ");
                    response.updated_time = axelib.toDate(response.updated_time, "yyyy-MM-dd hh:ii:ss");
                    //response.updated_time.setMinutes(50); //To test update information from FB
                    response.updated_time = axelib.tools.dateToStringMysql(response.updated_time);
                }
                return response;
            },
			appendCssModal: function(params) {
				
                this.popmsgclr = params.popmsgclr ? params.popmsgclr : 'red';
                
				//Creating css
				var style = document.createElement('style');
				style.type = 'text/css';
				var cssStyle = '';
				cssStyle += ' .ax-window { color:#111; width:100%; height:100%; position:fixed; top:0; right:0; margin:0px; z-index:9999999999; background-color:rgba(0,0,0, 0.7); text-align:center; padding-top:70px; } ';
				cssStyle += ' .ax-window-box {background-color:#FFF; width:250px; width:90%; margin:0 auto; padding:10px 0px;} ';
				cssStyle += ' .ax-window-btn { background-color:#AAAAAA; text-transform:uppercase; margin:5px 10px 0px 10px; cursor:pointer; padding:10px; color:#FFF; font-size:14px; } ';
				cssStyle += ' .ax-window-btn.activated { background-color:' + axelib.active + '; } ';
				cssStyle += ' .ax-window-btn:active { background-color:#555; } ';
                cssStyle += ' #ax-window-msg { font-size: 20px; padding-bottom:12px; } ';
                cssStyle += ' .popupmsg { position:absolute; width:100%; background-color:' + this.popmsgclr + '; color:#FFF; } ';
                cssStyle += ' .popupmsg.on-top { top:0px; padding:40px 0px 10px 0px; height:25px; } ';
                cssStyle += ' .popupmsg.on-bot { bottom:70px; } ';
                cssStyle += ' .popupmsg div.material-icons { position:absolute; left:10px; } ';
				style.innerHTML = cssStyle;
				document.getElementsByTagName('head')[0].appendChild(style);
				
			},
            hexFromColor: function(strColor) {
                
                var myColor = "";

                switch(strColor) {
                        case "red":        myColor = "#f44336"; break; case "pink":         myColor = "#e91e63"; break;
                        case "purple":     myColor = "#9c27b0"; break; case "deeppurple":   myColor = "#673ab7"; break;
                        case "indigo":     myColor = "#3f51b5"; break; case "blue":         myColor = "#2196f3"; break;
                        case "lightblue":  myColor = "#03a9f4"; break; case "cyan":         myColor = "#00bcd4"; break;
                        case "teal":       myColor = "#009688"; break; case "green":        myColor = "#4caf50"; break;
                        case "lightgreen": myColor = "#8bc34a"; break; case "lime":         myColor = "#cddc39"; break;
                        case "yellow":     myColor = "#ffeb3b"; break; case "amber":        myColor = "#ffc107"; break;
                        case "orange":     myColor = "#ff9800"; break; case "deeporange":   myColor = "#ff5722"; break;
                        case "brown":      myColor = "#795548"; break; case "gray":         myColor = "#9e9e9e"; break;
                        case "bluegray":   myColor = "#607d8b"; break; case "black":        myColor = "#000000"; break;
                        case "turquoise":  myColor = "#1ABC9C"; break; case "emerland":     myColor = "#2ecc71"; break;
                        case "peterriver": myColor = "#3498db"; break; case "amethyst":     myColor = "#9b59b6"; break;
                        case "wetasphalt": myColor = "#34495e"; break; case "greensea":     myColor = "#16a085"; break;
                        case "nephritis":  myColor = "#27ae60"; break; case "belizehole":   myColor = "#2980b9"; break;
                        case "wisteria":   myColor = "#8e44ad"; break; case "midnightblue": myColor = "#2c3e50"; break;
                        case "sunflower":  myColor = "#f1c40f"; break; case "carrot":       myColor = "#e67e22"; break;
                        case "alizarin":   myColor = "#e74c3c"; break; case "clouds":       myColor = "#ecf0f1"; break;
                        case "concrete":   myColor = "#95a5a6"; break; case "orangelight":  myColor = "#f39c12"; break;
                        case "pumpkin":    myColor = "#d35400"; break; case "pomegranate":  myColor = "#c0392b"; break;
                        case "silver":     myColor = "#bdc3c7"; break; case "asbestos":     myColor = "#7f8c8d"; break;
                        default: myColor = "#2196f3"; break;
                    }
                
                return myColor;
                
            }
		},
		txt: {
			nointernet: 		"No internet connexion detected !",
			timesout: 			"The request timed out !",
			errorserver: 		"The last action failed on server !",
			userexists: 		"Sorry this user already exist !",
			wrongcredentials: 	"Login or password incorrect !",
			noright: 			"You dont have the rights to do this action",
			tokenexpired: 		"Your session expired, please login",
			facebookapierror: 	"Facebook API connexion failed",
			okbutton:			"Ok"
		}
	};
	
	win.axelib = axelib;
    
    var ajx = axelib.init();
	
}(document, window));
