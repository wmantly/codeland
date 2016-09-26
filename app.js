var express = require('express.oi');
var path = require('path');
var app = express().http().io();
var RedisStore = require("connect-redis")(express.session);


// Pass in your express-session configuration
// Documentation here: https://github.com/expressjs/session#sessionoptions

// app.io.session({
//   store: new RedisStore({db:10}), // XXX redis server config
//   secret: "keyboard cat",
//   resave: true,
//   saveUninitialized: true
// });

// app.use(express.cookieParser());

var midwaresession= (function(){
  return express.session({
    store: new RedisStore({db:10}), // XXX redis server config
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  });
})();

// app.io.use(midwaresession);

app.use(midwaresession);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

require('./routes/index')(app);
require('./routes/sockets.js')(app);

// app.io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world', session: socket.request.session });
//   socket.on('session', function (data) {
//     socket.request.session.other = 'hi';
//     console.log('socket', socket.request.session);
//     socket.emit('news', { hello: 'world', session: socket.request.session });
//   });
// });

app.listen(3000);
