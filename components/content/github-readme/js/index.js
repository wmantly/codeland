spa.Component.add({ // github-readme
	name: 'github-readme',
	template: '{{{content}}}',
	cssRules: spa.includeTemplate('/static/spa/components/content/github-readme/css/style.css'),
	init: function(){
		var that = this;
		that.alfred = spa.utils.Alfred.create();

		this.subscribe('exercise-change-url', function(){
			that.$container.fadeTo('fast', 0);
			that.loadingStart();
		});

		this.subscribe('exercise-change', function(exercise){
			that.alfred.fetchCourse({
				"args": {
					"exercise": exercise
				},
				"callback": function(args){
					that.renderTemplate({
						content: _.get(
							args.course.active_track.currentExercise.files,
							"['README.md'].content", "File not found!"
						)
					}, function(){
						spa.publish('exercise-ready', {exercise:exercise});
						document.title = args.course.active_track.currentExercise.title || document.title;
						
					});
					that.challengeDifferentiator();
				},
			});
		});

		this.$container.on('click', 'div.github-readme-collapsible-header', function(event){
			spa.publish('GA-event', {
				category: 'exercise',
				action: 'expand-header',
			});
			$(this).parents('.github-readme-collapsible')
				.find('.github-readme-collapsible-content')
				.toggle();
			}
		);
		
	},

	challengeDifferentiator: function() {
		$("a[id^='user-content-challenge']").parent().css({
			'background-color': 'black',
			'color': 'white',
			'padding': '8px',
			'border-radius': '5px'
		});
	}
});
