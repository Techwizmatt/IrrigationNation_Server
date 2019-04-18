var app = require('express')();
var http = require('http').Server(app);
var serverIo = require('socket.io').listen(234);
var clientIo = require('socket.io').listen(235);

var games = {};
var clients = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

serverIo.on('connection', function(socket){
    console.log('Connected, ID: ' + socket.id);
    socket.emit('register', {id:socket.id});
    games[socket.id] = {};
    clients[socket.id] = {};

    socket.on('update', function(data){
        //From game
        console.log("Server " + data)
    });

    socket.on('frame', function(data){
        //Set frame details
        //Start the timer
        games[socket.id] = {};

        var timeAmount = data['time'] * 1000;

        console.log("Started timer for " + socket.id + " - Milliseconds: " + timeAmount);
        setTimeout(function(){
            if (games[socket.id] != null){
                socket.emit('option', games[socket.id]);
                console.log("Sent over options");
            }
        }, timeAmount);

        clientIo.emit('frame', data);
    });

});

clientIo.on('connection', function(socket){
    console.log('Client has connected');

    var connectingId = socket.handshake.query['id'];

    if (clients[connectingId] != null) {
        clients[connectingId][socket.io] = {};
    } else {
        socket.disconnect();
    }

    socket.on('option', (data) =>{

        var currentGame = games[connectingId];
        var clientsOption = data['option'];

        if (currentGame != null) {
            if (currentGame[clientsOption] != null) {
                currentGame[clientsOption] = currentGame[clientsOption] + 1;
            } else {
                currentGame[clientsOption] = 1;
            }
        }

        console.log(currentGame);
    });

});


clientIo.on('disconnect', function(socket){
    console.log('Client has disconnected');

    var connectingId = socket.handshake.query['id'];

    // clients[connectingId][socket.id] = {};

    serverIo.emit('update','Client ' + socket.id + " has disconnected from " + connectingId);
});

serverIo.on('disconnect', function(socket){

    console.log('Disconnected, ID: ' + socket.id);

    games.remove(socket.id);
});

http.listen(3000, function(){
    console.log('listening on *:234 and *:235');
});