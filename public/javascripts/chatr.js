$(function(){
    // Connect to the server.
    var server = io.connect(window.location.hostname);
    // Just initialise the username variable.
    var username = "";
    console.log("Connected to the ChatR server!");

    // The client's list of users connected to the chat.
    var users = [];


    // ====================== HELPER FUNCTIONS ======================= \\

    var fetchTime = function() {
        var d = new Date();
        var time = d.getHours();
        time += ":" + d.getMinutes();
        time += ":" + d.getSeconds();
        return time;
    }


    var isUserAlreadyAdded = function(name) {
        var i = users.length;
        while(i--) {
            if (i < 0) break;
            if (users[i].name === name) break;
        }
        if (i < 0 || users.length == 0) {
            users.push({name: name, joinTime: new Date()});
            return false;
        }
        else return true;
    }

    // ===================== PRE-CHAT FUNCTIONS ====================== \\

    // Find the entered username. (Needs to be checked on server if it is availble.)
    var input_username = $('#preChat').find('.inputBox');

    // Check to see if the user pressed the "Submit!" button.
    $('#preChat').find('.chatBtn').on('click', function(e) {
        e.preventDefault()
        server.emit('joinReq', input_username.val());
    });
    // Check to see if the user pressed enter after typing the message.
    input_username.keypress(function(event) {
        if (event.which == 13) {
            server.emit('joinReq', input_username.val());
        }
    });


    // The result of this client's join request.
    server.on('joinReq', function(data) {
        username = input_username.val();
        input_username.val("");
        // It failed! Try another username.
        if (!data.success) {
            $('#preChat').find('.alertMsg').text(data.username + ' is not available. Try something else!');
        }
        // Congrats, it worked!
        else {
            users.push({name: username, joinTime: new Date()});
            $('#userbox').append("<p class='me'>" + data.username + "</p>")
            // Add users which are not already added.
            for (var i = 0; i < data.users.length; i++) {
                console.log("Is user: " + data.users[i].name + " already added?");
                if (!isUserAlreadyAdded(data.users[i].name)) {
                    console.log("Yes");
                    $('#userbox').append("<p>" + data.users[i].name + "</p>")
                }
            }
            // Write previously written messages.
            for (var i = 0; i < data.msgs.length; i++) {
                writeMsgToScreen(data.msgs[i].name, data.msgs[i].timestamp, data.msgs[i].msg);
            }
            $('#preChat').hide("fast");
            $('#main').show("fast");
        }
    });

    // ======================= CHAT FUNCTIONS ======================== \\

    var writeMsgToScreen = function(user, timestamp, msg) {
        $('#chatbox').append("<p><span class='username'>" + user + " [" + timestamp + "]</span>: " + msg + "</p>");
    };

    var sendMsgToServer = function() {
        // Fetch the message. (Should probably safety-check chatInput.val=p)
        var message = $('#chatInput').val();
        // Pass the message to the server.
        server.emit("message", {username: username, msg: message});
        // Write the message to the screen.
        writeMsgToScreen(username, fetchTime(), message);
        // Clear the input.
        $('#chatInput').val("");
    };

    // Listen for messages from other clients.
    server.on('message', function(data) {
        // Write the other client's message to this screen.
        writeMsgToScreen(data.username, data.timestamp, data.msg);
    });

    // When another client has joined the chat, output it to screen to notify this client.
    server.on('joined', function(data) {
        users.push({name: data.username, joinTime: new Date()});
        $('#userbox').append("<p>" + data.username + "</p>")
        $('#chatbox').append("<p><span class='userJoined'>" + data.username + " has joined the chat!</span></p>");
    });

    // Check to see if the user pressed the "Send!" button. 
    $('#sendMsg').on('click', sendMsgToServer);
    // Check to see if the user pressed enter after typing the message. 
    $('#chatInput').keypress(function(event) {
        // Pressed enter/return
        if (event.which == 13) {
            sendMsgToServer();
        }
    });


});



