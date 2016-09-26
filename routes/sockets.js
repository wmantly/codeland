module.exports = function(app){
    messages = []
    app.io.route('messages', {
    // socket.io event: messages:list
    list: function(req, res) {

      console.log(req.session)
      res.json(req.session);
    },

    // socket.io event: messages:add
    add: function(req, res) {
      // data is accessible from req.data (just like req.body, req.query)
      var data = req.data;

      console.log(data);
      // Or use req.param(key)

      req.session[data.name] = data.value;
      req.session.save();
      res.status(200).json(req.session);
    },

    // socket.io event: messages:remove
    remove: function(req, res) {
      // Or just send a status code
      res.sendStatus(403);
    }
  });
};