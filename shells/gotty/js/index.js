spa.Shell.add({
    name: 'gotty',
    // cssRules: spa.includeTemplate('/static/spa/shells/shell-forum/css/style.css'),
    template: '<nav class="navbar" data-component-name="black-navbar"></nav><div cclass="col-md-12"><div id="gotty"></div></div>',
    init: function(){
        var that = this;
        this.renderTemplate();
        this.resize();
        spa.models.gotty.gotty(this.$container.find('#gotty'));

        $(window).on('resize', _.debounce(function(event){
            that.resize();
        }, 500));
    },
    resize: function(){
        var 
            height = parseInt($(window).height()),
            width = parseInt($(window).width()),
            min_width = 500, min_height = 600;

        this.$container.height(height > min_height ? '100vh' : min_height + 'px');
        this.$container.width(width > min_width ? '100vw' : min_width + 'px');
        spa.publish("resize");

    }
});
