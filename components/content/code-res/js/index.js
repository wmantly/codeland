spa.Component.add({ // code-res
	name: 'code-res',
	template: '<pre id="results" class="results">\n{{content}}</pre>',
	init: function(){
		this.renderTemplate();
	},
	update: function(content){
		this.renderTemplate({content:content});
	}
});
