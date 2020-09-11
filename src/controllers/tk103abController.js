const conn = require('./../database');
const dgram = require('dgram');
const udpserver = dgram.createSocket('udp4');
const listeningPort = 15003;
const moment = require('moment');

const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";
const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";
const BgBlack = "\x1b[40m";
const BgRed = "\x1b[41m";
const BgGreen = "\x1b[42m";
const BgYellow = "\x1b[43m";
const BgBlue = "\x1b[44m";
const BgMagenta = "\x1b[45m";
const BgCyan = "\x1b[46m";
const BgWhite = "\x1b[47m";

module.exports = (io, devices) => {
    udpserver.on('listening', () => {
        let address = udpserver.address();
        console.log(FgMagenta + '%s' + Reset, '[TK103AB UDP Server] listening on port ' + address.port);
    });

    udpserver.on('message', (message, remote) => {
        console.log(FgMagenta + '%s' + Reset, message);

        // imei:868683026573786,tracker,181218053226,,F,093222.000,A,1005.4532,N,07035.2947,W,42.05,93.83;
        let trace = message.toString();

        if (trace.length === 16) {
            let msg = 'ON';
            udpserver.send(msg, 0, msg.length, remote.port, remote.address);
        } else if (trace.length === 26) {
            let msg = 'LOAD';
            udpserver.send(msg, 0, msg.length, remote.port, remote.address);
        } else {
            var arrTrace = trace.split(',');
            if (arrTrace.length > 11 & arrTrace[4] === 'F') {
                var imei = arrTrace[0].replace('imei:', '');
                var alert = arrTrace[1];
                var datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                var date = moment().format('DD/MM/YYYY');
                var time = moment().format('hh:mm:ss a');

                if (arrTrace[2].length === 10) {
                    datetime = moment(arrTrace[2], 'YYMMDDHHmm').format('YYYY-MM-DD HH:mm:ss');
                    date = moment(arrTrace[2], 'YYMMDDHHmm').format('DD/MM/YYYY');
                    time = moment(arrTrace[2], 'YYMMDDHHmm').format('hh:mm:ss a');
                } else {
                    datetime = moment(arrTrace[2], 'YYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss');
                    date = moment(arrTrace[2], 'YYMMDDHHmmss').format('DD/MM/YYYY');
                    time = moment(arrTrace[2], 'YYMMDDHHmmss').format('hh:mm:ss a');
                }

                var fix = arrTrace[6];
                var latitude = Number(getLatitude(arrTrace[7], arrTrace[8].toUpperCase()));
                var longitude = Number(getLongitude(arrTrace[9], arrTrace[10].toUpperCase()));
                var speed = 0;
                var heading = 0.0;

                if (arrTrace[11].length > 0) {
                    speed = (arrTrace[11] * 1.852).toFixed(0);
                }

                if (arrTrace[12].length > 0) {
                    heading = Number(arrTrace[12].replace(';', '')).toFixed(0);
                }

                var sql = "INSERT INTO traces (imei,alert,date_time,fix,latitude,longitude,speed,heading,ip,port) VALUES (?)";
                var data = [
                    imei, alert, datetime, fix, latitude, longitude, speed, heading, remote.address, remote.port
                ];

                conn.query(sql, [data], (myerr, result) => {                    

                    let device = {
                        imei: imei,
                        imeiFixed: imei,
                        udpserver: udpserver,
                        remote: remote
                    };

                    if (devices.length > 0) {
                        let exist = false;
                        for (let i = 0; i < devices.length; i++) {
                            if (devices[i].imei === imei) {
                                devices[i] = device;
                                exist = true;
                                break;
                            }
                        }

                        if (!exist) {
                            devices.push(device);
                        }
                    } else {
                        devices.push(device);
                    }

                    io.sockets.emit('new gps data', {
                        imei: imei,
                        alert: getAlertName(alert),
                        date_time: datetime,
                        fix: fix,
                        latitude: latitude,
                        longitude: longitude,
                        speed: Number(speed),
                        heading: Number(heading),
                        ip: remote.address,
                        port: remote.port,
                        battery: 0,
                        doors: 0,
                        fuel: 0,
                        ignition: 0,
                        satellites: 0
                    });
                });
            }
        }
    });

    udpserver.bind(listeningPort);
}

function getAlertName(alert) {
    let parsedAlert = 'loc';

    switch (alert) {
        case 'ac alarm':
            parsedAlert = 'ac';
            break;
        case 'low battery':
            parsedAlert = 'low';
            break;
        case 'sensor alarm':
            parsedAlert = 'sensor';
            break;
        case 'acc on':
            parsedAlert = 'ignition_on';
            break;
        case 'acc off':
            parsedAlert = 'ignition_off';
            break;
        case 'overspeed':
            parsedAlert = 'speed';
            break;
        case 'help me!':
            parsedAlert = 'panic';
            break;
        default:
            parsedAlert = 'loc';
    };

    return parsedAlert;
}

function getLatitude(tempLat, direction) {
    var deg = tempLat.substring(0, 2);
    var min = tempLat.substring(2);
    var cMin = (min / 60).toFixed(6);
    var decPos = cMin.indexOf('.') + 1;

    var fDeg = direction === 'S' ? (deg * -1) : deg;
    var fMin = cMin.substring(decPos);

    return fDeg + '.' + fMin;
}

function getLongitude(tempLng, direction) {
    var deg = tempLng.substring(1, 3);
    var min = tempLng.substring(3);
    var cMin = (min / 60).toFixed(6);
    var decPos = cMin.indexOf('.') + 1;

    var fDeg = direction === 'W' ? (deg * -1) : deg;
    var fMin = cMin.substring(decPos);

    return fDeg + '.' + fMin;
}