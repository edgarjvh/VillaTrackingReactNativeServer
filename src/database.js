const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ejvh.251127',
    database: 'villatrackingserverdb'
});

// mysqlConnection.connect((err) => {
//     if(err){
//         console.log(err);
//         return;
//     }else{
//         console.log('Database is connected!');
//     }
// });

module.exports = mysqlConnection;