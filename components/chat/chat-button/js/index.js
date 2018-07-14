spa.Component.add({
	name: 'chat-button',
	template: spa.includeTemplate('/static/spa/components/chat/chat-button/html/template.html'),
	cssRules: spa.includeTemplate('/static/spa/components/chat/chat-button/css/style.css'),
	is_extended: false,
	init: function(){
		this.renderTemplate();
		this.$container.on('click', function(event){
			if(this.is_extended){
				spa.publish('chat-close');
				this.is_extended = !this.is_extended;
			}else {
				spa.publish('chat-open');
				this.is_extended = !this.is_extended;
			}
		});
	},	
});

