
// The messages sent in the chat. Stores a maximum of 10 messages
// before removing the oldest message.
var messages = [];
// The users in the chat.
var users = [];

// ======================== ENTRY POINT ========================== \\
/**
 * This function is called whenever a client connects to the server. 
 * From here, the player may (attempt) to join the chat.
 *
 * @param i The socket.io library
 * @param s The socket for the newly connected client
 */
exports.init = function(i, s) {

    // When a client wants to join the chat.
    s.on('joinReq', function(data) { joinRequest(s, data); });
    // s.on('joinReq', joinRequest);
    // When a client has sent a message.
    s.on('message', function(data) { sendMessage(s, data.username, data.msg); });

};


// ======================= CHAT FUNCTIONS ======================== \\

/**
 * This function handles join requests to the chat.
 *
 * @param username The username the client attempts to use.
 */
var joinRequest = function(s, username) {
    var socket = s;
    console.log("this: " + this);
    // Username is valid. Allow client to enter the chat.
    if (isUsernameValid(username)) {
        // Store the username.
        storeUser(username);
        // Tell the client that he/her can join the chat. Give a list of the other clients.
        socket.emit('joinReq', { username: username, success: true, users: users, msgs: messages });
        // Tell all the other clients that someone has joined the chat.
        socket.broadcast.emit('joined', { username: username});
    }
    // Username is invalid. Report back to client.
    else {
        socket.emit("joinReq", { username: username, success: false });
    }
};

/**
 * This function sends a given message from the user to the rest of
 * the clients/chatters.
 *
 * @param username The name of the user sending the message.
 * @param msg The message to send.
 */
var sendMessage = function(s, username, msg) {
    var timestamp = fetchTime();
    var socket = s;
    // Broadcast the message to all other clients.
    socket.broadcast.emit('message', { username: username, msg: msg, timestamp: timestamp });
    // Temporarily store the message. 
    storeMessage(username, timestamp, msg);
}

// ====================== HELPER FUNCTIONS ======================= \\


var storeMessage = function(name, timestamp, msg) {
    if (messages.length > 10) {
        // Remove the oldest message, i.e., the first one stored.
        messages.shift();
    }
    messages.push({name: name, timestamp: timestamp, msg: msg});
};

var storeUser = function(username) {
    users.push({name: username, joinTime: new Date()});
}

var fetchTime = function() {
    var d = new Date();
    var time = d.getHours();
    time += ":" + d.getMinutes();
    time += ":" + d.getSeconds();
    return time;
};

/** Checks to see if the username is currently available. */
var isUsernameValid = function(name) {
    var i = users.length;
    while(i--) {
        if (i < 0) break;
        if (users[i].name === name) break;
    }
    if (i < 0 || users.length == 0) {
        return true;
    }
    else return false;
};

