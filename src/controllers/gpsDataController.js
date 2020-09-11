const moment = require('moment');

var devices = [];

module.exports = (io) => {
    io.on('connection', socket => {
        console.log('NUEVO SOCKET CONECTADO');

        socket.on('send command tk103ab', function (data) {
            if (devices.length > 0) {
                for (let i = 0; i < devices.length; i++) {
                    if (devices[i].imei === data.imei) {
                        let udpserver = devices[i].udpserver;
                        let command = '**,imei:' + devices[i].imei + (data.action === 0 ? ',J;' : ',K;');
                        let port = devices[i].remote.port;
                        let ip = devices[i].remote.address;

                        udpserver.send(command, 0, command.length, port, ip, function (err) {
                            if (err) {
                                console.log("command not sent");
                            } else {
                                console.log("command sent");
                            }
                        });
                        break;
                    }
                }
            } else {
                console.log("dispositivo aun no reporta");
            }
        });
    });

    require('./tk103abController')(io, devices);
    // require('./sp4600Controller')(io, devices);
} 