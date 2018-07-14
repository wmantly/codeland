spa.Component.add({
	// This component does not update html when an exercise is complete
	name: 'video-portal',
	template: spa.includeTemplate('/static/spa/components/content/video-portal/html/template.html'),
	cssRules: spa.includeTemplate('/static/spa/components/content/video-portal/css/style.css'),
	templateMap: {
		"playlistCollection": spa.includeTemplate('/static/spa/components/content/video-portal/html/playlist-collection.html'),
		"modalView": spa.includeTemplate('/static/spa/components/content/video-portal/html/modalView.html')
	},
	init: function(){
		var that = this;


		that._id = spa.utils.uniqueId(that.name);
		that.template = that.templateMap[that.$container.data("template")] || that.template;
		that.renderTemplate({"_id": that._id});
		var $modal = that.$container.find("#video-modal");

		spa.subscribe("video-selected", function(args, topic){
			var header = $modal.find("h4 span.video-header-span");
			if (!that.player){
				that.player = that.createPlayer({
					videoId: args.params.videoId,
					height: args.params.height || "100%",
					width: args.params.width || "100%",
					// playerVars: args.playerVars,
					// events: {
					// 	"onReady": function(){
					// 		var header = that.$container.parents("#video-modal").find("h4 span.video-header-span");
					// 		header.html();
					// 	},
					// 	// "onStateChange": function(args){
					// 	// 	console.log(args.data);
					// 	// 	if(args.data === 5){	
					// 	// 		var header = $modal.find("h4 span.video-header-span");
					// 	// 		header.html(that.player.getVideoData().title);
					// 	// 	}
					// 	// }
					// }
				});	
			} else {
				that.player.loadVideoById(args.params.videoId);
			}
			
			$("#video-modal").modal("show");
			var $header = $modal.find("h4 span.video-header-span");
			$header.html(args.params.track + "  - Videos");
		});

		that.$container.find("#video-modal").on("hide.bs.modal", function(event){
			that.player.stopVideo();
		});

		that.$container.find("#video-modal").on("shown.bs.modal", function(event){
			var 
				$modalBody = that.$container.find(".modal-body"),
				modalStyle = getComputedStyle($modalBody[0]);

			that.player.setSize(
				"" + (parseInt(modalStyle.width) * 0.9) + "px",
				"" + (parseInt(modalStyle.height) * 0.9) + "px"
			);
		});

	},
	createPlayer: function(config){
		var that = this;
		return new YT.Player("player-" + that._id, config);
	},
	onReady: function(){
		var that = this;
		that.playlist = _.map(that.player.getPlaylist(), function(el, idx){
			// does not work only gets current video
			var videoData = that.player.getVideoData(el);
			return {
				"videoId": el,
				"author": videoData.author,
				"list": videoData.list,
				"title": el + " title placeholder" || videoData.title,
				"thumbnailLink":"https://i.ytimg.com/vi/" + el + "/hqdefault.jpg"
			} 
		});
		console.log(that.playlist);
		var rendered = Mustache.render(that.templateMap.playlistCollection, {
			"_id": that._id,
			"thumbnails": that.playlist
		});
		that.$container.find("#thumbnailList-" + that._id).html(rendered);
	}
});