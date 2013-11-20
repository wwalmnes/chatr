var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Reduce logging by socket.io. Comment if you want socket.io logging to terminal.
io.set('log level', 1);

// Configuration
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

server.listen(app.get('port'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
app.get('/', routes.index);

var fetchTime = function() {
    var d = new Date();
    var time = d.getHours();
    time += ":" + d.getMinutes();
    time += ":" + d.getSeconds();
    return time;
}

var messages = [];
var users = [];

var storeMessage = function(name, timestamp, msg) {
    if (messages.length >= 10) {
        /** We want to remove the oldest message (the first one stored). */
        messages.shift();
    }
    messages.push({name: name, timestamp: timestamp, msg: msg});
}

/** Checks to see if the username is currently available. */
var isUsernameValid = function(name) {
    var i = users.length;
    while(i--) {
        if (i < 0) break;
        if (users[i].name === name) break;
    }
    if (i < 0 || users.length == 0) {
        users.push({name: name, joinTime: new Date()});
        return true;
    }
    else return false;
}

io.sockets.on('connection', function(socket) {
    console.log("Successfully established connection with a client!");

    /** When a client wants to join the chat. */
    socket.on('joinReq', function(data) {
        console.log(data + " requesting to join chat.");
        /** If the username was valid. */
        if (isUsernameValid(data)) {
            /** Tell the client to proceed to the chatroom. */
            socket.emit('joinReq', { username: data, success: true, users: users });
            /** Tell all the other clients that someone has joined the chat. */
            socket.broadcast.emit('joined', { username: data});
        }
        /** Username was not valid. Has to try a new username. */
        else {
            socket.emit("joinReq", { username: data, success: false });
        }

    });

    /** When a client sends a message. */
    socket.on('messages', function(data) {
        var timestamp = fetchTime();
        /** Broadcast the message to all other clients. */
        socket.broadcast.emit('messages', { username: data.username, msg: data.msg, timestamp: timestamp });
        /** Temporarily store the message. */
        storeMessage(data.username, timestamp, data);
    });
});