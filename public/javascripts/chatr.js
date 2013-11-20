$(function(){
    var server = io.connect('http://localhost:3000');
    var username = "";
    console.log("Connected to the ChatR server!");

    var users = [];

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

    /*****************************************************
     * Related to before the chat has started.           *
     *****************************************************/

    var input_username = $('#preChat').find('.inputBox');

    /** Check to see if the user pressed the "Submit!" button. */
    $('#preChat').find('.chatBtn').on('click', function(e) {
        e.preventDefault()
        server.emit('joinReq', input_username.val());
    });
    /** Check to see if the user pressed enter after typing the message. */
    input_username.keypress(function(event) {
        if (event.which == 13) {
            server.emit('joinReq', input_username.val());
        }
    });


    server.on('joinReq', function(data) {
        username = input_username.val();
        input_username.val("");
        if (!data.success) {
            $('#preChat').find('.alertMsg').text(data.username + ' is not available. Try something else!');
        }
        else {
            users.push({name: username, joinTime: new Date()});
            $('#userbox').append("<p class='me'>" + data.username + "</p>")
            /** Add users which are not already added. */
            for (var i = 0; i < data.users.length; i++) {
                console.log("Is user: " + data.users[i].name + " already added?");
                if (!isUserAlreadyAdded(data.users[i].name)) {
                    console.log("Yes");
                    $('#userbox').append("<p>" + data.users[i].name + "</p>")
                }
            }
            for (var i = 0; i < data.msgs.length; i++) {
                writeMsgToScreen(data.msgs[i].name, data.msgs[i].timestamp, data.msgs[i].msg);
            }
            $('#preChat').hide("fast");
            $('#main').show("fast");
        }
    });



    /*****************************************************
     * Related to when the chat has started.             *
     *****************************************************/

    var writeMsgToScreen = function(user, timestamp, msg) {
        $('#chatbox').append("<p><span class='username'>" + user + " [" + timestamp + "]</span>: " + msg + "</p>");
    }

    var sendMsgToServer = function() {
        /** Pass the message to the server. */
        server.emit("messages", {username: username, msg: $('#chatInput').val()});
        /** Write the message to screen. */
        writeMsgToScreen(username, fetchTime(), $('#chatInput').val());
        /** Clear the input. */
        $('#chatInput').val("");
    }

    /** When another client has sent a message. */
    server.on('messages', function(data) {
        writeMsgToScreen(data.username, data.timestamp, data.msg);
    });

    /** When another client has joined the chat. */
    server.on('joined', function(data) {
        users.push({name: data.username, joinTime: new Date()});
        $('#userbox').append("<p>" + data.username + "</p>")
        $('#chatbox').append("<p><span class='userJoined'>" + data.username + " has joined the chat!</span></p>");
    });

    /** Check to see if the user pressed the "Send!" button. */
    $('#sendMsg').on('click', sendMsgToServer);
    /** Check to see if the user pressed enter after typing the message. */
    $('#chatInput').keypress(function(event) {
        if (event.which == 13) {
            sendMsgToServer();
        }
    });


});



