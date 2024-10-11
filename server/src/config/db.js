const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)', (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

module.exports = db;

