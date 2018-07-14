spa.Shell.add({ // index
	name: 'codeland',
	template: spa.includeTemplate('/shells/codeland/html/template.html'),
    cssRules: spa.includeTemplate('/shells/codeland/css/style.css'),
    init: function(){

        var that = this;
        that.renderTemplate();
        that.resize();

        $(window).on('resize', _.debounce(function(event){
            that.resize();
        }, 500));
    },
});
