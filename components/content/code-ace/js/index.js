spa.Component.add({
	name: 'code-ace',
	template: spa.includeTemplate('/components/content/code-ace/html/template.html'),
	cssRules: spa.includeTemplate('/components/content/code-ace/css/style.css'),
	init: function(){
		var that = this;
		that._id = spa.utils.uniqueId(that.name + "-");
		that.renderTemplate();
		
		that.editor = ace.edit(that.$container.find('#code-editor')[0]);
		that.editor.$blockScrolling = Infinity;
		that.editor.setFontSize(16);
		that.editor.setTheme("ace/theme/monokai");
		that.editor.getSession().setMode("ace/mode/javascript");
		that.editor.setShowInvisibles(true);

		that.modelist = ace.require("ace/ext/modelist");
		if (!this.outputBox){
				this.components.forEach(function(el, idx){
					if (el.name === "code-res"){
						this.outputBox = el;
					}
				}.bind(this));
			}

		this.$container.find('button#run').on('click', function(event){

			spa.publish('code-run', {
				language: 'bash',
				code: that.editor.getValue()
			});

		});

		this.$container.find('button#save').on('click', function(event){
			if(!that.exercise || that.exercise.action_token !== "") return true;
			spa.publish('GA-event', {
				category: 'codeland',
				action: 'save',
				label: that.exercise.slug
			});

			that.exercise.action_token = _.uniqueId('codelandManager-save');
			that.toggleActions({"state": "lock"});
			spa.publish('exercise-save', {
				token: that.exercise.action_token,
				content: that.editor.getValue(),
				exercise: that.exercise,
			});
		});

		this.$container.find('button#reset').on('click', function(event){
			if(!that.exercise || that.exercise.action_token !== "") return true;
			spa.publish('GA-event', {
				category: 'codeland',
				action: 'reset',
				label: that.exercise.slug
			});

			if (that.exercise){
				that.exercise.codeLandfile().then(function(file){
					spa.publish('codeland-file-change', {
						content: file.content || "",
						path: file.path
					});
				});
			}
		});

		this.$container.find('button#test').on('click', function(event){
			if(!that.exercise || that.exercise.action_token !== "") return true;
			spa.publish('GA-event', {
				category: 'codeland',
				action: 'test',
				label: that.exercise.slug
			});

			that.exercise.action_token = _.uniqueId('codelandManager-test');
			that.outputBox.loadingStart();
			that.toggleActions({"state": "lock"});
			
			that.exercise.codeLandfile().then(function(file){
				spa.publish('code-test', {
					"params": {
						token: that.exercise.action_token,
						exercise: that.exercise,
						code: that.editor.getValue(),
						exerciseSlug: that.exercise.slug,
						path: file.path,
						type: "tests"
					},

					"successEvent": "..." + that._id,
					"errorEvent": "..." + that._id
				});
			});
		});

		this.$container.find('button#quiz').on('click', function(event){
			$('#quiz-open-modal').trigger('click');
		});

		this.$container.find('button#question').on('click', function(event){
			spa.publish('GA-event', {
				category: 'codeland',
				action: 'question-open',
				label: that.exercise.slug
			});

			spa.publish('forum-post', {
				comment: this.$container.find('.ask-a-question textarea').val(),
				model: "exercise",
				slug: this.exercise.slug,
				title: this.$container.find('.ask-a-question [type=text]').val(),
				hand_raised: true,
			});
			this.$container.find('.ask-a-question textarea').val('');
			this.$container.find('.ask-a-question [type=text]').val('');
			
			$('#exercise-discussion').notify('Question added', {
				position: 'top center',
				className: 'success'
			}).fadeIn(300).fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);

		}.bind(this));

		// PUB/SUB

		this.subscribe('codeland-file-change', function(args){
			// console.log(args);
			if (args.content !== void 0 && (!args.sha || args.sha !== _.get(that.file, "sha"))) {
				that.file = args;
				// this is disgusting 
				// this whole component needs to be scrapped 
				this.editor.getSession().setMode(
					that.modelist.getModeForPath(args.path).mode
				);
				this.editor.setValue(args.content, -1);
			}
		}.bind(this));

		this.subscribe("exercise-change", function(args){
			that.exercise = args;
			that.exercise.action_token = "";
			that.updateActions();
		});

		this.subscribe("exercise-save-complete", function(args){
			if (args.token === that.exercise.action_token){
				that.exercise.action_token = "";
				that.toggleActions({"state": "unlock"});
			}
		});

		this.subscribe(["code-output", "..." + that._id], function(args){
			// Replaceing Character Codes In Result
			// for js tests with jasmine

			if (!that.outputBox){
				that.components.forEach(function(el, idx){
					if (el.name === "code-res"){
						that.outputBox = el;
					}
				});
			}

			that.toggleActions({"state": "unlock"});
			that.outputBox.update(args.res);
		
		});
	},
	toggleActions: function(args){
		var 
			that = this,
			$buttons = that.$container.find("button.action-button");
		if(args.state === "lock"){
			$buttons.toggleClass("disabled", true);
			setTimeout(function(){
				$buttons.toggleClass("disabled", false);
			}, 1000);
		} else if (args.state === "unlock"){
			$buttons.toggleClass("disabled", false);
		}

	},
	updateActions: function(){
		var 
			that = this,
			exercise = that.exercise;

		exercise.__meta.then(function(repo){
			var 
				missing, $testButton;

			if (exercise.github_id === that.exercise.github_id){

				$testButton = that.$container.find("#test");
				$quizButton = that.$container.find("#quiz");
				missing = _.difference(["quiz", "tests"], repo.tags);

				if (!~missing.indexOf("tests")){
					$testButton.toggleClass("hidden", false);
					$quizButton.toggleClass("hidden", true);

				} else if (!~missing.indexOf("quiz")){
					$testButton.toggleClass("hidden", true);
					$quizButton.toggleClass("hidden", false);

				} else {
					$testButton.toggleClass("hidden", false);
				}
			}
		});
	}
});
