const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);
const dgram = require('dgram');
const udpserver = dgram.createSocket('udp4');

require('./controllers/gpsDataController')(io);

// Settings
app.set('port', process.env.PORT || 3000);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Routes
app.use(require('./routes/routes'));

// Starting Server
server.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});