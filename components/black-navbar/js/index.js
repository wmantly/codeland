spa.Component.add({
	name: 'black-navbar',
	template: spa.includeTemplate('/components/black-navbar/html/template.html'),
	cssRules: spa.includeTemplate('/components/black-navbar/css/style.css'),
	init: function(){
		this.renderTemplate();

		this.$container.on("click", ".navbar-brand", function(event){
			event.preventDefault();
			spa.publish("open-team-selection");
		});
	}
});
