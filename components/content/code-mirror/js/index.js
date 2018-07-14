spa.Component.add({ // code-mirror
	name: 'code-mirror',
	template: spa.includeTemplate('/components/content/code-mirror/html/template.html'),
	cssRules: spa.includeTemplate('/components/content/code-mirror/css/style.css'),
	init: function(){
		var that = this;
		that.renderTemplate();
		this.editor = CodeMirror.fromTextArea(
			this.$container.find('textarea')[0], 
			{
				lineNumbers: true,
				theme: "solarized dark",
				lineWrapping: true,
				mode: 'python',
				indentUnit: 4,
				tabSize: 4
			}
		);

		this.editor.refresh();

		this.$container.find('button#run').on('click', function(event){
			that.exercise.__meta.then(function(repo){
				spa.publish('code-run', 
					that.stripCode({language: repo.language})
				);
			});
		});

		this.$container.find('button#test').on('click', function(event){
			spa.publish('code-test', 
				that.stripCode({exercise: that.exercise})
			);
		});

		this.$container.find('button#save').on('click', function(event){
			spa.publish('exercise-save', {
				content: that.editor.getValue(),	
				exercise: that.exercise
			});
		});

		this.$container.find('button#reset').on('click', function(event){
			if (that.exercise){
				that.exercise.codeLandfile().then(function(file){	
					spa.publish('codeland-file-change', {
						content: file.content || "",
					});
				});
			}
		});

		// PUB/SUB

		this.subscribe('codeland-file-change', function(args){
			if (args.content !== void 0) {
				this.editor.setValue(args.content);
			}
		}.bind(this));

		this.subscribe("exercise-change", function(args){
			this.exercise = args;
		}.bind(this));

		this.subscribe('code-output', function(args){

			if (!this.outputBox){
				this.components.forEach(function(el, idx){
					if (el.name === "code-res"){
						this.outputBox = el;
					}
				}.bind(this));
			}
			if (this.outputBox && args.token === this.token){
				this.outputBox.update(args.res);
			}
		}.bind(this));
	},
	stripCode: function(obj){
		that.token = Date();
		obj.token = that.token;
		obj.code = that.editor.getValue();
		return obj;
	}
});
