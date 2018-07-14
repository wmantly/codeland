spa.Component.add({
	name: 'chat-room',
	template: spa.includeTemplate('/static/spa/components/chat/chat-room/html/template.html'),
	cssRules: spa.includeTemplate('/static/spa/components/chat/chat-room/css/style.css'),
	templateMap: {
		messageTemplate: spa.includeTemplate('/static/spa/components/chat/chat-room/html/message.html')
	},
	currentTeam: '',
	init: function(){

		spa.subscribe('chat-close', function(){
			this.$container.hide();
			this.currentTeam = '';
		}.bind(this));

		spa.subscribe('spa-chat-new-message', function(data){
			if(data.teamname === this.currentTeam){
				data.user = spa.models.chat.users[data.username];
				data.message = markdown.toHTML(data.message);
				this.$container.find('#spa-chat-room').append(
					Mustache.render(this.templateMap.messageTemplate, data)
				);

				var $ul = this.$container.find('#spa-chat-room');
				$ul.scrollTop($ul[0].scrollHeight);

			}
		}.bind(this));

		spa.subscribe('chat-open-room', function(data){
			this.$container.empty();

			var context = (function(){
				spa.models.chat.teams[data.team].messages.map(function(message){
					if(!message.is_parses) {
						message.is_parses = true;
						message.message = markdown.toHTML(message.message);
						message.user = spa.models.chat.users[message.username];
					}
				});
				return context;
			})();

			this.renderTemplate(spa.models.chat.teams[data.team]);
			this.$container.show();
			var $ul = this.$container.find('#spa-chat-room');
			$ul.scrollTop($ul[0].scrollHeight);

			this.currentTeam = data.team;
		}.bind(this));

		this.$container.on('submit', 'form', function(event){
			event.preventDefault();
			var $input = $('#spa-chat-send-message');

			if($input.val() === '') return false;

			spa.publish('spa-chat-send-message', {
				room: $input.data('team-name'),
				message: $input.val() 
			});

			$input.val('');
		});
	},
});
