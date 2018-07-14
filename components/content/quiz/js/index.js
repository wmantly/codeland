spa.Component.add({
	name: 'quiz',
	cssRules: spa.includeTemplate('/static/spa/components/content/quiz/css/style.css'),
	template: spa.includeTemplate('/static/spa/components/content/quiz/html/template.html'),
	templateMap: {
		"quizForm": spa.includeTemplate('/static/spa/components/content/quiz/html/quiz-form.html'),
		"select": spa.includeTemplate('/static/spa/components/content/quiz/html/select-input.html'),
	},
	loadingHTML: '',
	init: function(){
		// Add mixin concept here and in content-release and content-pullrequest
		var that = this;
		
		spa.mixin.Form.call(that);

		that._id = spa.utils.uniqueId(that.name + "-");
		that.subscribe("exercise-change", function(args, topic){
			that.exercise = args;
			that.$container.empty();
			args.__meta.then(function(data){
				if(~data.tags.indexOf("quiz")){
					that.publish("get-file", {
						"params": {
							"owner": args.owner,
							"repo": args.repo,
							"path": "quiz.json",
							"MTtype": "full",
							"data": {
								"ref": "master"
							}
						},
						"successEvent": "quiz-ready-" + that._id,
						"errorEvent": "error-quiz-ready-" + that._id
					});
				}
			});
		});

		that.subscribe("quiz-ready-" + that._id, function(args, topic){
			var 
				$selectors,
				renderedQuiz,
				idx = 0;
			
			that.exercise.files[args.path] = that.quiz = args;
			that.quiz.content = JSON.parse(window.atob(args.content));
			that.exercise
			renderedQuiz = Mustache.render(
				that.templateMap.quizForm,
				{
					"_id": that._id,
					"quiz": that.quiz.content.quiz,
					"parse_question": function(){
						var template = that.templateMap[this.type];
						this._id = spa.utils.uniqueId()
						return Mustache.render(template, {
							"id": this._id,
							"name": "question" + idx++,
							"question": marked(this.question),
							"choices": this.choices,
							"md_parse": function(){
								return marked(this);
							}
						});
					}
				}
			);
			that.renderTemplate({"_id": that._id});
			that.$container.find("." + that._id + "-target").html(renderedQuiz);
			$selectors = that.$container.find('.selectpicker');
			$selectors.selectpicker();
		});

		that.subscribe("error-quiz-ready-" + that._id, function(args, topic){
			console.log(arguments);
		});

		that.subscribe("quiz-output-" + that._id, function(args){
			console.log(arguments);
			that.$container.find(".form-group").toggleClass("has-success", true);

		});

		that.subscribe("error-quiz-output-" + that._id, function(args){
			console.log(arguments);
		});


		that.$container.on("submit", "form#" + that._id, function(event){
			event.preventDefault();
			var 
				user_copy,
				$this = $(this),
				errors = {},
				data = $this.serializeObject();
			// move this into form mixin
			that.$container.find(".form-group").toggleClass("has-success", false);
			
			user_copy = $.extend(true, {}, that.quiz.content);
			_.each(that.quiz.content.quiz, function(obj, idx){
				// var $formGroup;
				user_copy.quiz[idx].answer = obj.choices.indexOf(data["question" + idx]);
				if(data["question" + idx] !== obj.choices[obj.answer]){
					errors[obj._id] = "Incorrect";
				} 
				else {
					$formGroup = that.$container.find('[for="' + obj._id + '"]').parent();
					$formGroup.toggleClass("has-success", true);
				}
			});
			if(!_.isEmpty(errors)){
				that.renderErrors(errors);
			} else {
				spa.publish('code-test', {
					"params": {
						token: that.exercise.action_token,
						exercise: that.exercise,
						code: JSON.stringify(user_copy),
						exerciseSlug: that.exercise.slug,
						path: "quiz.json",
						type: "quiz"
					},
					"successEvent": "quiz-output-" + that._id,
					"errorEvent": "error-quiz-output-" + that._id
				});
			}
		});
	}
});