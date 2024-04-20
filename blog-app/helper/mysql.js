const mysql = require("mysql");

const pool = mysql.createPool({
    connectionLimit:100,
    host:"localhost",
    user:"root",
    password:"Esma194+",
    database:"blog_db",
    insecureAuth: true,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL bağlantı hatası: ' + err.stack);
        return;
    }
    console.log('MySQL bağlantısı başarılı, bağlantı ID: ' + connection.threadId);
});

module.exports = pool;
