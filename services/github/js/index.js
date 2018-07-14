spa.Service.add({
	name: 'github',
	init: function(){
		var
			ping = alert,
			alertAndLogout = function(message){
				ping(message);
				ping = spa.utils.emptyFunc;
				window.location.href = '/users/logout';
			};

		var githubdown = function(data){
			alertAndLogout('Github is currently unreadable, please try again in 5 minutes.');
		};

		var statusCodes = {
			401: function(data){
				alertAndLogout("Authentication time out, please log back in.");
			},
			502: function(data){
				githubdown(data);
			},
			503: function(data){
				githubdown(data);
			},
		}

		var GithubAPI = {
		    /*
		    * Github API wrapper
		    */
		    "base_url": 'https://api.github.com/',

		    "url_templates": {
		    	"repo": "repos/{{owner}}/{{repo}}",
		    	"repo_commits": "repos/{{owner}}/{{repo}}/commits",
				"commits": "repos/{{owner}}/{{repo}}/git/commits",
		    	"commit": "repos/{{owner}}/{{repo}}/git/commits/{{&sha}}",
				"refs": "repos/{{owner}}/{{repo}}/git/refs",
				"ref": "repos/{{owner}}/{{repo}}/git/refs/{{&ref}}",
				"type": "repos/{{owner}}/{{repo}}/git/refs/{{&type}}",
				"blobs": "repos/{{owner}}/{{repo}}/git/blobs",
				"blob": "repos/{{owner}}/{{repo}}/git/blobs/{{&sha}}",
				"trees": "repos/{{owner}}/{{repo}}/git/trees",
				"tree": "repos/{{owner}}/{{repo}}/git/trees/{{&sha}}",
				"contents": "repos/{{owner}}/{{repo}}/contents/{{&path}}",
				"compare": "repos/{{owner}}/{{repo}}/compare/{{&base}}...{{&head}}",
				"pulls": "repos/{{owner}}/{{repo}}/pulls",
				"pull": "repos/{{owner}}/{{repo}}/pulls/{{number}}",
				"merge": "repos/{{owner}}/{{repo}}/pulls/{{number}}/merge",
				"releases": "repos/{{owner}}/{{repo}}/releases",
				"release_latest": "repos/{{owner}}/{{repo}}/releases/latest",
				"search/repositories": "search/repositories",
				"create_repo": "orgs/{{org}}/repos"
		    },

		    "__build_url": function(template_name, params){
		    	return Mustache.render(this.url_templates[template_name], params);
		    },

			"create": function(token){
				var self = Object.create(this);
				self.access_token = token;
				return self;
		    },

		    "__ajax": function(template_name, url_params, callback, method, data, MTtype){
		    	var 
		    		path,
		    		url = this.__build_url(template_name, url_params);

		    	path = (method === "GET" ? url:url + '?access_token=' + this.access_token);
		    	
		    	return $.ajax({
		    		"url": this.base_url + path,
		    		"success": callback,
		    		"method": method,
		    		"data": (method === "GET" ? data: JSON.stringify(data)),
		    		"headers": {
		    			"Accept": "application/vnd.github.v3." + (MTtype || "full")
		    		},
		    		"statusCodes": statusCodes
		    	});
		    },
		    // change this to have mytype last and callback third
		    "get": function(template_name, url_params, callback, MTtype, data){
		        
		        data = $.extend({
		            access_token: this.access_token
		        }, data || {});

		        return this.__ajax(template_name, url_params, callback, 'GET', data, MTtype);
		    },

		    "post": function(template_name, url_params, data, callback, MTtype){
		        return this.__ajax(template_name, url_params, callback, 'POST', data, MTtype);
		    },

		    "put": function(template_name, url_params, data, callback, MTtype){
		        return this.__ajax(template_name, url_params , callback, "PUT", data, MTtype);
		    },

		    "patch": function(template_name, url_params, data, callback, MTtype){
		        return this.__ajax(template_name, url_params, callback, 'PATCH', data, MTtype);
		    },

		    "delete": function(template_name, url_params, data, callback, MTtype){
		        return this.__ajax(template_name, url_params, callback, 'DELETE', data, MTtype);
		    },

		    "getRepo": function(args, callback){
		    	return this.get("repo", args, callback, args.MTtype, args.data);
		    },

		    "createRepo": function(args, callback){
		    	console.log();
		    	return this.post("create_repo", args, args.data, callback, args.MTtype);
		    },

		    "getCommit": function(args, callback){
		        // https://developer.github.com/v3/git/commits/#get-a-commit
		        return this.get("commit", args, callback, args.MTtype, args.data);
		    },

		    "getRef": function(args, callback){
		        // https://developer.github.com/v3/git/refs/#get-a-reference
		        // @param ref => 'heads/<branch name>';
		        return this.get("ref", args, callback, args.MTtype, args.data);
		    },

		    "createRef": function(args, callback){
		        return this.post("refs", args, args.data, callback);
		    },

		    "getBlob": function(args, callback){
		        // https://developer.github.com/v3/git/blobs/#get-a-blob
		        return this.get("blob", args, callback, args.MTtype, args.data);
		    },

		    "createBlob": function(args, callback){
		        // https://developer.github.com/v3/git/blobs/#create-a-blob
		        return this.post("blobs", args, args.data, callback);
		    },

		    "createTree": function (args, callback) {
		        // https://developer.github.com/v3/git/trees/#create-a-tree
		        return this.post("trees", args, args.data, callback);
		    },

		    "createCommit": function (args, callback){
		        // https://developer.github.com/v3/git/commits/#create-a-commit
		        return this.post("commits", args, args.data, callback);
		    },

		    "updateRef": function(args, callback){
		        // https://developer.github.com/v3/git/refs/#update-a-reference
		        return this.patch("ref", args, args.data, callback);
		    },

		    "contents": function(args, callback){
		        // required args 'owner, repo, path'
		        return this.get("contents", args, callback, args.MTtype, args.data);
		    },

		    "createFile": function(args, callback){
		        // required args 'owner, repo, path, message, content';
		        return this.put(
		            "contents", 
		            args,
		            {
		                "path": args.path,
		                "message": args.message,
		                "content": args.content,
		                "branch": args.branch
		            },
		            callback
		        )
		    },


		    // used on save
		    "updateFile": function(args, callback){
		        // required args 'owner, repo, path, message, SHA, content';
		        return this.put(
		        	"contents",
		        	args,
		            {
		                "path": args.path,
		                "message": args.message,
		                "sha": args.sha,
		                "content": args.content,
		                "branch": args.branch
		            },
		            callback
		        )
		    },

		    "deleteFile": function(args, callback){
		    	return this.delete(
		    		"contents", 
		    		args, 
		    		{
		                "path": args.path,
		                "message": args.message,
		                "sha": args.sha,
		                "branch": args.branch
		            },
		    		callback, 
		    		args.MTtype
		    	);
		    },

		    "createBranch": function(args, callback){
		    	// should be in models
		        // this needs more error checking
		        // the callback param is for after a branch is created
		        var that = this;
		        this.getRef(
		            args
		        ).success(function(data, status, jqXHR){
		            if(_.isArray(data)){
		                jqXHR.fail(jqXHR, "error", "Ref not found.");
		            } else {
			            that.createRef({
			                "owner": args.owner,
			                "repo": args.repo,
			                "data": {
			                    "ref": "refs/heads/" + args.branch,
			                    "sha": data.object.sha
			                }
			            }).success(function(data){
			                callback(data);
			            }).fail(function(data){
			                console.log(data);
			            });
		            }


		        }).fail(function(data){
		            // >> if this fails i need to get the repo
		            //    - determine what the default branch for the 
		            //      repo is
		            //    - create refs/heads/master using the sha of
		            //      the default branch
		            //    - once refs/heads/master is created run createBranch again
		            // >> if getting the repo fails trigger forking
		            //    - after triggering forking just display a message asking them 
		            //      to try again in a few minutes
		            console.log(data);
		        });
		    },

		    "loadTree": function(args, callback){
		        return this.get("tree", args, callback, args.MTtype, args.data);
		    },

		    "getRefs": function(args, callback){
		    	return this.get("type", args, callback, args.MTtype, args.data);
		    },

		    "compareCommits": function(args, callback){
		    	return this.get("compare", args, callback, args.MTtype, args.data);
		    },

		    "searchRepos": function(args, callback){
		    	return this.get("search/repositories", {}, callback, args.MTtype, args.params);
		    },

		    "listCommits": function(args, callback){
				// @param sha	string	SHA or branch to start listing commits from. Default: the repository’s default branch (usually master).
				// @param path	string	Only commits containing this file path will be returned.
				// @param author	string	GitHub login or email address by which to filter by commit author.
				// @param since	string	Only commits after this date will be returned. This is a timestamp in ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ.
				// @param until	string	Only commits before this date will be returned. This is a timestamp in ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ.
				return this.get("repo_commits", args, callback, args.MTtype, args.data);
		    },

		    "getPullRequests": function(args, callback){
		    	return this.get("pulls", args, callback, args.MTtype, args.data);
		    },

		    "createPullRequest": function(args, callback){
		    	return this.post("pulls", args, args.data, callback);
		    },

		    "mergePullRequest": function(args, callback){
				// @param commit_message  string  Extra detail to append to automatic commit message.
        		// @param sha string  SHA that pull request head must match to allow merge 
		    	// data = json.dumps({
		     //        'commit_message': message,
		     //        'sha': repo._info.get('head_sha')
		     //    })
		    	return this.put("merge", args, args.data, callback);
		    },

		    "closePullRequest": function(args, callback){
		    	return this.patch("pull", args, args.data, callback);
		    },

		   	"getReleases": function(args, callback){
		    	return this.get("releases", args, callback, args.MTtype, args.data);
		    },

		    "getLatestRelease": function(args, callback){
				/*		    	
		        GET /repos/:owner/:repo/releases/latest

		        Response
		        ['tag_name']
		        */
		    	return this.get("release_latest", args, callback, args.MTtype, args.data);
		    },

		    "createRelease": function(args, callback){
		    	/*
		    	POST /repos/:owner/:repo/releases
		        @param tag_name `string` Required. The name of the tag.
		        @param target_commitish `string` Can be any branch or commit SHA
		        @param name `string` name of the release
		        @param body `string` Text describing the contents of the tag
		        @param draft `boolean` True to create unpublished release. Default False
		        @param prerelease `boolean` True to create release as prereleasae. Default False

		        Example:
		        {
		          "tag_name": "v1.0.0",
		          "target_commitish": "master",
		          "name": "v1.0.0",
		          "body": "Description of the release",
		          "draft": false,
		          "prerelease": false
		        }
		        */
				return this.post("releases", args, args.data, callback);
		    }
		};
		spa.subscribe('api-init-ready', function(data){
			$.extend(this, GithubAPI.create(data.user.access_token));
		}.bind(this));
	}
});
