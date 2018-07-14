( function(){
    var Task = Promise.noConflict();

    Task.create = function(executor){
        return new Task(executor);
    }

    var Alfred = {};
    Alfred.create = function(config){
        var obj = $.extend(
            Object.create(Alfred),
            {
                __tasks: {},
                _id: spa.utils.uniqueId("alfred-")
            },
            config || {}
        );

        obj.__subscriptions = [
            spa.subscribe(obj._id, function(args, topic, token, key){
                var task = obj.__tasks[token];
                if(task){
                    if(_.isArray(task.args)){
                        task.args.push(args);
                    } else {
                        task.args[task.aliasMap[key]] = args;
                    }
                    
                    if(--task.after === 0){
                        task.callback(task.args);
                        delete obj.__tasks[token];
                    }
                }
            }),
            spa.subscribe("error-" + obj._id , function(args, topic, token, key){
                if(spa.utils.isDev()){
                    console.log("ALFRED ERROR:", arguments, "\nTASK:",obj.__tasks[token]);
                }
                obj.__tasks[token].errorCallback(args);
                delete obj.__tasks[token];
            })
        ];
        return obj;
    };

    Alfred.fetch = function(options){
        var 
            that = this,
            token = spa.utils.uniqueId("task-");
        that.__tasks[token] = options;
        _.each(options.events, function(value, key){
            value.successEvent = that._id + ":" + token + ":" + key;
            value.errorEvent =  "error-" + that._id + ":" + token + ":" + key;
            spa.publish(key, value);
        });
    };

    Alfred.fetchAsync = function(options){
        var 
            that = this,
            token = spa.utils.uniqueId("task-");

        that.__tasks[token] = {
            "aliasMap": _.reduce(options.events || [], function(result, value, idx){
                value.__key = spa.utils.uniqueId(value.event);
                result[value.__key] = value.alias;
                return result;
            },{}),
            "args": options.args || {},
            "callback": options.callback || _.noop,
            "errorCallback": options.errorCallback || _.noop,
            "after": options.events.length
        };

        _.each(options.events, function(value, idx){
            value.params = value.params || {};
            value.params.successEvent = that._id + ":" + token + ":" + value.__key;
            value.params.errorEvent =  "error-" + that._id + ":" + token + ":" + value.__key;
            spa.publish(value.event, value.params);
        });
    };

    Alfred.fetchTeam = function(options){
        var 
            that = this,
            options = options || {};
        
        that.fetch({
            "events": {
                "get-team": options.keyMap || {},
            },
            "aliasMap": {
                "get-team": options.alias || "team",
            },
            "args": options.args || {},
            "after": 1,
            "callback": options.callback || _.noop,
            "errorCallback": options.errorCallback || _.noop
        });
    };

    Alfred.fetchCourse = function(options){
        var
            that = this,
            options = options || {};

        // this should be done if options.keyMap is not passed
        that.fetchTeam({
            "keyMap": options.keyMap || {},
            "args": options.args || {},
            "callback": function(args){
                that.fetch({
                    "events": {
                        "get-course": {
                            "key": args.team.slug
                        },
                    },
                    "aliasMap": {
                        "get-course": options.alias || "course",
                    },
                    "args": args,
                    "after": 1,
                    "callback": options.callback || _.noop,
                    "errorCallback": options.errorCallback || _.noop
                });
            }
        });
    };


    var uniqueId = function(prefix){
        return _.uniqueId(prefix || "local_") + _.now();
    };

    var isDev = function(){
        return window.location.hostname !== "bytedev.co";
    };

    var indexOfOBJval = function( array, key, value ){

        for(var index = 0; index < array.length; ++index ) {
            if( array[index][key] === value ){
                return index;
            }
        }

        return -1;
    };


    spa.utils["Alfred"] = Alfred;
    spa.utils["Task"] = Task;
    spa.utils["uniqueId"] = uniqueId;
    spa.utils["isDev"] = isDev;
    spa.utils["indexOfOBJval"] = indexOfOBJval;
} )();


(function($){
    $.fn.serializeObject = function() {
        var 
            arr = $(this).serializeArray(), 
            obj = {};
        
        for(var i = 0; i < arr.length; i++) {
            if(obj[arr[i].name] === undefined) {
                obj[arr[i].name] = arr[i].value;
            } else {
                if(!(obj[arr[i].name] instanceof Array)) {
                    obj[arr[i].name] = [obj[arr[i].name]];
                }
                obj[arr[i].name].push(arr[i].value);
            }
        }
        return obj;
    };
    
    $.getCookie = function(){
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    };
})(jQuery);

( function(){
    spa.mixin = {};
    spa.mixin.Form = (function(){
        return function(){
            this.errorMessageClass = this.errorMessageClass || "help-block";
            this.errorClass = this.errorClass || "has-error";

            var that = this;
            this.submit = this.submit || function(event){
                event.preventDefault();
                var $form = $(this);
                spa.publish($form.data('publish'), { 
                    "form_data": $form.serializeObject(),
                    "method": $form.attr("method"),
                    "errorEvent": that.name + '-error'
                }); 
            };

            this.renderErrors = function(data){
                that.$container.find("." + that.errorMessageClass).remove();
                that.$container.find("." + that.errorClass).toggleClass(that.errorClass, false);
                jQuery.each(data, function(key, value){
                    if (Object.hasOwnProperty.call(that, "set" + key + "Error")){
                        that["set" + key + "Error"](key, value);
                    }
                    else{
                        that.setError(key, value);
                    }
                });
            };
            this.setError = function(name, message){
                var $target = that.getErrorTarget(name);
                $target.parent().toggleClass(that.errorClass, true);
                if (message.prototype !== Array.prototype){
                    message = [message];
                }
                jQuery.each(message, function(idx, value){
                    $target.append('<span class="' + that.errorMessageClass + '">' + value + '</span>');
                });
            };
            this.getErrorTarget = function(name) {
                return this.$container.find('[for="' + name + '"]');
            };

            spa.subscribe(this._id + '-error', function(data){
                this.renderErrors(data);
            }.bind(this));

        };
    })();

    spa.mixin.WorkTree = (function(){
        return function(){
            var attachWorkTree = this.attachWorkTree;

            this.attachWorkTree = function(args){
                is_valid = !(this.worktree_id && this.worktree_id === _.get(args, "worktree_id", this.worktree_id));
                if ( !is_valid && (this.__worktreeSubscriptions || []).length){
                    return false;
                } else if (this.worktree_id !== _.get(args, "worktree_id", this.worktree_id)){
                    // clean up
                    _.each(this.__worktreeSubscriptions, function(value){
                        value.remove();
                    });
                }
                this.worktree_id = _.get(args, "worktree_id", this.worktree_id);
                return attachWorkTree.bind(this)(args);
            };
        };
    })();


    spa.mixin.Graph = (function(){
        return function(){
            var that = this;


            that.subscribe("resize-graphs", function(args){
                var 
                    computed_style = window.getComputedStyle(that.$container.parent()[0]),
                    size = {
                    "height": parseInt(computed_style.height) * 0.9,
                    // "width": parseInt(size.width) * 0.9,
                };
                that.$container.css("height", parseInt(computed_style.height));
                that.resize(size);
            });

            that.resize = function(size){
                var computed_style;
                if (!that.__graph) that.createGraph();
                if (that.__graph) {
                    if (!size){
                        computed_style = window.getComputedStyle(that.$container[0]);
                    
                        size = {
                            "height": parseInt(computed_style.height) * 0.9,
                            "width": parseInt(computed_style.width) * 0.9,
                        };
                    }
                    that.__graph.resize(size);
                }

            };

            // that.$container.on("click", function(event){
            //  var $this = $(this);

            //  spa.publish('GA-event', {
            //      category: 'community-graph',
            //      action: 'expand',
            //  });

            //  if(that.isEmpty) return;

            //  if($this.hasClass("focused-graph")){
            //      var $grandparent = $this.parent().parent();
            //      $this.css({
            //          "z-index": "auto",
            //          "background-color": "rgb(0,0,0,0)",
            //          "position": "relative",
            //          "height": 0.95 * (parseInt($grandparent.css("height"))/2) + "px",
            //          "width": 0.95 * (parseInt($grandparent.css("width"))/2) + "px",
            //      });
            //      $grandparent.find(".row").css("display", "block");
            //      $this.toggleClass("focused-graph");
            //      var computed_style = window.getComputedStyle(that.$container[0]);

            //      that.resize({
            //          "height": parseInt(computed_style.height),
            //          "width": parseInt(computed_style.width) * 0.9
            //      });

            //  } else {
            //      var $grandparent = $this.parent().parent();
            //      $grandparent.find(".row").css("display", "none");
            //      $this.css({
            //          "z-index": "10000",
            //          "background-color": "white",
            //          "position": "absolute",
            //          "height": $grandparent.css("height"),
            //          "width": $grandparent.css("width"),
            //      });
            //      $this.parent().css("display", "block");
            //      $this.addClass("focused-graph");
                
            //      var computed_style = window.getComputedStyle(that.$container[0]);
            
            //      that.resize({
            //          "height": parseInt(computed_style.height) * 0.9,
            //          "width": parseInt(computed_style.width) * 0.9
            //      });
            //  }
            
            // });
        };
    })();

    spa.mixin.ProgressManager = (function(){
        return function(){
            var that = this;
            that.__id = that.__id || spa.utils.isDev();

            that.subscribe("team-selected-ready", function(args){
                that.team = args;
            });
            
            that.subscribe("error-course-summary-" + that.__id, function(args){
                if (spa.utils.isDev()){
                    console.warn(arguments);
                }
            });

            that.subscribe("user-binder-loaded", _.debounce(function(args){
                spa.publish('get-track-exercise-summary-data', {
                    successEvent: "course-summary-" + that.__id,
                    errorEvent: "error-course-summary-" + that.__id
                });
            }, 1000));

            that.subscribe("team-track-added", function(args){
                if (args.team === that.team.slug && args.tracks.length === that.team.tracks.length){
                    spa.publish('get-track-exercise-summary-data', {
                        errorEvent: "error-course-summary-" + that.__id,
                        successEvent: "course-summary-" + that.__id
                    });
                }
            });

            that.subscribe("exercise-summary-updated", function(args){
                that.update(args);
            });

            that.subscribe("course-summary-" + that.__id, function(args) {
                that.update(args);
            });
        };
    })();

    spa.mixin.JsonEditor = (function(){
        return function(){
            var that = this;

            that.schemas = {
                "fileBase": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string"
                        },
                        "sha": {
                            "type": "string"
                        },
                        "file": {
                            "type": "string"
                        }
                    }
                },
                "commit":{
                    "type": "object",
                    "properties": {
                        "title": {
                            "title": "Title",
                            "type": "string",
                            "default": ""
                        },
                        "body": {
                            "title": "Body",
                            "type": "string",
                            "format": "textarea",
                            "default": ""
                        },
                        "branch": {
                            "type": "string",
                            // add watcher here that creates branch names
                            // "enum": ["master","new"],
                            "enum": ["master"],
                            "default": "master"
                        }
                    }
                },
                "repo.json": {
                    "title": "Repository Config",
                    "type": "object",
                    "properties": { 
                        "title": {
                            "type": "string",
                            "description": "Title for the repository."
                        },
                        "language": {
                            "type": "string",
                            "description": "The primary language associated with this repository."
                        },
                        "main_file": {
                            "type": "string",
                            "description": "The default file to display in editor."
                        },
                        "tags": {
                            "type": "array",
                            "format": "table",
                            "title": "Tags",
                            "uniqueItems": true,
                            "items": {
                                "type": "string",
                                "title": "Tag"
                            },
                        }
                    }
                },
                "quiz.json": {
                    "title": "Quiz Builder",
                    "type": "object",
                    "properties": {
                        "quiz": {
                            "type": "array",
                            "format": "tabs",
                            "title": "Questions",
                            "uniqueItems": true,
                            "minItems": 1,
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string",
                                        "description": "Question prompt. Formats(md)",
                                        "format": "markdown"
                                    },
                                    "type": {
                                        "type": "string",
                                        "description": "Type of input to use when rendering question.",
                                        "enum": [
                                            "select"
                                        ],
                                        "default": "select"
                                    },
                                    "answer": {
                                        "type": "integer",
                                        "description": "The index of the answer."
                                    },
                                    "choices": {
                                        "type": "array",
                                        "format": "table",
                                        "title": "Choices",
                                        "uniqueItems": true,
                                        "items": {
                                            "type": "string",
                                            "title": "Choice"
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    })();

} )();
