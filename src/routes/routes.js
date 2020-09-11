const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt-nodejs');
const router = express.Router();
const util = require('util');
const moment = require('moment');
const geolib = require('geolib');

const myConnection = require('./../database');
const e = require('express');

router.get('/', (req, res) => {

});

router.post('/registerUser', (req, res) => {
    let { name, email, password } = req.body;

    myConnection.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (rows.length > 0) {
            if (rows[0].validation_code) {
                res.json({
                    result: 'VALIDATE'
                });
            } else {
                res.json({
                    result: 'EXIST'
                });
            }
        } else {
            let hashedPass = bcrypt.hashSync(password);
            let validationCode = generateCode(8);

            myConnection.query('INSERT INTO users (name,email,hashed_pass,validation_code) VALUES (?,?,?,?)', [name, email, hashedPass, validationCode], (err, result) => {
                if (err) {
                    res.json({
                        result: 'ERROR'
                    })
                } else {
                    console.log(result);

                    const transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: 'villasoftgps@gmail.com', // generated ethereal user
                            pass: 'Ejvh.251127' // generated ethereal password
                        }
                    });

                    let message = {
                        from: 'VillaTracking <villasoftgps@gmail.com>',
                        to: name + ' <' + email + '>',
                        subject: 'Código de Validación',
                        text: validationCode,
                        html: '<p>' + validationCode + '</p>'
                    }

                    transporter.sendMail(message, (err, info) => {
                        if (err) {
                            return res.send({
                                result: 'ERROR'
                            })
                        } else {
                            return res.json({
                                result: 'VALIDATE'
                            })
                        }
                    })
                }
            })
        }
    });
})

router.post('/validateRegistration', (req, res) => {
    let { email, validationCode } = req.body;

    myConnection.query('SELECT * FROM users WHERE email = ? AND validation_code = ?', [email, validationCode], (err, rows) => {
        if (err) {
            return res.send({
                result: 'ERROR'
            })
        }

        if (rows.length > 0) {
            myConnection.query('UPDATE users SET validation_code = NULL, status = 1 WHERE email = ?', [email], (err, rows) => {
                if (err) {
                    return res.send({
                        result: 'ERROR'
                    })
                }

                return res.send({
                    result: 'VALIDATED'
                })
            })
        } else {
            return res.send({
                result: 'INVALID'
            });
        }
    })
})

router.post('/validateLogin', (req, res) => {
    let { email, password } = req.body;

    myConnection.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) {
            return res.send({
                result: 'ERROR'
            })
        }

        if (rows.length > 0) {
            let row = rows[0];

            if (bcrypt.compareSync(password, row.hashed_pass)) {
                if (row.status === 0) {
                    let validationCode = generateCode(8);

                    myConnection.query('UPDATE users SET validation_code = ? WHERE email = ?', [validationCode, email], (err, rows) => {
                        if (err) {
                            return res.send({
                                result: 'ERROR'
                            })
                        }

                        const transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false, // true for 465, false for other ports
                            auth: {
                                user: 'villasoftgps@gmail.com', // generated ethereal user
                                pass: 'Ejvh.251127' // generated ethereal password
                            }
                        });

                        let message = {
                            from: 'VillaTracking <villasoftgps@gmail.com>',
                            to: row.name + ' <' + email + '>',
                            subject: 'Código de Validación',
                            text: validationCode,
                            html: '<p>' + validationCode + '</p>'
                        }

                        transporter.sendMail(message, (err, info) => {
                            if (err) {
                                return res.send({
                                    result: 'ERROR'
                                })
                            } else {
                                return res.json({
                                    result: 'VALIDATE'
                                })
                            }
                        })
                    })
                } else {
                    return res.send({
                        result: 'OK',
                        user: {
                            id: row.id,
                            name: row.name,
                            email: row.email
                        }
                    })
                }
            } else {
                return res.send({
                    result: 'INVALID'
                })
            }
        } else {
            return res.send({
                result: 'INVALID'
            })
        }
    });
})

router.post('/validateRecoveryEmail', (req, res) => {
    let { email } = req.body;

    myConnection.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) {
            return res.send({
                result: 'ERROR'
            })
        }

        if (rows.length === 0) {
            return res.send({
                result: 'NOT REGISTERED'
            })
        } else {
            let name = rows[0].name;
            let recoveryCode = generateCode(8);

            myConnection.query('UPDATE users SET recovery_code = ? where email = ?', [recoveryCode, email], (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.send({
                        result: 'ERROR'
                    })
                }

                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'villasoftgps@gmail.com', // generated ethereal user
                        pass: 'Ejvh.251127' // generated ethereal password
                    }
                });

                let message = {
                    from: 'VillaTracking <villasoftgps@gmail.com>',
                    to: name + ' <' + email + '>',
                    subject: 'Código de Recuperación',
                    text: recoveryCode,
                    html: '<p>' + recoveryCode + '</p>'
                }

                transporter.sendMail(message, (err, info) => {
                    if (err) {
                        return res.send({
                            result: 'ERROR'
                        })
                    } else {
                        return res.json({
                            result: 'EMAIL SENT'
                        })
                    }
                })
            })
        }
    })
})

router.post('/validateRecoveryCode', (req, res) => {
    let { email, recoveryCode } = req.body;

    myConnection.query('SELECT * FROM users WHERE email = ? AND recovery_code = ?', [email, recoveryCode], (err, rows) => {
        if (err) {
            return res.send({
                result: 'ERROR'
            })
        }

        if (rows.length === 0) {
            return res.send({
                result: 'INVALID'
            })
        } else {
            return res.json({
                result: 'VALIDATED'
            })
        }
    })
})

router.post('/changePassword', (req, res) => {
    let { email, password } = req.body;
    let hashedPass = bcrypt.hashSync(password);

    myConnection.query('UPDATE users SET hashed_pass = ?, recovery_code = NULL WHERE email = ?', [hashedPass, email], (err, rows) => {
        if (err) {
            return res.send({
                result: 'ERROR'
            })
        }
        console.log(rows);

        return res.send({
            result: rows.affectedRows > 0 ? 'UPDATED' : 'ERROR'
        })
    })
})

router.post('/saveGroup', (req, res) => {

    let { groupId, name, isActive, userId } = req.body;

    myConnection.query('SELECT * from villatrackingserverdb.groups WHERE user_id = ? AND name = ?;', [userId, name], (err, rows) => {
        if (rows.length > 0) {
            if (groupId > 0) {
                if (rows[0].id !== groupId) {
                    return res.send({
                        result: 'DUPLICATE'
                    })
                }
            } else {
                return res.send({
                    result: 'DUPLICATE'
                })
            }
        }

        let query = groupId === 0 ? `
            INSERT INTO villatrackingserverdb.groups (user_id,name,status) VALUES (?,?,?);
        `
            :

            `
            UPDATE villatrackingserverdb.groups SET name = ?, status = ? WHERE id = ?;
        `
            ;

        let data = groupId === 0 ?
            [
                userId, name, isActive ? 1 : 0
            ]
            :
            [
                name, isActive ? 1 : 0, groupId
            ];

        console.log(query);
        console.log(data);

        myConnection.query(query, data, (err, result) => {
            if (err) {
                console.log(err);
                return res.send({
                    result: 'ERROR'
                })
            }

            if (result.affectedRows > 0) {
                let response = {};
                (async () => {
                    try {
                        response = await getPayload(userId);
                    } finally {
                        response.result = groupId > 0 ? 'UPDATED' : 'SAVED';
                        return res.send(response)
                    }
                })()
            } else {
                return res.send({
                    result: 'NO SAVE'
                })
            }
        });
    })
})

router.post('/deleteGroup', (req, res) => {
    let { groupId, userId } = req.body

    let query = `
        DELETE FROM villatrackingserverdb.groups WHERE id = ?;
    `;

    myConnection.query(query, [groupId], (err, result) => {
        if (err) {
            console.log(err);
            return res.send({
                result: 'ERROR'
            })
        }

        (async () => {
            let response
            try {
                response = await getPayload(userId)
            } finally {
                response.result = 'OK';
                return res.send(response)
            }
        })()
    })
})

router.post('/deleteDevice', (req, res) => {
    let {deviceId, userId} = req.body;

    let query = `
        DELETE FROM devices WHERE id = ?
    `;

    myConnection.query(query, [deviceId], (err, result) => {
        if (err) {
            console.log(err);
            return res.send({
                result: 'ERROR'
            })
        }

        (async () => {
            let response
            try {
                response = await getPayload(userId)
            } finally {
                response.result = 'OK';
                return res.send(response)
            }
        })()
    })
})

router.post('/getDevicesPayload', (req, res) => {
    let { id } = req.body;

    (async () => {
        let response = {};
        try {
            response = await getPayload(id);
        } finally {
            response.result = 'OK';
            return res.send(response);
        }
    })()

})

router.post('/saveDevice', (req, res) => {
    let {
        id,
        deviceId,
        deviceModelId,
        deviceImei,
        simcardNumber,
        simcardCarrier,
        simcardApn,
        simcardUser,
        simcardPass,
        vehicleDescription,
        vehicleLicensePlate,
        vehicleDriverName,
        vehicleSpeedLimit,
        vehicleFuelConsumption,
        VehicleFuelConsumptionCost,
        markerIconType,
        additionalInfo
    } = req.body;

    let query = deviceId > 0 ? `
            UPDATE devices SET 
                device_model_id = ?,
                imei = ?,
                simcard_number = ?,
                simcard_carrier = ?,
                simcard_apn_name = ?,
                simcard_apn_user = ?,
                simcard_apn_pass = ?,
                vehicle = ?,
                license_plate = ?,
                driver_name = ?,
                speed_limit = ?,
                km_per_lt = ?,
                cost_per_lt = ?,
                marker_icon_type = ?,
                additional_info = ? 
            WHERE id = ?
        `
        :
        `
            INSERT INTO devices (
            user_id,
            device_model_id,
            imei,
            simcard_number,
            simcard_carrier,
            simcard_apn_name,
            simcard_apn_user,
            simcard_apn_pass,
            vehicle,
            license_plate,
            driver_name,
            speed_limit,
            km_per_lt,
            cost_per_lt,
            marker_icon_type,
            additional_info) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `
        ;

    let data = deviceId > 0 ?
        [
            deviceModelId,
            deviceImei,
            simcardNumber,
            simcardCarrier,
            simcardApn,
            simcardUser,
            simcardPass,
            vehicleDescription,
            vehicleLicensePlate,
            vehicleDriverName,
            vehicleSpeedLimit,
            vehicleFuelConsumption,
            VehicleFuelConsumptionCost,
            markerIconType,
            additionalInfo,
            deviceId
        ]
        :
        [
            id,
            deviceModelId,
            deviceImei,
            simcardNumber,
            simcardCarrier,
            simcardApn,
            simcardUser,
            simcardPass,
            vehicleDescription,
            vehicleLicensePlate,
            vehicleDriverName,
            vehicleSpeedLimit,
            vehicleFuelConsumption,
            VehicleFuelConsumptionCost,
            markerIconType,
            additionalInfo
        ]
        ;

    myConnection.query(query, data, (err, result) => {
        if (err) {
            return res.send({
                result: 'ERROR',
                data: err
            })
        }

        if (result.affectedRows > 0) {
            (async () => {
                let response = {};
                try {
                    response = await getPayload(id);
                } finally {
                    response.result = deviceId > 0 ? 'UPDATED' : 'SAVED';
                    return res.send(response);
                }
            })()

        } else {
            return res.send({
                result: 'NO SAVE'
            })
        }
    })
})

router.post('/getDeviceHistory', (req, res) => {
    let {
        deviceId,
        dateFrom,
        dateTo,
        historyType
    } = req.body;

    let device = {};

    let query = `
        SELECT 
            t.*
        FROM traces t
        LEFT JOIN devices d ON t.imei = d.imei 
        WHERE d.id = ? AND t.date_time BETWEEN ? AND ? ${historyType === 'alerts' ? "AND t.alert <> 'tracker'" : ''}
        ORDER BY t.date_time ASC;        
    `;

    let query2 = `
        SELECT 
            * 
        FROM devices 
        WHERE id = ?;
    `;

    myConnection.query(query2, [deviceId], (err, rows) => {
        if (err) {
            console.log(err)
            return res.send({
                result: 'ERROR',
                count: 0,
                traces: []
            })
        }

        device = rows[0];
    })

    myConnection.query(query, [deviceId, dateFrom, dateTo], async (err, rows) => {
        if (err) {
            console.log(err)
            return res.send({
                result: 'ERROR',
                count: 0,
                traces: []
            })
        }
        let traces = [];
        let lastTrace = null;
        let coords = [];
        let count = rows.length;

        rows.map((trace, index) => {
            trace.date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');
            trace.last_date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');

            if (historyType === 'alerts') {
                //si hay una ubicacion anterior
                if (lastTrace) {
                    // verificamos si la alerta corresponde a eventos no acumulables
                    if (trace.alert === 'acc on' ||
                        trace.alert === 'acc off' ||
                        trace.alert === 'overspeed' ||
                        trace.alert === 'geofence in' ||
                        trace.alert === 'geofence out') {

                        //guardamos el ultimo punto
                        let coord = {
                            latitude: lastTrace.latitude,
                            longitude: lastTrace.longitude
                        }

                        coords.push(coord);
                        traces.push(lastTrace);

                        lastTrace = trace;

                        //verificamos si el punto actual es el ultimo para guardarlo tambien
                        if ((index + 1) === count) {
                            let coord = {
                                latitude: trace.latitude,
                                longitude: trace.longitude
                            }

                            coords.push(coord);
                            traces.push(trace);
                        }
                    } else {
                        //verificamos que la alerta anterior sea distinta a la actual
                        if (lastTrace.alert !== trace.alert) {
                            //guardamos el ultimo punto
                            let coord = {
                                latitude: lastTrace.latitude,
                                longitude: lastTrace.longitude
                            }

                            coords.push(coord);
                            traces.push(lastTrace);

                            lastTrace = trace;

                            //verificamos si el punto actual es el ultimo para guardarlo tambien
                            if ((index + 1) === count) {
                                let coord = {
                                    latitude: trace.latitude,
                                    longitude: trace.longitude
                                }

                                coords.push(coord);
                                traces.push(trace);
                            }
                        } else {
                            // verificamos si son el mismo punto
                            if ((lastTrace.latitude === trace.latitude && lastTrace.longitude === trace.longitude)) {
                                //se sobreescribe la ultima fecha del punto anterior
                                lastTrace.last_date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');

                                //verificamos si es el ultimo registro para guardar el punto anterior
                                if ((index + 1) === count) {
                                    let coord = {
                                        latitude: lastTrace.latitude,
                                        longitude: lastTrace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(lastTrace);
                                }

                            } else {
                                // se verifica que la distancia sea mayor a 40 metros
                                if (geolib.getDistance(
                                    { latitude: lastTrace.latitude, longitude: lastTrace.longitude },
                                    { latitude: trace.latitude, longitude: trace.longitude }
                                ) > 40) {
                                    //guardamos el ultimo punto
                                    let coord = {
                                        latitude: lastTrace.latitude,
                                        longitude: lastTrace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(lastTrace);

                                    lastTrace = trace;

                                    //verificamos si el punto actual es el ultimo para guardarlo tambien
                                    if ((index + 1) === count) {
                                        let coord = {
                                            latitude: trace.latitude,
                                            longitude: trace.longitude
                                        }

                                        coords.push(coord);
                                        traces.push(trace);
                                    }
                                } else {
                                    //se sobreescribe la ultima fecha del punto anterior
                                    lastTrace.last_date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');

                                    //verificamos si es el ultimo registro para guardar el ultimo punto
                                    if ((index + 1) === count) {
                                        let coord = {
                                            latitude: lastTrace.latitude,
                                            longitude: lastTrace.longitude
                                        }

                                        coords.push(coord);
                                        traces.push(lastTrace);
                                    }
                                }
                            }
                        }
                    }

                } else {
                    lastTrace = trace;

                    //se verifica si es el ultimo punto
                    if ((index + 1) === count) {
                        let coord = {
                            latitude: trace.latitude,
                            longitude: trace.longitude
                        }

                        coords.push(coord);
                        traces.push(trace);
                    }
                }

            } else {
                //si hay una ubicacion anterior
                if (lastTrace) {
                    //comparamos primero si el punto anterior estaba en movimiento
                    if (lastTrace.speed > 0) {
                        //verificamos si en el nuevo punto sigue en movimiento a mas de 15 km/h
                        //para tratarlo como un nuevo punto
                        if (trace.speed > 15) {
                            //guardamos el ultimo punto
                            let coord = {
                                latitude: lastTrace.latitude,
                                longitude: lastTrace.longitude
                            }

                            coords.push(coord);
                            traces.push(lastTrace);

                            lastTrace = trace;

                            //verificamos si el punto actual es el ultimo para guardarlo tambien
                            if ((index + 1) === count) {
                                let coord = {
                                    latitude: trace.latitude,
                                    longitude: trace.longitude
                                }

                                coords.push(coord);
                                traces.push(trace);
                            }
                        } else if (trace.speed > 0) {
                            //si la velocidad actual es menor o igual a 15 km/h y mayor a 0
                            //se verifica la distancia entre el ultimo punto y el actual
                            //si es mayor a 40 metros se toma como un punto nuevo, de lo contrario se omite
                            if (geolib.getDistance(
                                { latitude: lastTrace.latitude, longitude: lastTrace.longitude },
                                { latitude: trace.latitude, longitude: trace.longitude }
                            ) > 40) {
                                //guardamos el ultimo punto
                                let coord = {
                                    latitude: lastTrace.latitude,
                                    longitude: lastTrace.longitude
                                }

                                coords.push(coord);
                                traces.push(lastTrace);

                                lastTrace = trace;

                                //verificamos si el punto actual es el ultimo para guardarlo tambien
                                if ((index + 1) === count) {
                                    let coord = {
                                        latitude: trace.latitude,
                                        longitude: trace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(trace);
                                }
                            } else {
                                //se omite el punto actual
                                //verificamos si es el ultimo registro para guardar el ultimo punto
                                if ((index + 1) === count) {
                                    let coord = {
                                        latitude: lastTrace.latitude,
                                        longitude: lastTrace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(lastTrace);
                                }
                            }
                        } else {
                            // si la velocidad es 0 se toma como un punto nuevo
                            //guardamos el ultimo punto
                            let coord = {
                                latitude: lastTrace.latitude,
                                longitude: lastTrace.longitude
                            }

                            coords.push(coord);
                            traces.push(lastTrace);

                            lastTrace = trace;

                            //verificamos si es el ultimo registro para guardar el punto actual
                            if ((index + 1) === count) {
                                let coord = {
                                    latitude: trace.latitude,
                                    longitude: trace.longitude
                                }

                                coords.push(coord);
                                traces.push(trace);
                            }
                        }
                    } else {
                        // si la velocidad del ultimo punto es 0, comparamos primero si son el mismo punto
                        if ((lastTrace.latitude === trace.latitude && lastTrace.longitude === trace.longitude)) {
                            //se sobreescribe la ultima fecha del punto anterior
                            lastTrace.last_date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');

                            //verificamos si es el ultimo registro para guardar el punto anterior
                            if ((index + 1) === count) {
                                let coord = {
                                    latitude: lastTrace.latitude,
                                    longitude: lastTrace.longitude
                                }

                                coords.push(coord);
                                traces.push(lastTrace);
                            }

                        } else {
                            //si no es el mismo punto se verifica primero que la velocidad sea mayor a 15 km/h
                            if (trace.speed > 15) {
                                //guardamos el ultimo punto
                                let coord = {
                                    latitude: lastTrace.latitude,
                                    longitude: lastTrace.longitude
                                }

                                coords.push(coord);
                                traces.push(lastTrace);

                                lastTrace = trace;

                                //verificamos si es el ultimo registro para guardar el punto actual
                                if ((index + 1) === count) {
                                    let coord = {
                                        latitude: trace.latitude,
                                        longitude: trace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(trace);
                                }
                            } else {
                                // si la velocidad es menor o igual a 15 se verifica que la distancia sea mayor a 40 metros
                                if (geolib.getDistance(
                                    { latitude: lastTrace.latitude, longitude: lastTrace.longitude },
                                    { latitude: trace.latitude, longitude: trace.longitude }
                                ) > 40) {
                                    //guardamos el ultimo punto
                                    let coord = {
                                        latitude: lastTrace.latitude,
                                        longitude: lastTrace.longitude
                                    }

                                    coords.push(coord);
                                    traces.push(lastTrace);

                                    lastTrace = trace;

                                    //verificamos si el punto actual es el ultimo para guardarlo tambien
                                    if ((index + 1) === count) {
                                        let coord = {
                                            latitude: trace.latitude,
                                            longitude: trace.longitude
                                        }

                                        coords.push(coord);
                                        traces.push(trace);
                                    }
                                } else {
                                    //se sobreescribe la ultima fecha del punto anterior
                                    lastTrace.last_date_time = moment(trace.date_time).format('YYYY-MM-DD HH:mm:ss');

                                    //verificamos si es el ultimo registro para guardar el ultimo punto
                                    if ((index + 1) === count) {
                                        let coord = {
                                            latitude: lastTrace.latitude,
                                            longitude: lastTrace.longitude
                                        }

                                        coords.push(coord);
                                        traces.push(lastTrace);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    lastTrace = trace;

                    //se verifica si es el ultimo punto
                    if ((index + 1) === count) {
                        let coord = {
                            latitude: trace.latitude,
                            longitude: trace.longitude
                        }

                        coords.push(coord);
                        traces.push(trace);
                    }
                }
            }



            // =====================================================================

            return false;
        })

        let distance = await geolib.getPathLength(coords);
        let higherSpeed = 0;
        let secondsMove = 0;
        let secondsStop = 0;
        let lastStatus = null;
        let lastTime = null;
        let secondsAcAlarm = 0;
        let secondsLowBattery = 0;
        let secondsNoGps = 0;
        let secondsSensorAlarm = 0;

        if (historyType === 'alerts') {
            if (traces.length === 1) {
                let date1 = moment(traces[0].date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                let date2 = moment(traces[0].last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                let dif = date2 - date1;

                switch (traces[0].alert) {
                    case 'ac alarm':
                        secondsAcAlarm = dif;
                        break;
                    case 'low battery':
                        secondsLowBattery = dif;
                        break;
                    case 'no gps':
                        secondsNoGps = dif;
                        break;
                    case 'sensor alarm':
                        secondsSensorAlarm = dif;
                        break;
                }
            } else {
                traces.map((trace, index) => {
                    let { alert, date_time, last_date_time } = trace;

                    let date1 = moment(date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                    let date2 = moment(last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                    let dif = date2 - date1;

                    switch (alert) {
                        case 'ac alarm':
                            if (!lastStatus) {
                                lastStatus = alert;
                                lastTime = last_date_time;
                                secondsAcAlarm += dif;
                            } else {
                                if (lastStatus === alert) {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    dif = dif + (date1 - date0);
                                    lastTime = last_date_time;
                                    secondsAcAlarm += dif;
                                } else {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    let lastDif = date1 - date0;
                                    secondsLowBattery += lastStatus === 'low battery' ? lastDif : 0;
                                    secondsNoGps += lastStatus === 'no gps' ? lastDif : 0;
                                    secondsSensorAlarm += lastStatus === 'sensor alarm' ? lastDif : 0;

                                    lastStatus = alert;
                                    lastTime = last_date_time;
                                    secondsAcAlarm += dif;
                                }
                            }
                            break;
                        case 'low battery':
                            if (!lastStatus) {
                                lastStatus = alert;
                                lastTime = last_date_time;
                                secondsLowBattery += dif;
                            } else {
                                if (lastStatus === alert) {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    dif = dif + (date1 - date0);
                                    lastTime = last_date_time;
                                    secondsLowBattery += dif;
                                } else {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    let lastDif = date1 - date0;
                                    secondsAcAlarm += lastStatus === 'ac alarm' ? lastDif : 0;
                                    secondsNoGps += lastStatus === 'no gps' ? lastDif : 0;
                                    secondsSensorAlarm += lastStatus === 'sensor alarm' ? lastDif : 0;

                                    lastStatus = alert;
                                    lastTime = last_date_time;
                                    secondsLowBattery += dif;
                                }
                            }
                            break;
                        case 'no gps':
                            if (!lastStatus) {
                                lastStatus = alert;
                                lastTime = last_date_time;
                                secondsNoGps += dif;
                            } else {
                                if (lastStatus === alert) {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    dif = dif + (date1 - date0);
                                    lastTime = last_date_time;
                                    secondsNoGps += dif;
                                } else {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    let lastDif = date1 - date0;
                                    secondsAcAlarm += lastStatus === 'ac alarm' ? lastDif : 0;
                                    secondsLowBattery += lastStatus === 'low battery' ? lastDif : 0;
                                    secondsSensorAlarm += lastStatus === 'sensor alarm' ? lastDif : 0;

                                    lastStatus = alert;
                                    lastTime = last_date_time;
                                    secondsNoGps += dif;
                                }
                            }
                            break;
                        case 'sensor alarm':
                            if (!lastStatus) {
                                lastStatus = alert;
                                lastTime = last_date_time;
                                secondsSensorAlarm += dif;
                            } else {
                                if (lastStatus === alert) {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    dif = dif + (date1 - date0);
                                    lastTime = last_date_time;
                                    secondsSensorAlarm += dif;
                                } else {
                                    let date0 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                    let lastDif = date1 - date0;
                                    secondsAcAlarm += lastStatus === 'ac alarm' ? lastDif : 0;
                                    secondsNoGps += lastStatus === 'no gps' ? lastDif : 0;
                                    secondsLowBattery += lastStatus === 'low battery' ? lastDif : 0;

                                    lastStatus = alert;
                                    lastTime = last_date_time;
                                    secondsSensorAlarm += dif;
                                }
                            }
                            break;
                    }
                })
            }

        } else {
            if (traces.length === 1) {
                let date1 = moment(traces[0].date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                let date2 = moment(traces[0].last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                let dif = date2 - date1;

                secondsMove = traces[0].speed > 0 ? dif : 0;
                secondsStop = traces[0].speed === 0 ? dif : 0;

            } else {
                traces.map((trace, index) => {
                    let { speed } = trace;
                    higherSpeed = speed > higherSpeed ? speed : higherSpeed;

                    if (speed > 0) {
                        if (!lastStatus) {
                            lastStatus = 'move';
                            lastTime = trace.date_time;
                        } else {
                            if (lastStatus === 'stop') {
                                let date1 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let date2 = moment(trace.last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let dif = date2 - date1;

                                secondsStop += dif;
                                lastStatus = 'move';
                                lastTime = trace.last_date_time;
                            }

                            if ((index + 1) === traces.length) {
                                let date1 = moment(trace.date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let date2 = moment(trace.last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let dif = date2 - date1;
                                secondsMove += dif;
                            }
                        }
                    } else {
                        if (!lastStatus) {
                            lastStatus = 'stop';
                            lastTime = trace.date_time;
                        } else {
                            if (lastStatus === 'move') {
                                let date1 = moment(lastTime, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let date2 = moment(trace.last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let dif = date2 - date1;

                                secondsMove += dif;
                                lastStatus = 'stop';
                                lastTime = trace.last_date_time;
                            }

                            if ((index + 1) === traces.length) {
                                let date1 = moment(trace.date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let date2 = moment(trace.last_date_time, 'YYYY-MM-DD HH:mm:ss').format('X');
                                let dif = date2 - date1;
                                secondsStop += dif;
                            }
                        }
                    }

                    return false;
                })
            }
        }

        return res.send({
            result: 'OK',
            lastCount: rows.length,
            newCount: traces.length,
            distance: distance,
            fuelConsumption: device.km_per_lt === 0 ? 0 : (distance / 1000) / device.km_per_lt,
            timeMove: {
                formatted: new Date(secondsMove * 1000).toISOString().substr(11, 8),
                seconds: secondsMove
            },
            timeStop: {
                formatted: new Date(secondsStop * 1000).toISOString().substr(11, 8),
                seconds: secondsStop
            },
            alertsTime: [
                {
                    name: 'ac alarm',
                    formatted: new Date(secondsAcAlarm * 1000).toISOString().substr(11, 8),
                    seconds: secondsAcAlarm
                },
                {
                    name: 'low battery',
                    formatted: new Date(secondsLowBattery * 1000).toISOString().substr(11, 8),
                    seconds: secondsLowBattery
                },
                {
                    name: 'no gps',
                    formatted: new Date(secondsNoGps * 1000).toISOString().substr(11, 8),
                    seconds: secondsNoGps
                },
                {
                    name: 'sensor alarm',
                    formatted: new Date(secondsSensorAlarm * 1000).toISOString().substr(11, 8),
                    seconds: secondsSensorAlarm
                }
            ],
            traces: traces,
            coords: coords,
            higherSpeed: higherSpeed
        })
    })
})

router.post('/getDistance', (req, res) => {
    let distance = geolib.getDistance(
        { latitude: 10.314508, longitude: -71.406108 },
        { latitude: 10.314578, longitude: -71.405725 }
    )

    console.log(new Date(650 * 1000).toISOString().substr(11, 8))


    return res.send({
        result: 'OK',
        distance: distance
    })

})

async function getPayload(userId) {
    let query = util.promisify(myConnection.query).bind(myConnection);

    const devicesQuery = 'SELECT * FROM devices WHERE user_id = ?';
    const geofencesQuery = 'SELECT * FROM geofences WHERE user_id = ?';
    const groupsQuery = 'SELECT * FROM villatrackingserverdb.groups WHERE user_id = ? ORDER BY name ASC;';
    const groupDevicesQuery = 'SELECT * FROM devices d LEFT JOIN groups_devices gd ON d.id = gd.device_id WHERE gd.group_id = ?';

    const devicesModelsQuery = 'SELECT * FROM device_models';
    const tracesQuery = 'SELECT t.* FROM traces AS t LEFT JOIN devices AS d ON t.imei = d.imei WHERE d.id = ? ORDER BY t.date_time DESC LIMIT 10';
    const alertsQuery = 'SELECT a.* FROM alerts AS a LEFT JOIN devices AS d ON a.imei = d.imei WHERE d.id = ? AND DATE(a.date_time) = CURDATE()';

    let response = {
        result: '',
        groups: [],
        geofences: [],
        devices: [],
        deviceModels: []
    };

    response.deviceModels = await query(devicesModelsQuery);
    let groups = await query(groupsQuery, [userId]);

    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];

        let groupDevices = await query(groupDevicesQuery, [group.id]);
        group.devices = groupDevices;

        response.groups.push(group);
    }

    response.geofences = await query(geofencesQuery, [userId])

    let devices = await query(devicesQuery, [userId]);

    for (let i = 0; i < devices.length; i++) {
        let device = devices[i];

        let traces = await query(tracesQuery, [device.id]);
        device.traces = traces;

        let alerts = await query(alertsQuery, [device.id]);
        device.alerts = alerts;

        response.devices.push(device);
    }

    return response;
}

function generateCode(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


module.exports = router;
