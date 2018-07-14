spa.Component.add({
	name: 'chat-list',
	template: spa.includeTemplate('/static/spa/components/chat/chat-list/html/template.html'),
	cssRules: spa.includeTemplate('/static/spa/components/chat/chat-list/css/style.css'),
	init: function(){
		spa.subscribe('chat-open', function(){
			this.$container.show();
		}.bind(this));

		spa.subscribe('chat-close', function(){
			this.$container.hide();
		}.bind(this));

		spa.subscribe('chat-userList-update', function(data){
			this.renderTemplate({
				teams: Object.keys(data.teams).map(function(key) { return data.teams[key]; }),
				users: Object.keys(data.users).map(function(key) { 
					if(!data.users[key].teams.length) return data.users[key];
					return {}; 
				})
			});
		}.bind(this));

		this.$container.on('click', 'h3[data-team-slug]', function(event){
			var team = $(this).data('team-slug');
			spa.publish('chat-open-room', {team: team});
		});
	}
});
