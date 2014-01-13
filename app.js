

// ======================= INITIALIZATION ======================== \\
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var chatserver = require('./chatserver');

// ======================== CONFIGURATION ======================== \\

// Reduce logging by socket.io. Comment if you want socket.io logging to terminal.
io.set('log level', 1);

// Heroku specific requirements
io.configure(function() {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});


app.configure(function() {
    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// =========================== ROUTES ============================ \\
app.get('/', routes.index);

// ===================== START APPLICATION ======================= \\
server.listen(app.get('port'));
console.log("Application started on port " + app.get('port'));

io.sockets.on('connection', function(socket) {
    console.log("Successfully established connection with a client!");
    chatserver.init(io, socket);
});
