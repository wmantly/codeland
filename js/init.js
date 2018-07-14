spa.init(function(){
    if(location.search.startsWith("?dev")){
        spa.sub("__MIDDLEWARE__", function(args, topic){
            console.log(topic, args);
            return true;
        });
    }
    // TODO: This might be fixed in ace. The issue was closed.
    ace.EditSession.$uid = 0;
    JSONEditor.plugins.epiceditor.basePath = "/static/spa/libs/epiceditor";
});

spa.RenderBase.loadingHTML = '<i class="fa fa-spinner fa-spin fa-3x fa-fw spa-spinner-component" style="position: absolute"></i>';

spa.RenderBase.loadingStart = function(){
    this.$container.prev('.spa-spinner-component').remove();
    var loadingHTML = this.loadingHTML;
    this.$container.before(loadingHTML);
};

spa.RenderBase.hideContainerInit = function(){
    this.$container.css('opacity', 0);
};

// spa.RenderBase.hideContainer = function(callback){
//     this.$container.fadeTo('slow', 0, callback);
// };

spa.RenderBase.showContainer = function(callback){
    this.$container.prev('.spa-spinner-component').remove();
    this.$container.stop().fadeTo('slow', 1, callback);
};

spa.preSubscribe('load-shell', function(data){
    var hideModal = true;
    $(".modal").filter(":visible").each(function(idx, el){
        $(el).modal('hide');
        if(hideModal) hideModal = false;
    });
    return hideModal;
});

spa.Component.lockButtons = function(){
    this.$container.find('button').prop('disabled', true);
};

spa.Component.unlockButtons = function(){
    this.$container.find('button').prop('disabled', false);
};

spa.onInit();
